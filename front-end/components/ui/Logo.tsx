interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Storewave logo component
 * Features layered wave blocks representing storage
 */
export function Logo({ className = "", size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="90" fill="#97f0e5" opacity="0.15" />

      {/* Storage blocks with wave pattern */}
      {/* Bottom wave/block */}
      <path
        d="M 40 120 Q 70 110, 100 120 T 160 120 L 160 140 Q 130 150, 100 140 T 40 140 Z"
        fill="#97f0e5"
        opacity="0.6"
      />

      {/* Middle wave/block */}
      <path
        d="M 40 85 Q 70 75, 100 85 T 160 85 L 160 105 Q 130 115, 100 105 T 40 105 Z"
        fill="#97f0e5"
        opacity="0.8"
      />

      {/* Top wave/block */}
      <path
        d="M 40 50 Q 70 40, 100 50 T 160 50 L 160 70 Q 130 80, 100 70 T 40 70 Z"
        fill="#97f0e5"
      />
    </svg>
  );
}
