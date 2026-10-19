import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

const display = Anton({ subsets: ["latin"], variable: "--font-display", weight: "400" });
const sans = Archivo({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Portal do Lobo — A.A.A. CEFET/RJ", template: "%s | Portal do Lobo — A.A.A. CEFET/RJ" },
  description: "Jogos, escala de treinos, loja oficial, Sócio-Lobo e galeria de títulos da Atlética CEFET-RJ.",
  };

export const viewport: Viewport = { themeColor: "#17275F" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
