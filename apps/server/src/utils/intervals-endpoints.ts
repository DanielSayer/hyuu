const INTERVALS_API_BASE = "https://intervals.icu/api/v1";

export const INTERVALS_ENDPOINTS = {
  ATHLETE: {
    PROFILE: (athleteId: string | number) =>
      `${INTERVALS_API_BASE}/athlete/${athleteId}`,
    ACTIVITIES: (
      athleteId: string | number,
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
      activityId: string | number,
      { intervals = false }: { intervals?: boolean } = {},
    ) =>
      `${INTERVALS_API_BASE}/activity/${activityId}?${new URLSearchParams({
        intervals: String(intervals),
      }).toString()}`,
    INTERVALS: (activityId: string | number) =>
      `${INTERVALS_API_BASE}/activity/${activityId}/intervals`,
    HR_HISTOGRAM: (activityId: string | number) =>
      `${INTERVALS_API_BASE}/activity/${activityId}/hr-histogram`,
  },
};
