import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
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

  const privateData = useQuery(trpc.privateData.queryOptions());

  const handleConnectStrava = () => {
    window.location.href = `${window.location.origin.replace(
      /:\d+$/,
      "",
    )}:3000/api/strava/authorize`;
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome {session.data?.user.name}
        </p>
      </div>
      <div className="rounded-lg border p-4 space-y-2">
        <p>API: {privateData.data?.message}</p>
        <Button type="button" onClick={handleConnectStrava}>
          Connect Strava
        </Button>
      </div>
    </div>
  );
}
