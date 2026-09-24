import Link from "next/link";
import { card } from "../../ui";

export default function EnviadoPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <div className={`${card} text-center`}>
        <div className="mb-2 text-4xl">📧</div>
        <h1 className="text-xl font-bold">Revisá tu email</h1>
        <p className="mt-3 text-sm text-slate-600">
          Si el email está registrado, te enviamos un enlace para restablecer la contraseña. Vale por 1 hora.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-teal-700 underline">Volver a ingresar</Link>
      </div>
    </main>
  );
}
