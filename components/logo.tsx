/** Logo web. Nama brand tetap dari database; bentuk logo adalah desain statis. */
export function Logo({
  dark = false,
  name = "PPOB",
}: {
  dark?: boolean;
  name?: string;
}) {
  const grad = dark ? "logo-grad-dark" : "logo-grad-light";
  const words = name.trim().split(/\s+/).filter(Boolean);
  const main = (words[0] ?? "PPOB").toUpperCase();
  const sub = (words.slice(1).join(" ") || "Digital").toUpperCase();

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
          {main}
        </span>
        <span
          className={`block text-[9.5px] font-bold tracking-[.38em] mt-0.5 ${
            dark ? "text-[#a9b3ff]" : "text-[#3b4fd8]"
          }`}
        >
          {sub}
        </span>
      </span>
    </span>
  );
}
