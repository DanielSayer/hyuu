import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  MapPin,
  Repeat,
  Timer,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GoalType = "distance" | "frequency" | "pace";
type GoalCadence = "weekly" | "monthly";

interface GoalFormState {
  goalType: GoalType | null;
  cadence: GoalCadence | null;
  targetValue: string;
  trackStreak: boolean;
}

const goalTypes = [
  {
    type: "distance",
    title: "Distance Goal",
    description: "Set a target distance and watch the kilometers stack up.",
    icon: MapPin,
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    activeBorder: "border-emerald-500",
    iconColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/10 text-emerald-400",
    unit: "km",
    placeholder: "e.g. 30",
    hint: "Total kilometers to run",
  },
  {
    type: "frequency",
    title: "Frequency Goal",
    description: "Commit to a number of runs and build the habit.",
    icon: Repeat,
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
    activeBorder: "border-violet-500",
    iconColor: "text-violet-400",
    badgeColor: "bg-violet-500/10 text-violet-400",
    unit: "runs",
    placeholder: "e.g. 4",
    hint: "Number of runs to complete",
  },
  {
    type: "pace",
    title: "Pace Goal",
    description: "Push your speed and hit a new personal best pace.",
    icon: Timer,
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    activeBorder: "border-amber-500",
    iconColor: "text-amber-400",
    badgeColor: "bg-amber-500/10 text-amber-400",
    unit: "min/km",
    placeholder: "e.g. 5.30",
    hint: "Target pace in minutes per km",
  },
] as const;

const cadenceOptions = [
  {
    value: "weekly",
    label: "Weekly",
    description: "Reset every Monday",
    icon: Zap,
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Reset on the 1st",
    icon: Repeat,
  },
] as const;

export function CreateGoalPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GoalFormState>({
    goalType: null,
    cadence: null,
    targetValue: "",
    trackStreak: false,
  });

  const selectedGoal = goalTypes.find((g) => g.type === form.goalType);

  const canProceedStep1 = form.goalType !== null;
  const canProceedStep2 =
    form.cadence !== null &&
    form.targetValue !== "" &&
    Number(form.targetValue) > 0;

  const handleSelectType = (type: GoalType) => {
    setForm((prev) => ({ ...prev, goalType: type }));
  };

  const handleSelectCadence = (cadence: GoalCadence) => {
    setForm((prev) => ({ ...prev, cadence }));
  };

  const handleSubmit = () => {
    const payload = {
      goalType: form.goalType!,
      cadence: form.cadence!,
      targetValue: Number(form.targetValue),
      trackStreak: form.trackStreak || undefined,
    };
    console.log("Creating goal:", payload);
    // call your mutation here
    setStep(3);
  };

  const handleReset = () => {
    setForm({
      goalType: null,
      cadence: null,
      targetValue: "",
      trackStreak: false,
    });
    setStep(0);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <AnimatePresence mode="wait">
            {step < 3 && (
              <motion.div
                key="header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="mb-6 flex items-center gap-3">
                  {step > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <h1 className="text-2xl font-bold tracking-tight">
                    New Goal
                  </h1>
                </div>

                {/* Progress indicator */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-500",
                        i <= step ? "bg-primary" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* Step 0: Choose Goal Type */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="mb-6">
                <h2 className="text-foreground text-lg font-semibold">
                  What do you want to achieve?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Pick a goal type that matches your focus right now.
                </p>
              </div>

              <div className="space-y-3">
                {goalTypes.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = form.goalType === goal.type;

                  return (
                    <button
                      key={goal.type}
                      onClick={() => handleSelectType(goal.type)}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-xl border p-5 text-left transition-all duration-200",
                        isSelected
                          ? `${goal.activeBorder} bg-gradient-to-br ${goal.gradient}`
                          : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-foreground font-semibold">
                              {goal.title}
                            </h3>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <Check className="text-primary h-4 w-4" />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {goal.description}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isSelected ? `${goal.badgeColor}` : "bg-muted",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-6 w-6 transition-colors",
                              isSelected
                                ? goal.iconColor
                                : "text-muted-foreground",
                            )}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(1)}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Configure Cadence & Target */}
          {step === 1 && selectedGoal && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={selectedGoal.badgeColor}
                  >
                    {selectedGoal.title}
                  </Badge>
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  Set your target
                </h2>
                <p className="text-muted-foreground text-sm">
                  How often and how much?
                </p>
              </div>

              {/* Cadence */}
              <div className="space-y-3">
                <Label className="text-muted-foreground text-sm font-medium">
                  Cadence
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {cadenceOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = form.cadence === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelectCadence(option.value)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-muted-foreground/30",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                          <div>
                            <p className="text-foreground font-medium">
                              {option.label}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Value */}
              <div className="space-y-3">
                <Label
                  htmlFor="targetValue"
                  className="text-muted-foreground text-sm font-medium"
                >
                  Target
                </Label>
                <div className="relative">
                  <Input
                    id="targetValue"
                    type="number"
                    step={selectedGoal.type === "pace" ? "0.01" : "1"}
                    min="0"
                    placeholder={selectedGoal.placeholder}
                    value={form.targetValue}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        targetValue: e.target.value,
                      }))
                    }
                    className="h-14 rounded-xl pr-16 text-lg font-semibold"
                  />
                  <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium">
                    {selectedGoal.unit}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {selectedGoal.hint}
                  {form.cadence
                    ? ` per ${form.cadence === "weekly" ? "week" : "month"}`
                    : ""}
                </p>
              </div>

              {/* Track Streak */}
              <div className="border-border bg-card flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Flame className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Track streak</p>
                    <p className="text-muted-foreground text-xs">
                      Keep a streak count when you hit your goal consecutively
                    </p>
                  </div>
                </div>
                <Switch
                  checked={form.trackStreak}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, trackStreak: checked }))
                  }
                />
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(2)}
                >
                  Review Goal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review & Confirm */}
          {step === 2 && selectedGoal && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-foreground text-lg font-semibold">
                  Looking good — confirm your goal
                </h2>
                <p className="text-muted-foreground text-sm">
                  Here's what you're committing to. Ready?
                </p>
              </div>

              <Card className="border-border overflow-hidden">
                <div
                  className={cn(
                    "h-2 bg-gradient-to-r",
                    selectedGoal.type === "distance" &&
                      "from-emerald-500 to-teal-500",
                    selectedGoal.type === "frequency" &&
                      "from-violet-500 to-purple-500",
                    selectedGoal.type === "pace" &&
                      "from-amber-500 to-orange-500",
                  )}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        selectedGoal.badgeColor,
                      )}
                    >
                      <selectedGoal.icon
                        className={cn("h-5 w-5", selectedGoal.iconColor)}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {selectedGoal.title}
                      </CardTitle>
                      <CardDescription>
                        {form.cadence === "weekly" ? "Weekly" : "Monthly"}{" "}
                        target
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground text-4xl font-bold tracking-tight">
                      {form.targetValue}
                    </span>
                    <span className="text-muted-foreground text-lg">
                      {selectedGoal.unit}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      / {form.cadence === "weekly" ? "week" : "month"}
                    </span>
                  </div>

                  {form.trackStreak && (
                    <div className="flex items-center gap-2 text-sm text-orange-400">
                      <Flame className="h-4 w-4" />
                      Streak tracking enabled
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Edit
                </Button>
                <Button size="lg" className="flex-1" onClick={handleSubmit}>
                  <Check className="mr-2 h-4 w-4" />
                  Create Goal
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && selectedGoal && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.15,
                }}
                className={cn(
                  "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
                  selectedGoal.type === "distance" && "bg-emerald-500/10",
                  selectedGoal.type === "frequency" && "bg-violet-500/10",
                  selectedGoal.type === "pace" && "bg-amber-500/10",
                )}
              >
                <Check
                  className={cn("h-10 w-10", selectedGoal.iconColor)}
                  strokeWidth={2.5}
                />
              </motion.div>

              <h2 className="text-foreground mb-2 text-2xl font-bold">
                Goal created!
              </h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                You're targeting{" "}
                <span className="text-foreground font-semibold">
                  {form.targetValue} {selectedGoal.unit}
                </span>{" "}
                every {form.cadence === "weekly" ? "week" : "month"}. Let's get
                after it.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Create Another
                </Button>
                <Button>View My Goals</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
