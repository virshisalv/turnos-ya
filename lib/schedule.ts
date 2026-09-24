const SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // de lunes a domingo

type Row = { weekday: number; startTime: string; endTime: string };

/**
 * Resume los horarios de atención agrupando días consecutivos con los mismos bloques.
 * Ej: [{ days: "Lun a Vie", hours: "09:00–13:00 y 16:00–20:00" }, { days: "Sáb", hours: "09:00–12:00" }]
 */
export function summarizeSchedule(rows: Row[]) {
  const perDay = ORDER.map((d) => ({
    d,
    hours: rows
      .filter((r) => r.weekday === d)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((r) => `${r.startTime}–${r.endTime}`)
      .join(" y "),
  }));

  const groups: { days: number[]; hours: string }[] = [];
  for (const { d, hours } of perDay) {
    if (!hours) continue;
    const last = groups[groups.length - 1];
    const prevDay = last?.days[last.days.length - 1];
    // consecutivo si es el siguiente en el orden lun..dom y tiene los mismos horarios
    if (last && last.hours === hours && ORDER.indexOf(prevDay) + 1 === ORDER.indexOf(d)) last.days.push(d);
    else groups.push({ days: [d], hours });
  }

  return groups.map((g) => ({
    days:
      g.days.length === 1
        ? SHORT[g.days[0]]
        : g.days.length === 2
          ? `${SHORT[g.days[0]]} y ${SHORT[g.days[1]]}`
          : `${SHORT[g.days[0]]} a ${SHORT[g.days[g.days.length - 1]]}`,
    hours: g.hours,
  }));
}
