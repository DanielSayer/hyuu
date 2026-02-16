# Intervals Package Plan

## Goal

Create a dedicated `@hyuu/intervals` package that isolates Intervals integration concerns from HTTP transport and app wiring. The package should support future growth (webhooks, additional sync jobs, richer analytics) without forcing repeated changes in `apps/server`.

## Why This Extraction Makes Sense Now

Current Intervals logic in `apps/server/src/endpoints/intervals/index.ts` already includes:

- external API interaction
- payload validation/parsing
- sync window calculation
- persistence/upsert logic
- endpoint response shaping

This is a strong signal to separate:

- transport layer (Hono routes) from
- business/application layer (sync orchestration) from
- anti-corruption layer (Intervals-specific translation/parsing)

## Proposed Package

- **Package name:** `@hyuu/intervals`
- **Location:** `packages/intervals`
- **Ownership boundary:** all provider-specific logic for Intervals. No Hono imports.

## Architecture: 3 Layers

### 1) Transport Layer (stays in app)

Lives in `apps/server`:

- route auth/session checks
- query param extraction
- HTTP status + JSON responses

Routes should call package application services and map errors to HTTP.

### 2) Application/Business Layer (package)

Use-case oriented services (provider-agnostic naming where possible):

- `connectAthleteAndBootstrapActivities`
- `syncActivitiesIncremental`
- `testConnection`
- `getConnectionStatus`

Responsibilities:

- orchestrate the workflow
- call ACL gateway
- call repository interfaces
- apply business rules (lookback, re-sync buffer, idempotency policy)

### 3) ACL (Anti-Corruption Layer) (package)

Wrap Intervals API and payload shapes so Intervals-specific models do not leak everywhere.

- translate external payloads -> internal canonical models
- normalize optional/null/number/date fields
- map remote API errors to domain error types
- keep Intervals endpoint URLs and request options internal to ACL

## Proposed File Structure

```text
packages/intervals/
  src/
    index.ts

    application/
      services/
        connect-athlete-and-bootstrap-activities.ts
        sync-activities-incremental.ts
        test-connection.ts
        get-connection-status.ts
      policies/
        sync-window-policy.ts

    domain/
      models/
        athlete.ts
        activity.ts
        sync-log.ts
      errors/
        intervals-domain-error.ts
        connection-not-found-error.ts
        upstream-auth-error.ts
        upstream-request-error.ts

    acl/
      intervals-gateway.ts
      intervals-endpoints.ts
      mappers/
        athlete-mapper.ts
        activity-mapper.ts
      schemas/
        intervals-athlete-schemas.ts
        intervals-activity-schemas.ts
      errors/
        intervals-request-error.ts

    persistence/
      intervals-repository.ts
      drizzle-intervals-repository.ts
      mappers/
        activity-row-mapper.ts
        athlete-row-mapper.ts
```

Notes:

- existing `apps/server/src/utils/intervals-endpoints.ts` moves into `acl/intervals-endpoints.ts`
- existing schema validators in `apps/server/src/endpoints/intervals/schemas/*` move into `acl/schemas/*`
- existing helper logic in endpoint file (`fetchAndUpsertActivities`, `upsertIntervalsAthleteData`, `normalizeIntervalsDateParam`) becomes package services/policies/repository methods

## Business Logic Extractors (from current endpoint)

Extract these first-class units from `apps/server/src/endpoints/intervals/index.ts`:

1. **Sync Window Policy**
   - current rule: initial 14 days, incremental from last successful sync minus 1 day
   - input: last successful sync timestamp + optional overrides
   - output: `{ oldest, newest }`
2. **Activity Fetch Orchestrator**
   - fetch activity events, fetch detail + intervals per activity, dedupe IDs
3. **Activity Upsert Service**
   - idempotent upsert for activity row and intervals rows
4. **Athlete Profile Upsert Service**
   - create/update profile record from normalized athlete model
5. **Sync Log Lifecycle**
   - started -> success/failed transitions and counts

## Interface Contracts (keep package composable)

Define repository and gateway interfaces in package:

- `IntervalsGateway`: fetch athlete profile, list activities/events, fetch activity detail, fetch intervals
- `IntervalsRepository`: read connection info, read last successful sync, write sync log entries, upsert athlete, upsert activities

Then provide default Drizzle implementation in package, but keep interfaces public for testing/mocking.

## Migration Plan (Low Risk)

### Phase 1: Internal Extraction (no behavior changes)

- Create package and copy schemas/endpoints/mappers
- Move pure helper functions and policies first
- Keep route handlers in `apps/server` unchanged except imports

### Phase 2: Service Boundary

- Introduce service calls from route handlers:
  - `/connections` -> `connectAthleteAndBootstrapActivities`
  - `/sync` -> `syncActivitiesIncremental`
  - `/connections/test` -> `testConnection`
- Keep response payload shapes in server route layer

### Phase 3: Stabilize Contracts

- Add unit tests for:
  - sync-window policy
  - mapper conversions
  - error mapping (Intervals -> domain)
- Add integration tests for service + drizzle repository

### Phase 4: Expansion Readiness

- add webhook entrypoints (server) that call same package services
- optionally add background job workers that call package services directly
- maintain one canonical sync behavior path

## ACL Rules to Enforce

1. No Intervals raw payload objects outside `acl/*` and `schemas/*`.
2. No direct references to Intervals API URL builders outside `acl/intervals-endpoints.ts`.
3. Route handlers never call external API directly; they call application services only.
4. Domain/application services never import Hono types.
5. Repository implementations are replaceable; business services depend on interfaces.

## What Should Stay Outside the Package

- session/auth retrieval (`getCurrentSession`)
- HTTP response codes and response JSON shape
- route registration in `apps/server/src/index.ts`

## Acceptance Criteria for the Refactor

- `apps/server/src/endpoints/intervals/index.ts` mostly route/controller orchestration
- all sync and mapping rules are tested in package
- no behavior regression for:
  - connect + 2-week bootstrap fetch
  - incremental sync from last successful sync minus 1 day
  - activity upsert idempotency
