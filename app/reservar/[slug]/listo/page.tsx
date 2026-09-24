import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { card } from "../../../ui";

export default async function ListoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;
  const appt = id
    ? await db.appointment.findFirst({
        where: { id, professional: { slug } },
        include: { service: true, professional: true },
      })
    : null;
  if (!appt) notFound();

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className={`${card} text-center`}>
        <div className="mb-2 text-4xl">✅</div>
        <h1 className="text-xl font-bold">¡Turno confirmado!</h1>
        <p className="mt-3 text-slate-700">
          {appt.service.name} con <strong>{appt.professional.name}</strong>
        </p>
        <p className="text-slate-700">{fmtDateTime(appt.start)}</p>
        <Link href="/" className="mt-6 inline-block text-sm text-teal-700 underline">Volver al inicio</Link>
      </div>
    </main>
  );
}
