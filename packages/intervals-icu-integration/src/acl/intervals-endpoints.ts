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
    DETAIL: (activityId: string) =>
      `${INTERVALS_API_BASE}/activity/${activityId}?intervals=true`,
    MAP: (activityId: string) =>
      `${INTERVALS_API_BASE}/activity/${activityId}/map`,
    STREAMS: (
      activityId: string,
      {
        types,
        ext = ".json",
      }: {
        types: string[];
        ext?: ".json" | ".csv";
      },
    ) => {
      const params = new URLSearchParams();
      for (const streamType of types) {
        params.append("types", streamType);
      }
      const query = params.toString();
      return `${INTERVALS_API_BASE}/activity/${activityId}/streams${ext}${
        query ? `?${query}` : ""
      }`;
    },
  },
};
