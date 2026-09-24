import { jwtDecode } from "jwt-decode";
import { getCurAppIndex, signOut, userroles, timeout, getGraphqlResolver, ToolKit } from "../utils";
import { resolveViewerDeepLinkSearch } from "../loadingRouteUtils";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { EntityTypeMap, ResultPayload, clearData as clearReducers } from "../store/slices/rowSlice";
import { enqueueHydrationStoreUpdate } from "./hydrationPayloadBuffer";
import { markHydrationAttemptedSeekIds, onHydrationQueryComplete, onHydrationSessionIdle } from "./hydrationQueue";
import {
    buildEmptyImageHydrationCollapseUpdates,
    partitionImageHydrationRows,
} from "./imageHydrationCollapseUtils";
import { mediaHydration } from "./actions";
import { InitializedLoadingPayload } from "../store/slices/sessionSlice";
import { CustomJwtPayload, AuthPayload } from "./types";
import { RootState } from "../store";
import { FetchDataPayload, Executedquery, validateThenDispatch, getAccountRecords, getAnonymousRecords } from "./ThunksUtils";
import { resetAppliedRouterSelections } from "../Hooks/useShortcuts";

export const authenticate = createAsyncThunk<InitializedLoadingPayload, AuthPayload, { rejectValue: string }>(
    'authenticate',
    async (payload: AuthPayload, { rejectWithValue, dispatch }) => {
        const {
            email,
            password,
            seconds = 0,
            selectedRole,
        } = payload;
        const variables = { password, username: email, seconds };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(ToolKit.accountLoginUrl, {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variables),
                method: 'POST',
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            let token: string;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                throw new Error('expected text but got json' + await response.json());
            } else {
                token = await response.text();
            }
            clearTimeout(timeoutId);
            const looksLikeToken = token.indexOf(".") > -1;
            if (looksLikeToken) {
                const { roles, quota, userid, roleIds, sub: username } = jwtDecode<CustomJwtPayload>(token);
                const baseRoleIndex = userroles.findIndex((r: string) => roles.includes(r));
                const roleIndex = roles.findIndex((r: string) => r === userroles[baseRoleIndex]);
                console.log("authenticate_roles", roles);
                dispatch(clearReducers());
                dispatch({ type: signOut() });
                resetAppliedRouterSelections();
                const session = {
                    quota,
                    roles,
                    userid,
                    roleIds,
                    username,
                    roleIndex,
                    curToken: token,
                    fetchRole: roles[roleIndex],
                    mutateRole: roles[roleIndex],
                    authenticated: looksLikeToken,
                    curMailer: roleIds[roleIndex],
                    isIncognito: false,
                    isPrivate: true,
                };
                const fetchRoleIndex = roles.findIndex((r: string) => r === selectedRole);
                if (fetchRoleIndex > -1) {
                    return {
                        ...session,
                        roleIndex: fetchRoleIndex,
                        fetchRole: roles[fetchRoleIndex],
                        mutateRole: roles[fetchRoleIndex],
                    };
                }
                return session;
            } else {
                throw new Error(token);
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                return rejectWithValue(`Request timeout: Authentication failed after ${timeout}ms`);
            }
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('An unknown error occurred');
        }
    }
);

export type DehydratedRowsFetchArg = {
    fetcher: () => Promise<ResultPayload>;
    hydrationSeekIds?: number[];
    skipQueueLifecycle?: boolean;
};

export const deHydratedRowsDataFetcher = createAsyncThunk<void, DehydratedRowsFetchArg, { rejectValue: string; state: RootState }>(
    'row/untabledDataFetcher',
    async ({ fetcher, hydrationSeekIds, skipQueueLifecycle }, { rejectWithValue, dispatch, getState }) => {
        let settleError: string | undefined;
        try {
            const { payload: data, parent: fromEntity, entity: toEntity, isAppend, keywords } = await fetcher();
            const { graphqlResolver, to, from } = getGraphqlResolver(fromEntity ?? '', toEntity ?? '');
            const corData = data['records'][graphqlResolver];
            const rowsKey = to.toLowerCase();
            const rawRows = corData[rowsKey];
            const rowsPayload = Array.isArray(rawRows) ? rawRows : [];

            // Image hydration: only forward rows with real media; collapse empty misses
            // to bare sentinels so mime-only slots are not re-queued forever.
            if (skipQueueLifecycle && hydrationSeekIds?.length) {
                const { hydratedRows, collapseSeekIds } = partitionImageHydrationRows(
                    hydrationSeekIds,
                    rowsPayload,
                );

                if (hydratedRows.length > 0) {
                    enqueueHydrationStoreUpdate({
                        rows: {
                            entity: toEntity as keyof EntityTypeMap,
                            payload: hydratedRows,
                            parent: fromEntity,
                            keywords,
                            isAppend,
                        },
                        metadata: {
                            dest: to,
                            orig: from,
                            data: corData[from],
                            interaction: true,
                        },
                    });
                }

                const collapseUpdates = buildEmptyImageHydrationCollapseUpdates(
                    collapseSeekIds,
                    getState(),
                );
                if (collapseUpdates.length > 0) {
                    dispatch(mediaHydration(collapseUpdates));
                }
                return;
            }

            enqueueHydrationStoreUpdate({
                rows: {
                    entity: toEntity as keyof EntityTypeMap,
                    payload: rowsPayload,
                    parent: fromEntity,
                    keywords,
                    isAppend,
                },
                metadata: {
                    dest: to,
                    orig: from,
                    data: corData[from],
                    interaction: true,
                },
            });
        }
        catch (error) {
            settleError = error instanceof Error ? error.message : 'An unknown error occurred';
            return rejectWithValue(settleError);
        }
        finally {
            if (hydrationSeekIds?.length) {
                markHydrationAttemptedSeekIds(hydrationSeekIds);
            }
            if (!skipQueueLifecycle) {
                onHydrationQueryComplete(dispatch, settleError);
                onHydrationSessionIdle(dispatch, getState);
            }
        }
    }
);


export const fetchData = createAsyncThunk<
    Record<string, Executedquery>,
    FetchDataPayload,
    { rejectValue: string }
>(
    'fetchData',
    async (payload: FetchDataPayload, { rejectWithValue, getState, dispatch }) => {
        const state = getState() as RootState;
        const { convolution, webapp, requestTake: payloadTake, queriesOverride } = payload;
        const search = payload.search === null ? null : resolveViewerDeepLinkSearch(payload.search);
        const {
            isUnzipCourses,
            isUnzipTutorials,
            isUnzipQuizzes,
        } = state.settings;
        const {
            curApp,
            curToken,
            fetchRole,
            isIncognito,
            defaultTake,
            curMailer: mailer,
        } = state.session;
        const args = {
            curApp,
            isUnzipCourses,
            isUnzipTutorials,
            isUnzipQuizzes,
            convolution,
            webapp,
        };
        const [unzippedApp, unzippedAppName, unzippedAppConvolution] = getUnzippedApp(args);
        try {
            const isAccount = !isIncognito && curToken;
            const requestTake = payloadTake ?? defaultTake;
            const params = isAccount
                ? {
                    state,
                    search,
                    mailer,
                    curToken,
                    isPrivate: true,
                    fetchRole,
                    curApp: unzippedApp,
                    requestTake,
                    queriesOverride,
                    convolution: unzippedAppName,
                    formatter: unzippedAppConvolution,
                    counts:  {},
                    executedQueries: {},
                    path: ToolKit.authenticatedRecordsUrl,
                }
                : {
                    state,
                    search,
                    curApp: unzippedApp,
                    requestTake,
                    queriesOverride,
                    convolution: unzippedAppName,
                    formatter: unzippedAppConvolution,
                    counts: {},
                    executedQueries: {},
                    path: ToolKit.anonymousRecordsUrl,
                };

            console.log("recordsHook_fired");
            const content = isAccount
                ? await getAccountRecords(params)
                : await getAnonymousRecords(params);
            const { executedQueries: query, ...fetchedData } = content ?? { counts: {} };
            validateThenDispatch({
                response: fetchedData,
                curApp: unzippedApp,
                dispatch,
            });
            console.log(content);
            return query || {};
        } catch (error) {
            if (error instanceof Error) return rejectWithValue(error.message);
            return rejectWithValue('An unknown error occurred while fetching data');
        }
    }
);

type UnzipFetchArgs = {
    curApp: number;
    webapp: string;
    convolution: string;
    isUnzipCourses: boolean;
    isUnzipQuizzes: boolean;
    isUnzipTutorials: boolean;
};

export const setCurPage = (_page: number) => { };
const getUnzippedApp = (args: UnzipFetchArgs): [number, string, string] => {
    const {
        curApp,
        webapp,
        convolution,
        isUnzipCourses,
        isUnzipTutorials,
        isUnzipQuizzes,
    } = args;
    const _webapp = webapp.toLowerCase();
    const remapToSession =
        _webapp === 'session'
        || (_webapp === 'tutorial' && isUnzipTutorials)
        || (_webapp === 'course' && isUnzipCourses)
        || (_webapp === 'quiz' && isUnzipQuizzes);
    if (remapToSession) {
        const [index] = getCurAppIndex('session');
        return [parseInt(index ?? '7'), 'session', 'session'];
    }
    return [curApp, webapp, convolution];
}
