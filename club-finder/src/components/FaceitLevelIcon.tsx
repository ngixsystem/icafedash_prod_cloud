const LEVEL_COLORS: Record<number, string> = {
  1: "#CCCCCC",
  2: "#1EE600", 3: "#1EE600",
  4: "#FFD000", 5: "#FFD000",
  6: "#FF8C00", 7: "#FF8C00",
  8: "#FE3F00", 9: "#FE3F00",
  10: "#FE0000",
};

const LEVEL_ELO_RANGE: Record<number, [number, number]> = {
  1: [100, 500], 2: [501, 750], 3: [751, 900],
  4: [901, 1050], 5: [1051, 1200], 6: [1201, 1350],
  7: [1351, 1530], 8: [1531, 1750], 9: [1751, 2000],
  10: [2001, 3000],
};

export function FaceitLevelIcon({ level, elo, size = 40 }: { level: number; elo?: number | null; size?: number }) {
  const color = LEVEL_COLORS[level] ?? "#CCCCCC";
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const sw = size * 0.08;
  const circ = 2 * Math.PI * r;
  const totalArc = circ;
  const gap = 0;

  let progress = 1;
  if (elo != null && LEVEL_ELO_RANGE[level]) {
    const [min, max] = LEVEL_ELO_RANGE[level];
    progress = Math.min(1, Math.max(0, (elo - min) / (max - min)));
  }
  const filledArc = totalArc * progress;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={size * 0.44} fill="#1a1b1e" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeOpacity={0.15}
        strokeWidth={sw}
        strokeDasharray={`${totalArc} ${gap}`}
        transform={`rotate(-90, ${cx}, ${cy})`}
        strokeLinecap="round"
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={`${filledArc} ${circ - filledArc}`}
        transform={`rotate(-90, ${cx}, ${cy})`}
        strokeLinecap="round"
      />
      <text
        x={cx} y={cy + size * 0.1}
        textAnchor="middle"
        fontSize={size * 0.27}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        fill={color}
      >
        {level}
      </text>
    </svg>
  );
}

export { LEVEL_COLORS, LEVEL_ELO_RANGE };
