/** Caracteres que se aceptan al tipear un teléfono: números, +, espacios, guiones y paréntesis. */
export const stripPhoneChars = (v: string) => v.replace(/[^\d+\-\s()]/g, "");

/** Teléfono válido: "+" solo al inicio, entre 8 y 15 dígitos (estándar E.164). */
export function isValidPhone(v: string) {
  const t = v.trim();
  if (!/^\+?[\d\s\-()]+$/.test(t)) return false;
  const digits = t.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15;
}

export const PHONE_ERROR = "Ingresá un teléfono válido, solo números (entre 8 y 15 dígitos).";
