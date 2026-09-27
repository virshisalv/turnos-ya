"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, requireProfessional } from "@/lib/auth";
import { getFreeSlots, parseLocal, toMin } from "@/lib/slots";
import { fmtDateTime } from "@/lib/format";
import { isValidPhone, PHONE_ERROR } from "@/lib/phone";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------- Auth ----------

export async function register(_: string | null, f: FormData): Promise<string | null> {
  const name = str(f, "name"),
    email = str(f, "email").toLowerCase();
  const profession = str(f, "profession"),
    password = str(f, "password");
  if (!name || !email || !profession || password.length < 6)
    return "Completá todos los campos (contraseña de al menos 6 caracteres).";
  if (await db.professional.findUnique({ where: { email } })) return "Ese email ya está registrado.";

  let slug = slugify(name) || "profesional";
  if (await db.professional.findUnique({ where: { slug } })) slug += "-" + Math.random().toString(36).slice(2, 6);

  const pro = await db.professional.create({
    data: {
      name,
      email,
      profession,
      slug,
      passwordHash: await bcrypt.hash(password, 10),
      services: { create: [{ name: "Consulta", durationMin: 30 }] },
      availability: {
        create: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "09:00", endTime: "13:00" })),
      },
    },
  });
  await createSession(pro.id);
  redirect("/panel");
}

export async function login(_: string | null, f: FormData): Promise<string | null> {
  const pro = await db.professional.findUnique({ where: { email: str(f, "email").toLowerCase() } });
  if (!pro || !(await bcrypt.compare(str(f, "password"), pro.passwordHash)))
    return "Email o contraseña incorrectos.";
  if (pro.suspended) return "Esta cuenta fue suspendida por un administrador. Contactá a soporte.";
  await createSession(pro.id);
  redirect("/panel");
}

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function requestReset(_: string | null, f: FormData): Promise<string | null> {
  const email = str(f, "email").toLowerCase();
  if (!email) return "Ingresá tu email.";
  const pro = await db.professional.findUnique({ where: { email } });
  if (pro) {
    const token = randomBytes(32).toString("hex");
    await db.passwordReset.create({
      data: {
        professionalId: pro.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const base = process.env.APP_URL ?? "http://localhost:3000";
    // TODO: enviar por email cuando haya un servicio SMTP configurado.
    console.log(`\n[Recuperar contraseña] ${email}: ${base}/recuperar/${token}\n`);
  }
  // Misma respuesta exista o no la cuenta, para no revelar qué emails están registrados.
  redirect("/recuperar/enviado");
}

export async function resetPassword(token: string, _: string | null, f: FormData): Promise<string | null> {
  const password = str(f, "password");
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (password !== str(f, "confirm")) return "Las contraseñas no coinciden.";
  const reset = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return "El enlace venció o ya fue usado. Pedí uno nuevo.";
  await db.$transaction([
    db.professional.update({ where: { id: reset.professionalId }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);
  await createSession(reset.professionalId);
  redirect("/panel");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ---------- Configuración ----------

export async function addService(f: FormData) {
  const pro = await requireProfessional();
  const name = str(f, "name"),
    durationMin = Number(f.get("durationMin"));
  if (!name || !(durationMin >= 5 && durationMin <= 480)) return;
  await db.service.create({ data: { professionalId: pro.id, name, durationMin } });
  revalidatePath("/panel/configuracion");
}

export async function updateService(id: string, f: FormData) {
  const pro = await requireProfessional();
  const name = str(f, "name"),
    durationMin = Number(f.get("durationMin"));
  if (!name || !Number.isInteger(durationMin) || durationMin < 5 || durationMin > 480) return;
  await db.service.updateMany({ where: { id, professionalId: pro.id }, data: { name, durationMin } });
  revalidatePath("/panel/configuracion");
}

export async function toggleService(id: string) {
  const pro = await requireProfessional();
  const s = await db.service.findFirst({ where: { id, professionalId: pro.id } });
  if (s) await db.service.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/panel/configuracion");
}

// ---------- Reserva pública ----------

export async function fetchSlots(professionalId: string, serviceId: string, date: string) {
  const service = await db.service.findFirst({ where: { id: serviceId, professionalId, active: true } });
  if (!service) return [];
  return getFreeSlots(professionalId, date, service.durationMin);
}

export async function book(slug: string, _: string | null, f: FormData): Promise<string | null> {
  const pro = await db.professional.findUnique({ where: { slug } });
  if (!pro) return "Profesional no encontrado.";
  if (pro.suspended) return "Este profesional no está disponible para solicitar turnos en este momento.";
  const serviceId = str(f, "serviceId"),
    date = str(f, "date"),
    time = str(f, "time");
  const name = str(f, "name"),
    lastName = str(f, "lastName"),
    email = str(f, "email").toLowerCase(),
    phone = str(f, "phone");
  if (!serviceId || !date || !time) return "Elegí tipo de atención, día y horario.";
  if (!name || !lastName || !email || !phone) return "Completá tus datos de contacto.";
  if (!isValidPhone(phone)) return PHONE_ERROR;

  const service = await db.service.findFirst({ where: { id: serviceId, professionalId: pro.id, active: true } });
  if (!service) return "Tipo de atención inválido.";
  const free = await getFreeSlots(pro.id, date, service.durationMin);
  if (!free.includes(time)) return "Ese horario ya no está disponible, elegí otro.";

  const start = parseLocal(date, time);
  const end = new Date(start.getTime() + service.durationMin * 60000);

  const existing = await db.patient.findUnique({
    where: { professionalId_email: { professionalId: pro.id, email } },
  });
  // Al registrarse un paciente nuevo se crea su seguimiento automáticamente.
  const patient =
    existing ??
    (await db.patient.create({
      data: {
        professionalId: pro.id,
        name,
        lastName,
        email,
        phone,
        birthDate: str(f, "birthDate") || null,
        followUp: {
          create: {
            goal: str(f, "reason"),
            entries: { create: { kind: "SISTEMA", text: "Paciente registrado. Seguimiento iniciado." } },
          },
        },
      },
    }));

  const appt = await db.appointment.create({
    data: { professionalId: pro.id, patientId: patient.id, serviceId, start, end, reason: str(f, "reason") },
  });
  const fu = await db.followUp.upsert({
    where: { patientId: patient.id },
    update: {},
    create: { patientId: patient.id },
  });
  await db.followUpEntry.create({
    data: {
      followUpId: fu.id,
      kind: "SISTEMA",
      text: `Turno reservado: ${service.name}, ${fmtDateTime(start)}.`,
    },
  });
  redirect(`/reservar/${slug}/listo?id=${appt.id}`);
}

// ---------- Agenda y seguimiento ----------

export async function setAppointmentStatus(id: string, status: string) {
  const pro = await requireProfessional();
  const a = await db.appointment.findFirst({
    where: { id, professionalId: pro.id },
    include: { service: true },
  });
  if (!a) return;
  await db.appointment.update({ where: { id }, data: { status } });
  const fu = await db.followUp.findUnique({ where: { patientId: a.patientId } });
  if (fu) {
    await db.followUpEntry.create({
      data: {
        followUpId: fu.id,
        kind: "SISTEMA",
        text: `Turno del ${fmtDateTime(a.start)} (${a.service.name}) marcado como ${status.toLowerCase()}.`,
      },
    });
  }
  revalidatePath("/panel", "layout");
}

export async function addNote(patientId: string, f: FormData) {
  const pro = await requireProfessional();
  const text = str(f, "text");
  const fu = await db.followUp.findFirst({ where: { patientId, patient: { professionalId: pro.id } } });
  if (!fu || !text) return;
  await db.followUpEntry.create({ data: { followUpId: fu.id, kind: "NOTA", text } });
  revalidatePath(`/panel/pacientes/${patientId}`);
}

export async function updateFollowUp(patientId: string, f: FormData) {
  const pro = await requireProfessional();
  const fu = await db.followUp.findFirst({ where: { patientId, patient: { professionalId: pro.id } } });
  if (!fu) return;
  const status = str(f, "status");
  await db.followUp.update({ where: { id: fu.id }, data: { status, goal: str(f, "goal") } });
  if (status !== fu.status)
    await db.followUpEntry.create({
      data: {
        followUpId: fu.id,
        kind: "SISTEMA",
        text: `Estado del seguimiento: ${status.replace("_", " ").toLowerCase()}.`,
      },
    });
  revalidatePath(`/panel/pacientes/${patientId}`);
}

// ---------- Perfil ----------

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO = 2 * 1024 * 1024;

const yearOrNull = (f: FormData, k: string) => {
  const n = parseInt(str(f, k), 10);
  return n >= 1900 && n <= 2100 ? n : null;
};

export async function uploadPhoto(_: string | null, f: FormData): Promise<string | null> {
  const pro = await requireProfessional();
  const file = f.get("photo");
  if (!(file instanceof File) || file.size === 0) return "Elegí una imagen.";
  if (!PHOTO_TYPES.includes(file.type)) return "Formato no válido (usá JPG, PNG o WebP).";
  if (file.size > MAX_PHOTO) return "La imagen pesa más de 2 MB.";
  const data = Buffer.from(await file.arrayBuffer());
  await db.professionalPhoto.upsert({
    where: { professionalId: pro.id },
    update: { data, contentType: file.type },
    create: { professionalId: pro.id, data, contentType: file.type },
  });
  revalidatePath("/", "layout");
  return null;
}

export async function removePhoto() {
  const pro = await requireProfessional();
  await db.professionalPhoto.deleteMany({ where: { professionalId: pro.id } });
  revalidatePath("/", "layout");
}

export async function updateProfile(_: string | null, f: FormData): Promise<string | null> {
  const pro = await requireProfessional();
  const name = str(f, "name"),
    profession = str(f, "profession");
  if (!name || !profession) return "Nombre y profesión son obligatorios.";
  if (str(f, "phone") && !isValidPhone(str(f, "phone"))) return PHONE_ERROR;
  await db.professional.update({
    where: { id: pro.id },
    data: { name, profession, phone: str(f, "phone"), license: str(f, "license"), address: str(f, "address"), bio: str(f, "bio") },
  });
  revalidatePath("/", "layout");
  return "ok";
}

export async function addEducation(f: FormData) {
  const pro = await requireProfessional();
  const title = str(f, "title"),
    institution = str(f, "institution");
  if (!title || !institution) return;
  await db.education.create({
    data: { professionalId: pro.id, title, institution, startYear: yearOrNull(f, "startYear") },
  });
  revalidatePath("/panel/perfil");
}

export async function removeEducation(id: string) {
  const pro = await requireProfessional();
  await db.education.deleteMany({ where: { id, professionalId: pro.id } });
  revalidatePath("/panel/perfil");
}

export async function addWorkplace(f: FormData) {
  const pro = await requireProfessional();
  const name = str(f, "name");
  if (!name) return;
  await db.workplace.create({
    data: {
      professionalId: pro.id,
      name,
      role: str(f, "role"),
      address: str(f, "address"),
      startYear: yearOrNull(f, "startYear"),
    },
  });
  revalidatePath("/panel/perfil");
}

export async function removeWorkplace(id: string) {
  const pro = await requireProfessional();
  await db.workplace.deleteMany({ where: { id, professionalId: pro.id } });
  revalidatePath("/panel/perfil");
}

// ---------- Horarios semanales ----------

type Block = { start: string; end: string };

/** Reemplaza todos los horarios de atención de la semana de una sola vez. */
export async function saveWeek(_: string | null, f: FormData): Promise<string | null> {
  const pro = await requireProfessional();
  let week: Block[][];
  try {
    week = JSON.parse(str(f, "week"));
  } catch {
    return "Datos inválidos.";
  }
  if (!Array.isArray(week) || week.length !== 7) return "Datos inválidos.";

  const rows: { professionalId: string; weekday: number; startTime: string; endTime: string }[] = [];
  const names = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  for (let d = 0; d < 7; d++) {
    const blocks = week[d];
    if (!Array.isArray(blocks)) return "Datos inválidos.";
    const valid = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const b of blocks) {
      if (!valid.test(b?.start) || !valid.test(b?.end)) return `Revisá los horarios del ${names[d]}.`;
      if (toMin(b.end) <= toMin(b.start)) return `En el ${names[d]}, "hasta" debe ser posterior a "desde".`;
    }
    const sorted = [...blocks].sort((a, b) => toMin(a.start) - toMin(b.start));
    for (let i = 1; i < sorted.length; i++)
      if (toMin(sorted[i].start) < toMin(sorted[i - 1].end)) return `Hay bloques superpuestos el ${names[d]}.`;
    for (const b of sorted) rows.push({ professionalId: pro.id, weekday: d, startTime: b.start, endTime: b.end });
  }

  await db.$transaction([
    db.availability.deleteMany({ where: { professionalId: pro.id } }),
    db.availability.createMany({ data: rows }),
  ]);
  revalidatePath("/panel", "layout");
  return "ok";
}
