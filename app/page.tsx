import Link from "next/link";
import { db } from "@/lib/db";
import { getProfessional } from "@/lib/auth";
import { btn, btnGhost, card } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pros, me] = await Promise.all([
    db.professional.findMany({ orderBy: { name: "asc" } }),
    getProfessional(),
  ]);
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-12 flex items-center justify-between">
        <h1 className="text-xl font-bold text-teal-800">Turnos Ya</h1>
        <nav className="flex gap-2">
          {me ? (
            <Link href="/panel" className={btn}>Ir a mi panel</Link>
          ) : (
            <>
              <Link href="/login" className={btnGhost}>Ingresar</Link>
              <Link href="/registro" className={btn}>Soy profesional</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mb-10">
        <h2 className="text-3xl font-bold">Reservá tu turno online</h2>
        <p className="mt-2 text-slate-600">Elegí un profesional, un horario disponible y listo.</p>
      </section>

      {pros.length === 0 ? (
        <p className="text-slate-500">Todavía no hay profesionales registrados.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pros.map((p) => (
            <Link key={p.id} href={`/reservar/${p.slug}`} className={`${card} transition hover:border-teal-600`}>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-slate-500">{p.profession}</div>
              <div className="mt-3 text-sm font-medium text-teal-700">Reservar turno →</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
