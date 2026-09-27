import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { deleteProfessional, toggleSuspend } from "../../actions";
import ConfirmButton from "../../confirm-button";
import Avatar from "../../../avatar";
import { Badge, btn, btnGhost, card } from "../../../ui";

export const dynamic = "force-dynamic";

export default async function AdminProfesionalDetalle({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const pro = await db.professional.findUnique({
    where: { id },
    include: {
      photo: { select: { updatedAt: true } },
      _count: { select: { patients: true, appointments: true, services: true } },
      appointments: {
        orderBy: { start: "desc" },
        take: 5,
        include: { patient: true, service: true },
      },
    },
  });
  if (!pro) notFound();

  return (
    <>
      <Link href="/admin" className="text-sm text-teal-700">← Cuentas</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar id={pro.id} name={pro.name} photoVersion={pro.photo?.updatedAt.getTime()} size={64} />
          <div>
            <h1 className="text-2xl font-bold">
              {pro.name} {pro.suspended && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-800">suspendida</span>}
            </h1>
            <p className="text-slate-500">{pro.profession}{pro.license && ` · Mat. ${pro.license}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/reservar/${pro.slug}`} target="_blank" className={btnGhost}>Ver página pública ↗</Link>
          <form action={toggleSuspend.bind(null, pro.id)}>
            <button className={btnGhost}>{pro.suspended ? "Reactivar cuenta" : "Suspender cuenta"}</button>
          </form>
          <form action={deleteProfessional.bind(null, pro.id)}>
            <ConfirmButton
              className={`${btn} !bg-red-600 hover:!bg-red-700`}
              confirm={`¿Eliminar la cuenta de ${pro.name}? Se borran también sus pacientes, turnos y seguimientos. Esta acción no se puede deshacer.`}
            >
              Eliminar cuenta
            </ConfirmButton>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <section className={`${card} space-y-2 text-sm`}>
          <h2 className="mb-1 text-base font-semibold">Datos de la cuenta</h2>
          <div><span className="text-slate-500">Email:</span> {pro.email}</div>
          <div><span className="text-slate-500">Teléfono:</span> {pro.phone || "—"}</div>
          <div><span className="text-slate-500">Lugar de atención:</span> {pro.address || "—"}</div>
          <div><span className="text-slate-500">Alta:</span> {fmtDate(pro.createdAt)}</div>
          <div><span className="text-slate-500">Página pública:</span> /reservar/{pro.slug}</div>
          <div className="pt-2 text-slate-500">
            {pro._count.patients} pacientes · {pro._count.appointments} turnos · {pro._count.services} tipos de atención
          </div>
        </section>

        <section className={`${card} md:col-span-2`}>
          <h2 className="mb-3 text-base font-semibold">Últimos turnos</h2>
          {pro.appointments.length === 0 ? (
            <p className="text-sm text-slate-400">Todavía no tiene turnos.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {pro.appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3">
                  <div>
                    <div>{fmtDateTime(a.start)} · {a.service.name}</div>
                    <div className="text-xs text-slate-500">{a.patient.lastName ? `${a.patient.lastName}, ${a.patient.name}` : a.patient.name}</div>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
