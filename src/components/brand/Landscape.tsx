/** Иллюстрация-заглушка для hero: горы, лес и мягкое солнце */
export function Landscape({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4efe6" />
          <stop offset=".55" stopColor="#e3eadc" />
          <stop offset="1" stopColor="#cbd6c3" />
        </linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#f1e3c4" />
          <stop offset="1" stopColor="#f1e3c4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#faf8f3" stopOpacity="0" />
          <stop offset=".5" stopColor="#faf8f3" stopOpacity=".7" />
          <stop offset="1" stopColor="#faf8f3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="900" fill="url(#sky)" />
      <circle cx="540" cy="300" r="260" fill="url(#sun)" />
      <circle cx="540" cy="300" r="78" fill="#efdcb2" opacity=".9" />
      <path d="M0 470 120 380l90 50 120-120 130 110 90-60 120 90 130-70v520H0Z" fill="#cbd6c3" />
      <rect y="440" width="800" height="90" fill="url(#mist)" />
      <path d="M0 560c80-40 150-90 250-70s170 70 260 40 190-80 290-50v420H0Z" fill="#9fb8a8" />
      <path d="M0 650c120-50 220-40 330-10s210 30 300-10 120-30 170-20v290H0Z" fill="#598988" />
      <path d="M0 740c140-40 260-30 400 0s260 20 400-20v200H0Z" fill="#2f5451" />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = 20 + i * 52 + (i % 3) * 9;
        const h = 70 + ((i * 37) % 50);
        const y = 760 - ((i * 13) % 30);
        return <path key={i} d={`M${x} ${y - h}l${h * 0.28} ${h}h${-h * 0.56}Z`} fill="#1e3836" opacity={0.85} />;
      })}
      <path d="M0 830c160-20 320-10 480 5s240 10 320 0v65H0Z" fill="#1e3836" />
      <g stroke="#faf8f3" strokeOpacity=".5" fill="none" strokeWidth="1.2">
        <path d="M150 210q10-8 20 0q10-8 20 0" />
        <path d="M210 250q7-6 14 0q7-6 14 0" />
      </g>
    </svg>
  );
}
