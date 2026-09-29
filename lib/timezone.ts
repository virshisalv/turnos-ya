// Zona horaria en la que operan los profesionales (Argentina no tiene horario de verano
// desde 2009, así que un offset fijo es exacto y evita depender del reloj del servidor,
// que puede estar en UTC en producción y en otra zona en una máquina local).
export const APP_TIMEZONE = "America/Argentina/Buenos_Aires";
const APP_OFFSET_MIN = -180; // UTC-3

/**
 * Convierte una fecha y hora "de pared" en la zona horaria de la app a su instante UTC real,
 * sin importar en qué zona horaria esté corriendo el proceso de Node que ejecuta esto.
 */
export function zonedToUtc(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0) - APP_OFFSET_MIN * 60000);
}

/** Opciones para pasarle a Intl/toLocale*, para que el horario se vea igual sin importar el servidor. */
export const tz = { timeZone: APP_TIMEZONE } as const;

/** Fecha de "hoy" ("YYYY-MM-DD") en la zona horaria de la app, no en la del servidor. */
export function todayInAppTz() {
  const parts = new Intl.DateTimeFormat("en-CA", { ...tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    new Date(),
  );
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
