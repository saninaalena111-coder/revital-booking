import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppChrome } from "@/components/layout/AppChrome";
import "./globals.css";

/** Фирменный шрифт Ревиталь — Myriad Pro (без засечек) */
const myriad = localFont({
  variable: "--font-myriad",
  display: "swap",
  src: [
    { path: "../fonts/MyriadPro-Light.otf", weight: "300", style: "normal" },
    { path: "../fonts/MyriadPro-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/MyriadPro-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../fonts/MyriadPro-Bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Онлайн-запись — медицинский центр Ревиталь Парк",
  description: "Собственная система онлайн-записи Ревиталь Парк. Интерактивный прототип.",
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${myriad.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
