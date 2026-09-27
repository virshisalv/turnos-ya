"use client";

import { useActionState } from "react";
import { btn, input, label } from "../ui";

type Action = (prev: string | null, f: FormData) => Promise<string | null>;

export default function AdminAuthForm({ action, mode }: { action: Action; mode: "login" | "setup" }) {
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      {mode === "setup" && (
        <div>
          <label className={label}>Nombre</label>
          <input name="name" className={input} required />
        </div>
      )}
      <div>
        <label className={label}>Email</label>
        <input name="email" type="email" className={input} required />
      </div>
      <div>
        <label className={label}>Contraseña</label>
        <input name="password" type="password" className={input} required minLength={6} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={`${btn} w-full`} disabled={pending}>
        {pending ? "Un momento..." : mode === "login" ? "Ingresar" : "Crear cuenta de administrador"}
      </button>
    </form>
  );
}
