"use client";

import { useActionState, useState } from "react";
import { saveWeek } from "../../actions";
import { btn, btnGhost, input } from "../../ui";

type Block = { start: string; end: string };
type Week = Block[][]; // índice 0 = domingo ... 6 = sábado

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // se muestra de lunes a domingo
const DEFAULT_BLOCK: Block = { start: "09:00", end: "13:00" };

export default function WeekEditor({ initial }: { initial: Week }) {
  const [week, setWeek] = useState<Week>(initial);
  const [msg, formAction, pending] = useActionState(saveWeek, null);

  const setDay = (d: number, blocks: Block[]) => setWeek((w) => w.map((x, i) => (i === d ? blocks : x)));
  const editBlock = (d: number, i: number, patch: Partial<Block>) =>
    setDay(d, week[d].map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const clone = (blocks: Block[]) => blocks.map((b) => ({ ...b }));

  // Copia los bloques de un día a los días indicados
  const copyTo = (from: number, targets: number[]) =>
    setWeek((w) => w.map((x, i) => (targets.includes(i) ? clone(w[from]) : x)));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="week" value={JSON.stringify(week)} />

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {ORDER.map((d) => {
          const blocks = week[d];
          const enabled = blocks.length > 0;
          return (
            <div key={d} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <label className="flex w-40 shrink-0 items-center gap-2 pt-1.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setDay(d, e.target.checked ? [{ ...DEFAULT_BLOCK }] : [])}
                  className="h-4 w-4 accent-teal-700"
                />
                {DAYS[d]}
              </label>

              <div className="flex-1 space-y-2">
                {!enabled && <p className="pt-1.5 text-sm text-slate-400">No atiende</p>}
                {blocks.map((b, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={b.start}
                      onChange={(e) => editBlock(d, i, { start: e.target.value })}
                      className={`${input} !w-28`}
                      required
                    />
                    <span className="text-slate-400">a</span>
                    <input
                      type="time"
                      value={b.end}
                      onChange={(e) => editBlock(d, i, { end: e.target.value })}
                      className={`${input} !w-28`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setDay(d, blocks.filter((_, j) => j !== i))}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                {enabled && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDay(d, [...blocks, { start: "16:00", end: "20:00" }])}
                      className="text-xs font-medium text-teal-700 hover:underline"
                    >
                      + Agregar otro bloque
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => copyTo(d, [1, 2, 3, 4, 5])}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Copiar a lun–vie
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTo(d, [0, 1, 2, 3, 4, 5, 6])}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Copiar a toda la semana
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className={btn} disabled={pending}>
          {pending ? "Guardando..." : "Guardar horarios"}
        </button>
        <button type="button" className={btnGhost} onClick={() => setWeek(initial)}>
          Descartar cambios
        </button>
        {msg === "ok" && <span className="text-sm text-emerald-700">Horarios guardados ✓</span>}
        {msg && msg !== "ok" && <span className="text-sm text-red-600">{msg}</span>}
      </div>
    </form>
  );
}
