import Link from "next/link";
import { db } from "@/lib/db";
import { requireProfessional } from "@/lib/auth";
import { fmtDate, patientName } from "@/lib/format";
import { btn, btnGhost, card, input } from "../../ui";

export const dynamic = "force-dynamic";

// Sin acentos y en minúsculas, para que "perez" encuentre "Pérez"
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const pro = await requireProfessional();
  const all = await db.patient.findMany({
    where: { professionalId: pro.id },
    include: { followUp: true, _count: { select: { appointments: true } } },
    orderBy: [{ lastName: "asc" }, { name: "asc" }],
  });
  const query = norm(q);
  const patients = query ? all.filter((p) => norm(p.lastName).includes(query)) : all;

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Pacientes</h1>
      <form action="/panel/pacientes" className="mb-4 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por apellido"
          aria-label="Buscar por apellido"
          className={input}
        />
        <button className={btn} aria-label="Buscar" title="Buscar">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
        {q && (
          <Link href="/panel/pacientes" className={btnGhost}>Limpiar</Link>
        )}
      </form>
      {patients.length === 0 ? (
        <p className="text-slate-500">
          {q
            ? `No se encontraron pacientes con "${q}".`
            : "Todavía no hay pacientes. Se crean automáticamente al reservar su primer turno."}
        </p>
      ) : (
        <div className={`${card} divide-y divide-slate-100 !p-0`}>
          {patients.map((p) => (
            <Link key={p.id} href={`/panel/pacientes/${p.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
              <div>
                <div className="font-medium">{patientName(p)}</div>
                <div className="text-xs text-slate-500">{p.email} · {p.phone}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>{p.followUp?.status.replace("_", " ").toLowerCase()}</div>
                <div>{p._count.appointments} turnos · desde {fmtDate(p.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
