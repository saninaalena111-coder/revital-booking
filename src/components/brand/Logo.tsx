import Image from "next/image";
import Link from "next/link";
import logoTeal from "@/assets/brand/horiz_teal.png";
import markTeal from "@/assets/brand/krug.png";
import markWhite from "@/assets/brand/krug_white.png";

/** Круглый знак «В» из фирменного стиля */
export function LogoMark({ className = "h-9 w-9", light = false }: { className?: string; light?: boolean }) {
  return <Image src={light ? markWhite : markTeal} alt="" className={`${className} object-contain`} priority />;
}

/** Логотип «Ревиталь» + подпись раздела */
export function Logo({ light = false, subtitle = "Онлайн-запись" }: { light?: boolean; subtitle?: string }) {
  if (light) {
    // Тёмная боковая панель: белый знак, подпись под названием
    return (
      <Link href="/" className="flex items-center gap-3" aria-label="Ревиталь Парк — на главную">
        <LogoMark light className="h-11 w-11 shrink-0" />
        <span className="leading-none">
          <span className="block text-[22px] tracking-[0.06em] text-milk">РЕВИТАЛЬ</span>
          <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-sage">{subtitle}</span>
        </span>
      </Link>
    );
  }
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Ревиталь Парк — на главную">
      <Image src={logoTeal} alt="Ревиталь" className="h-9 w-auto sm:h-10" priority />
      <span className="hidden border-l border-line pl-3 text-[11px] font-semibold uppercase leading-tight tracking-[0.18em] text-teal sm:block">{subtitle}</span>
    </Link>
  );
}
