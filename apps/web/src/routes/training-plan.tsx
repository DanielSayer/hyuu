import { createFileRoute, redirect } from "@tanstack/react-router";
import WorkoutCalendar, {
  type WeekSummary,
  type Workout,
} from "@/components/training-plan/calendar";
import { startOfMonth, endOfMonth } from "date-fns";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/training-plan")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

const DEFAULT_DATE = new Date();
function RouteComponent() {
  const [currentDate, setCurrentDate] = useState(DEFAULT_DATE);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data, isLoading } = useQuery(
    trpc.trainingPlan.queryOptions(
      {
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      },
      {
        staleTime: 1000 * 60 * 5,
      },
    ),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-4">
      <h1 className="text-3xl font-bold tracking-tight">Training Plan</h1>
      <WorkoutCalendar
        loading={isLoading}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        monthStart={monthStart}
        monthEnd={monthEnd}
        workouts={data?.workouts ?? []}
        weekSummaries={data?.weekSummaries ?? {}}
      />
    </div>
  );
}
