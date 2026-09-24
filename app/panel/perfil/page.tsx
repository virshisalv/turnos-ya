import { db } from "@/lib/db";
import { requireProfessional } from "@/lib/auth";
import { addEducation, addWorkplace, removeEducation, removeWorkplace } from "../../actions";
import Avatar from "../../avatar";
import { btn, card, input, label } from "../../ui";
import ShareLink from "./share";
import { PhotoForm, ProfileForm, RemovePhotoButton } from "./forms";

export const dynamic = "force-dynamic";

// Sin año de fin: solo se muestra el año de inicio (los datos viejos con fin se siguen mostrando)
const years = (start: number | null, end: number | null) =>
  end ? `${start ?? "?"} – ${end}` : start ? `desde ${start}` : "";

export default async function PerfilPage() {
  const pro = await requireProfessional();
  const [photo, educations, workplaces] = await Promise.all([
    db.professionalPhoto.findUnique({ where: { professionalId: pro.id }, select: { updatedAt: true } }),
    db.education.findMany({ where: { professionalId: pro.id }, orderBy: [{ endYear: { sort: "desc", nulls: "first" } }, { startYear: "desc" }] }),
    db.workplace.findMany({ where: { professionalId: pro.id }, orderBy: [{ endYear: { sort: "desc", nulls: "first" } }, { startYear: "desc" }] }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Configurar perfil</h1>

      {/* Link para compartir */}
      <section className={card}>
        <h2 className="mb-1 text-lg font-semibold">Compartí tu link para solicitar turnos</h2>
        <p className="mb-4 text-sm text-slate-500">Enviáselo a tus pacientes por WhatsApp o copialo donde quieras.</p>
        <ShareLink slug={pro.slug} name={pro.name} profession={pro.profession} />
      </section>

      {/* Foto y datos */}
      <section className={card}>
        <div className="mb-6 flex flex-col items-center gap-3">
          <Avatar id={pro.id} name={pro.name} photoVersion={photo?.updatedAt.getTime()} size={112} />
          <PhotoForm />
          {photo && <RemovePhotoButton />}
        </div>
        <h2 className="mb-3 border-t border-slate-100 pt-5 text-lg font-semibold">Datos personales</h2>
        <ProfileForm
          defaults={{
            name: pro.name,
            profession: pro.profession,
            phone: pro.phone,
            license: pro.license,
            address: pro.address,
            bio: pro.bio,
            email: pro.email,
          }}
        />
      </section>

      {/* Trayecto académico */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Trayecto académico</h2>
        <div className={`${card} mb-3 space-y-3`}>
          {educations.length === 0 && <p className="text-sm text-slate-400">Todavía no cargaste estudios.</p>}
          {educations.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-slate-500">
                  {e.institution}
                  {years(e.startYear, e.endYear) && ` · ${years(e.startYear, e.endYear)}`}
                </div>
              </div>
              <form action={removeEducation.bind(null, e.id)}>
                <button className="text-xs text-red-600 hover:underline">Quitar</button>
              </form>
            </div>
          ))}
        </div>
        <form action={addEducation} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <div>
            <label className={label}>Título / carrera / curso</label>
            <input name="title" className={input} placeholder="Licenciatura en Psicología" required />
          </div>
          <div>
            <label className={label}>Institución</label>
            <input name="institution" className={input} placeholder="Universidad de..." required />
          </div>
          <div>
            <label className={label}>Año de inicio</label>
            <input name="startYear" type="number" min={1900} max={2100} className={input} />
          </div>
          <div className="sm:col-span-2">
            <button className={btn}>Agregar estudio</button>
          </div>
        </form>
      </section>

      {/* Lugares de trabajo */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Lugares de trabajo</h2>
        <div className={`${card} mb-3 space-y-3`}>
          {workplaces.length === 0 && <p className="text-sm text-slate-400">Todavía no cargaste lugares de trabajo.</p>}
          {workplaces.map((w) => (
            <div key={w.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <div className="font-medium">
                  {w.name}
                  {w.role && <span className="font-normal text-slate-500"> · {w.role}</span>}
                </div>
                <div className="text-slate-500">
                  {[w.address, years(w.startYear, w.endYear)].filter(Boolean).join(" · ")}
                </div>
              </div>
              <form action={removeWorkplace.bind(null, w.id)}>
                <button className="text-xs text-red-600 hover:underline">Quitar</button>
              </form>
            </div>
          ))}
        </div>
        <form action={addWorkplace} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <div>
            <label className={label}>Lugar</label>
            <input name="name" className={input} placeholder="Clínica / Hospital / Consultorio propio" required />
          </div>
          <div>
            <label className={label}>Cargo o rol</label>
            <input name="role" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Dirección</label>
            <input name="address" className={input} />
          </div>
          <div>
            <label className={label}>Año de inicio</label>
            <input name="startYear" type="number" min={1900} max={2100} className={input} />
          </div>
          <div className="sm:col-span-2">
            <button className={btn}>Agregar lugar de trabajo</button>
          </div>
        </form>
      </section>
    </div>
  );
}
