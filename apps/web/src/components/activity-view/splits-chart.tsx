import { formatSecondsToMinsPerKm } from "@hyuu/utils/pace";

type SplitsChartProps = {
  splits: { splitNumber: number; durationSeconds: number }[];
};

function formatDiff(diffSeconds: number): string {
  const abs = Math.abs(diffSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = Math.round(abs % 60);
  const sign = diffSeconds > 0 ? "+" : "-";
  return `${sign}${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SplitsChart({ splits }: SplitsChartProps) {
  const splitsWithPace = splits.map((split) => {
    // splitNumber < 1 means it's a partial km (e.g. 0.32 km)
    const distance = split.splitNumber < 1 ? split.splitNumber : 1;
    const pace = split.durationSeconds / distance; // seconds per km
    return { ...split, pace, distance };
  });

  const minPace = Math.min(...splitsWithPace.map((s) => s.pace));
  const maxPace = Math.max(...splitsWithPace.map((s) => s.pace));
  const paceRange = maxPace - minPace || 1;

  // Faster pace (lower seconds/km) = wider bar
  // Maps to range [42%, 88%] so bars are visually distinct
  const getBarWidth = (pace: number) =>
    88 - ((pace - minPace) / paceRange) * 46;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Splits</h2>
        <p className="text-muted-foreground text-sm">Your 1 km splits.</p>
      </div>

      <div className="space-y-3 p-5">
        <div className="text-muted-foreground grid grid-cols-[3.5rem_1fr_4.5rem] items-center pb-1 text-xs font-semibold tracking-widest uppercase">
          <span>KM</span>
          <span>AVG PACE</span>
          <span className="text-right">+/-</span>
        </div>

        {splitsWithPace.map((split, index) => {
          const prev = index > 0 ? splitsWithPace[index - 1] : null;
          // positive diff = faster than previous split
          const diff = prev !== null ? prev.pace - split.pace : null;
          const barWidth = getBarWidth(split.pace);

          return (
            <div
              key={split.splitNumber}
              className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center"
            >
              <span className="text-foreground text-sm">
                {split.splitNumber}
              </span>

              <div className="pr-3">
                <div
                  className="bg-primary text-primary-foreground flex min-w-28 items-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                >
                  {formatSecondsToMinsPerKm(split.pace)}
                </div>
              </div>

              <span
                className={`text-right text-sm font-semibold ${
                  diff === null
                    ? "invisible"
                    : diff > 0
                      ? "text-green-400"
                      : "text-red-400"
                }`}
              >
                {diff !== null ? formatDiff(diff) : "0:00"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
