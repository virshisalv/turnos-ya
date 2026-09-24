"use client";

import { useActionState } from "react";
import { removePhoto, updateProfile, uploadPhoto } from "../../actions";
import { stripPhoneChars } from "@/lib/phone";
import { btn, btnGhost, input, label } from "../../ui";

export function PhotoForm() {
  const [error, formAction, pending] = useActionState(uploadPhoto, null);
  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-slate-200"
        />
        <button className={btn} disabled={pending}>
          {pending ? "Subiendo..." : "Subir foto"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">JPG, PNG o WebP, hasta 2 MB.</p>
    </div>
  );
}

export function RemovePhotoButton() {
  return (
    <form action={removePhoto}>
      <button className={btnGhost}>Quitar foto</button>
    </form>
  );
}

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; profession: string; phone: string; license: string; address: string; bio: string; email: string };
}) {
  const [msg, formAction, pending] = useActionState(updateProfile, null);
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={label}>Nombre completo</label>
        <input name="name" defaultValue={defaults.name} className={input} required />
      </div>
      <div>
        <label className={label}>Profesión</label>
        <input name="profession" defaultValue={defaults.profession} className={input} required />
      </div>
      <div>
        <label className={label}>Email (no editable)</label>
        <input value={defaults.email} className={`${input} bg-slate-100`} disabled readOnly />
      </div>
      <div>
        <label className={label}>Teléfono</label>
        <input
          name="phone"
          defaultValue={defaults.phone}
          className={input}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          pattern="\+?[0-9\s\-\(\)]{8,20}"
          title="Solo números (entre 8 y 15 dígitos). Ej: +54 9 11 2345-6789"
          placeholder="Ej: 11 2345-6789"
          onInput={(e) => (e.currentTarget.value = stripPhoneChars(e.currentTarget.value))}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Matrícula profesional</label>
        <input name="license" defaultValue={defaults.license} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Lugar de atención (consultorio y dirección)</label>
        <input name="address" defaultValue={defaults.address} className={input} placeholder="Consultorio Centro, Av. Siempre Viva 123, piso 2" />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Sobre mí</label>
        <textarea name="bio" rows={3} defaultValue={defaults.bio} className={input} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className={btn} disabled={pending}>
          {pending ? "Guardando..." : "Guardar datos"}
        </button>
        {msg === "ok" && <span className="text-sm text-emerald-700">Guardado ✓</span>}
        {msg && msg !== "ok" && <span className="text-sm text-red-600">{msg}</span>}
      </div>
    </form>
  );
}
