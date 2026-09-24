import Link from "next/link";
import { db } from "@/lib/db";
import { requireProfessional } from "@/lib/auth";
import { addService, toggleService, updateService } from "../../actions";
import { btn, btnGhost, card, input, label } from "../../ui";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const pro = await requireProfessional();
  const services = await db.service.findMany({ where: { professionalId: pro.id }, orderBy: { durationMin: "asc" } });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h2 className="mb-1 text-xl font-bold">Horarios de atención</h2>
        <p className="mb-4 text-sm text-slate-500">Definí los días y franjas de toda la semana en una sola pantalla.</p>
        <div className={card}>
          <Link href="/panel/horarios" className={btn}>Configurar horarios de la semana</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold">Tipos de atención</h2>
        <p className="mb-4 text-sm text-slate-500">Cada tipo tiene su duración; los turnos se generan según ella.</p>
        <div className={`${card} mb-4 space-y-3`}>
          {services.map((s) => (
            <form key={s.id} action={updateService.bind(null, s.id)} className="flex flex-wrap items-center gap-2">
              <input
                name="name"
                defaultValue={s.name}
                required
                className={`${input} min-w-0 flex-1 ${s.active ? "" : "text-slate-400 line-through"}`}
              />
              <input
                name="durationMin"
                type="number"
                min={5}
                max={480}
                step={5}
                defaultValue={s.durationMin}
                required
                aria-label="Minutos"
                className={`${input} !w-20`}
              />
              <span className="text-xs text-slate-500">min</span>
              <button className={btn}>Guardar</button>
              <button formAction={toggleService.bind(null, s.id)} formNoValidate className={btnGhost}>
                {s.active ? "Desactivar" : "Activar"}
              </button>
            </form>
          ))}
          {services.length === 0 && <p className="text-sm text-slate-400">Sin tipos de atención.</p>}
          <p className="pt-1 text-xs text-slate-500">
            Al cambiar la duración solo se ven afectados los turnos nuevos; los ya reservados conservan la suya.
          </p>
        </div>
        <form action={addService} className={`${card} grid grid-cols-3 gap-3`}>
          <div className="col-span-2">
            <label className={label}>Nombre</label>
            <input name="name" className={input} placeholder="Primera consulta" required />
          </div>
          <div>
            <label className={label}>Minutos</label>
            <input name="durationMin" type="number" min={5} max={480} step={5} defaultValue={30} className={input} required />
          </div>
          <div className="col-span-3">
            <button className={btn}>Agregar tipo de atención</button>
          </div>
        </form>
      </section>
    </div>
  );
}
