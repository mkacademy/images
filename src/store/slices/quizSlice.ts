import { signedOut } from './sessionSlice';
import type {
  QuizState,
  SetQuizzesPayload,
} from '../../library/QuizUtils';
import {
  applyCourseReducer,
  applySetQuizzes,
  recomputeFollowupCombinations,
} from '../../library/QuizUtils';

export type {
  Attempt,
  Quiz,
  QuizState,
  SetQuizzesPayload,
  Submition,
} from '../../library/QuizUtils';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  textsMerger,
} from '../../library/sliceUtils';
import {
  updateQuizzes,
  updateCourses,
  updateTutorials,
  updateSteps,
  updateQuestionsMetadata,
  updateQuizMetadata,
  updatePennantsMetadata,
  updateCoversMetadata,
  updateStepsMetadata,
  updateAnswersMetadata,
} from '../../library/actions';
const initialState: QuizState = {
  followupCombinations: {},
  followupId: undefined,
  routeToggleGreenIds: {},
  routeToggleOrangeMarks: [],
  routeTogglePrimarySide: null,
  combinations: [],
  noQuizzes: true,
  selected: -1,
  content: [],
  banners: [],
  quizzes: [],
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    toggleQuiz: (state, action: PayloadAction<{ selectedId?: number, canToggle?: boolean }>) => {
      const { selectedId, canToggle = true } = action.payload;
      const index = state.quizzes.findIndex(({ id }) => id === selectedId);
      if (canToggle && state.selected === index) {
        state.selected = -1;
      } else state.selected = index;
    },
    setSelected: (state, action: PayloadAction<number>) => {
      if (action.payload >= -1) state.selected = action.payload;
    },
    setFollowupId: (state, action: PayloadAction<number | undefined>) => {
      state.followupId = action.payload;
      recomputeFollowupCombinations(state);
    },
    setRouteToggleMarks: (
      state,
      action: PayloadAction<{
        greenIds: QuizState['routeToggleGreenIds'];
        orangeMarks: QuizState['routeToggleOrangeMarks'];
        primarySide: QuizState['routeTogglePrimarySide'];
      }>,
    ) => {
      state.routeToggleGreenIds = action.payload.greenIds;
      state.routeToggleOrangeMarks = action.payload.orangeMarks;
      state.routeTogglePrimarySide = action.payload.primarySide;
    },
    clearRouteToggleMarks: (state) => {
      state.routeToggleGreenIds = {};
      state.routeToggleOrangeMarks = [];
      state.routeTogglePrimarySide = null;
    },
    setQuizzes: (state, action: PayloadAction<SetQuizzesPayload>) => {
      applySetQuizzes(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signedOut, () => initialState)
      .addCase(updateQuizzes, (state, action) => {
        const { quizzes } = state;
        const nState = quizzes.map(quiz => ({
          ...quiz,
          ...textsMerger(action.payload)(quiz)
        }));
        state.quizzes = nState;
      })
      .addCase(updateTutorials, (state, action) => {
        // Update quizzes (quiz-specific logic)
        const { quizzes } = state;
        const nState = quizzes.map(({ pennants, ...fields }) => ({
          pennants: pennants.map(pennant => ({
            ...pennant,
            ...textsMerger(action.payload)(pennant)
          })),
          ...fields,
        }));
        state.quizzes = nState;
        // Update banners using courseReducer
        const { banners } = applyCourseReducer(state, action);
        state.banners = banners || state.banners;
      })
      .addCase(updateCourses, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        state.banners = banners || state.banners;
      })
      .addCase(updateSteps, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        state.content = content || state.content;
      })
      .addCase(updateQuizMetadata, (state, action) => {
        const { quizzes } = state;
        const nState = quizzes.map(quiz => ({
          ...quiz,
          ...(action.payload.find(({ id }) => id === quiz.id) ?? {}),
        }));
        state.quizzes = nState;
      })
      .addCase(updateAnswersMetadata, (state, action) => {
        const { quizzes } = state;
        const nState = quizzes.map(quiz => ({
          ...quiz,
          pennants: quiz.pennants.map(pennant => ({
            ...pennant,
            ...(action.payload.find(({ id }) => id === pennant.id) ?? {}),
          })),
        }));
        state.quizzes = nState;
      })
      .addCase(updateQuestionsMetadata, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        if (banners) state.banners = banners;
      })
      .addCase(updatePennantsMetadata, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        if (banners) state.banners = banners;
      })
      .addCase(updateCoversMetadata, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
      .addCase(updateStepsMetadata, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
  },
});

export const {
  toggleQuiz,
  setQuizzes,
  setSelected,
  setFollowupId,
  setRouteToggleMarks,
  clearRouteToggleMarks,
} = quizSlice.actions;

export default quizSlice.reducer; 