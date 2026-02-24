import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  getISOWeek,
  isSameMonth,
  isToday,
  subMonths,
} from "date-fns";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2Icon,
  Mountain,
  Route,
  Timer,
} from "lucide-react";

export type Workout = {
  id: number;
  date: string;
  duration: string;
  distance: string;
  bpm: number;
  pace: string;
  load: number;
  title: string;
};

export type WeekSummary = {
  elevation: number;
  runDist: string;
  runTime: string;
};

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <Link to="/activity/$activityId" params={{ activityId: workout.id }}>
      <div className="group relative flex cursor-pointer flex-col gap-1 overflow-hidden rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2.5 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/15">
        {/* Accent left border indicator */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-500/50 transition-colors group-hover:bg-cyan-500" />

        <div className="flex flex-col text-xs font-semibold text-cyan-700 dark:text-cyan-400">
          <span className="text-end">{workout.distance}</span>
          <span className="truncate">{workout.title}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-[10px] font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <Timer className="h-3 w-3 opacity-70" />
            {workout.duration}
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 opacity-70" />
            {workout.bpm} bpm
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-cyan-500/10 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span>Pace: {workout.pace}</span>
          <span>Load: {workout.load}</span>
        </div>
      </div>
    </Link>
  );
}

function WeekSummaryCell({
  weekNum,
  summary,
}: {
  weekNum: number;
  summary?: WeekSummary;
}) {
  if (!summary) {
    return (
      <div className="border-border/50 flex min-h-[140px] flex-col justify-center border-r bg-slate-50/50 p-4 dark:bg-slate-900/50">
        <p className="text-muted-foreground text-center text-xs font-medium">
          Week {weekNum}
        </p>
      </div>
    );
  }

  return (
    <div className="border-border/50 flex flex-col gap-3 border-r bg-slate-50/50 p-3 dark:bg-slate-900/50">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold">
          W{weekNum}
        </div>
        <span className="text-foreground text-xs font-semibold">Summary</span>
      </div>

      <div className="flex flex-col gap-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5" />
            <span>Time</span>
          </div>
          <span className="text-foreground font-medium">{summary.runTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5" />
            <span>Dist</span>
          </div>
          <span className="text-foreground font-medium">{summary.runDist}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Mountain className="h-3.5 w-3.5" />
            <span>Elev</span>
          </div>
          <span className="text-foreground font-medium">
            {summary.elevation}m
          </span>
        </div>
      </div>
    </div>
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type WorkoutCalendarProps = {
  loading: boolean;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  monthStart: Date;
  monthEnd: Date;
  workouts: Workout[];
  weekSummaries: Record<number, WeekSummary>;
};

export default function WorkoutCalendar({
  loading,
  currentDate,
  setCurrentDate,
  monthStart,
  monthEnd,
  workouts,
  weekSummaries,
}: WorkoutCalendarProps) {
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 },
  );

  const workoutsByDate = workouts.reduce<Record<string, Workout[]>>(
    (acc, w) => {
      const key = format(w.date, "yyyy-MM-dd");
      acc[key] = [...(acc[key] ?? []), w];
      return acc;
    },
    {},
  );

  return (
    <div className="border-border/60 bg-background flex h-full flex-col overflow-hidden rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-border/60 bg-card flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-foreground text-xl font-bold tracking-tight">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="border-border/50 bg-background flex items-center gap-1 rounded-md border p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="bg-border/50 h-4 w-px" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 text-xs font-medium"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
      </div>

      {/* Day label row */}
      <div
        className="border-border/60 bg-muted/20 grid border-b"
        style={{ gridTemplateColumns: "180px repeat(7, minmax(0, 1fr))" }}
      >
        <div className="border-border/50 text-muted-foreground border-r py-2.5 text-center text-xs font-semibold tracking-wider uppercase">
          Weekly Totals
        </div>
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="border-border/50 text-muted-foreground border-r py-2.5 text-center text-xs font-semibold tracking-wider uppercase last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-background relative flex-1 overflow-y-auto">
        {loading && (
          <Loader2Icon className="absolute inset-0 top-1/4 left-1/2 size-10 animate-spin" />
        )}
        <div className="flex flex-col">
          {weeks.map((weekStart, index) => {
            const weekDays = eachDayOfInterval({
              start: weekStart,
              end: endOfWeek(weekStart, { weekStartsOn: 1 }),
            });
            const weekNum = getISOWeek(weekStart);
            const summary = weekSummaries[weekNum];
            const isLastWeek = index === weeks.length - 1;

            return (
              <div
                key={weekStart.toISOString()}
                className={cn(
                  "grid min-h-[140px]",
                  !isLastWeek && "border-border/50 border-b",
                )}
                style={{
                  gridTemplateColumns: "180px repeat(7, minmax(0, 1fr))",
                }}
              >
                {/* Week summary */}
                <WeekSummaryCell weekNum={weekNum} summary={summary} />

                {/* Day cells */}
                {weekDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayWorkouts = workoutsByDate[key] ?? [];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={key}
                      className={cn(
                        "group border-border/50 relative border-r p-2 last:border-r-0",
                        !isCurrentMonth && "bg-muted/10",
                        isCurrentDay && "bg-primary/2",
                      )}
                    >
                      {/* Date Header */}
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
                            isCurrentDay
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : isCurrentMonth
                                ? "text-foreground group-hover:bg-muted"
                                : "text-muted-foreground/50",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>

                      {/* Workouts container */}
                      <div className="flex flex-col gap-1.5">
                        {dayWorkouts.map((w) => (
                          <WorkoutCard key={w.id} workout={w} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
