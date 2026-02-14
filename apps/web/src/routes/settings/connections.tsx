import { QueryRenderer } from "@/components/renderers";
import { ConnectedState, DisconnectedState } from "@/components/settings/connection-states";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { disconnectStrava, getStravaConnection, testStravaConnection } from "@/lib/strava/actions";
import { getErrorMessage } from "@/lib/utils";
import { env } from "@hyuu/env/web";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/connections")({
  component: RouteComponent,
});




function RouteComponent() {
  const queryClient = useQueryClient();

  const connectionQuery = useQuery({
    queryKey: ["strava-connection"],
    queryFn: getStravaConnection,
  });

  const testMutation = useMutation({
    mutationFn: testStravaConnection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["strava-connection"] });
      toast.success(
        `Connection verified${data.athlete.name ? ` for ${data.athlete.name}` : ""}.`,
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to test Strava connection."));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectStrava,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strava-connection"] });
      toast.success("Strava disconnected.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to disconnect Strava."));
    },
  });

  const handleConnect = () => {
    window.location.href = `${env.VITE_SERVER_URL}/api/strava/authorize`;
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Connections
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your linked third-party services and integrations.
        </p>
      </div>

      <QueryRenderer
        query={connectionQuery}
        loadingState={
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strava</CardTitle>
              <CardDescription>Checking your current connection...</CardDescription>
            </CardHeader>
          </Card>
        }
        errorState={
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strava</CardTitle>
              <CardDescription>Could not load connection state.</CardDescription>
            </CardHeader>
          </Card>
        }
        render={
          (data) => {
            if (data.connected) {
              return <ConnectedState
                athleteName={data.connection.athleteName}
                connectedAt={data.connection.connectedAt}
                onTestConnection={handleTest}
                onDisconnect={handleDisconnect}
                isTesting={testMutation.isPending}
                isDisconnecting={disconnectMutation.isPending}
              />
            }
            return <DisconnectedState onConnect={handleConnect} />
          }
        }
      />
    </div>
  );
}