# Goals Feature - Product Requirements Document

## Overview

Introduce a goals feature that enables users to set and track running goals across distance, frequency, and pace metrics on weekly or monthly cadences.

## Problem Statement

Users have no structured way to set personal running targets or track progress toward them, reducing engagement and accountability.

## Feature Goals

1. Enable users to set meaningful running goals (distance, frequency, pace)
2. Provide real-time progress tracking on dashboard and dedicated goals page
3. Create habit-forming streaks for weekly frequency goals
4. Offer flexible rescheduling for missed goals (soft failure model)

---

## Scope: V1

### Goal Types

- **Distance** (e.g., 100km/month, 50km/week)
- **Frequency** (e.g., 3 runs/week)
- **Pace** (e.g., maintain 6:00min/km average)

### Goal Configuration

Users can set:

- Goal type (distance, frequency, or pace)
- Target value
- Recurring unit (weekly or monthly)

### Streak System (Frequency-Only)

- Users can set one active "runs per week" streak
- Streaks track consecutive weeks hitting target
- Broken streak = reset counter
- Visual indicator on dashboard and goals page

### Failed Goals (Soft Failure + Reschedule)

- Goals that miss target do not delete
- User prompted to:
  - Reschedule for next period with same target
  - Adjust target down and retry
  - Archive goal
- No punitive messaging

### Dashboard Display

Shows:

- **Active Goals Card** listing:
  - Streak prominently (🔥 format, runs this week)
  - Up to 3 active goals (distance/pace) with progress bars
  - "Manage goals" link to Goals page
- Goals ordered by: streak first, then by progress (closest to failing)

### Goals Management Page (Sidebar)

Sections:

- **Active Goals** — Edit/delete, view progress
- **Expired/Failed Goals History** — Review past goals, option to reschedule
- **+ Add New Goal** button

### Goal Creation Flow

1. User clicks "Add goal"
2. Select goal type (distance, frequency, pace)
3. Input target value
4. Select recurring unit (weekly/monthly)
5. Confirm & goal appears on dashboard + goals page

### Progress Tracking

Goals tracked automatically based on logged runs:

- **Distance:** Cumulative km logged in period
- **Frequency:** Run count in period
- **Pace:** Average pace across runs in period

Goals refresh at period boundary (Sunday/Monday (based on user setting) 00:00 or month-end).

---

## Scope: V2 (Future)

### Weekly Review Popup

- **Trigger:** Start or end of week (TBD)
- **Display:**
  - Runs completed this week (progress bar)
  - Target runs
  - Current streak status
  - Peek at distance/pace goal progress
- **UX:**
  - Dismissable modal
  - User setting to disable notifications
  - Link to view previous week summaries
  - Previous summaries accessible via Goals page or user profile

---

## Success Metrics

- Goal creation rate (% of users setting ≥1 goal)
- Streak engagement (weekly active users with streak)
- Goal completion rate (% of goals hit)
- Dashboard card interaction rate (clicks to manage)

---

## Technical Notes

- Goals data linked to user profile
- Automatic progress calculation on run log
- Period reset logic (monthly: 1st of month) (weekly user will have a setting for their preffered DOTW)
- Failed goal state management
