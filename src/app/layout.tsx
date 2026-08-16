import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naturalización MX — Examen de Ciudadanía",
  description:
    "Práctica del examen de naturalización mexicana: simulador de Historia/Cultura, lectura, entrevista y redacción.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
