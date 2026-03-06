import { activityMapDataSchema } from "../../schemas/activities";
import { parseNullableJsonb } from "../../utils";

type ActivityListRow = {
  id: number;
  name: string | null;
  distance: number | null;
  startDate: Date | null;
  elapsedTime: number | null;
  averageHeartrate: number | null;
  mapData: unknown;
};

export function mapActivityListItem(row: ActivityListRow) {
  return {
    id: row.id,
    name: row.name ?? "Untitled activity",
    startDate: row.startDate,
    distance: row.distance ?? 0,
    elapsedTime: row.elapsedTime,
    averageHeartrate: row.averageHeartrate,
    routePreview: parseNullableJsonb(row.mapData, activityMapDataSchema),
  };
}
