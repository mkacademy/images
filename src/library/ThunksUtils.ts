import { jwtDecode } from 'jwt-decode';
import { createSelector, Dispatch } from '@reduxjs/toolkit';
import { Content,  Banner as TutorialBanner } from '../store/slices/tutorialSlice';
import { Banner, SlideGroup } from '../store/slices/courseSlice';
import { IncomingMessage, OutgoingMessage, setIncomings, setOutgoings } from '../store/slices/commsSlice';
import { ToolKit, RECORDS, getCurAppName, getSimplePageIndexFromSearch, orderedWebappRoutes, Tree, timeout, getCurAppIndex } from '../utils';
import { ResultPayload, ROW_APPEND_QUERY_TYPE } from '../store/slices/rowSlice';
import { getCounts, getExecutedQueries } from '../store/slices/statsSlice';
import { Quiz } from '../store/slices/quizSlice';
import { CpanelRow } from '../types/cpanel';
import { viewRequestFetching } from '../store/slices/viewSlice';
import { applyInsertStats } from '../store/thunks/applyInsertStats';
import { emptySelectedRoute } from '../store/slices/searchSlice';
import { RootState } from '../store';
import { StatsMiddlewareState } from '../store/types';
import { QueryParams } from './types';
import { buildRecordStateProps, type StatsPayload } from './requestIdsUtils';
import { getDeepLinkTreeIds, resolveViewerDeepLinkSearch } from '../loadingRouteUtils';

export {
    bannerPred,
    pennantTutorialBannerPred,
    buildChapterPennantFallback,
    quizBannerPred,
    quizPred,
    bannerOrTutorialBannerOrQuizPred,
    highBannerPred,
    transformCourseSlideGroups,
    transformQuizSlideGroups,
    buildRecordStateProps,
    extractIDsAtRequest,
    type RecordStateProps,
    type StatsPayload,
} from './requestIdsUtils';

const expireMessage = 'Token has expired, sign out and sign in again';

let fetchSequenceAborted = false;
let fetchSequenceRunning = false;

export const resetFetchSequenceAbort = () => {
    fetchSequenceAborted = false;
};

export const abortFetchSequence = () => {
    fetchSequenceAborted = true;
    fetchSequenceRunning = false;
};

export const isFetchSequenceAborted = () => fetchSequenceAborted;

export const setFetchSequenceRunning = (running: boolean) => {
    fetchSequenceRunning = running;
};

export const isFetchSequenceRunning = () => fetchSequenceRunning;

interface RecordParams {
    curApp: number;
    search: string;
    mailer?: number;
    state: RootState;
    formatter: string;
    isPrivate?: boolean;
    convolution: string;
    requestTake: number;
    curToken?: string | null;
    fetchRole?: string | null;
    executedQueries: Record<string, Record<string, Executedquery>>;
    counts: Record<string, Record<string, Record<string, number>>>;
    path: string;
}

const getCachedCounts = (
    counts: Record<string, Record<string, Record<string, number>>>, stateProps: StatsPayload) => {
    const { webapp, selectedT, selectedC, selectedQ, quizzes, pennantz, pennants, banners, selecteds, selectedRoute, curMailer } = stateProps;
    const app = getCurAppName(webapp);
    return getCounts({
        app,
        webapp,
        curMailer,
        selectedT,
        selectedC,
        selectedQ,
        quizzes,
        pennantz,
        pennants,
        banners,
        selecteds,
        selectedRoute
    }, counts)
}
const getCachedExecutedQueries = (
    executedQueries: Record<string, Record<string, Executedquery>>, stateProps: StatsPayload) => {
    const { webapp, selectedRoute, selectedT, selectedC, selectedQ, quizzes, pennantz, pennants, banners, selecteds, curMailer } = stateProps;
    const app = getCurAppName(webapp);
    return getExecutedQueries({
        app,
        webapp,
        curMailer,
        selectedT,
        selectedC,
        selectedQ,
        quizzes,
        pennantz,
        pennants,
        banners,
        selecteds,
        selectedRoute,
    }, executedQueries);
}
const getAccountBody = async (params: RecordParams) => {
    const state = params.state;
    const selectedRoute = emptySelectedRoute;
    const stateProps = buildRecordStateProps(state, params.curApp);
    const newStateProps = { ...stateProps, app: '', curMailer: params.mailer ?? -1, selectedRoute };
    const searchedRoutes = getSearchedRoutes(stateProps.webapp, []);
    const queries = getCachedExecutedQueries(params.executedQueries, newStateProps);
    const counts = getCachedCounts(params.counts, newStateProps);
    const requestBody = {
        counts,
        queries,
        searchedRoutes,
        state: stateProps,
        mailer: params.mailer,
        search: params.search,
        curToken: params.curToken,
        isPrivate: params.isPrivate,
        formatter: params.formatter,
        mutateRole: params.fetchRole,
        convolution: params.convolution,
        requestTake: params.requestTake,
    };
    return JSON.stringify(requestBody);
}

const getSkeletonSkip = (params: RecordParams): number => {
    const convolution = params.convolution.toLowerCase();
    const take = convolution === 'tutorial'
        ? 1000
        : convolution === 'course'
            ? 80
            : convolution === 'quiz'
                ? 20
                : params.state.session.defaultTake ?? 10;
    const page = getSimplePageIndexFromSearch(params.search);
    if (convolution === 'tutorial'
        || convolution === 'course'
        || convolution === 'quiz')
        return page * take;
    return 0;
};

const getAccountSkeletons = async (params: RecordParams): Promise<string> => {
    const requestBody = {
        hasCounts: false,
        mailer: params.mailer,
        curToken: params.curToken,
        isPrivate: params.isPrivate,
        mutateRole: params.fetchRole,
        skip: getSkeletonSkip(params),
        convolution: params.convolution,
    };
    return JSON.stringify(requestBody);
}
export const getAccountRecords = async (params: RecordParams) => {
    const endpoint = params.path;
    const currentTime = new Date().getTime();
    if (!params.curToken) throw new Error('No token provided');
    const decodedToken = jwtDecode<{ exp: number }>(params.curToken);
    if (decodedToken.exp * 1000 < currentTime) throw new Error(expireMessage);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body:
                endpoint === ToolKit.authenticatedSkeletonsRecordsUrl
                    ? await getAccountSkeletons(params)
                    : await getAccountBody(params),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Failed to fetch account records');
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout: Failed to fetch account records after ${timeout}ms`);
        }
        throw error;
    }
};

const getSearchedRoutes = (webapp: number, searchedRoutes: Record<string, string>[]) => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith("/convolution/search")) {
        if (searchedRoutes.length > 0)
            return searchedRoutes.reduce<Record<string, string>>((acc, cur) => ({ ...acc, ...cur }), {});
        const app = getCurAppName(webapp);
        return orderedWebappRoutes(Tree.entities, app);
    } else return null;
}
const getAnonymousSkeletons = async (params: RecordParams): Promise<string> => {
    const requestBody = {
        hasCounts: false,
        skip: getSkeletonSkip(params),
        convolution: params.convolution,
    };
    return JSON.stringify(requestBody);
}
const getAnonymousBody = async (params: RecordParams) => {
    const state = params.state;
    const selectedRoute = emptySelectedRoute;
    const stateProps = buildRecordStateProps(state, params.curApp);
    stateProps.quizzes = stateProps.quizzes.map(({ id }) => ({ id }));
    const newStateProps = { ...stateProps, app: '', curMailer: params.mailer ?? -1, selectedRoute };
    const searchedRoutes = getSearchedRoutes(stateProps.webapp, []);
    const queries = getCachedExecutedQueries(params.executedQueries, newStateProps);
    const counts = getCachedCounts(params.counts, newStateProps);
    const requestBody = {
        counts,
        queries,
        searchedRoutes,
        state: stateProps,
        search: params.search,
        formatter: params.formatter,
        convolution: params.convolution,
        requestTake: params.requestTake,
    };
    return JSON.stringify(requestBody);
}
export const getAnonymousRecords = async (params: RecordParams) => {
    const endpoint = params.path;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body:
                endpoint === ToolKit.anonymousSkeletonsRecordsUrl
                    ? await getAnonymousSkeletons(params)
                    : await getAnonymousBody(params),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Failed to fetch anonymous records');
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout: Failed to fetch anonymous records after ${timeout}ms`);
        }
        throw error;
    }
};

export interface Initials {
    [key: string]: FetchedData;
}

export interface Executedquery {
    isPrivateView?: boolean;
    parentIDs?: number[];
    childIDs?: number[];
    search?: string;
    take?: number;
    skip?: number;
}

export interface FetchDataPayload {
    fetchSequence?: { index: number; total: number };
    isMinimumFeatureMode?: boolean;
    convolution: string;
    webapp: string;
    search: string;
}

export interface MinimumFeatureModeFlags {
    isUnzipCourses: boolean;
    isUnzipQuizzes: boolean;
    isUnzipTutorials: boolean;
}

const minimumFeatureAppIndices = [1, 2, 3, 4, 5, 6];

export const isMinimumFeatureModeFromFlags = (flags: MinimumFeatureModeFlags): boolean =>
    flags.isUnzipCourses || flags.isUnzipQuizzes || flags.isUnzipTutorials;

export const selectMinimumFeatureModeFlags = createSelector(
    [
        (state: RootState) => state.settings.isUnzipCourses,
        (state: RootState) => state.settings.isUnzipQuizzes,
        (state: RootState) => state.settings.isUnzipTutorials,
    ],
    (isUnzipCourses, isUnzipQuizzes, isUnzipTutorials): MinimumFeatureModeFlags => ({
        isUnzipCourses,
        isUnzipQuizzes,
        isUnzipTutorials,
    }),
);

export const buildFetchDataPayload = (
    unzipFlags: MinimumFeatureModeFlags,
    payload: Omit<FetchDataPayload, 'isMinimumFeatureMode'>,
): FetchDataPayload => ({
    ...payload,
    isMinimumFeatureMode: isMinimumFeatureModeFromFlags(unzipFlags),
});

const COUNTS = 'counts';

/** Query map keys end with `records` or `counts`; strip to the route stem used in `orderedWebappRoutes`. */
const normalizeExecutedQueryRoute = (routeStem: string): string =>
    routeStem.endsWith('dashboard') && !routeStem.endsWith('dashboards')
        ? `${routeStem}s`
        : routeStem;

const routeStemFromExecutedQueryKey = (key: string): string | undefined => {
    if (key.endsWith(RECORDS)) return normalizeExecutedQueryRoute(key.slice(0, -RECORDS.length));
    if (key.endsWith(COUNTS)) return normalizeExecutedQueryRoute(key.slice(0, -COUNTS.length));
    return undefined;
};

const routesFromExecutedQueries = (executedQueries: Record<string, Executedquery>): string[] => {
    const routes = new Set<string>();
    for (const key of Object.keys(executedQueries)) {
        const route = routeStemFromExecutedQueryKey(key);
        if (route) routes.add(route);
    }
    return [...routes];
};

/** App index (1–6) whose route set contains every route key in the fetch response. */
export const resolveAppIndexFromExecutedQueryRoutes = (
    executedQueries: Record<string, Executedquery>,
): string | undefined => {
    const routes = routesFromExecutedQueries(executedQueries);
    if (routes.length === 0) return undefined;

    const matches = minimumFeatureAppIndices.filter((index) => {
        const appRoutes = orderedWebappRoutes(Tree.entities, getCurAppName(index));
        return routes.every((route) => appRoutes.includes(route));
    });

    if (matches.length === 0) return undefined;
    if (matches.length === 1) return matches[0].toString();

    return matches
        .reduce((tightest, candidate) => {
            const tightestRoutes = orderedWebappRoutes(Tree.entities, getCurAppName(tightest));
            const candidateRoutes = orderedWebappRoutes(Tree.entities, getCurAppName(candidate));
            return candidateRoutes.length < tightestRoutes.length ? candidate : tightest;
        })
        .toString();
};



export const anonymousFetch = async (query: QueryParams): Promise<ResultPayload> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(ToolKit.anonymousFetcherUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Failed to fetch anonymous records');
        const data = await response.json();
        const sizeMb = new Blob([JSON.stringify(data)]).size / (1024 * 1024);
        console.log(`anonymousFetch response size: ${sizeMb.toFixed(2)} MB`);
        const keywords = [`${query.limit?.skip}-${query.limit?.take}`];
        const result = {
            keywords,
            payload: data,
            entity: query.entity || '',
            parent: query.parent || '',
            isAppend: query.type === ROW_APPEND_QUERY_TYPE
        };
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout: Failed to fetch anonymous records after ${timeout}ms`);
        }
        throw error;
    }
};

export const authenticatedFetch = async (query: QueryParams): Promise<ResultPayload> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(ToolKit.authenticatedFetcherUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Failed to fetch authenticated records');
        const data = await response.json();
        const sizeMb = new Blob([JSON.stringify(data)]).size / (1024 * 1024);
        console.log(`authenticatedFetch response size: ${sizeMb.toFixed(2)} MB`);
        const keywords = [`${query.limit?.skip}-${query.limit?.take}`];
        const result = {
            keywords,
            payload: data,
            entity: query.entity || '',
            parent: query.parent || '',
            isAppend: query.type === ROW_APPEND_QUERY_TYPE
        };
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout: Failed to fetch authenticated records after ${timeout}ms`);
        }
        throw error;
    }
};


export interface FetchedData {
    quizzes?: Quiz[];
    totals?: Record<string, number>;
    banners?: Banner[] | TutorialBanner[];
    counts: Record<string, Record<string, number>>;
    executedQueries?: Record<string, Executedquery>;
    content?: SlideGroup[] | Content[][] | OutgoingMessage[] | IncomingMessage[] | Record<string, Record<string, CpanelRow[]>>;
}
const emptyTotals = {} as Record<string, number>;

const filterCommsByDeepLinkTreeIds = <T extends { id: number }>(messages: T[]): T[] => {
    if (typeof window === 'undefined') return messages;
    const treeIds = getDeepLinkTreeIds(resolveViewerDeepLinkSearch(window.location.search));
    const allowedIds = new Set(Object.values(treeIds));
    if (allowedIds.size === 0) return messages;
    return messages.filter((message) => allowedIds.has(message.id));
};

interface validateThenDispatchPayload {
    query: Record<string, Record<string, Executedquery>>;
    fetchSequence?: FetchDataPayload['fetchSequence'];
    response: FetchedData;
    dispatch: Dispatch;
    state: RootState;
    curApp: number;
    requestId?: string;
}

export const validateThenDispatch = ({
    response,
    query,
    dispatch,
    curApp,
    state,
    fetchSequence,
    requestId
}: validateThenDispatchPayload): void => {
    const {
        session: { curMailer },
        pagination: { selectedRoutes },
        course: { banners: courseBanners, selected: courseSelected },
        quiz: { quizzes, banners: quizBanners, selected: quizSelected },
        tutorial: { banners: tutorialBanners, selected: tutorialSelected },
    } = state;

    const statsState: StatsMiddlewareState = {
        search: { selectedRoute: emptySelectedRoute },
        session: { curApp, curMailer },
        pagination: { selectedRoutes },
        course: { selected: courseSelected, banners: courseBanners },
        quiz: { selected: quizSelected, banners: quizBanners, quizzes },
        tutorial: { selected: tutorialSelected, banners: tutorialBanners },
    }
    const { content, counts, totals } = response;
    const routeReasons: string[] = [];
    let abortRemainingFetchSequence = false;

    if (content && Array.isArray(content) && content.length > 0) {
        if (isArrayOfType(content, isOutgoingMessage)) {
            console.log("is_outgoing_response");
            const filtered = filterCommsByDeepLinkTreeIds(content);
            dispatch(setOutgoings(filtered));
            applyInsertStats(dispatch, { screen: 'outgoing', query, counts, totals: totals ?? emptyTotals, state: statsState, requestId });
        }
        else if (isArrayOfType(content, isIncomingMessage)) {
            console.log("is_incoming_response");
            dispatch(setIncomings(filterCommsByDeepLinkTreeIds(content)));
            applyInsertStats(dispatch, { screen: 'incoming', query, counts, totals: totals ?? emptyTotals, state: statsState, requestId });
        }

    } else {
        console.log("is_empty_response");
        if (routeReasons.length > 0) logGuardInvalidReasons(`has_route_slice_data_${getCurAppName(curApp)}`, routeReasons, response);
        applyInsertStats(dispatch, { screen: getCurAppName(curApp), query, counts, totals: totals ?? emptyTotals, state: statsState, requestId });
        if (fetchSequence && routeReasons.length > 0) abortRemainingFetchSequence = true;
    }

    if (abortRemainingFetchSequence) abortFetchSequence();

    const isLastFetchInSequence =
        !fetchSequence || fetchSequence.index >= fetchSequence.total - 1;
    if (isLastFetchInSequence || abortRemainingFetchSequence) dispatch(viewRequestFetching(false));

}




const isArrayOfType = <T>(arr: unknown[], typeGuard: (item: unknown) => item is T): arr is T[] => {
    return Array.isArray(arr) && arr.every((item) => typeGuard(item));
};


const isOutgoingMessage = (item: unknown): item is OutgoingMessage => {
    if (typeof item !== 'object' || item === null) return false;
    const o = item as Record<string, unknown>;
    // OutgoingMessage has mailer as undefined (not present), no email, status as object
    return typeof o.status === 'object' &&
        typeof o.mailer === 'undefined' &&
        !('email' in o);
};

const isIncomingMessage = (item: unknown): item is IncomingMessage => {
    if (typeof item !== 'object' || item === null) return false;
    const o = item as Record<string, unknown>;
    // IncomingMessage has mailer as number, no email, status as object
    return typeof o.status === 'object' &&
        typeof o.mailer === 'number' &&
        !('email' in o);
};

const logGuardInvalidReasons = (guardName: string, reasons: string[], response: unknown) => {
    if (reasons.length === 0) return;
    const keys =
        typeof response === 'object' && response !== null
            ? Object.keys(response as Record<string, unknown>).slice(0, 20)
            : [];
    console.log(`${guardName}: invalid`, { reasons, keys });
};






