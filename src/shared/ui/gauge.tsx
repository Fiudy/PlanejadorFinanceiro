const SIZE = 96;
const STROKE = 14;
const RADIUS = SIZE - STROKE / 2;
const CIRCUMFERENCE = Math.PI * RADIUS;
const ARC_PATH = `M ${STROKE / 2} ${SIZE} A ${RADIUS} ${RADIUS} 0 0 1 ${SIZE * 2 - STROKE / 2} ${SIZE}`;

/** Medidor semicircular reutilizável — usado no score de saúde financeira e no limite mensal. */
export function Gauge({
  value,
  color,
  label,
  sublabel,
}: {
  /** 0..100 */
  value: number;
  color: string;
  label: string;
  sublabel?: string;
}) {
  const progress = Math.min(1, Math.max(0, value / 100));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex shrink-0 flex-col items-center">
      <svg width={SIZE * 2} height={SIZE + STROKE / 2} viewBox={`0 0 ${SIZE * 2} ${SIZE + STROKE / 2}`}>
        <path d={ARC_PATH} fill="none" strokeWidth={STROKE} strokeLinecap="round" className="stroke-paper-100 dark:stroke-ink-800" />
        <path
          d={ARC_PATH}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute top-[52px] flex flex-col items-center">
        <span className="font-display text-3xl font-bold tabular text-ink-950 dark:text-paper-50">{label}</span>
        {sublabel && <span className="text-xs text-muted-500">{sublabel}</span>}
      </div>
    </div>
  );
}
