import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret");

export async function createSession(professionalId: string) {
  const token = await new SignJWT({ sub: professionalId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("14d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getProfessional() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return await db.professional.findUnique({ where: { id: String(payload.sub) } });
  } catch {
    return null;
  }
}

export async function requireProfessional() {
  const pro = await getProfessional();
  if (!pro) redirect("/login");
  return pro;
}
