import { db } from "@/lib/db";

// Sirve la foto de perfil de un profesional (pública: se muestra en la página de reservas).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await db.professionalPhoto.findUnique({ where: { professionalId: id } });
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      // La URL lleva ?v=<updatedAt>, así que puede cachearse sin problema.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
