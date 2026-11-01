import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-b from-teal to-forest text-milk shadow-[var(--shadow-glow)] hover:-translate-y-0.5 hover:from-forest hover:to-forest-deep hover:shadow-[0_16px_34px_-14px_rgb(47_84_81/0.6)]",
  secondary: "border border-forest/20 bg-milk/60 text-forest backdrop-blur-sm hover:-translate-y-0.5 hover:border-forest/50 hover:bg-milk hover:shadow-[var(--shadow-soft)]",
  ghost: "text-forest hover:bg-forest/[0.06]",
  gold: "bg-gradient-to-b from-[#dcbb7c] to-gold text-forest-deep shadow-[0_10px_26px_-12px_rgb(208_171_103/0.8)] hover:-translate-y-0.5",
  light: "bg-milk/90 text-forest-deep hover:bg-milk",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

interface Common {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className = "", ...rest }: Common & ComponentProps<"button">) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function LinkButton({ variant = "primary", size = "md", className = "", href, ...rest }: Common & { href: string } & Omit<ComponentProps<"a">, "href">) {
  return <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}
