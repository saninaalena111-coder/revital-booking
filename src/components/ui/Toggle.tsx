"use client";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-forest" : "bg-linen"}`}
    >
      <span
        className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-milk shadow transition-transform duration-300 ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
