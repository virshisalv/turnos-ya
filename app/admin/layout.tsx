import Link from "next/link";
import { getAdmin } from "@/lib/admin-auth";
import { adminLogout } from "./actions";
import { btnGhost } from "../ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();

  // Sin sesión (pantallas de /admin/login y /admin/setup): sin encabezado.
  if (!admin) return <div className="mx-auto max-w-5xl px-4">{children}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <Link href="/admin" className="text-lg font-bold text-teal-800">Turnos Ya · Admin</Link>
          <div className="text-xs text-slate-500">{admin.name}</div>
        </div>
        <form action={adminLogout}>
          <button className={btnGhost}>Salir</button>
        </form>
      </header>
      {children}
    </div>
  );
}
