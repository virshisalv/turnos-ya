"use client";

import { useActionState, useEffect, useState } from "react";
import { book, fetchSlots } from "../../actions";
import { btn, input, label } from "../../ui";

type Service = { id: string; name: string; durationMin: number };

export default function BookingForm({
  slug,
  professionalId,
  services,
  today,
}: {
  slug: string;
  professionalId: string;
  services: Service[];
  today: string;
}) {
  const [error, formAction, pending] = useActionState(book.bind(null, slug), null);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);

  useEffect(() => {
    setTime("");
    if (!serviceId || !date) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setSlots(null);
    fetchSlots(professionalId, serviceId, date).then((s) => !cancelled && setSlots(s));
    return () => {
      cancelled = true;
    };
  }, [professionalId, serviceId, date]);

  if (services.length === 0)
    return <p className="text-slate-500">Este profesional todavía no configuró tipos de atención.</p>;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={time} />

      <div>
        <label className={label}>Tipo de atención</label>
        <select className={input} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.durationMin} min)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Día</label>
        <input type="date" min={today} className={input} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {date && (
        <div>
          <label className={label}>Horario</label>
          {slots === null ? (
            <p className="text-sm text-slate-500">Buscando horarios...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500">No hay horarios disponibles ese día.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setTime(s)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    time === s ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white hover:border-teal-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <hr className="border-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Nombre y apellido</label>
          <input name="name" className={input} required />
        </div>
        <div>
          <label className={label}>Teléfono</label>
          <input name="phone" className={input} required />
        </div>
        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" className={input} required />
        </div>
        <div>
          <label className={label}>Fecha de nacimiento (opcional)</label>
          <input name="birthDate" type="date" className={input} />
        </div>
      </div>
      <div>
        <label className={label}>Motivo de la consulta</label>
        <textarea name="reason" rows={3} className={input} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={btn} disabled={pending || !time}>
        {pending ? "Reservando..." : "Confirmar turno"}
      </button>
    </form>
  );
}
