import { userApps, memberApps } from './constants';

export interface Metadata {
  owner: boolean;
  ordinal?: number;
  interaction?: boolean;
  communications?: string;
  instructionId?: number;
  foundationId?: (string | number)[];
  bossId?: (string | number)[] | number;
  minionId?: (string | number)[] | number;
  filterId?: (string | number)[] | number;
  sifterId?: (string | number)[] | number;
  dashboardId?: (string | number)[] | number;
  underbossId?: (string | number)[] | number;
  lowersifterId?: (string | number)[] | number;
  highersifterId?: (string | number)[] | number;
}
export interface GlobalVars {
  globallyUniqueIDs: number;
}

export interface ToolKit {
  anonymousRecordsUrl: string;
  authenticatedRecordsUrl: string;
  accountLoginUrl: string;
  anonymousFetcherUrl: string;
  authenticatedFetcherUrl: string;
}

export interface TimeOptions {
  dateStyle: string;
  timeStyle: string;
}

export interface QueryParam {
  key: string;
  value: string;
}

export const bannerRoutes = [
  "foundationfilters",
  "foundationsifters",
  "foundationdashboards",
];

export const placeholder = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/hA29odHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMTgwMTE3NDA3MjA2ODExODhDNkUyRjBDQjIyQjYyQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo1MURDREI3NERCODgxMUUyOEYxRkYyMkY4NEYyQTMwOSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1MURDREI3M0RCODgxMUUyOEYxRkYyMkY4NEYyQTMwOSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjA4ODAxMTc0MDcyMDY4MTE4OEM2RTJGMENCMjJCNjJBIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjAxODAxMTc0MDcyMDY4MTE4OEM2RTJGMENCMjJCNjJBIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4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";

export const userroles = ["ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR"];

export function capitalizeFirstLetter(string: string | undefined): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function unCapitalizeFirstLetter(string: string | undefined): string {
  if (!string) return '';
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export interface MediaQuery {
  query: string;
}

export interface MediaQueries {
  Small: MediaQuery;
  Tablet: MediaQuery;
  Mobile: MediaQuery;
  Phablet: MediaQuery;
  DeskTop: MediaQuery;
  _15Inch: MediaQuery;
  _14Inch: MediaQuery;
}

export const medias: MediaQueries = {
  Small: { query: `(min-width: 992px)` },
  Tablet: { query: `(min-width: 768px)` },
  Mobile: { query: `(min-width: 320px)` },
  Phablet: { query: `(min-width: 576px)` },
  DeskTop: { query: `(min-width: 1920px)` },
  _15Inch: { query: `(min-width: 1536px)` },
  _14Inch: { query: `(min-width: 1440px)` },
};

let take = 1;
export const timeout = 30000;
export const hydrationDelay = 100;
export const convolutionDelay = 1000;
export const convolutionTake = (): number => take;
export const setTake = (curtake: string | number): number => (take = parseInt(curtake as string));
export const globalVars: GlobalVars = { globallyUniqueIDs: -1 };
export const incrementID = (): number => globalVars.globallyUniqueIDs--;
export const signOut = (): string => {
  take = 1;
  globalVars.globallyUniqueIDs = -1;
  return "session/signedOut";
};

// Helper function to get the base URL based on environment
export const getBaseUrl = (): string => {
  // For development, use local backend server
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }

  // For preview mode (local testing of production build)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8080'; // Still use local backend for testing
  }

  // For real production, use empty string (relative URLs)
  return '';
};

export const ToolKit: ToolKit = {
  get anonymousRecordsUrl() { return getBaseUrl() + "/api/records/anonymous-app"; },
  get authenticatedRecordsUrl() { return getBaseUrl() + "/api/records/authenticated-app"; },
  get accountLoginUrl() { return getBaseUrl() + "/api/settings/account-login"; },
  get anonymousFetcherUrl() { return getBaseUrl() + "/api/records/anonymous-fetcher"; },
  get authenticatedFetcherUrl() { return getBaseUrl() + "/api/records/authenticated-fetcher"; },
};

export const maxIndexOfApps = 4;
export const maxIndexOfUserApps = 6;

export const getCurAppName = (input: string | number): string => {
  const appIndex = parseInt(input as string);
  return appIndex <= maxIndexOfApps
    ? userApps[appIndex].toLowerCase()
    : appIndex > maxIndexOfApps && appIndex <= maxIndexOfUserApps
      ? memberApps[appIndex].toLowerCase()
      : '';
};

export const getCurAppIndex = (input: string): [string, string] | [] => {
  const pred = ([_, value]: [string, string]) => input.toLowerCase() === value.toLowerCase();
  return (
    Object.entries(userApps).find(pred) ??
    Object.entries(memberApps).find(pred) ??
    []
  );
};


export const getPlural = (singular: string): string => {
  switch (singular.toLowerCase()) {
    case "boss":
      return "bosses";
    case "minion":
      return "minions";
    case "sifter":
      return "sifters";
    case "filter":
      return "filters";
    case "instruction":
      return "instructions";
    case "dashboard":
      return "dashboards";
    case "underboss":
      return "underbosses";
    case "higherunderboss":
      return "higherunderbosses";
    case "lowerunderboss":
      return "lowerunderbosses";
    case "highersifter":
      return "highersifters";
    case "lowersifter":
      return "lowersifters";
    case "tutors":
    case "tutor":
      return "tutors";
    case "quizzes":
    case "quiz":
      return "quizzes";
    case "tutorials":
    case "tutorial":
      return "tutorials";
    case "courses":
    case "course":
      return "courses";
    case "foundation":
      return "foundation";
    default:
      throw Error(`"${singular}" conversion to plural failed`);
  }
};

export const getGraphqlResolver = (fromEntity: string, toEntity: string) => {
  const toLowerEntity = toEntity.toLowerCase();
  const isToLowerEntity = fromEntity === toLowerEntity;
  return !isToLowerEntity
    ? {
      graphqlResolver: fromEntity + capitalizeFirstLetter(toEntity),
      to: capitalizeFirstLetter(toEntity),
      from: fromEntity,
    }
    : {
      graphqlResolver: fromEntity + "Lower" + toLowerEntity,
      to: "Lower" + toLowerEntity,
      from: fromEntity,
    };
};

export const uniqueAliases = ["text", "quote", "content", "title", "imageurl", 'email'];



export const textEllipsis = (
  str: string,
  maxLength = 500,
  { side = "end", ellipsis = "..." } = {}
) => {
  if (str && str.length > maxLength) {
    switch (side) {
      case "start":
        return ellipsis + str.slice(-(maxLength - ellipsis.length));
      case "end":
      default:
        return str.slice(0, maxLength - ellipsis.length) + ellipsis;
    }
  }
  return str;
};

