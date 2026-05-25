interface GCLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function GCLogo({ size = 32, className = '', showText = false }: GCLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG monogram: interlocked G and C */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="GC"
      >
        {/* Outer C — large arc open to the right */}
        <path
          d="M30 8 C16 8 8 13.5 8 20 C8 26.5 16 32 30 32"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
        {/* Inner G — smaller C with horizontal bar closing it */}
        <path
          d="M24 14 C17 14 13 16.5 13 20 C13 23.5 17 26 24 26 L24 20.5 L20 20.5"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className="text-white font-light tracking-[0.18em] text-[11px] uppercase"
            style={{ fontFamily: 'inherit', letterSpacing: '0.18em' }}
          >
            GESTIÓN Y CONTROL
          </span>
        </div>
      )}
    </div>
  );
}
