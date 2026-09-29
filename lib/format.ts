import { todayInAppTz, tz } from "./timezone";

export const fmtDateTime = (d: Date) =>
  d.toLocaleString("es-AR", { ...tz, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const fmtDate = (d: Date) => d.toLocaleDateString("es-AR", { ...tz, day: "2-digit", month: "short", year: "numeric" });
export const fmtTime = (d: Date) => d.toLocaleTimeString("es-AR", { ...tz, hour: "2-digit", minute: "2-digit" });

/** Fecha de "hoy" ("YYYY-MM-DD") en la zona horaria de los profesionales, no en la del servidor. */
export const todayStr = todayInAppTz;

/** "Apellido, Nombre" para mostrar y ordenar pacientes. */
export const patientName = (p: { name: string; lastName: string }) =>
  p.lastName ? `${p.lastName}, ${p.name}` : p.name;
