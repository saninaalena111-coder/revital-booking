"use client";

import { motion } from "framer-motion";
import { useId } from "react";

export function Segmented<T extends string>({
  value, onChange, options, className = "", size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div className={`inline-flex max-w-full overflow-x-auto scrollbar-none rounded-full border border-line bg-cream/70 p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`relative shrink-0 rounded-full ${size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm"} font-medium transition-colors ${value === o.value ? "text-milk" : "text-ink/70 hover:text-forest"}`}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
