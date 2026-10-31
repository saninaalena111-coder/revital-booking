import type { Metadata, Viewport } from "next";
import { AppChrome } from "@/components/layout/AppChrome";
// Фирменный шрифт Ревиталь — Myriad Pro. Модуль создаёт scripts/prepare-fonts.mjs:
// без лицензионных файлов шрифта сайт собирается на системном шрифте.
import { brandFont as myriad } from "@/fonts";
import "./globals.css";

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
