import type { Doctor } from "@/lib/types";

const TONES: Record<Doctor["tone"], [string, string, string]> = {
  sage: ["#e6ecdf", "#c5d3bd", "#497673"],
  sand: ["#f1e9db", "#dccdb2", "#8a6f45"],
  teal: ["#dbe7e4", "#a8c2be", "#2f5451"],
  gold: ["#f5ead1", "#e2cb96", "#7a5a1c"],
  linen: ["#efe9df", "#d8ccb9", "#598988"],
  mist: ["#e6eae5", "#c8d3ce", "#1e3836"],
};

/**
 * Фото-заглушка врача. В рабочей версии — реальная фотография
 * (хранится в нашей системе, т.к. в МИС фото обычно нет).
 */
export function DoctorPortrait({ doctor, className = "", rounded = "rounded-[22px]" }: { doctor: Doctor; className?: string; rounded?: string }) {
  const [bg1, bg2, accent] = TONES[doctor.tone];
  const female = doctor.patronymic.endsWith("на");
  const gid = `g-${doctor.id}`;
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <svg viewBox="0 0 300 360" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={bg1} />
            <stop offset="1" stopColor={bg2} />
          </linearGradient>
          <linearGradient id={`${gid}-coat`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#f1ede6" />
          </linearGradient>
        </defs>
        <rect width="300" height="360" fill={`url(#${gid})`} />
        {/* арочное окно санатория */}
        <path d="M60 360V150a90 90 0 0 1 180 0v210" fill="#ffffff" fillOpacity=".28" />
        <path d="M60 360V150a90 90 0 0 1 180 0v210" fill="none" stroke="#ffffff" strokeOpacity=".55" />
        <path d="M150 60v300M60 210h180" stroke="#ffffff" strokeOpacity=".35" />
        {/* шея */}
        <path d="M132 196h36v34h-36z" fill="#e9cdb5" />
        {/* волосы сзади */}
        {female && <path d="M100 150c0-44 22-70 50-70s50 26 50 70c0 30-6 58-14 70h-72c-8-12-14-40-14-70Z" fill={accent} fillOpacity=".85" />}
        {/* голова */}
        <ellipse cx="150" cy="148" rx="36" ry="44" fill="#f0d7c1" />
        {/* волосы спереди */}
        {female ? (
          <path d="M112 146c2-34 18-54 40-54 22 0 36 16 38 44-14-4-30-14-40-30-8 18-22 32-38 40Z" fill={accent} />
        ) : (
          <path d="M114 140c0-30 16-48 36-48s36 16 36 44c-8-10-20-18-36-18s-28 8-36 22Z" fill={accent} />
        )}
        {/* халат */}
        <path d="M58 360c0-70 30-122 92-128 62 6 92 58 92 128Z" fill={`url(#${gid}-coat)`} />
        <path d="M132 232l18 52 18-52" fill={accent} fillOpacity=".55" />
        <path d="M120 236l30 70M180 236l-30 70" stroke="#d9d2c6" strokeWidth="1.5" fill="none" />
        {/* стетоскоп */}
        <path d="M128 240c-8 30-4 56 14 64" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="144" cy="306" r="6" fill="none" stroke={accent} strokeWidth="2.5" />
        {/* бейдж */}
        <rect x="186" y="282" width="30" height="10" rx="2" fill={accent} fillOpacity=".45" />
      </svg>
    </div>
  );
}
