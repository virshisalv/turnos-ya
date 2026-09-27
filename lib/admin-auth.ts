import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

// Cookie y JWT separados de la sesión de los profesionales: un admin y un
// profesional pueden estar logueados a la vez en el mismo navegador sin pisarse.
const COOKIE = "admin_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret");

export async function createAdminSession(adminId: string) {
  const token = await new SignJWT({ sub: adminId, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("14d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroyAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function getAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.role !== "admin") return null;
    return await db.admin.findUnique({ where: { id: String(payload.sub) } });
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
