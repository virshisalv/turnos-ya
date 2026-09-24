import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnos Ya",
  description: "Agenda de turnos y seguimiento de pacientes para profesionales",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
