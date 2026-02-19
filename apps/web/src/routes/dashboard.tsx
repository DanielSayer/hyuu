import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { ActivityCard } from "@/components/activity-card";
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
import { trpc } from "@/utils/trpc";

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
  const feedScrollRef = useRef<HTMLDivElement | null>(null);

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
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = activitiesQuery;

  const rowVirtualizer = useVirtualizer({
    count: activities.length,
    getScrollElement: () => feedScrollRef.current,
    estimateSize: () => 330,
    overscan: 6,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) {
      return;
    }
    if (
      lastItem.index >= activities.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    activities.length,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    virtualItems,
  ]);

  const handleSync = () => {
    syncMutation.mutate();
  };

  const renderSyncState = () => {
    if (syncMutation.isPending) {
      return (
        <p className="text-muted-foreground text-sm">
          Syncing Intervals data...
        </p>
      );
    }

    if (syncMutation.isError) {
      return (
        <p className="text-destructive text-sm">
          {getErrorMessage(
            syncMutation.error,
            "Failed to sync Intervals activities.",
          )}
        </p>
      );
    }

    if (syncMutation.data) {
      return (
        <p className="text-muted-foreground text-sm">
          Synced {syncMutation.data.savedActivityCount ?? 0} activities for
          athlete {syncMutation.data.athleteId ?? "Unknown"}.
        </p>
      );
    }

    return (
      <p className="text-muted-foreground text-sm">
        Uses server-side Basic Auth credentials and stores normalized Intervals
        activity data.
      </p>
    );
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
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
            <p className="text-muted-foreground text-sm">
              Loading activities...
            </p>
          ) : activitiesQuery.isError ? (
            <p className="text-destructive text-sm">
              {getErrorMessage(
                activitiesQuery.error,
                "Failed to load activities.",
              )}
            </p>
          ) : activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No synced activities yet.
            </p>
          ) : (
            <div
              ref={feedScrollRef}
              className="bg-background/30 h-[70vh] overflow-y-auto rounded-md border px-2 py-2"
            >
              <div
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                className="relative w-full"
              >
                {virtualItems.map((virtualItem) => {
                  const activity = activities[virtualItem.index];
                  if (!activity) {
                    return null;
                  }

                  return (
                    <div
                      key={activity.id}
                      data-index={virtualItem.index}
                      ref={rowVirtualizer.measureElement}
                      className="absolute top-0 left-0 w-full px-1 py-1"
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <Link
                        to="/activity/$activityId"
                        params={{ activityId: activity.id }}
                      >
                        <ActivityCard activity={activity} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activitiesQuery.isFetchingNextPage ? (
            <p className="text-muted-foreground text-sm">
              Loading more activities...
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
