import Link from "next/link";
import { db } from "@/lib/db";
import { requireProfessional } from "@/lib/auth";
import WeekEditor from "./week-editor";

export const dynamic = "force-dynamic";

export default async function HorariosPage() {
  const pro = await requireProfessional();
  const rows = await db.availability.findMany({
    where: { professionalId: pro.id },
    orderBy: { startTime: "asc" },
  });
  const initial = Array.from({ length: 7 }, (_, d) =>
    rows.filter((r) => r.weekday === d).map((r) => ({ start: r.startTime, end: r.endTime })),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/panel" className="text-sm text-teal-700">← Agenda</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Horarios de la semana</h1>
      <p className="mb-6 text-sm text-slate-500">
        Definí en qué días y franjas atendés. Podés cargar varios bloques por día (por ejemplo mañana y tarde). Los
        turnos ya reservados no se modifican.
      </p>
      <WeekEditor initial={initial} />
    </div>
  );
}
