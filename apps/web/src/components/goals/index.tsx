import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CreateGoalWizard } from "./create-goal-wizard";
import { GoalCard } from "./goal-card";

// ── Types ────────────────────────────────────────────────────────────────────

type GoalType = "distance" | "frequency" | "pace";
type GoalCadence = "weekly" | "monthly";
type GoalStatus = "on-track" | "at-risk" | "behind" | "completed";

interface Goal {
  id: string;
  goalType: GoalType;
  cadence: GoalCadence;
  targetValue: number;
  currentValue: number;
  trackStreak: boolean;
  currentStreak: number;
  bestStreak: number;
  status: GoalStatus;
  createdAt: string;
  resetsAt: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockGoals: Goal[] = [
  {
    id: "1",
    goalType: "distance",
    cadence: "weekly",
    targetValue: 30,
    currentValue: 22.4,
    trackStreak: true,
    currentStreak: 5,
    bestStreak: 8,
    status: "on-track",
    createdAt: "2026-01-15",
    resetsAt: "2026-03-02",
  },
  {
    id: "2",
    goalType: "frequency",
    cadence: "weekly",
    targetValue: 4,
    currentValue: 2,
    trackStreak: true,
    currentStreak: 3,
    bestStreak: 12,
    status: "on-track",
    createdAt: "2026-02-01",
    resetsAt: "2026-03-02",
  },
  {
    id: "3",
    goalType: "pace",
    cadence: "monthly",
    targetValue: 5.3,
    currentValue: 5.52,
    trackStreak: false,
    currentStreak: 0,
    bestStreak: 0,
    status: "at-risk",
    createdAt: "2026-02-10",
    resetsAt: "2026-03-01",
  },
  {
    id: "4",
    goalType: "distance",
    cadence: "monthly",
    targetValue: 100,
    currentValue: 41.7,
    trackStreak: true,
    currentStreak: 0,
    bestStreak: 2,
    status: "behind",
    createdAt: "2026-01-01",
    resetsAt: "2026-03-01",
  },
  {
    id: "5",
    goalType: "frequency",
    cadence: "monthly",
    targetValue: 15,
    currentValue: 15,
    trackStreak: true,
    currentStreak: 4,
    bestStreak: 4,
    status: "completed",
    createdAt: "2026-01-20",
    resetsAt: "2026-03-01",
  },
];

function EmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
  return (
    <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
      <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        <Target className="text-muted-foreground h-7 w-7" />
      </div>
      <h3 className="text-foreground mb-1 font-semibold">No goals yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
        Set a distance, frequency, or pace goal to stay accountable and track
        your progress over time.
      </p>
      <Button onClick={onCreateGoal}>
        <Plus className="mr-2 h-4 w-4" />
        Create Your First Goal
      </Button>
    </div>
  );
}

function StatsBar({ goals }: { goals: Goal[] }) {
  const active = goals.filter((g) => g.status !== "completed").length;
  const completed = goals.filter((g) => g.status === "completed").length;
  const longestStreak = Math.max(...goals.map((g) => g.bestStreak), 0);
  const onTrack = goals.filter((g) => g.status === "on-track").length;

  const stats = [
    { label: "Active Goals", value: active },
    { label: "Completed", value: completed },
    { label: "On Track", value: onTrack },
    { label: "Best Streak", value: `${longestStreak} weeks` },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card>
          <CardHeader>
            <CardTitle>{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tracking-tight">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function GoalsPage() {
  const [goals] = useState<Goal[]>(mockGoals);

  const handleCreateGoal = () => {
    // Open your wizard here — modal, drawer, or navigate to /goals/new
    console.log("Open create goal wizard");
  };

  const activeGoals = goals.filter((g) => g.status !== "completed");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
            <p className="text-muted-foreground text-sm">
              Track your running targets and build consistency.
            </p>
          </div>
          <CreateGoalWizard />
        </div>

        {goals.length === 0 ? (
          <EmptyState onCreateGoal={handleCreateGoal} />
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <StatsBar goals={goals} />

            {/* Tabs */}
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Active
                  {activeGoals.length > 0 && (
                    <span className="bg-primary/20 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      {activeGoals.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  {completedGoals.length > 0 && (
                    <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      {completedGoals.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                {activeGoals.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    No active goals. Create one to get started.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {completedGoals.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    No completed goals yet. Keep pushing!
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {completedGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
