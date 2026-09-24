import Link from "next/link";
import { requireProfessional } from "@/lib/auth";
import { logout } from "../actions";
import { btnGhost } from "../ui";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const pro = await requireProfessional();
  const link = "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200";
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <Link href="/panel" className="text-lg font-bold text-teal-800">Turnos Ya</Link>
          <div className="text-xs text-slate-500">
            {pro.name} · {pro.profession}
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/panel" className={link}>Agenda</Link>
          <Link href="/panel/pacientes" className={link}>Pacientes</Link>
          <Link href="/panel/configuracion" className={link}>Configuración</Link>
          <Link href={`/reservar/${pro.slug}`} target="_blank" className={link}>Mi página ↗</Link>
          <form action={logout}>
            <button className={btnGhost}>Salir</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
