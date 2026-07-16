import { Tree, getCurAppIndex, getCurAppName, orderedWebappRoutes } from '../../utils';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearEscrow } from './viewSlice';
import { hydrateData } from '../../library/actions';
import { clearData } from './rowSlice';
import { authenticate, deHydratedRowsDataFetcher, fetchData } from '../../library/Thunks';
import { DataRow } from '../../types/cpanel';
import { resolveAppIndexFromExecutedQueryRoutes } from '../../library/ThunksUtils';
import { ParentData } from './viewSlice';

export interface SessionState {
  curApp: number;
  curMailer: number;
  curRoutes: string[];
  isPrivate: boolean;
  isAppend: boolean;
  isFetching: boolean;
  defaultTake: number;
  hydrationQueries: number;
  roleIndex: number;
  isIncognito: boolean;
  showShortcuts: boolean;
  authenticated: boolean;
  pauseFetchers: boolean;
  curToken: string | null;
  fetchRole: string | null;
  username: string | undefined;
  showRolesToggler: boolean;
  selectedTraversal: number;
  userid: number | undefined;
  roles: string[] | undefined;
  roleIds: number[] | undefined;
  /** When true for an app index, fetchData ignores cached counts/queries and fetches fresh. */
  isCleared: Record<string, boolean>;
  singleItemForms?: Record<string, boolean>;
  allowMimeOnlyImageurlOverrideOnUpdateSteps: boolean;
}

const getCurRoutes = (app: string) => orderedWebappRoutes(Tree.entities, app);
const initialCleared = { [1]: true, [2]: true, [3]: true, [4]: true, [5]: true, [6]: true, };
const initialState: SessionState = {
  isCleared: initialCleared,
  hydrationQueries: 0,
  userid: undefined,
  curApp: 1,
  curMailer: -1,
  roleIds: undefined,
  showShortcuts: true,
  curRoutes: [],
  showRolesToggler: false,
  pauseFetchers: true,
  selectedTraversal: 0,
  roles: undefined,
  fetchRole: null,
  isPrivate: false,
  isAppend: true,
  curToken: null,
  isFetching: true,
  isIncognito: true,
  username: undefined,
  authenticated: false,
  defaultTake: 1,
  roleIndex: -1,
  allowMimeOnlyImageurlOverrideOnUpdateSteps: false,
};

let loginAttempts = -2;

export interface InitializedLoadingPayload extends Partial<SessionState> {
  urlData?: string;
  rootIDS?: string[];
  operation?: string;
  isExtractAlgo?: boolean;
  parentData?: ParentData;
  insertedRows?: DataRow[];
}

const updateCurRoutes = (curApp: number): { curRoutes: string[]; curApp: number } => {
  const curRoutes = getCurRoutes(getCurAppName(curApp));
  return { curRoutes, curApp };
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    resetHydrationQueries: (state) => {
      state.hydrationQueries = 0;
    },
    initializedLoading: (state, action: PayloadAction<InitializedLoadingPayload>) => {
      const newRoleIndex =
        action.payload.fetchRole && state.roles
          ? state.roles.findIndex((role) => role === action.payload.fetchRole)
          : action.payload.roleIndex ?? state.roleIndex;
      if (action.payload?.parentData?.curApp && action.payload.parentData.curApp !== state.curApp) {
        const { curRoutes, curApp } = updateCurRoutes(action.payload.parentData.curApp);
        state.curRoutes = curRoutes;
        state.curApp = curApp;
      }
      const previousDefaultTake = state.defaultTake;
      (Object.keys(action.payload) as Array<keyof InitializedLoadingPayload>).forEach((key) => {
        const value = action.payload[key];
        if (value !== null && value !== undefined) state[key] = value;
      });
      if (state.defaultTake !== previousDefaultTake) {
        state.isCleared = initialCleared;
      }
      state.roleIndex = newRoleIndex;
    },
    mutateCurApp: (state, action: PayloadAction<string>) => {
      const userApp = getCurAppIndex(action.payload);
      if (userApp.length === 2) {
        const [index, appname] = userApp;
        state.curApp = parseInt(index);
        state.curRoutes = getCurRoutes(appname.toLowerCase());
      }
      else console.log("unknown app ==>", action.payload);
    },
    signedOut: (state) => {
      const { isAppend } = state;
      state.isCleared = initialCleared;
      state.userid = undefined;
      state.curMailer = -1;
      state.roleIds = undefined;
      state.showShortcuts = true;
      state.showRolesToggler = false;
      state.pauseFetchers = true;
      state.selectedTraversal = 0;
      state.roles = undefined;
      state.fetchRole = null;
      state.isPrivate = false;
      state.isAppend = !isAppend;
      state.curToken = null;
      state.isFetching = true;
      state.isIncognito = true;
      state.username = undefined;
      state.authenticated = false;
      state.defaultTake = 1;
      state.roleIndex = -1;
      state.allowMimeOnlyImageurlOverrideOnUpdateSteps = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearEscrow, (state) => {
        console.log('clear_Session_Url');
      })
      .addCase(clearData, (state) => {
        console.log('clear_Session');
      })
      .addCase(authenticate.pending, (state) => {
        console.log("authenticate.pending");
        state.isFetching = true;
      })
      .addCase(authenticate.fulfilled, (state, action) => {
        console.log("authenticate.fulfilled");
        return sessionSlice.caseReducers.initializedLoading(state, action);
      })
      .addCase(authenticate.rejected, (state) => {
        console.log("authenticate.rejected");
        return sessionSlice.caseReducers.initializedLoading(state, {
          type: initializedLoading.type,
          payload: { roleIndex: loginAttempts-- }
        });
      })
      .addCase(hydrateData, (state, action) => {
        state.hydrationQueries += action.payload;
        state.allowMimeOnlyImageurlOverrideOnUpdateSteps = false;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        const { webapp, isMinimumFeatureMode } = action.meta.arg;
        const curApp = isMinimumFeatureMode
          ? resolveAppIndexFromExecutedQueryRoutes(action.payload) ?? getCurAppIndex(webapp)[0]
          : getCurAppIndex(webapp)[0];
        if (curApp) state.isCleared[curApp] = false;
      })
      .addCase(deHydratedRowsDataFetcher.pending, (state) => {
        state.allowMimeOnlyImageurlOverrideOnUpdateSteps = false;
      })
      .addCase(deHydratedRowsDataFetcher.fulfilled, (state) => {
        if (state.hydrationQueries > 0) state.hydrationQueries -= 1;
      })
      .addCase(deHydratedRowsDataFetcher.rejected, (state) => {
        if (state.hydrationQueries > 0) state.hydrationQueries -= 1;
      });
  }
});

export const {
  resetHydrationQueries,
  initializedLoading,
  mutateCurApp,
  signedOut,
} = sessionSlice.actions;

export default sessionSlice.reducer; 