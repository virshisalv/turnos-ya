"use client";

import { useEffect, useState } from "react";
import { btn, btnGhost, input } from "../../ui";

export default function ShareLink({ slug, name, profession }: { slug: string; name: string; profession: string }) {
  // El origen se toma del navegador para que el link sirva tanto en local como una vez publicada la app.
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  const url = origin ? `${origin}/reservar/${slug}#solicitar-turno` : "";
  const text = `Hola! Podés solicitar turno con ${name} (${profession}) desde este link: ${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* si el navegador bloquea el portapapeles, el link igual se puede seleccionar a mano */
    }
  }

  return (
    <div className="space-y-3">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={`${input} bg-slate-50`} aria-label="Link para solicitar turno" />
      <div className="flex flex-wrap gap-2">
        <a
          href={url ? whatsapp : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} !bg-emerald-600 hover:!bg-emerald-700 ${url ? "" : "pointer-events-none opacity-50"}`}
        >
          Compartir por WhatsApp
        </a>
        <button type="button" onClick={copy} disabled={!url} className={btnGhost}>
          {copied ? "Link copiado ✓" : "Copiar link"}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Quien abra el link va directo al calendario para elegir día y horario y solicitar el turno.
      </p>
    </div>
  );
}
