import Link from "next/link";
import type { Tenant } from "@/config/tenant";
import { Logo } from "@/components/brand/Logo";

/**
 * Логотип арендатора. Для Ревиталь — фирменные файлы,
 * для других сетей — текстовый знак в цветах бренда из конфига.
 */
export function TenantLogo({ tenant, light = false, subtitle, href = "/mis" }: { tenant: Tenant; light?: boolean; subtitle: string; href?: string }) {
  if (tenant.brand.logo === "revital") return <Logo light={light} subtitle={subtitle} href={href} />;
  const initial = tenant.brand.wordmark[0];
  return (
    <Link href={href} className="flex items-center gap-3" aria-label={`${tenant.brand.name} — на главную`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-lg font-semibold ${light ? "border-milk/70 text-milk" : "border-teal text-teal"}`}>
        {initial}
      </span>
      <span className="leading-none">
        <span className={`block text-[17px] tracking-[0.06em] ${light ? "text-milk" : "text-forest-deep"}`}>{tenant.brand.wordmark}</span>
        <span className={`mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? "text-sage" : "text-teal"}`}>{subtitle}</span>
      </span>
    </Link>
  );
}
