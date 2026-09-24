import Link from "next/link";
import { register } from "../actions";
import AuthForm from "../auth-form";
import { card } from "../ui";

export default function RegistroPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Crear cuenta profesional</h1>
      <div className={card}>
        <AuthForm action={register} mode="register" />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta? <Link href="/login" className="text-teal-700 underline">Ingresá</Link>
      </p>
    </main>
  );
}
