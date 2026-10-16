/** Logo Ludovex. dark=true dipakai di footer (latar gelap). */
export function Logo({ dark = false }: { dark?: boolean }) {
  const grad = dark ? "logo-grad-dark" : "logo-grad-light";
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b4fd8" />
            <stop offset="1" stopColor="#8a6cf7" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill={`url(#${grad})`} />
        <path
          d="M13 10v17h15"
          fill="none"
          stroke="#fff"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="27.5" cy="13.5" r="3.6" fill="#7ff0c6" />
      </svg>
      <span className="leading-none">
        <span
          className={`block font-extrabold text-[19px] tracking-tight ${
            dark ? "text-white" : "text-[#16204a]"
          }`}
        >
          LUDOVEX
        </span>
        <span
          className={`block text-[9.5px] font-bold tracking-[.38em] mt-0.5 ${
            dark ? "text-[#a9b3ff]" : "text-[#3b4fd8]"
          }`}
        >
          DIGITAL
        </span>
      </span>
    </span>
  );
}
