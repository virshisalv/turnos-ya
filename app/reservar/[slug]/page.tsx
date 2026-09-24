import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { todayStr } from "@/lib/format";
import { card } from "../../ui";
import BookingForm from "./booking-form";

export const dynamic = "force-dynamic";

export default async function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pro = await db.professional.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: { durationMin: "asc" } } },
  });
  if (!pro) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-teal-700">← Volver</Link>
      <h1 className="mt-3 text-2xl font-bold">{pro.name}</h1>
      <p className="mb-6 text-slate-500">{pro.profession}</p>
      <div className={card}>
        <BookingForm
          slug={pro.slug}
          professionalId={pro.id}
          services={pro.services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
          today={todayStr()}
        />
      </div>
    </main>
  );
}
