"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, requireProfessional } from "@/lib/auth";
import { getFreeSlots, parseLocal, toMin } from "@/lib/slots";
import { fmtDateTime } from "@/lib/format";

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
  await createSession(pro.id);
  redirect("/panel");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ---------- Configuración ----------

export async function addAvailability(f: FormData) {
  const pro = await requireProfessional();
  const weekday = Number(f.get("weekday")),
    startTime = str(f, "startTime"),
    endTime = str(f, "endTime");
  if (!startTime || !endTime || toMin(endTime) <= toMin(startTime)) return;
  await db.availability.create({ data: { professionalId: pro.id, weekday, startTime, endTime } });
  revalidatePath("/panel/configuracion");
}

export async function removeAvailability(id: string) {
  const pro = await requireProfessional();
  await db.availability.deleteMany({ where: { id, professionalId: pro.id } });
  revalidatePath("/panel/configuracion");
}

export async function addService(f: FormData) {
  const pro = await requireProfessional();
  const name = str(f, "name"),
    durationMin = Number(f.get("durationMin"));
  if (!name || !(durationMin >= 5 && durationMin <= 480)) return;
  await db.service.create({ data: { professionalId: pro.id, name, durationMin } });
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
  const serviceId = str(f, "serviceId"),
    date = str(f, "date"),
    time = str(f, "time");
  const name = str(f, "name"),
    email = str(f, "email").toLowerCase(),
    phone = str(f, "phone");
  if (!serviceId || !date || !time) return "Elegí tipo de atención, día y horario.";
  if (!name || !email || !phone) return "Completá tus datos de contacto.";

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
