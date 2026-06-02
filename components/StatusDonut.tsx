"use client";

type Segment = { label: string; value: number; color: string };

const COLORS: Record<string, string> = {
  Open: "#3b82f6",
  "In Progress": "#f59e0b",
  "Waiting on Client": "#8b5cf6",
  Resolved: "#22c55e",
  Closed: "#9ca3af",
};

export default function StatusDonut({ data }: { data: Segment[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <p className="text-sm text-gray-400 text-center py-8">No data</p>;

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const innerR = 34;

  let cumAngle = -Math.PI / 2;

  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle = endAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);
      const largeArc = angle > Math.PI ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        "Z",
      ].join(" ");

      return { ...d, path, color: COLORS[d.label] ?? "#6b7280" };
    });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5} />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6b7280">
          total
        </text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-gray-600">{s.label}</span>
            </div>
            <span className="font-semibold text-gray-800">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
