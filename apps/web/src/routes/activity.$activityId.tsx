import { authClient } from "@/lib/auth-client";
import { LoadingWrapper } from "@/components/loading-wrapper";
import { getErrorMessage } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";

const activityParamsSchema = z.object({
  activityId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/activity/$activityId")({
  component: RouteComponent,
  params: {
    parse: (params) => activityParamsSchema.parse(params),
    stringify: ({ activityId }) => ({ activityId: String(activityId) }),
  },
  beforeLoad: async ({ params }) => {
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
  const { activityId } = Route.useParams();

  const activityQuery = useQuery(
    trpc.activity.queryOptions({ id: activityId }),
  );

  return (
    <div className="container mx-auto max-w-5xl space-y-3 px-4 py-4">
      <div>
        <h1 className="text-2xl font-semibold">Activity {activityId}</h1>
      </div>

      <LoadingWrapper isLoading={activityQuery.isLoading}>
        {activityQuery.isError ? (
          <p className="text-destructive text-sm">
            {getErrorMessage(activityQuery.error, "Failed to load activity.")}
          </p>
        ) : activityQuery.data ? (
          <pre className="bg-background/30 overflow-auto rounded-md border p-3 text-xs">
            {JSON.stringify(activityQuery.data, null, 2)}
          </pre>
        ) : (
          <p className="text-muted-foreground text-sm">No activity found.</p>
        )}
      </LoadingWrapper>
    </div>
  );
}
