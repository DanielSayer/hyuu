import { router } from "../index";
import { activitiesProcedures } from "./activities";
import { analyticsProcedures } from "./analytics";
import { goalsRouter } from "./goals";
import { healthProcedures } from "./health";

export const appRouter = router({
  ...healthProcedures,
  ...activitiesProcedures,
  ...analyticsProcedures,
  goals: goalsRouter,
});
export type AppRouter = typeof appRouter;
