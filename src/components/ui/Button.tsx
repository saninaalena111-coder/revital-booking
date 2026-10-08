import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none select-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-forest text-milk hover:bg-forest-deep shadow-[0_8px_24px_-12px_rgb(30_56_54/0.6)]",
  secondary: "border border-forest/25 text-forest hover:border-forest hover:bg-forest/[0.04]",
  ghost: "text-forest hover:bg-forest/[0.06]",
  gold: "bg-gold text-forest-deep hover:bg-[#c79f57]",
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
