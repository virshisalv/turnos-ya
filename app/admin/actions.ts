"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createAdminSession, destroyAdminSession, requireAdmin } from "@/lib/admin-auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

// El primer admin se crea desde /admin/setup, que solo funciona si todavía no existe ninguno.
export async function setupAdmin(_: string | null, f: FormData): Promise<string | null> {
  if ((await db.admin.count()) > 0) redirect("/admin/login");
  const name = str(f, "name"),
    email = str(f, "email").toLowerCase(),
    password = str(f, "password");
  if (!name || !email || password.length < 6) return "Completá todos los campos (contraseña de al menos 6 caracteres).";
  const admin = await db.admin.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function adminLogin(_: string | null, f: FormData): Promise<string | null> {
  const admin = await db.admin.findUnique({ where: { email: str(f, "email").toLowerCase() } });
  if (!admin || !(await bcrypt.compare(str(f, "password"), admin.passwordHash))) return "Email o contraseña incorrectos.";
  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function adminLogout() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function toggleSuspend(id: string) {
  await requireAdmin();
  const pro = await db.professional.findUnique({ where: { id } });
  if (!pro) return;
  await db.professional.update({ where: { id }, data: { suspended: !pro.suspended } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteProfessional(id: string) {
  await requireAdmin();
  await db.professional.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
}
