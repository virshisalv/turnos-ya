import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireProfessional } from "@/lib/auth";
import { fmtDate, fmtDateTime, patientName } from "@/lib/format";
import { addNote, updateFollowUp } from "../../../actions";
import { Badge, btn, card, input, label } from "../../../ui";

export const dynamic = "force-dynamic";

export default async function PacienteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pro = await requireProfessional();
  const patient = await db.patient.findFirst({
    where: { id, professionalId: pro.id },
    include: {
      followUp: { include: { entries: { orderBy: { createdAt: "desc" } } } },
      appointments: { include: { service: true }, orderBy: { start: "desc" } },
    },
  });
  if (!patient) notFound();
  const fu = patient.followUp;

  return (
    <>
      <Link href="/panel/pacientes" className="text-sm text-teal-700">← Pacientes</Link>
      <h1 className="mt-2 text-2xl font-bold">{patientName(patient)}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {patient.email} · {patient.phone}
        {patient.birthDate && ` · Nac. ${patient.birthDate}`} · Registrado el {fmtDate(patient.createdAt)}
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section>
            <h2 className="mb-2 text-lg font-semibold">Seguimiento</h2>
            {fu && (
              <form action={updateFollowUp.bind(null, patient.id)} className={`${card} mb-4 grid gap-3 sm:grid-cols-3`}>
                <div>
                  <label className={label}>Estado</label>
                  <select name="status" defaultValue={fu.status} className={input}>
                    <option value="ACTIVO">Activo</option>
                    <option value="EN_PAUSA">En pausa</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Objetivo / motivo principal</label>
                  <input name="goal" defaultValue={fu.goal} className={input} />
                </div>
                <div className="sm:col-span-3">
                  <button className={btn}>Guardar</button>
                </div>
              </form>
            )}

            <form action={addNote.bind(null, patient.id)} className={`${card} mb-4`}>
              <label className={label}>Nueva nota de evolución</label>
              <textarea name="text" rows={3} className={input} required />
              <button className={`${btn} mt-3`}>Agregar nota</button>
            </form>

            <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
              {fu?.entries.map((e) => (
                <li key={e.id}>
                  <div className="text-xs text-slate-400">{fmtDateTime(e.createdAt)}</div>
                  <div className={e.kind === "NOTA" ? "rounded-lg border border-slate-200 bg-white p-3 text-sm" : "text-sm text-slate-500"}>
                    {e.text}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside>
          <h2 className="mb-2 text-lg font-semibold">Turnos</h2>
          <div className={`${card} space-y-3 !p-4`}>
            {patient.appointments.map((a) => (
              <div key={a.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span>{fmtDateTime(a.start)}</span>
                  <Badge status={a.status} />
                </div>
                <div className="text-xs text-slate-500">{a.service.name}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
