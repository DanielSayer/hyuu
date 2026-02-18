import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarDays, HeartPulse, Timer } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import {
  syncIntervalsActivities,
  type IntervalsSyncResponse,
} from "@/lib/intervals/actions";
import { getErrorMessage } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { trpc } from "@/utils/trpc";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Unknown date";
  }
  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }
  return dateTimeFormatter.format(parsedDate);
}

function formatDuration(totalSeconds: number | null | undefined) {
  if (!totalSeconds || totalSeconds <= 0) {
    return "N/A";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function formatAverageHeartRate(heartRate: number | null | undefined) {
  if (!heartRate || heartRate <= 0) {
    return "N/A";
  }
  return `${Math.round(heartRate)} bpm`;
}

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

  const syncMutation = useMutation<IntervalsSyncResponse, Error>({
    mutationFn: syncIntervalsActivities,
    onSuccess: (data) => {
      const count = data.eventCount ?? 0;
      toast.success(`Synced ${count} Intervals activities.`);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to sync Intervals activities."),
      );
    },
  });

  const canSync = !syncMutation.isPending;

  const activitiesQuery = useInfiniteQuery(
    trpc.activities.infiniteQueryOptions(
      { limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  const activities = useMemo(
    () =>
      (activitiesQuery.data?.pages.flatMap((page) => page.items) ?? []).sort(
        (a, b) => {
          const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
          const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
          if (aDate !== bDate) {
            return bDate - aDate;
          }
          return b.id - a.id;
        },
      ),
    [activitiesQuery.data],
  );

  const loadMoreRef = useInfiniteScroll({
    hasMore: Boolean(activitiesQuery.hasNextPage),
    isLoadingMore: activitiesQuery.isFetchingNextPage,
    onLoadMore: () => {
      activitiesQuery.fetchNextPage();
    },
    enabled: !activitiesQuery.isLoading && !activitiesQuery.isError,
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const renderSyncState = () => {
    if (syncMutation.isPending) {
      return (
        <p className="text-sm text-muted-foreground">
          Syncing Intervals data...
        </p>
      );
    }

    if (syncMutation.isError) {
      return (
        <p className="text-sm text-destructive">
          {getErrorMessage(
            syncMutation.error,
            "Failed to sync Intervals activities.",
          )}
        </p>
      );
    }

    if (syncMutation.data) {
      return (
        <p className="text-sm text-muted-foreground">
          Synced {syncMutation.data.savedActivityCount ?? 0} activities for
          athlete {syncMutation.data.athleteId ?? "Unknown"}.
        </p>
      );
    }

    return (
      <p className="text-sm text-muted-foreground">
        Uses server-side Basic Auth credentials and stores normalized Intervals
        activity data.
      </p>
    );
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome {session.data?.user.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intervals Activity Sync</CardTitle>
          <CardDescription>
            Manually fetch recent events and activity data from Intervals.icu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleSync} disabled={!canSync}>
            {syncMutation.isPending
              ? "Syncing..."
              : "Sync Intervals Activities"}
          </Button>
          {renderSyncState()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>
            Infinite scroll using TanStack Query + tRPC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activitiesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          ) : activitiesQuery.isError ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(
                activitiesQuery.error,
                "Failed to load activities.",
              )}
            </p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No synced activities yet.
            </p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border bg-card/50 p-4 transition-colors hover:bg-accent/20"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate">
                          {activity.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(activity.startDate)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {formatDistance(activity.distance)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md border bg-background/70 px-2.5 py-2 text-muted-foreground flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5" />
                        <span>
                          Elapsed: {formatDuration(activity.elapsedTime)}
                        </span>
                      </div>
                      <div className="rounded-md border bg-background/70 px-2.5 py-2 text-muted-foreground flex items-center gap-1.5">
                        <HeartPulse className="h-3.5 w-3.5" />
                        <span>
                          Avg HR:{" "}
                          {formatAverageHeartRate(activity.averageHeartrate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-2" />

          {activitiesQuery.isFetchingNextPage ? (
            <p className="text-sm text-muted-foreground">
              Loading more activities...
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
