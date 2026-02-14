import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";
import {
  getStravaSyncStatus,
  syncStravaActivities,
} from "@/lib/strava/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const queryClient = useQueryClient();
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const syncStatusQuery = useQuery({
    queryKey: ["strava-sync-status"],
    queryFn: getStravaSyncStatus,
    refetchInterval: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: syncStravaActivities,
    onSuccess: (data) => {
      setRemainingSeconds(data.cooldownRemainingSeconds);
      queryClient.invalidateQueries({ queryKey: ["strava-sync-status"] });
      toast.success(
        `Synced ${data.fetchedCount} activities (${data.createdCount} new, ${data.updatedCount} updated).`,
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to sync Strava activities."));
    },
  });

  useEffect(() => {
    setRemainingSeconds(syncStatusQuery.data?.cooldownRemainingSeconds ?? 0);
  }, [syncStatusQuery.data?.cooldownRemainingSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  const canSync =
    (syncStatusQuery.data?.connected ?? false) &&
    remainingSeconds === 0 &&
    !syncMutation.isPending;

  const handleSync = () => {
    syncMutation.mutate();
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
          <CardTitle>Strava Activity Sync</CardTitle>
          <CardDescription>
            Manually fetch recent activities, laps, and zone data from Strava.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleSync} disabled={!canSync}>
            {syncMutation.isPending ? "Syncing..." : "Sync Strava Activities"}
          </Button>
          {syncStatusQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Checking sync availability...
            </p>
          ) : null}
          {syncStatusQuery.data && !syncStatusQuery.data.connected ? (
            <p className="text-sm text-muted-foreground">
              Connect Strava in Settings to start syncing.
            </p>
          ) : null}
          {remainingSeconds > 0 ? (
            <p className="text-sm text-muted-foreground">
              Cooldown active: {formatCooldown(remainingSeconds)} remaining.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ready to run a sync.
            </p>
          )}
          {syncStatusQuery.data?.lastSuccessfulSyncAt ? (
            <p className="text-sm text-muted-foreground">
              Last successful sync:{" "}
              {new Date(syncStatusQuery.data.lastSuccessfulSyncAt).toLocaleString()}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCooldown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
