"use client";

import { useActionState } from "react";
import { btn, input, label } from "../ui";

type Action = (prev: string | null, f: FormData) => Promise<string | null>;

export default function ResetForm({ action, mode }: { action: Action; mode: "request" | "set" }) {
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      {mode === "request" ? (
        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" className={input} required autoFocus />
        </div>
      ) : (
        <>
          <div>
            <label className={label}>Nueva contraseña</label>
            <input name="password" type="password" className={input} required minLength={6} autoFocus />
          </div>
          <div>
            <label className={label}>Repetir contraseña</label>
            <input name="confirm" type="password" className={input} required minLength={6} />
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={`${btn} w-full`} disabled={pending}>
        {pending ? "Un momento..." : mode === "request" ? "Enviar enlace" : "Guardar contraseña"}
      </button>
    </form>
  );
}
