import type { IntervalsAthlete } from "../domain/models/athlete";
import type { IntervalsActivityAggregate } from "../domain/models/activity";
import type { SyncStartResult } from "../domain/models/sync-log";

export type IntervalsConnectionProfile = {
  intervalsAthleteId: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LastSuccessfulSync = {
  completedAt: Date | null;
  startedAt: Date;
};

export type LatestSyncAttempt = {
  startedAt: Date;
};

export interface IntervalsRepository {
  getLatestConnectionProfile(userId: string): Promise<IntervalsConnectionProfile | null>;
  getConnectedAthleteId(userId: string): Promise<string | null>;
  getLastSuccessfulSync(userId: string): Promise<LastSuccessfulSync | null>;
  getLatestSyncAttempt(userId: string): Promise<LatestSyncAttempt | null>;
  createSyncLogStarted(params: {
    userId: string;
    intervalsAthleteId: string;
    startedAt: Date;
  }): Promise<SyncStartResult | null>;
  completeSyncLogSuccess(params: {
    syncLogId: number;
    intervalsAthleteId: string;
    completedAt: Date;
    fetchedActivityCount: number;
  }): Promise<void>;
  completeSyncLogFailed(params: {
    syncLogId: number;
    completedAt: Date;
    errorMessage: string;
  }): Promise<void>;
  upsertAthleteProfile(params: {
    userId: string;
    athlete: IntervalsAthlete;
    now: Date;
  }): Promise<{ profileId: number }>;
  upsertActivities(params: {
    userId: string;
    intervalsAthleteId: string;
    activities: IntervalsActivityAggregate[];
  }): Promise<number>;
}
