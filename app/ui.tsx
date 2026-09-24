// Clases compartidas para mantener el estilo consistente.
export const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";
export const btn =
  "inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100";
export const card = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
export const label = "mb-1 block text-xs font-medium text-slate-600";

export const STATUS_STYLE: Record<string, string> = {
  PROGRAMADO: "bg-sky-100 text-sky-800",
  ATENDIDO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-200 text-slate-600",
  AUSENTE: "bg-amber-100 text-amber-800",
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? "bg-slate-100"}`}>
      {status.toLowerCase()}
    </span>
  );
}
