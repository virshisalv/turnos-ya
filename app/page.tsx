import Link from "next/link";
import { db } from "@/lib/db";
import { getProfessional } from "@/lib/auth";
import { summarizeSchedule } from "@/lib/schedule";
import Avatar from "./avatar";
import { btn, btnGhost, card } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pros, me] = await Promise.all([
    db.professional.findMany({
      where: { suspended: false },
      orderBy: { name: "asc" },
      include: {
        photo: { select: { updatedAt: true } },
        availability: { select: { weekday: true, startTime: true, endTime: true } },
      },
    }),
    getProfessional(),
  ]);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-teal-800">Turnos Ya</h1>
        <nav className="flex flex-wrap gap-2">
          {me ? (
            <Link href="/panel" className={btn}>Ir a mi panel</Link>
          ) : (
            <>
              <Link href="/login" className={btnGhost}>Ingresar</Link>
              <Link href="/registro" className={btn}>Crear cuenta profesional</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mb-8">
        <h2 className="text-3xl font-bold">Elegí tu profesional y pedí tu turno</h2>
        <p className="mt-2 text-slate-600">Seleccioná un profesional, elegí el día y el horario disponible.</p>
      </section>

      {pros.length === 0 ? (
        <p className="text-slate-500">Todavía no hay profesionales registrados.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pros.map((p) => {
            const schedule = summarizeSchedule(p.availability);
            return (
              <div key={p.id} className={`${card} flex flex-col gap-3`}>
                <div className="flex items-center gap-4">
                  <Avatar id={p.id} name={p.name} photoVersion={p.photo?.updatedAt.getTime()} size={56} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="truncate text-sm text-slate-500">{p.profession}</div>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="font-medium text-slate-700">Días y horarios de atención</div>
                  {schedule.length === 0 ? (
                    <div className="text-slate-400">Horarios a confirmar</div>
                  ) : (
                    schedule.map((g) => (
                      <div key={g.days} className="flex justify-between gap-3 text-slate-600">
                        <span>{g.days}</span>
                        <span className="text-right">{g.hours}</span>
                      </div>
                    ))
                  )}
                </div>

                {p.address && (
                  <div className="text-sm">
                    <div className="font-medium text-slate-700">Lugar de atención</div>
                    <div className="text-slate-600">{p.address}</div>
                  </div>
                )}

                <Link href={`/reservar/${p.slug}`} className={`${btn} mt-auto w-full`}>
                  Solicitar turno
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <footer className="mt-16 text-center">
        <Link href="/admin/login" className="text-xs text-slate-400 hover:text-slate-600">
          Panel de administración
        </Link>
      </footer>
    </main>
  );
}
