import { jwtDecode } from "jwt-decode";
import { getCurAppIndex, getSimplePageIndexFromSearch, signOut, userroles, timeout, getConvSearch, getGraphqlResolver, redirectUrl, ToolKit, RECORDS } from "../utils";
import { resolveViewerDeepLinkSearch } from "../loadingRouteUtils";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { EntityTypeMap, ResultPayload, clearData as clearReducers } from "../store/slices/rowSlice";
import { clearEscrow } from "../store/slices/viewSlice";
import { enqueueHydrationStoreUpdate } from "./hydrationPayloadBuffer";
import { markHydrationAttemptedSeekIds, onHydrationQueryComplete, onHydrationSessionIdle } from "./hydrationQueue";
import { InitializedLoadingPayload } from "../store/slices/sessionSlice";
import { CustomJwtPayload, AuthPayload } from "./types";
import { RootState } from "../store";
import { FetchDataPayload, Executedquery, validateThenDispatch, buildRecordStateProps, extractIDsAtRequest, getAccountRecords, getAnonymousRecords } from "./ThunksUtils";
import { clearIDsAtRequest, registerIDsAtRequest } from "../store/slices/statsSlice";


export const authenticate = createAsyncThunk<InitializedLoadingPayload, AuthPayload, { rejectValue: string }>(
    'authenticate',
    async (payload: AuthPayload, { rejectWithValue, dispatch, getState }) => {
        const state = getState() as RootState;
        const { pauseFetchers } = state.session;
        const {
            email,
            password,
            seconds = 0,
            ingredients,
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
                dispatch(clearEscrow());
                dispatch({ type: signOut(pauseFetchers) });
                redirectUrl(ingredients);
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
            const corData = data[RECORDS][graphqlResolver];
            enqueueHydrationStoreUpdate({
                rows: {
                    entity: toEntity as keyof EntityTypeMap,
                    payload: corData[to.toLowerCase()],
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
                onHydrationQueryComplete(dispatch, getState, settleError);
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
    async (payload: FetchDataPayload, { rejectWithValue, getState, dispatch, requestId }) => {
        const state = getState() as RootState;
        const { counts, executedQueries: inputsPayloads } = state.stats;
        const { convolution, webapp, fetchSequence } = payload;
        const search = resolveViewerDeepLinkSearch(payload.search);
        const {
            isUnzipCourses,
            isUnzipTutorials,
            isUnzipQuizzes,
            unzipCoursesType,
            unzipTutorialsType,
            unzipQuizzesType,
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
            unzipCoursesType,
            unzipTutorialsType,
            unzipQuizzesType,
            fetchSequence,
            convolution,
            webapp,
            search,
        };
        const [unzippedApp, unzippedAppName, unzippedAppConvolution] = getUnzippedApp(args);
        const _inputsPayloads = setSkipOnExecutedQueries(args, defaultTake, inputsPayloads);
        const recordStateProps = buildRecordStateProps(state, unzippedApp);
        dispatch(registerIDsAtRequest({ requestId, ids: extractIDsAtRequest(recordStateProps) }));
        try {
            const isAccount = !isIncognito && curToken;
            const params = isAccount
                ? {
                    state,
                    search,
                    mailer,
                    curToken,
                    isPrivate: true,
                    fetchRole,
                    curApp: unzippedApp,
                    requestTake: defaultTake,
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
                    requestTake: defaultTake,
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
                fetchSequence: payload.fetchSequence,
                response: fetchedData,
                curApp: unzippedApp,
                dispatch,
                query,
                state,
                requestId,
            });
            dispatch(clearIDsAtRequest(requestId));
            console.log(content);
            return query || {};
        } catch (error) {
            if (error instanceof Error) return rejectWithValue(error.message);
            return rejectWithValue('An unknown error occurred while fetching data');
        }
    }
);

/** Mirrors `getUnzippedApp` unzip branches: enabled + one of incoming/outgoing/both. */
const isUnzipTypeActive = (isUnzip: boolean, unzipType: string): boolean =>
    isUnzip &&
    (unzipType === 'incoming_and_outgoing' ||
        unzipType === 'incoming' ||
        unzipType === 'outgoing');

type UnzipFetchArgs = {
    curApp: number;
    webapp: string;
    search: string;
    convolution: string;
    isUnzipCourses: boolean;
    isUnzipQuizzes: boolean;
    isUnzipTutorials: boolean;
    unzipCoursesType: string;
    unzipTutorialsType: string;
    unzipQuizzesType: string;
    fetchSequence?: { index: number; total: number };
};

let curskip = 0;
export const getCurSkip = () => curskip;
const setSkipOnExecutedQueries = (
    args: UnzipFetchArgs,
    defaultTake: number,
    inputsPayloads: Record<string, Record<string, Executedquery>>
): Record<string, Record<string, Executedquery>> => {
    const { webapp, search, fetchSequence } = args;
    const w = webapp.toLowerCase();
    const applies =
        (w === 'course' && isUnzipTypeActive(args.isUnzipCourses, args.unzipCoursesType)) ||
        (w === 'tutorial' && isUnzipTypeActive(args.isUnzipTutorials, args.unzipTutorialsType)) ||
        (w === 'quiz' && isUnzipTypeActive(args.isUnzipQuizzes, args.unzipQuizzesType));
    if (fetchSequence || !applies) {
        const searchRoutes = getConvSearch(search);
        if (!searchRoutes || Object.keys(searchRoutes).length === 0)
            return inputsPayloads;

        const out: Record<string, Record<string, Executedquery>> = {};
        for (const [outerKey, inner] of Object.entries(inputsPayloads)) {
            out[outerKey] = {};
            for (const [innerKey, q] of Object.entries(inner))
                out[outerKey][innerKey] = { ...q };
        }

        for (const [route, csEntry] of Object.entries(searchRoutes)) {
            if (!csEntry || typeof csEntry !== 'object' || !('skip' in csEntry)) continue;
            const skip = (csEntry as { skip: number }).skip;
            const queryKey = route + RECORDS;
            for (const outerKey of Object.keys(out)) {
                if (out[outerKey][queryKey])
                    out[outerKey][queryKey] = { ...out[outerKey][queryKey], skip };
            }
        }
        if (searchRoutes) console.log("conv_search", searchRoutes, out);
        return out;
    }
    else {
        curskip = getSimplePageIndexFromSearch(search);
        const skip = curskip * defaultTake;
        const out: Record<string, Record<string, Executedquery>> = {};
        for (const [outerKey, inner] of Object.entries(inputsPayloads)) {
            out[outerKey] = {};
            for (const [innerKey, q] of Object.entries(inner))
                out[outerKey][innerKey] = { ...q, skip };
        }
        if (curskip !== 0) console.log("simple_page", curskip, out);
        return out;
    }
};

let curPage = 0;
export const setCurPage = (page: number) => (curPage = page);
const getUnzippedApp = (args: UnzipFetchArgs): [number, string, string] => {
    const {
        curApp,
        webapp,
        convolution,
        fetchSequence,
        isUnzipCourses,
        isUnzipTutorials,
        isUnzipQuizzes,
        unzipCoursesType,
        unzipTutorialsType,
        unzipQuizzesType,
    } = args;
    const _webapp = webapp.toLowerCase();
    if (fetchSequence) return [curApp, webapp, convolution];
    switch (_webapp) {

        case 'course': {
            if (isUnzipCourses && unzipCoursesType === "incoming_and_outgoing") {
                const _app = curPage % 2 === 0 ? (curPage++, "outgoing") : (curPage++, "incoming");
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            if (isUnzipCourses && unzipCoursesType === "incoming") {
                curPage++;
                const _app = "incoming";
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            if (isUnzipCourses && unzipCoursesType === "outgoing") {
                curPage++;
                const _app = "outgoing";
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            return [curApp, webapp, convolution];
        }
        case 'tutorial': {
            if (isUnzipTutorials && unzipTutorialsType === "incoming_and_outgoing") {
                const _app = curPage % 2 === 0 ? (curPage++, "outgoing") : (curPage++, "incoming");
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            if (isUnzipTutorials && unzipTutorialsType === "incoming") {
                curPage++;
                const _app = "incoming";
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            if (isUnzipTutorials && unzipTutorialsType === "outgoing") {
                curPage++;
                const _app = "outgoing";
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            return [curApp, webapp, convolution];
        }
        case 'quiz': {
            if (isUnzipQuizzes && unzipQuizzesType === "incoming_and_outgoing") {
                const _app = curPage % 2 === 0 ? (curPage++, "outgoing") : (curPage++, "incoming");
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            if (isUnzipQuizzes && unzipQuizzesType === "incoming") {
                curPage++;
                const _app = "incoming";
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            if (isUnzipQuizzes && unzipQuizzesType === "outgoing") {
                curPage++;
                const _app = "outgoing";
                const [index, _] = getCurAppIndex(_app)
                const _a = index ?? curApp.toString();
                return [parseInt(_a), _app, _app];
            }
            return [curApp, webapp, convolution];
        }
        default:
            return [curApp, webapp, convolution];
    }
}
