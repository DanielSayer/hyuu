import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
  syncIntervalsActivities,
  type IntervalsSyncResponse,
} from "@/lib/intervals/actions";
import { getErrorMessage } from "@/lib/utils";
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

  const syncMutation = useMutation<IntervalsSyncResponse, Error>({
    mutationFn: syncIntervalsActivities,
    onSuccess: (data) => {
      const count = data.eventCount ?? data.activities?.length ?? 0;
      toast.success(`Synced ${count} Intervals activities.`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to sync Intervals activities."));
    },
  });

  const canSync = !syncMutation.isPending;

  const handleSync = () => {
    syncMutation.mutate();
  };

  const renderSyncState = () => {
    if (syncMutation.isPending) {
      return (
        <p className="text-sm text-muted-foreground">Syncing Intervals data...</p>
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
          Synced{" "}
          {syncMutation.data.eventCount ?? syncMutation.data.activities?.length ?? 0}{" "}
          activities for athlete {syncMutation.data.athleteId ?? "unknown"}.
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
            {syncMutation.isPending ? "Syncing..." : "Sync Intervals Activities"}
          </Button>
          {renderSyncState()}
        </CardContent>
      </Card>
    </div>
  );
}
