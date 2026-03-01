import { GoalsPage } from "@/components/goals";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  return <GoalsPage />;
}
