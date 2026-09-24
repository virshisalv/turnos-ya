import { resetPassword } from "../../actions";
import { card } from "../../ui";
import ResetForm from "../reset-form";

export default async function NuevaClavePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Nueva contraseña</h1>
      <div className={card}>
        <ResetForm action={resetPassword.bind(null, token)} mode="set" />
      </div>
    </main>
  );
}
