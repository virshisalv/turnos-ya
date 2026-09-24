import { db } from "./db";

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** Fecha/hora "naive" interpretada en la zona horaria del servidor. */
export const parseLocal = (date: string, time: string) => new Date(`${date}T${time}:00`);

export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** Devuelve los horarios ("HH:mm") libres de un profesional para un día y una duración dada. */
export async function getFreeSlots(professionalId: string, date: string, durationMin: number) {
  const day = parseLocal(date, "00:00");
  if (isNaN(day.getTime())) return [];
  const blocks = await db.availability.findMany({
    where: { professionalId, weekday: day.getDay() },
  });
  const dayEnd = new Date(day.getTime() + 24 * 3600 * 1000);
  const busy = await db.appointment.findMany({
    where: {
      professionalId,
      status: { not: "CANCELADO" },
      start: { gte: day, lt: dayEnd },
    },
  });
  const now = Date.now();
  const slots = new Set<string>();
  for (const b of blocks) {
    for (let t = toMin(b.startTime); t + durationMin <= toMin(b.endTime); t += durationMin) {
      const start = parseLocal(date, fromMin(t));
      const end = new Date(start.getTime() + durationMin * 60000);
      if (start.getTime() <= now) continue;
      if (busy.some((a) => a.start < end && a.end > start)) continue;
      slots.add(fromMin(t));
    }
  }
  return [...slots].sort();
}
