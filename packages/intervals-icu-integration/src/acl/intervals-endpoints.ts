const INTERVALS_API_BASE = "https://intervals.icu/api/v1";

export const INTERVALS_ENDPOINTS = {
  ATHLETE: {
    PROFILE: (athleteId: string) =>
      `${INTERVALS_API_BASE}/athlete/${athleteId}`,
    ACTIVITIES: (
      athleteId: string,
      {
        oldest,
        newest,
      }: {
        oldest?: string;
        newest?: string;
      } = {},
    ) => {
      const params = new URLSearchParams();
      if (oldest) {
        params.set("oldest", oldest);
      }
      if (newest) {
        params.set("newest", newest);
      }
      const query = params.toString();
      return `${INTERVALS_API_BASE}/athlete/${athleteId}/activities${
        query ? `?${query}` : ""
      }`;
    },
  },
  ACTIVITY: {
    DETAIL: (
      activityId: string,
      { intervals = false }: { intervals?: boolean } = {},
    ) =>
      `${INTERVALS_API_BASE}/activity/${activityId}?${new URLSearchParams({
        intervals: String(intervals),
      }).toString()}`,
    INTERVALS: (activityId: string) =>
      `${INTERVALS_API_BASE}/activity/${activityId}/intervals`,
    MAP: (activityId: string) =>
      `${INTERVALS_API_BASE}/activity/${activityId}/map`,
  },
};
