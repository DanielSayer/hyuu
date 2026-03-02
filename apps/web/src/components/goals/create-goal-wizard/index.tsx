import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cadenceOptions, goalTypes } from "./constants";
import { StepCadenceTarget } from "./step-cadence-target";
import { StepGoalType } from "./step-goal-type";
import { StepReview } from "./step-review";
import { StepSuccess } from "./step-success";
import type { GoalCadence, GoalFormState, GoalType } from "./types";
import { WizardProgressHeader } from "./wizard-progress-header";

function CreateGoalWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GoalFormState>({
    goalType: null,
    cadence: null,
    targetValue: "",
    trackStreak: false,
  });

  const selectedGoal = goalTypes.find((goal) => goal.type === form.goalType);

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

  const handleTargetValueChange = (value: string) => {
    setForm((prev) => ({ ...prev, targetValue: value }));
  };

  const handleTrackStreakChange = (checked: boolean) => {
    setForm((prev) => ({ ...prev, trackStreak: checked }));
  };

  const handleSubmit = () => {
    const payload = {
      goalType: form.goalType!,
      cadence: form.cadence!,
      targetValue: Number(form.targetValue),
      trackStreak: form.trackStreak || undefined,
    };
    console.log("Creating goal:", payload);
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
    <Dialog>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        }
      />

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Create a new running goal</DialogTitle>
          <DialogDescription>
            Choose goal type, cadence, and target value, then confirm.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step < 3 && (
            <WizardProgressHeader
              step={step}
              onBack={() => setStep((current) => current - 1)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepGoalType
              goalTypes={goalTypes}
              selectedType={form.goalType}
              canProceed={canProceedStep1}
              onSelectType={handleSelectType}
              onContinue={() => setStep(1)}
            />
          )}

          {step === 1 && selectedGoal && (
            <StepCadenceTarget
              selectedGoal={selectedGoal}
              cadenceOptions={cadenceOptions}
              form={form}
              canProceed={canProceedStep2}
              onSelectCadence={handleSelectCadence}
              onTargetValueChange={handleTargetValueChange}
              onTrackStreakChange={handleTrackStreakChange}
              onContinue={() => setStep(2)}
            />
          )}

          {step === 2 && selectedGoal && (
            <StepReview
              selectedGoal={selectedGoal}
              form={form}
              onEdit={() => setStep(1)}
              onSubmit={handleSubmit}
            />
          )}

          {step === 3 && selectedGoal && form.cadence && (
            <StepSuccess
              selectedGoal={selectedGoal}
              targetValue={form.targetValue}
              cadence={form.cadence}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export { CreateGoalWizard };
