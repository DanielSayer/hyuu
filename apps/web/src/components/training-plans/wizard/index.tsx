import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { StepContext } from "./step-context";
import { StepGoal } from "./step-goal";
import { StepReview } from "./step-review";
import { StepSchedule } from "./step-schedule";
import { StepSuccess } from "./step-success";
import type {
  RunningPlanDraft,
  RunningPlanPrefill,
  RunningPlanProfile,
  RunningPlanScaffoldSummary,
  TrainingPlanFormState,
} from "./types";
import {
  buildInitialForm,
  emptyTrainingPlanForm,
  getStepIndexFromDraft,
  toIsoDateTime,
  toOptionalDay,
  toOptionalInteger,
  toOptionalNumber,
  trainingPlanWizardVersion,
  wizardSteps,
} from "./utils";
import { WizardProgressHeader } from "./wizard-progress-header";

interface TrainingPlanWizardProps {
  onCreated?: (scaffold: RunningPlanScaffoldSummary) => void;
}

type SaveDraftStepInput = Parameters<
  typeof trpcClient.runningPlan.saveDraftStep.mutate
>[0];
type SaveDraftStepResult = Awaited<
  ReturnType<typeof trpcClient.runningPlan.saveDraftStep.mutate>
>;
type CreateScaffoldInput = Parameters<
  typeof trpcClient.runningPlan.createScaffoldFromDraft.mutate
>[0];
type CreateScaffoldResult = Awaited<
  ReturnType<typeof trpcClient.runningPlan.createScaffoldFromDraft.mutate>
>;

function LoadingState() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export function TrainingPlanWizard({ onCreated }: TrainingPlanWizardProps) {
  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [createdScaffold, setCreatedScaffold] =
    useState<RunningPlanScaffoldSummary | null>(null);
  const [form, setForm] = useState<TrainingPlanFormState>(
    emptyTrainingPlanForm,
  );
  const [hydrated, setHydrated] = useState(false);

  const draftQuery = useQuery(trpc.runningPlan.getDraft.queryOptions());
  const profileQuery = useQuery(trpc.runningPlan.getProfile.queryOptions());

  const saveDraftStepMutation = useMutation({
    mutationFn: (input: SaveDraftStepInput) =>
      trpcClient.runningPlan.saveDraftStep.mutate(input),
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to save training plan draft."),
      );
    },
  });

  const createScaffoldMutation = useMutation({
    mutationFn: (input: CreateScaffoldInput) =>
      trpcClient.runningPlan.createScaffoldFromDraft.mutate(input),
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to create training plan scaffold."),
      );
    },
  });

  const draft: RunningPlanDraft | null =
    (draftQuery.data?.draft as RunningPlanDraft | null | undefined) ?? null;
  const profile: RunningPlanProfile | null =
    (profileQuery.data?.profile as RunningPlanProfile | null | undefined) ??
    null;
  const prefill: RunningPlanPrefill | null =
    ((draftQuery.data?.prefill ?? profileQuery.data?.prefill) as
      | RunningPlanPrefill
      | null
      | undefined) ?? null;

  useEffect(() => {
    if (hydrated || draftQuery.isLoading || profileQuery.isLoading) {
      return;
    }

    setForm(
      buildInitialForm({
        draft,
        profile,
        prefill,
      }),
    );
    setDraftId(draft?.id ?? null);
    setStep(getStepIndexFromDraft(draft));
    setHydrated(true);
  }, [
    draft,
    draftQuery.isLoading,
    hydrated,
    prefill,
    profile,
    profileQuery.isLoading,
  ]);

  const canContinueGoal =
    form.goalType !== null &&
    (form.goalType === "general_fitness" ||
      form.goalType === "consistency" ||
      ((form.goalType === "distance" || form.goalType === "race") &&
        Number(form.targetDistanceKm) > 0)) &&
    (form.goalType !== "race" || Boolean(form.eventDate));

  const canContinueSchedule = Boolean(form.startDate);
  const canContinueContext = true;

  const updateForm = <K extends keyof TrainingPlanFormState>(
    field: K,
    value: TrainingPlanFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const applyDraftResult = async (result: SaveDraftStepResult) => {
    setDraftId(result.draft?.id ?? null);
    await queryClient.invalidateQueries(
      trpc.runningPlan.getDraft.queryOptions(),
    );
  };

  const saveDraftStep = async (input: SaveDraftStepInput) => {
    const result = await saveDraftStepMutation.mutateAsync(input);
    await applyDraftResult(result);
    return result;
  };

  const handleGoalContinue = async () => {
    if (!form.goalType) {
      return;
    }

    if (form.goalType === "general_fitness") {
      await saveDraftStep({
        draftId: draftId ?? undefined,
        draftType: "create_scaffold",
        wizardVersion: trainingPlanWizardVersion,
        currentStep: "schedule",
        step: "goal-intent",
        stepData: {
          goalType: "general_fitness",
          goalDetails: {},
        },
      });
    } else if (form.goalType === "consistency") {
      await saveDraftStep({
        draftId: draftId ?? undefined,
        draftType: "create_scaffold",
        wizardVersion: trainingPlanWizardVersion,
        currentStep: "schedule",
        step: "goal-intent",
        stepData: {
          goalType: "consistency",
          goalDetails: {
            targetRunsPerWeek: toOptionalInteger(form.defaultRunsPerWeek),
          },
        },
      });
    } else if (form.goalType === "distance") {
      await saveDraftStep({
        draftId: draftId ?? undefined,
        draftType: "create_scaffold",
        wizardVersion: trainingPlanWizardVersion,
        currentStep: "schedule",
        step: "goal-intent",
        stepData: {
          goalType: "distance",
          goalDetails: {
            targetDistanceKm: Number(form.targetDistanceKm),
            targetDate: form.targetDate
              ? toIsoDateTime(form.targetDate)
              : undefined,
          },
        },
      });
    } else {
      await saveDraftStep({
        draftId: draftId ?? undefined,
        draftType: "create_scaffold",
        wizardVersion: trainingPlanWizardVersion,
        currentStep: "schedule",
        step: "goal-intent",
        stepData: {
          goalType: "race",
          goalDetails: {
            raceName: form.raceName.trim() || undefined,
            targetDistanceKm: Number(form.targetDistanceKm),
            eventDate: toIsoDateTime(form.eventDate),
            targetTimeMinutes: toOptionalNumber(form.targetTimeMinutes),
          },
        },
      });
    }

    setStep(1);
  };

  const handleScheduleContinue = async () => {
    await saveDraftStep({
      draftId: draftId ?? undefined,
      draftType: "create_scaffold",
      wizardVersion: trainingPlanWizardVersion,
      currentStep: "runner-profile",
      step: "schedule",
      stepData: {
        startDate: toIsoDateTime(form.startDate),
        planningHorizonWeeks: toOptionalInteger(form.planningHorizonWeeks),
        defaultRunsPerWeek: toOptionalInteger(form.defaultRunsPerWeek),
        preferredRunDays: form.preferredRunDays,
        blockedDays: form.blockedDays,
        longRunDay: toOptionalDay(form.longRunDay),
      },
    });

    setStep(2);
  };

  const handleContextContinue = async () => {
    const nextDraftId = draftId ?? undefined;
    const runnerProfile = {
      experienceLevel: form.experienceLevel ?? undefined,
      primaryMotivation: form.primaryMotivation ?? undefined,
      typicalWeeklyRuns: toOptionalInteger(form.typicalWeeklyRuns),
      typicalWeeklyDistanceKm: toOptionalNumber(form.typicalWeeklyDistanceKm),
      longestRecentRunKm: toOptionalNumber(form.longestRecentRunKm),
      preferredLongRunDay: toOptionalDay(form.longRunDay),
      preferredRunDays: form.preferredRunDays,
      blockedDays: form.blockedDays,
      planEffortPreference: form.planEffortPreference ?? undefined,
    };

    const firstResult = await saveDraftStep({
      draftId: nextDraftId,
      draftType: "create_scaffold",
      wizardVersion: trainingPlanWizardVersion,
      currentStep: "runner-profile",
      step: "runner-profile",
      stepData: runnerProfile,
    });

    const activeDraftId = firstResult.draft?.id ?? nextDraftId;

    await saveDraftStep({
      draftId: activeDraftId,
      draftType: "create_scaffold",
      wizardVersion: trainingPlanWizardVersion,
      currentStep: "fitness-baseline",
      step: "fitness-baseline",
      stepData: {
        currentWeeklyRuns: toOptionalInteger(form.typicalWeeklyRuns),
        currentWeeklyDistanceKm: toOptionalNumber(form.typicalWeeklyDistanceKm),
        longestRecentRunKm: toOptionalNumber(form.longestRecentRunKm),
        hasTrustedSyncedHistory:
          prefill?.source.hasTrustedSyncedHistory || undefined,
      },
    });

    await saveDraftStep({
      draftId: activeDraftId,
      draftType: "create_scaffold",
      wizardVersion: trainingPlanWizardVersion,
      currentStep: "constraints",
      step: "constraints",
      stepData: {
        willingForSpeedwork: form.willingForSpeedwork,
        willingForHills: form.willingForHills,
        willingForCrossTraining: form.willingForCrossTraining,
      },
    });

    await saveDraftStep({
      draftId: activeDraftId,
      draftType: "create_scaffold",
      wizardVersion: trainingPlanWizardVersion,
      currentStep: "review-preferences",
      step: "review-preferences",
      stepData: {
        planEffortPreference: form.planEffortPreference ?? undefined,
      },
    });

    setStep(3);
  };

  const handleSubmit = async () => {
    const scaffold: CreateScaffoldResult =
      await createScaffoldMutation.mutateAsync({
        draftId: draftId ?? undefined,
      });

    await queryClient.invalidateQueries(
      trpc.runningPlan.getDraft.queryOptions(),
    );
    setCreatedScaffold(scaffold);
    setStep(4);
    toast.success("Training plan scaffold created.");
    onCreated?.(scaffold);
  };

  const handleReset = async () => {
    setDraftId(null);
    setCreatedScaffold(null);
    setForm(emptyTrainingPlanForm());
    setStep(0);
    setHydrated(false);
    await Promise.all([
      queryClient.invalidateQueries(trpc.runningPlan.getDraft.queryOptions()),
      queryClient.invalidateQueries(trpc.runningPlan.getProfile.queryOptions()),
    ]);
  };

  if (draftQuery.isLoading || profileQuery.isLoading || !hydrated) {
    return <LoadingState />;
  }

  if (draftQuery.isError || profileQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Plan Wizard</CardTitle>
          <CardDescription>
            Could not load your training plan context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => void handleReset()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        {step < wizardSteps.length && (
          <WizardProgressHeader
            step={step}
            steps={wizardSteps}
            onBack={() => setStep((current) => Math.max(current - 1, 0))}
          />
        )}
        <div>
          <CardTitle>Build a training plan scaffold</CardTitle>
          <CardDescription>
            Reusable intake flow for settings now, onboarding later.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepGoal
              form={form}
              canProceed={canContinueGoal}
              onGoalTypeChange={(value) => updateForm("goalType", value)}
              onFieldChange={(field, value) => updateForm(field, value)}
              onContinue={() => void handleGoalContinue()}
            />
          )}

          {step === 1 && (
            <StepSchedule
              form={form}
              canProceed={canContinueSchedule}
              onFieldChange={(field, value) => updateForm(field, value)}
              onPreferredRunDaysChange={(value) =>
                updateForm("preferredRunDays", value)
              }
              onBlockedDaysChange={(value) => updateForm("blockedDays", value)}
              onContinue={() => void handleScheduleContinue()}
              isSaving={saveDraftStepMutation.isPending}
            />
          )}

          {step === 2 && (
            <StepContext
              form={form}
              canProceed={canContinueContext}
              hasTrustedHistory={Boolean(
                prefill?.source.hasTrustedSyncedHistory,
              )}
              onFieldChange={(field, value) => updateForm(field, value)}
              onExperienceLevelChange={(value) =>
                updateForm("experienceLevel", value)
              }
              onMotivationChange={(value) =>
                updateForm("primaryMotivation", value)
              }
              onEffortPreferenceChange={(value) =>
                updateForm("planEffortPreference", value)
              }
              onConstraintChange={(field, value) => updateForm(field, value)}
              onContinue={() => void handleContextContinue()}
              isSaving={saveDraftStepMutation.isPending}
            />
          )}

          {step === 3 && (
            <StepReview
              form={form}
              onEditGoal={() => setStep(0)}
              onEditSchedule={() => setStep(1)}
              onEditContext={() => setStep(2)}
              onSubmit={() => void handleSubmit()}
              isSubmitting={createScaffoldMutation.isPending}
            />
          )}

          {step === 4 && (
            <StepSuccess
              form={form}
              scaffold={createdScaffold}
              onReset={() => void handleReset()}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
