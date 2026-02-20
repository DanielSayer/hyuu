import type { trpc, TRPCResult } from "@/utils/trpc";
import { RouteMap } from "../route-map";

type ActivityViewProps = {
  activity: TRPCResult<typeof trpc.activity.queryOptions>;
};

function ActivityView({ activity }: ActivityViewProps) {
  return (
    <div>
      <RouteMap mapData={activity.mapData} />
    </div>
  );
}

export { ActivityView };
