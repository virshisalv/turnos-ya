import Link from "next/link";
import { db } from "@/lib/db";
import { requireProfessional } from "@/lib/auth";
import { fmtTime, patientName } from "@/lib/format";
import { setAppointmentStatus } from "../actions";
import { Badge, btn, btnGhost, card } from "../ui";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const pro = await requireProfessional();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const appts = await db.appointment.findMany({
    where: { professionalId: pro.id, start: { gte: startOfToday } },
    include: { patient: true, service: true },
    orderBy: { start: "asc" },
    take: 100,
  });

  // Agrupar por día
  const byDay = new Map<string, typeof appts>();
  for (const a of appts) {
    const key = a.start.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Link href="/panel/horarios" className={btn}>Configurar horarios de la semana</Link>
      </div>
      {appts.length === 0 && (
        <p className="text-slate-500">
          No hay turnos próximos. Compartí tu página: <Link className="text-teal-700 underline" href={`/reservar/${pro.slug}`}>/reservar/{pro.slug}</Link>
        </p>
      )}
      <div className="space-y-6">
        {[...byDay.entries()].map(([day, list]) => (
          <section key={day}>
            <h2 className="mb-2 text-sm font-semibold capitalize text-slate-600">{day}</h2>
            <div className="space-y-2">
              {list.map((a) => (
                <div key={a.id} className={`${card} flex flex-wrap items-center justify-between gap-3 !p-4`}>
                  <div>
                    <div className="font-medium">
                      {fmtTime(a.start)} – {fmtTime(a.end)} · {a.service.name}
                    </div>
                    <Link href={`/panel/pacientes/${a.patientId}`} className="text-sm text-teal-700 hover:underline">
                      {patientName(a.patient)}
                    </Link>
                    {a.reason && <div className="text-xs text-slate-500">{a.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={a.status} />
                    {a.status === "PROGRAMADO" && (
                      <>
                        <form action={setAppointmentStatus.bind(null, a.id, "ATENDIDO")}>
                          <button className={btnGhost}>Atendido</button>
                        </form>
                        <form action={setAppointmentStatus.bind(null, a.id, "AUSENTE")}>
                          <button className={btnGhost}>Ausente</button>
                        </form>
                        <form action={setAppointmentStatus.bind(null, a.id, "CANCELADO")}>
                          <button className={btnGhost}>Cancelar</button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
