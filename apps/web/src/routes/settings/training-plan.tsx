import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import { TrainingPlanWizard } from "@/components/training-plans/wizard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { queryClient, trpc } from "@/utils/trpc";
import {
  formatDays,
  formatStatusLabel,
  getScaffoldGoalSummary,
  getWeekdayLabel,
} from "@/components/training-plans/wizard/utils";
import type { RunningPlanScaffoldSummary } from "@/components/training-plans/wizard/types";

export const Route = createFileRoute("/settings/training-plan")({
  component: RouteComponent,
});

function ScaffoldSummary({
  scaffold,
}: {
  scaffold: RunningPlanScaffoldSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Current scaffold</CardTitle>
            <CardDescription>
              {getScaffoldGoalSummary(scaffold)}
            </CardDescription>
          </div>
          <Badge variant="outline">{formatStatusLabel(scaffold.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Start date
          </p>
          <p className="mt-1 font-medium">
            {format(new Date(scaffold.startDate), "MMM d, yyyy")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Created
          </p>
          <p className="mt-1 font-medium">
            {format(new Date(scaffold.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Preferred run days
          </p>
          <p className="mt-1 font-medium">
            {formatDays(scaffold.preferredRunDays)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Long run day
          </p>
          <p className="mt-1 font-medium">
            {scaffold.longRunDay === null
              ? "Not set"
              : getWeekdayLabel(scaffold.longRunDay)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No training plan scaffold yet</CardTitle>
        <CardDescription>
          Use the wizard below to save a durable scaffold row for future plan
          generation.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function RouteComponent() {
  const scaffoldsQuery = useQuery(
    trpc.runningPlan.listScaffolds.queryOptions({
      limit: 5,
    }),
  );

  return (
    <div className="space-y-6 pb-40">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Training Plan</h2>
        <p className="text-muted-foreground text-sm">
          Review your current scaffold and create a new intake draft when
          needed.
        </p>
      </div>

      {scaffoldsQuery.isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Training plan info</CardTitle>
            <CardDescription>Loading your current scaffold...</CardDescription>
          </CardHeader>
        </Card>
      )}

      {scaffoldsQuery.isError && (
        <Card>
          <CardHeader>
            <CardTitle>Training plan info</CardTitle>
            <CardDescription>Could not load scaffold info.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {scaffoldsQuery.isSuccess &&
        (scaffoldsQuery.data.length > 0 ? (
          <ScaffoldSummary
            scaffold={scaffoldsQuery.data[0] as RunningPlanScaffoldSummary}
          />
        ) : (
          <EmptyState />
        ))}

      <TrainingPlanWizard
        onCreated={async () => {
          await queryClient.invalidateQueries(
            trpc.runningPlan.listScaffolds.queryOptions({
              limit: 5,
            }),
          );
        }}
      />
    </div>
  );
}
