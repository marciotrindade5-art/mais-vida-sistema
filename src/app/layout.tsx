import type { Metadata } from "next";
import { Outfit, Yeseva_One } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const yeseva = Yeseva_One({ variable: "--font-yeseva", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Clínica Mais Vida",
  description: "Sistema de gestão da Clínica Mais Vida",
  icons: { icon: "/marca/simbolo-verde.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${yeseva.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
