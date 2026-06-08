import { cn } from "@/lib/utils";

export type BarDatum = {
  label: string;
  value: number;
  /** Visual tone for the bar. */
  tone?: "default" | "over" | "under" | "forecast";
};

const toneClass: Record<NonNullable<BarDatum["tone"]>, string> = {
  default: "bg-primary",
  over: "bg-destructive",
  under: "bg-success",
  forecast: "border-2 border-dashed border-primary/60 bg-primary/15",
};

/**
 * Lightweight, dependency-free vertical bar chart (deterministic px heights to
 * avoid % layout pitfalls). Horizontally scrollable on small screens (DoD:
 * scrolling). Swap for ECharts/Recharts later without changing callers' data.
 */
export function BarChart({
  data,
  format = (n) => String(n),
  height = 160,
  caption,
}: {
  data: BarDatum[];
  format?: (n: number) => string;
  height?: number;
  caption?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <figure role="img" aria-label={caption ?? "Bar chart"} className="m-0">
      <div className="overflow-x-auto scrollbar-thin pb-1">
        <div className="min-w-full">
          {/* Bars */}
          <div className="flex items-end gap-2" style={{ height }}>
            {data.map((d, i) => {
              const px = Math.max(2, Math.round((d.value / max) * height));
              return (
                <div
                  key={i}
                  className="flex min-w-8 flex-1 flex-col items-center gap-1"
                >
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {format(d.value)}
                  </span>
                  <div
                    className={cn("w-full rounded-t", toneClass[d.tone ?? "default"])}
                    style={{ height: px }}
                    title={`${d.label}: ${format(d.value)}`}
                  />
                </div>
              );
            })}
          </div>
          {/* Labels */}
          <div className="mt-1 flex gap-2">
            {data.map((d, i) => (
              <span
                key={i}
                className="min-w-8 flex-1 text-center text-[10px] text-muted-foreground"
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
