import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const display = Oswald({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Portal do Esporte — Atlética Lobo", template: "%s | Portal do Esporte — Atlética Lobo" },
  description: "Jogos, escala de treinos, loja oficial, Sócio-Lobo e galeria de títulos da Atlética Lobo.",
  icons: { icon: "/img/lobo.svg" },
};

export const viewport: Viewport = { themeColor: "#0B1F3A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
