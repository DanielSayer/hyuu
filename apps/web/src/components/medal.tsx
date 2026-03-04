type MedalProps = {
  label: string;
  color: string;
  ring: string;
  glow: string;
};

function Medal({ label, color, ring, glow }: MedalProps) {
  const uid = `medal-${label.replace(/\W/g, "")}`;
  const fontSize = label.length > 2 ? 17 : 21;

  return (
    <svg
      viewBox="0 0 80 80"
      className="h-14 w-14 transition-all duration-300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={`${color}cc`} stopOpacity="1" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle
        cx="40"
        cy="40"
        r="37"
        fill="none"
        stroke={glow}
        strokeWidth="6"
      />

      {/* Main ring */}
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke={ring}
        strokeWidth="2.5"
      />

      {/* Coin body */}
      <circle cx="40" cy="40" r="31" fill={`url(#bg-${uid})`} />

      {/* Inner detail ring */}
      <circle
        cx="40"
        cy="40"
        r="26"
        fill="none"
        stroke={ring}
        strokeWidth="0.75"
        strokeOpacity="0.5"
      />

      {/* Label */}
      <text
        x="40"
        y="41"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        {label}
      </text>
    </svg>
  );
}

export { Medal };
