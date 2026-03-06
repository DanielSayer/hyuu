import { router } from "../index";
import { activitiesProcedures } from "./activities";
import { analyticsProcedures } from "./analytics";
import { goalsRouter } from "./goals";
import { healthProcedures } from "./health";
import { runningPlansRouter } from "./running-plans";

export const appRouter = router({
  ...healthProcedures,
  ...activitiesProcedures,
  ...analyticsProcedures,
  goals: goalsRouter,
  runningPlan: runningPlansRouter,
});
export type AppRouter = typeof appRouter;
