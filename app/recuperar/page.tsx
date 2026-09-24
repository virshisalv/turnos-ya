import Link from "next/link";
import { requestReset } from "../actions";
import { card } from "../ui";
import ResetForm from "./reset-form";

export default function RecuperarPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-slate-600">Ingresá tu email y te enviamos un enlace para crear una contraseña nueva.</p>
      <div className={card}>
        <ResetForm action={requestReset} mode="request" />
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-teal-700 underline">Volver a ingresar</Link>
      </p>
    </main>
  );
}
