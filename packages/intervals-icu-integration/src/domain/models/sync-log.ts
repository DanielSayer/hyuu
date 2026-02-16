export type SyncStatus = "started" | "success" | "failed";

export type SyncWindow = {
  oldest: string;
  newest: string;
};

export type SyncStartResult = {
  id: number;
};
