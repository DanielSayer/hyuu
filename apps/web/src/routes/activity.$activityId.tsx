import { ActivityView } from "@/components/activity-view";
import { LoadingWrapper } from "@/components/loading-wrapper";
import { authClient } from "@/lib/auth-client";
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
  const { activityId } = Route.useParams();

  const activityQuery = useQuery(
    trpc.activity.queryOptions({ id: activityId }),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-4">
      <LoadingWrapper isLoading={activityQuery.isLoading}>
        {activityQuery.isError ? (
          <p className="text-destructive text-sm">
            {getErrorMessage(activityQuery.error, "Failed to load activity.")}
          </p>
        ) : activityQuery.data ? (
          <ActivityView activity={activityQuery.data} />
        ) : null}
      </LoadingWrapper>
    </div>
  );
}
