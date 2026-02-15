# Strava Activity Fetch and Storage Strategy

## Context

We are building a Strava integration that requires syncing athlete activities into our database. The MVP will use manual sync via a UI button. In future iterations, we plan to migrate to webhook-based syncing for real-time updates.

Key constraints:

- Strava API rate limits: 100 requests per 15 minutes, 1,000 per day
- Activities can be edited by users after creation
- We must avoid duplicate storage and unnecessary API calls
- Must support future webhook migration without schema changes

---

## Decision

We will implement an **incremental upsert strategy** with a 24-hour lookback buffer and deduplication via the Strava activity ID.

### Storage Strategy

**Deduplication Key:** `(user_id, strava_id)` unique constraint

Each activity is uniquely identified by the combination of the authenticated user and Strava's activity ID. This serves as the single source of truth for detecting duplicates.

**Data Retention:**

- Store raw JSON response from Strava for each activity to support future feature expansion (e.g., segments, laps, gear details)
- Track Strava's `updated_at` timestamp separately from our own `updated_at` to distinguish between Strava changes and local modifications
- Maintain a sync log table recording when syncs occurred, how many activities were fetched/created/updated, and any errors

### Fetch Strategy

**Incremental Fetching:**

- On each manual sync, determine the lowest timestamp: either the last successful sync time minus 24 hours (buffer) or their last 2 weeks of data for initial sync
- Use Strava's `after` parameter to fetch only activities created or modified after this timestamp
- Paginate through all results using Strava's pagination (200 activities per page, typical)
- For MVP, a single sync operation fetches all matching activities in one go

**Why the 24-Hour Buffer:**
The buffer recaptures the previous day of activities intentionally. This handles:

- User edits to activity metadata (name, description, privacy)
- GPS uploads that arrive late
- Manual activity entries added after the initial sync
- Cost is negligible: at typical user activity volumes, 1–3 duplicate fetches daily is not a rate limit concern

### Save Strategy

**Upsert on Conflict:**

- For each fetched activity, attempt an insert
- If a `(user_id, strava_id)` conflict exists, update the row instead
- Only update mutable fields if Strava's `updated_at` is newer than our stored `strava_updated_at` to avoid redundant writes
- Record the operation (insert vs. update) in the sync log for audit purposes

**Immutable Fields:**

- Strava activity ID
- Creation timestamp (start_date from Strava)

**Mutable Fields:**

- Activity name, description, privacy settings
- Physical metrics (distance, time, elevation, heart rate) — users can re-record segments or correct GPS traces
- Sport type classification (user can reclassify)

---

## Activity Update Handling

**Out of Scope for MVP:** Direct mutation of activity data through our UI.

Users must edit activities in the Strava app. Our sync mechanism automatically captures these changes on the next sync cycle. No explicit update workflow is required in the application layer for MVP.

---

## Rate Limiting Strategy

**Request Budget Awareness:**

- 200 activities per page; at 100 requests per 15 minutes, one sync can safely fetch up to ~20,000 activities
- Typical active users have 100–500 activities, well under this threshold
- Sync operation is batched into a single HTTP request session to minimize overhead

**User-Facing Throttle:**

- The manual sync button is disabled for 5 minutes after a successful sync completes
- Before allowing a new sync, check the sync log for a recent completed entry within the throttle window
- Display remaining cooldown time to the user
- If a sync fails, do not apply throttle — allow immediate retry

**Fallback:**

- If rate limit is hit (HTTP 429), catch and bubble error to user with a clear message
- Log the rate limit event for monitoring
- User can retry after 15 minutes

---

## Sync Operation Flow (MVP)

1. User clicks manual sync button
2. System checks if throttle window is active; if so, show cooldown timer
3. If clear, create a sync log entry marked "started"
4. Determine the `after` timestamp from last successful sync (minus 24-hour buffer)
5. Iterate through all paginated results from Strava API
6. Accumulate activities in memory during fetch
7. Upsert each activity to the database
8. Update sync log with success status, counts (fetched, created, updated), and completion time
9. Display summary to user: "Synced 42 activities (15 new, 27 updated)"
10. On error at any step, catch exception, log error message to sync log as "failed", and re-throw to UI

---

## Data Consistency

**Transactional Integrity:**

- Each individual activity upsert should be atomic
- If a batch sync is partially completed and fails mid-way, partial data is acceptable—the sync log records the failure, and retry will re-fetch and reconcile

**Conflict Resolution:**

- If the same activity is fetched twice (e.g., user manually triggers a sync before cooldown expires), the upsert is idempotent; the row is either inserted once or updated with the latest data
- No duplicate rows are created

---

## Future Considerations: Webhook-Based Sync

**Migration Plan (Post-MVP):**

Once Strava webhook support is implemented, the sync strategy will layer on webhooks without schema changes:

**Webhook Events:**

- Activity create: Fetch and upsert the new activity
- Activity update: Fetch and upsert the modified activity
- Activity delete: Hard-delete the activity from our database

**Parallel Operation:**

- Manual sync button remains available for explicit refresh or backfill scenarios
- Webhooks handle real-time ingestion of changes
- Both code paths funnel into the same upsert logic; data flows into the same tables

**Rate Limit Benefit:**

- Webhooks are push events, not pull requests; they do not consume API quota
- Manual syncs can be less frequent (e.g., weekly) since webhooks keep data current
- Throttle on manual sync can be loosened or removed if webhooks are the primary sync mechanism

**Implementation Notes:**

- Strava webhooks require a public HTTPS endpoint registered in the Strava app settings
- Webhook payload contains object ID only; we still must fetch full activity data from the API (1 request per event)
- Idempotency: process webhook events idempotently to handle retries
- Webhook backlog: if our service is down, Strava retries for ~72 hours; manual sync can backfill missed events

**Timeline:** Webhooks are not scheduled for MVP but will be prioritized in the next phase pending Strava webhook availability and infrastructure readiness.

---

## Rationale

- **Idempotent Upsert:** Eliminates complex deduplication logic and allows safe retries
- **24-Hour Buffer:** Balances completeness (catches edits) with rate limit efficiency
- **Incremental Fetch:** Minimizes API calls and response sizes; only pulls what's changed
- **Sync Log Audit Trail:** Enables debugging, rate limit monitoring, and user-facing transparency
- **Webhook-Ready:** Architecture requires no schema changes when migrating from pull to push; reduces future rework

---

## Consequences

**Positive:**

- Simple, deterministic sync logic
- No risk of duplicate activities in the database
- User edits in Strava automatically reflected on next sync
- Clear audit trail of all sync operations
- Minimal API overhead for typical user activity volumes
- Straightforward webhook migration path

**Negative:**

- Strava edits have a sync delay (manual sync lag, not real-time)
- Initial sync may refetch 24 hours of data unnecessarily, but cost is negligible
- Sync log table grows over time (manageable with retention policies)

---

## Acceptance Criteria

- [ ] Activities are never duplicated in the database regardless of how many times sync is triggered
- [ ] Manual sync button is disabled for 5 minutes after a successful sync
- [ ] Sync log records creation, update, and fetch counts for every sync attempt
- [ ] Rate limit errors are caught and displayed to the user
- [ ] User can manually retry a failed sync immediately
- [ ] Architecture supports webhook ingestion without schema or table changes
- [ ] Strava activity edits are reflected in the database on the next sync
