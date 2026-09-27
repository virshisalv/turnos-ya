import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { adminLogin } from "../actions";
import AdminAuthForm from "../admin-auth-form";
import { card } from "../../ui";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if ((await db.admin.count()) === 0) redirect("/admin/setup");
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 text-2xl font-bold">Panel de administración</h1>
      <p className="mb-6 text-sm text-slate-500">Acceso exclusivo para administradores de Turnos Ya.</p>
      <div className={card}>
        <AdminAuthForm action={adminLogin} mode="login" />
      </div>
    </main>
  );
}
