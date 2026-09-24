export const fmtDateTime = (d: Date) =>
  d.toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
export const fmtTime = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
