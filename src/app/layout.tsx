import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const titleFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-title"
});

const bodyFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Jônatas e Nadjilla",
  description: "Site do casamento com RSVP, recados e informações importantes."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${titleFont.variable} ${bodyFont.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
