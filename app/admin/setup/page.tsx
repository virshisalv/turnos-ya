import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { setupAdmin } from "../actions";
import AdminAuthForm from "../admin-auth-form";
import { card } from "../../ui";

export const dynamic = "force-dynamic";

// Solo accesible mientras no exista ningún administrador todavía.
export default async function AdminSetupPage() {
  if ((await db.admin.count()) > 0) redirect("/admin/login");
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 text-2xl font-bold">Crear cuenta de administrador</h1>
      <p className="mb-6 text-sm text-slate-500">
        Esta pantalla solo está disponible una vez, para crear el primer administrador de la plataforma.
      </p>
      <div className={card}>
        <AdminAuthForm action={setupAdmin} mode="setup" />
      </div>
    </main>
  );
}
