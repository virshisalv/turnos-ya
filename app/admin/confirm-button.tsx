"use client";

// Botón de submit que pide confirmación antes de disparar una acción destructiva o sensible.
export default function ConfirmButton({
  confirm,
  className,
  children,
}: {
  confirm: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
