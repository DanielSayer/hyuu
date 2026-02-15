import { QueryRenderer } from "@/components/renderers";
import {
  ConnectedState,
  DisconnectedState,
} from "@/components/settings/connection-states";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  connectIntervalsConnection,
  getIntervalsConnection,
  testIntervalsConnection,
} from "@/lib/intervals/actions";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/connections")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const connectionQuery = useQuery({
    queryKey: ["intervals-connection"],
    queryFn: getIntervalsConnection,
  });

  const testMutation = useMutation({
    mutationFn: testIntervalsConnection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intervals-connection"] });
      toast.success(
        `Connection verified${data.athlete.name ? ` for ${data.athlete.name}` : ""}.`,
      );
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to test Intervals connection."),
      );
    },
  });

  const connectMutation = useMutation({
    mutationFn: connectIntervalsConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intervals-connection"] });
      toast.success("Intervals connected.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to connect Intervals."));
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Connections</h2>
        <p className="text-sm text-muted-foreground">
          Manage your linked third-party services and integrations.
        </p>
      </div>

      <QueryRenderer
        query={connectionQuery}
        loadingState={
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Intervals</CardTitle>
              <CardDescription>
                Checking your current connection...
              </CardDescription>
            </CardHeader>
          </Card>
        }
        errorState={
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Intervals</CardTitle>
              <CardDescription>
                Could not load connection state.
              </CardDescription>
            </CardHeader>
          </Card>
        }
        render={(data) => {
          if (data.connected) {
            return (
              <ConnectedState
                athleteName={data.connection.athleteName}
                connectedAt={data.connection.connectedAt}
                onTestConnection={handleTest}
                isTesting={testMutation.isPending}
              />
            );
          }
          return (
            <DisconnectedState
              onConnect={handleConnect}
              isConnecting={connectMutation.isPending}
            />
          );
        }}
      />
    </div>
  );
}
