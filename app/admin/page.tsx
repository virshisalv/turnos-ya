import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { fmtDate } from "@/lib/format";
import { toggleSuspend } from "./actions";
import ConfirmButton from "./confirm-button";
import { btnGhost, card } from "../ui";

export const dynamic = "force-dynamic";

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const all = await db.professional.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { patients: true, appointments: true } } },
  });
  const query = norm(q);
  const pros = query
    ? all.filter((p) => norm(p.name).includes(query) || norm(p.email).includes(query) || norm(p.profession).includes(query))
    : all;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cuentas de profesionales</h1>
        <span className="text-sm text-slate-500">
          {all.length} en total · {all.filter((p) => p.suspended).length} suspendidas
        </span>
      </div>

      <form action="/admin" className="mb-4 max-w-md">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, email o profesión"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
        />
      </form>

      {pros.length === 0 ? (
        <p className="text-slate-500">{q ? `No se encontraron cuentas con "${q}".` : "Todavía no hay profesionales registrados."}</p>
      ) : (
        <div className={`${card} divide-y divide-slate-100 !p-0`}>
          {pros.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <Link href={`/admin/profesionales/${p.id}`} className="font-medium text-teal-700 hover:underline">
                  {p.name}
                </Link>
                {p.suspended && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">suspendida</span>}
                <div className="text-xs text-slate-500">
                  {p.email} · {p.profession} · Alta {fmtDate(p.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{p._count.patients} pacientes</span>
                <span>{p._count.appointments} turnos</span>
                <form action={toggleSuspend.bind(null, p.id)}>
                  <button className={btnGhost}>{p.suspended ? "Reactivar" : "Suspender"}</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
