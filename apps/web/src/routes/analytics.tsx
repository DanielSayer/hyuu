import { ProgressCockpit } from "@/components/analytics/progress-cockpit";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/analytics")({
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

const currentYear = new Date().getUTCFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => ({
  label: currentYear - index,
  value: String(currentYear - index),
}));

function RouteComponent() {
  const [year, setYear] = useState(currentYear);

  const analyticsQuery = useQuery(
    trpc.analytics.queryOptions(
      { year },
      {
        staleTime: 1000 * 60 * 5,
      },
    ),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Monthly + yearly trends and personal records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="analytics-year">Year</Label>
          <Select
            items={yearOptions}
            value={year}
            onValueChange={(value) =>
              setYear(value ? Number(value) : currentYear)
            }
          >
            <SelectTrigger className="min-w-36">
              <SelectValue placeholder="Select a year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={`analytics-skeleton-${index}`}
              className="h-28 animate-pulse"
            />
          ))}
        </div>
      ) : analyticsQuery.data ? (
        <ProgressCockpit data={analyticsQuery.data} />
      ) : (
        <Card className="p-6">No analytics data available.</Card>
      )}
    </div>
  );
}
