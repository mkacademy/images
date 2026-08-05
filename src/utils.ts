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

export const placeholder = new URL("./Images/placeholder.jpg", import.meta.url).href;
/** Shown for dehydrated / mime-only image slots (data:image/jpeg, …). Bare `data:image` is a permanent sentinel. */
export const imageMimePlaceholder = new URL("./Images/imageLoading.gif", import.meta.url).href;
/** Shown for dehydrated / mime-only audio slots (data:audio, data:audio/mpeg, …). */
export const audioMimePlaceholder = new URL("./Images/audioMimePlaceholder.png", import.meta.url).href;
/** Shown for dehydrated / mime-only video slots (data:video, data:video/mp4, …). */
export const videoMimePlaceholder = new URL("./Images/videoMimePlaceholder.png", import.meta.url).href;
/** @deprecated Prefer imageMimePlaceholder */
export const imageLoadingGif = imageMimePlaceholder;

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

