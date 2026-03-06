# Training Plans Infra Summary

## Overview

This doc summarizes the current backend infra for training plans.

The system is designed around a rolling-plans model, not a single static generated plan. The core idea is:

1. capture stable runner context
2. save wizard progress as a draft
3. materialize a long-lived scaffold
4. support future 1-2 week cycles
5. support weekly review inputs to shape future adjustments

V1 does **not** generate workouts or plan blocks yet. It creates the backend contract needed for a future complex frontend wizard and later generation engine.

## Product Model

The infra assumes good running plans need to understand:

- runner experience
- primary motivation
- current fitness baseline
- preferred run days
- blocked days
- long run preference
- injury and schedule constraints
- desired effort level
- rolling review inputs from recent cycles

This supports both general-fitness runners and more structured distance/race-oriented runners.

## Core Entities

### Runner Profile

Long-lived defaults for one user.

Purpose:

- store reusable runner context
- prefill future scaffold creation
- avoid re-asking stable questions every time

Current fields include:

- `experienceLevel`
- `primaryMotivation`
- `typicalWeeklyRuns`
- `typicalWeeklyDistanceKm`
- `longestRecentRunKm`
- `preferredLongRunDay`
- `preferredRunDays`
- `blockedDays`
- `weekStartDay`
- `surfacePreferences`
- `injuryNotes`
- `timeConstraintsNotes`
- `planEffortPreference`

### Plan Draft

One active draft per user.

Purpose:

- support a future multi-step wizard
- autosave progress safely
- allow scaffold creation or scaffold update flows

Current draft behavior:

- `draftType` supports `create_scaffold` and `update_scaffold`
- `draftData` stores step payloads as validated `jsonb`
- `completedSteps` tracks which wizard sections are done
- `currentStep` tracks resume position
- drafts can be `draft`, `finalized`, or `archived`

### Plan Scaffold

The scaffold is the durable parent object for a training plan.

Purpose:

- store the overall plan direction
- hold stable intent across many future plan cycles
- avoid rewriting the whole plan every week

Current scaffold behavior:

- one primary goal per scaffold
- stores schedule preferences and constraints
- stores a profile snapshot at creation time
- tracks `currentCycleNumber`
- supports `draft`, `active`, `paused`, `completed`, `archived`

### Plan Cycle

Represents a future 1-2 week planning window.

Purpose:

- make rolling planning possible
- support short generation windows later
- separate long-lived intent from short-lived execution blocks

Current cycle model supports:

- `cycleNumber`
- `startDate`
- `endDate`
- `status`
- `generationInput`
- `generationMetadata`
- `adjustmentNotes`
- `generatedAt`

V1 does not create cycles automatically, but the schema and read surfaces exist.

### Cycle Review

Represents the feedback loop for future weekly tweaks.

Purpose:

- capture how the last cycle went
- store subjective review plus derived activity metrics
- prepare future generation to adapt week by week

Current review fields include:

- `completionScore`
- `feltDifficulty`
- `fatigueLevel`
- `painFlags`
- `missedRunsCount`
- `notes`
- `derivedMetrics`

### Event Log

Append-only activity log for plan actions.

Purpose:

- audit/debug complex wizard flows
- trace scaffold and review changes
- support future analytics or support tooling

Current event types include:

- `draft_created`
- `step_saved`
- `draft_finalized`
- `scaffold_created`
- `scaffold_updated`
- `cycle_review_saved`

## Supported Goal Shapes

The backend currently supports these scaffold goal types:

- `general_fitness`
- `consistency`
- `distance`
- `race`

This is intentional. General fitness is a first-class case, not a fallback.

Each goal type has its own validated `goalDetails` payload.

## Validation Model

All plan `jsonb` payloads are validated with Zod on write and on read.

This matters because the training-plan system stores flexible wizard data in `jsonb`, and repo rules require shape validation for persisted `jsonb`.

Current validated payload groups:

- runner profile input
- goal intent
- schedule
- fitness baseline
- constraints
- review preferences
- full draft data
- scaffold payload
- cycle review payload
- cycle metadata payloads

The wizard is modeled as independently valid steps, which makes autosave and step-by-step resume easier.

## API Surface

The backend exposes a dedicated `runningPlan` router.

Current procedures:

- `runningPlan.getProfile`
- `runningPlan.upsertProfile`
- `runningPlan.getDraft`
- `runningPlan.saveDraftStep`
- `runningPlan.createScaffoldFromDraft`
- `runningPlan.getScaffold`
- `runningPlan.updateScaffold`
- `runningPlan.listScaffolds`
- `runningPlan.listCycles`
- `runningPlan.getCycle`
- `runningPlan.saveCycleReview`

## How The Infra Works

### 1. Profile and prefill

The system can return both:

- explicitly saved running-plan profile data
- derived prefill data from existing running history

Prefill currently derives from:

- weekly rollups
- synced activities
- user week-start setting
- Intervals athlete profile where available

Current prefill output includes:

- likely weekly run count
- likely weekly distance
- longest recent run
- preferred run days inferred from behavior
- likely long-run day
- sync confidence hints

### 2. Draft save flow

Each wizard step can be saved independently.

When a step is saved:

- the active draft is created or updated
- step data is merged into `draftData`
- `completedSteps` is updated
- `currentStep` is advanced
- an event is logged

### 3. Draft to scaffold flow

When a draft is finalized:

- required draft sections are validated
- goal + schedule + constraints are combined
- profile data is snapshotted
- a scaffold is created or updated
- the draft is marked finalized
- events are logged

This is the key boundary between in-progress intake and durable training-plan intent.

### 4. Cycle review flow

When a cycle review is saved:

- review input is validated
- activities inside the cycle window are analyzed
- derived metrics are stored alongside the review
- an event is logged

This creates the future adjustment hook for rolling plans.

## Existing Smart Prefill

The backend already uses current running history to reduce future wizard friction.

It can infer:

- typical weekly runs
- typical weekly distance
- longest recent run
- preferred run days
- likely long-run day
- whether synced history exists and is usable

This is useful for future UX because the wizard can start from a realistic baseline instead of a blank form.

## Current Features Shipped In Infra

- dedicated running-plan db schema
- dedicated running-plan API router
- strong Zod validation for all flexible payloads
- one-active-draft model
- scaffold creation and update flows
- rolling cycle entity support
- cycle review persistence
- derived metrics from historical activity data
- event logging for draft/scaffold/review flows
- prefill from existing synced run history

## Current Non-Goals

These are intentionally **not** implemented yet:

- workout generation
- planned workout rows
- adherence matching between planned and completed runs
- auto-creation of future cycles
- coach-like adaptive plan mutation
- frontend wizard UI

## Why This Shape Was Chosen

This infra avoids a common bad path: generating a full static plan too early.

Instead it assumes:

- long-lived plan intent should be stable
- weekly execution should be flexible
- review loops matter
- runners change availability, fatigue, and goals over time

That makes the backend more compatible with future rolling generation and weekly adjustment logic.

## Key Product Decisions Encoded

- one active draft per user
- many historical scaffolds allowed
- one primary goal per scaffold
- general fitness is first-class
- preferred days and blocked days are separate concepts
- free-text notes are supported alongside structured fields
- cycle reviews can mix subjective input with derived activity metrics
- cycle windows are flexible enough for 1-2 week planning

## Gaps / Next Steps

Likely next product/backend steps:

1. generate and commit the DB migration files
2. define the future cycle-generation contract more tightly
3. introduce planned workout entities once generation starts
4. build the frontend wizard on top of step save + scaffold creation
5. add planned-vs-completed linking once execution tracking begins

## Relevant Code

- `packages/db/src/schema/running-plans.ts`
- `packages/api/src/schemas/running-plans.ts`
- `packages/api/src/services/running-plans/index.ts`
- `packages/api/src/services/running-plans/shared.ts`
- `packages/api/src/services/running-plans/prefill.ts`
- `packages/api/src/routers/running-plans.ts`
