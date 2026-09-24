import Link from "next/link";
import { login } from "../actions";
import AuthForm from "../auth-form";
import { card } from "../ui";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Ingresar</h1>
      <div className={card}>
        <AuthForm action={login} mode="login" />
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/recuperar" className="text-teal-700 underline">¿Olvidaste tu contraseña?</Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-600">
        ¿No tenés cuenta? <Link href="/registro" className="text-teal-700 underline">Crear cuenta</Link>
      </p>
    </main>
  );
}
