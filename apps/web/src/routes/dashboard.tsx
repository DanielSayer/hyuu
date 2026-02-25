import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  ActivityPreview,
  ActivityPreviewSkeleton,
} from "@/components/dashboard/activity-preview";
import { WeeklyDistanceCard } from "@/components/dashboard/weekly-distance-card";
import { WeeklyPaceCard } from "@/components/dashboard/weekly-pace-card";
import { authClient } from "@/lib/auth-client";
import {
  syncIntervalsActivities,
  type IntervalsSyncResponse,
} from "@/lib/intervals/actions";
import { cn, getErrorMessage, getGreeting } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, BedIcon, RefreshCcwIcon } from "lucide-react";
import { formatDateTime } from "@hyuu/utils/dates";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { LoadingWrapper } from "@/components/loading-wrapper";

export const Route = createFileRoute("/dashboard")({
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

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const { data, refetch } = useQuery(trpc.dashboard.queryOptions());
  const recentActivitiesQuery = useQuery(trpc.recentActivities.queryOptions());
  const syncMutation = useMutation<IntervalsSyncResponse, Error>({
    mutationFn: syncIntervalsActivities,
    onSuccess: () => {
      toast.success("Success!", { description: "Synced activities!" });
      refetch();
      recentActivitiesQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to sync Intervals activities."),
      );
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting(session.data?.user.name ?? "")}
        </h1>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {syncMutation.isPending
              ? "Syncing..."
              : data?.lastSyncedAt
                ? `Last synced: ${formatDateTime(data.lastSyncedAt)}`
                : "Never synced"}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={syncMutation.isPending}
            onClick={handleSync}
          >
            <RefreshCcwIcon
              className={cn(syncMutation.isPending && "animate-spin")}
            />
            <span className="sr-only">Sync Intervals Data</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeeklyDistanceCard weeklyMileage={data?.trends.weeklyMileage ?? []} />
        <WeeklyPaceCard weeklyPace={data?.trends.averagePace ?? []} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Today</h2>
          <Empty className="bg-accent/20 py-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BedIcon />
              </EmptyMedia>
              <EmptyTitle>No Workouts Scheduled for Today</EmptyTitle>
              <EmptyDescription>
                Today is a rest day. Enjoy your day off!
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <div className="space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Recent Activities
            </h2>
            <p className="text-muted-foreground text-sm">
              A quick look at your 5 most recent activities.
            </p>
          </div>
          <LoadingWrapper
            isLoading={recentActivitiesQuery.isLoading}
            fallback={<ActivityPreviewSkeleton />}
          >
            <ActivityPreview activities={recentActivitiesQuery.data ?? []} />
          </LoadingWrapper>
        </div>
      </div>
    </div>
  );
}
