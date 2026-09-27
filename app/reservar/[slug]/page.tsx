import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { todayStr } from "@/lib/format";
import { summarizeSchedule } from "@/lib/schedule";
import Avatar from "../../avatar";
import { card } from "../../ui";
import BookingForm from "./booking-form";

export const dynamic = "force-dynamic";

const years = (s: number | null, e: number | null) => (e ? `${s ?? "?"} – ${e}` : s ? `desde ${s}` : "");

export default async function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pro = await db.professional.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { durationMin: "asc" } },
      educations: { orderBy: [{ endYear: { sort: "desc", nulls: "first" } }, { startYear: "desc" }] },
      availability: { select: { weekday: true, startTime: true, endTime: true } },
      workplaces: { orderBy: [{ endYear: { sort: "desc", nulls: "first" } }, { startYear: "desc" }] },
    },
  });
  if (!pro) notFound();
  const photo = await db.professionalPhoto.findUnique({ where: { professionalId: pro.id }, select: { updatedAt: true } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-teal-700">← Volver</Link>
      <div className="mb-6 mt-4 flex items-center gap-4">
        <Avatar id={pro.id} name={pro.name} photoVersion={photo?.updatedAt.getTime()} size={80} />
        <div>
          <h1 className="text-2xl font-bold">{pro.name}</h1>
          <p className="text-slate-500">
            {pro.profession}
            {pro.license && ` · Mat. ${pro.license}`}
          </p>
        </div>
      </div>

      <div className={`${card} mb-6 grid gap-4 text-sm sm:grid-cols-2`}>
        <div>
          <h2 className="mb-1 font-semibold">Días y horarios de atención</h2>
          {summarizeSchedule(pro.availability).length === 0 ? (
            <p className="text-slate-400">Horarios a confirmar</p>
          ) : (
            summarizeSchedule(pro.availability).map((g) => (
              <div key={g.days} className="flex justify-between gap-3 text-slate-600">
                <span>{g.days}</span>
                <span className="text-right">{g.hours}</span>
              </div>
            ))
          )}
        </div>
        {pro.address && (
          <div>
            <h2 className="mb-1 font-semibold">Lugar de atención</h2>
            <p className="text-slate-600">{pro.address}</p>
          </div>
        )}
      </div>

      {(pro.bio || pro.educations.length > 0 || pro.workplaces.length > 0) && (
        <div className={`${card} mb-6 space-y-4 text-sm`}>
          {pro.bio && <p className="whitespace-pre-line text-slate-700">{pro.bio}</p>}
          {pro.educations.length > 0 && (
            <div>
              <h2 className="mb-1 font-semibold">Formación</h2>
              <ul className="space-y-1 text-slate-600">
                {pro.educations.map((e) => (
                  <li key={e.id}>
                    {e.title} — {e.institution}
                    {years(e.startYear, e.endYear) && ` (${years(e.startYear, e.endYear)})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pro.workplaces.length > 0 && (
            <div>
              <h2 className="mb-1 font-semibold">Lugares de trabajo</h2>
              <ul className="space-y-1 text-slate-600">
                {pro.workplaces.map((w) => (
                  <li key={w.id}>
                    {w.name}
                    {w.role && ` · ${w.role}`}
                    {w.address && ` · ${w.address}`}
                    {years(w.startYear, w.endYear) && ` (${years(w.startYear, w.endYear)})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div id="solicitar-turno" className={`${card} scroll-mt-4`}>
        {pro.suspended ? (
          <p className="text-slate-500">Este profesional no está disponible para solicitar turnos en este momento.</p>
        ) : (
          <BookingForm
            slug={pro.slug}
            professionalId={pro.id}
            services={pro.services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
            today={todayStr()}
            weekdays={[...new Set(pro.availability.map((a) => a.weekday))]}
          />
        )}
      </div>
    </main>
  );
}
