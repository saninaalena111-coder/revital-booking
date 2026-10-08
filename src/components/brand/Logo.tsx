import Link from "next/link";

export function LogoMark({ className = "h-9 w-9", light = false }: { className?: string; light?: boolean }) {
  const c = light ? "#faf8f3" : "#2f5451";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="19" fill="none" stroke={c} strokeWidth="1" />
      <path d="M20 31c0-8 0-12 0-17" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M20 22c-6-1-9-5-9-10 5 0 9 3 9 10Z" fill="none" stroke={c} strokeWidth="1.2" />
      <path d="M20 18c5-.5 8-4 8-8.5-4.5 0-8 3-8 8.5Z" fill="#d0ab67" fillOpacity=".9" />
    </svg>
  );
}

export function Logo({ light = false, subtitle = "Medical Booking" }: { light?: boolean; subtitle?: string }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Revital Park — на главную">
      <LogoMark light={light} />
      <span className="leading-none">
        <span className={`font-display block text-[22px] tracking-tight ${light ? "text-milk" : "text-forest-deep"}`}>Revital Park</span>
        <span className={`mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.28em] ${light ? "text-sage" : "text-teal"}`}>{subtitle}</span>
      </span>
    </Link>
  );
}
