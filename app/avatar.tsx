/* eslint-disable @next/next/no-img-element */
export default function Avatar({
  id,
  name,
  photoVersion,
  size = 64,
}: {
  id: string;
  name: string;
  photoVersion?: number | null; // updatedAt de la foto; null/undefined = sin foto
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  if (photoVersion) {
    return (
      <img
        src={`/foto/${id}?v=${photoVersion}`}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size / 2.6 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800"
    >
      {initials}
    </div>
  );
}
