import { authenticate } from '../../library/Thunks';
import {
  updateCourses,
  updateQuizzes,
  updateSteps,
  updateTutorials,
  UpdatePayload,
} from '../../library/actions';
import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { signedOut } from '../slices/sessionSlice';


export interface Handler {
  id: number;
  keyword: string;
}

export interface ErrorState {
  errors: string[];
  showCount: number;
  warnings: string[];
  shortcuts: string[];
  handles: Record<string, Handler[]>;
}

const initialErrors: ErrorState = {
  errors: [],
  handles: {},
  warnings: [],
  showCount: 0,
  shortcuts: [],
};

const splitter = (payload: string | null) => {
  const splits = payload?.split(/\//);
  if (splits?.length && splits.length > 1) console.log(payload);
  return splits?.[splits.length - 1];
};

const remDuplPred = (previous: Record<string, Handler>, cur: Handler) => ({
  ...previous,
  [cur.id]: cur,
});

const keywordMerger = (payload: UpdatePayload[]) => (row: Draft<Handler>) => {
  const update = payload.find(({ id }) => id === row.id);
  if (update?.title) return { ...row, keyword: update.title };
  return row;
};

const updateHandleKeywords = (
  state: Draft<ErrorState>,
  handlesKey: string,
  payload: UpdatePayload[],
) => {
  const curHandles = state.handles[handlesKey] ?? [];
  if (curHandles.length === 0) return;
  const newHandles = curHandles.map(keywordMerger(payload));
  state.handles = { ...state.handles, [handlesKey]: newHandles };
};

const INSTRUCTION_HANDLES_KEYS = ['handlesBosses', 'handlesMinions', 'handlesUnderbosses'] as const;

const updateInstructionHandleKeywords = (
  state: Draft<ErrorState>,
  payload: UpdatePayload[],
) => {
  for (const handlesKey of INSTRUCTION_HANDLES_KEYS) {
    updateHandleKeywords(state, handlesKey, payload);
  }
};

export const errorSlice = createSlice({
  name: 'error',
  initialState: initialErrors,
  reducers: {
    fetchedHandles: (state, action: PayloadAction<Record<string, Handler[]>>) => {
      const { handles } = state;
      const newHandles = Object.entries(action.payload ?? {})
        .map(([route, arr]) => {
          const curHandles = handles[route] ?? [];
          const uniques = [...curHandles, ...arr].reduce(remDuplPred, {});
          return [route, Object.values(uniques)] as [string, Handler[]];
        })
        .reduce((prev, [route, arr]) => ({ ...prev, [route]: arr }), handles);
      state.handles = newHandles;
    },
    prependError: (state, action: PayloadAction<string | null>) => {
      const message: string = splitter(action.payload) ?? 'ooops, something went wrong';
      if (action.payload) {
        state.showCount += 1;
        state.errors = [message, ...state.errors];
      } else {
        state.showCount += 1;
      }
    },
    prependWarning: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        state.showCount += 1;
        state.warnings = [action.payload, ...state.warnings];
      } else {
        state.showCount += 1;
      }
    },
    removeError: (state, action: PayloadAction<number>) => {
      if (action.payload < state.errors.length) {
        const index = action.payload;
        const newState = state.errors.filter((_, i) => i !== index);
        state.showCount = newState.length > 0 ? state.showCount : 0;
        state.errors = newState;
      }
      else {
        const index = action.payload - state.errors.length;
        const newState = state.warnings.filter((_, i) => i !== index);
        state.showCount = newState.length > 0 ? state.showCount : 0;
        state.warnings = newState;
      }
    },
    clearOnlyErrors: (state: ErrorState) => {
      state.errors = [];
    },
    clearOnlyWarnings: (state: ErrorState) => {
      state.warnings = [];
    },
    appendShortcut: (state, action: PayloadAction<string>) => {
      state.shortcuts = [...state.shortcuts, action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signedOut, () => {
        console.log("cleared_errors");
        return initialErrors;
      })
      .addCase(updateTutorials, (state, action) => {
        updateHandleKeywords(state, 'handlesFilters', action.payload);
      })
      .addCase(updateCourses, (state, action) => {
        updateHandleKeywords(state, 'handlesSifters', action.payload);
      })
      .addCase(updateQuizzes, (state, action) => {
        updateHandleKeywords(state, 'handlesDashboards', action.payload);
      })
      .addCase(updateSteps, (state, action) => {
        updateInstructionHandleKeywords(state, action.payload);
      })
      .addCase(authenticate.rejected, (state, action) => {
        return errorSlice.caseReducers.prependError(state, { ...action, payload: action.payload as string });
      })
  }
});

export const {
  fetchedHandles,
  prependError,
  prependWarning,
  removeError,
  clearOnlyErrors,
  clearOnlyWarnings,
  appendShortcut,
} = errorSlice.actions;

export default errorSlice.reducer;
