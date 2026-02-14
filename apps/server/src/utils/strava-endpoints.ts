export const STRAVA_ENDPOINTS = {
  OAUTH: {
    AUTHORIZE: "https://www.strava.com/oauth/authorize",
    TOKEN: "https://www.strava.com/oauth/token",
  },
  ATHLETE: "https://www.strava.com/api/v3/athlete",
  ACTIVITIES: {
    LIST: "https://www.strava.com/api/v3/athlete/activities",
    DETAIL: (activityId: number) =>
      `https://www.strava.com/api/v3/activities/${activityId}`,
    ZONES: (activityId: number) =>
      `https://www.strava.com/api/v3/activities/${activityId}/zones`,
  },
};
