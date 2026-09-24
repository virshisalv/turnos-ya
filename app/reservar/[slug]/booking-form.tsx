"use client";

import { useActionState, useEffect, useState } from "react";
import { book, fetchSlots } from "../../actions";
import { stripPhoneChars } from "@/lib/phone";
import { btn, input, label } from "../../ui";

type Service = { id: string; name: string; durationMin: number };

export default function BookingForm({
  slug,
  professionalId,
  services,
  today,
  weekdays,
}: {
  slug: string;
  professionalId: string;
  services: Service[];
  today: string;
  weekdays: number[];
}) {
  const [error, formAction, pending] = useActionState(book.bind(null, slug), null);
  const serviceId = services[0]?.id ?? "";
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
        <label className={label}>Elegí un día</label>
        <Calendar today={today} weekdays={weekdays} value={date} onChange={setDate} />
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
          <label className={label}>Nombre</label>
          <input name="name" className={input} autoComplete="given-name" required />
        </div>
        <div>
          <label className={label}>Apellido</label>
          <input name="lastName" className={input} autoComplete="family-name" required />
        </div>
        <div>
          <label className={label}>Teléfono</label>
          <input
          name="phone"
          className={input}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          pattern="\+?[0-9\s\-\(\)]{8,20}"
          title="Solo números (entre 8 y 15 dígitos). Ej: +54 9 11 2345-6789"
          placeholder="Ej: 11 2345-6789"
          onInput={(e) => (e.currentTarget.value = stripPhoneChars(e.currentTarget.value))}
        />
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

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DOW = ["L", "M", "X", "J", "V", "S", "D"];
const pad = (n: number) => String(n).padStart(2, "0");

function Calendar({
  today,
  weekdays,
  value,
  onChange,
}: {
  today: string;
  weekdays: number[];
  value: string;
  onChange: (d: string) => void;
}) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7; // semana desde lunes
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isCurrentMonth = view.y === ty && view.m === tm - 1;
  const shift = (d: number) =>
    setView((v) => {
      const dt = new Date(v.y, v.m + d, 1);
      return { y: dt.getFullYear(), m: dt.getMonth() };
    });

  return (
    <div className="max-w-xs rounded-xl border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={isCurrentMonth} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label="Mes anterior">‹</button>
        <span className="text-sm font-semibold">{MONTHS[view.m]} {view.y}</span>
        <button type="button" onClick={() => shift(1)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100" aria-label="Mes siguiente">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {DOW.map((d) => (
          <div key={d} className="py-1 font-medium text-slate-400">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const str = `${view.y}-${pad(view.m + 1)}-${pad(day)}`;
          const enabled = str >= today && weekdays.includes(new Date(view.y, view.m, day).getDay());
          const selected = str === value;
          return (
            <button
              type="button"
              key={i}
              disabled={!enabled}
              onClick={() => onChange(str)}
              className={`rounded-lg py-1.5 text-sm ${
                selected ? "bg-teal-700 font-semibold text-white" : enabled ? "hover:bg-teal-50 text-slate-900" : "text-slate-300"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
