import { signedOut } from './sessionSlice';
import type {
  dismissAttemptPayload,
  dismissFollowupOptionPayload,
  dismissFollowupPayload,
  dismissOptionPayload,
  dismissQuestionPayload,
  dismissQuizPayload,
  dismissChoicePayload,
  Quiz,
  QuizState,
  QuizStartId,
  SetQuizzesPayload,
} from '../../library/QuizUtils';
import {
  applyClearSelectedQuizBranches,
  applyCourseReducer,
  applyDismissFollowupOption,
  applyDismissQuestion,
  applyDismissOption,
  applyDismissQuizToState,
  applyHighlightAttemptBreathSelection,
  applySetQuizzes,
  recomputeFollowupCombinations,
  createQuizStartIdInitial,
} from '../../library/QuizUtils';

export type {
  Attempt,
  dismissAttemptPayload,
  dismissFollowupOptionPayload,
  dismissFollowupPayload,
  dismissOptionPayload,
  dismissQuestionPayload,
  dismissQuizPayload,
  dismissChoicePayload,
  Quiz,
  QuizState,
  QuizStartId,
  SetQuizzesPayload,
  Submition,
} from '../../library/QuizUtils';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  highlightCoversBreathSelection,
  highlightSlideBreathSelection,
  highlightCourseBreathSelection,
  highlightPennantBreathSelection,
  clearSelected as clearCourseSelected,
} from './courseSlice';
import {
  textsMerger,
  orderPredicate,
} from '../../library/sliceUtils';
import { getChoices, getAttempts, getFocuses } from '../../library/quizAttemptManager';
import {
  updateQuizzes,
  updateQuizOrdinals,
  updatePennantsOrdinals,
  updateCoversOrdinals,
  updateStepsOrdinals,
  updateCourses,
  updateTutorials,
  erasePayload,
  updateSteps,
  updateQuestionsOrdinals,
  updateQuestionsMetadata,
  updateQuizMetadata,
  updatePennantsMetadata,
  updateCoversMetadata,
  updateStepsMetadata,
  updateAnswersMetadata,
} from '../../library/actions';
const initialState: QuizState = {
  startId: createQuizStartIdInitial(),
  followupCombinations: {},
  followupId: undefined,
  routeToggleGreenIds: {},
  routeToggleOrangeMarks: [],
  routeTogglePrimarySide: null,
  modifiedOrdinals: {},
  combinations: [],
  noQuizzes: true,
  selected: -1,
  content: [],
  banners: [],
  quizzes: [],
  attempt: {},
  focus: {},
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
    highlightAttemptBreathSelection: (state, action: PayloadAction<{ ids: (number | string)[]; isHighlighted?: boolean; isShow?: boolean }>) => {
      applyHighlightAttemptBreathSelection(state, action.payload, getChoices);
    },
    dismissQuestion: (state, action: PayloadAction<dismissQuestionPayload>) => {
      applyDismissQuestion(state, action.payload);
    },
    dismissOption: (state, action: PayloadAction<dismissOptionPayload>) => {
      applyDismissOption(state, action.payload.choice);
    },
    dismissFollowupOption: (state, action: PayloadAction<dismissFollowupOptionPayload>) => {
      applyDismissFollowupOption(state, action.payload.choice);
    },
    dismissQuiz: (state, action: PayloadAction<dismissQuizPayload>) => {
      applyDismissQuizToState(state, action.payload);
    },
    dismissChoice: (state, action: PayloadAction<dismissChoicePayload>) => {
      const { selected, quizzes } = state;
      if (selected <= -1) return;
      const { choice } = action.payload;
      const dismissedSubmission = Object.keys(choice || {}).pop();
      state.quizzes = quizzes.map(
        ({ pennants: submissions, ...q }) => ({
          ...q,
          pennants: submissions.map((sub) => {
            if (dismissedSubmission === undefined) return sub;
            const isMatch = getChoices(sub)[dismissedSubmission];
            return !isMatch ? sub : { ...sub, isDismissed: action.payload.isDismissed ?? !sub.isDismissed };
          }),
        })
      );
    },
    clearSelected: (state, action: PayloadAction<erasePayload>) => {
      applyClearSelectedQuizBranches(state, action.payload, getChoices);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signedOut, () => initialState)
      .addCase(clearCourseSelected, (state, action) => {
        if (action.payload.route === "dashboardssifters") {
          const { banners, content } = applyCourseReducer(state, action);
          state.banners = banners || state.banners;
          state.content = content || state.content;
        }
      })
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
        state.attempt = getAttempts(nState);
      })
      .addCase(updateCourses, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        state.banners = banners || state.banners;
      })
      .addCase(updateSteps, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        state.content = content || state.content;
      })
      .addCase(updateQuizOrdinals, (state, action) => {
        const { quizzes } = state;
        const nState = quizzes.map(quiz => ({
          ...quiz,
          ordinal: action.payload.find(({ id }) => id === quiz.id)?.ordinal ?? quiz.ordinal
        }));
        state.quizzes = nState.sort(orderPredicate);
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
      .addCase(updateQuestionsOrdinals, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        if (banners) state.banners = banners;
      })
      .addCase(updateQuestionsMetadata, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        if (banners) state.banners = banners;
      })
      .addCase(updatePennantsOrdinals, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        if (banners) state.banners = banners;
      })
      .addCase(updatePennantsMetadata, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        if (banners) state.banners = banners;
      })
      .addCase(updateCoversOrdinals, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
      .addCase(updateCoversMetadata, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
      .addCase(updateStepsOrdinals, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
      .addCase(updateStepsMetadata, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
      .addCase(highlightCourseBreathSelection, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
      .addCase(highlightSlideBreathSelection, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      })
      .addCase(highlightPennantBreathSelection, (state, action) => {
        const { banners } = applyCourseReducer(state, action);
        if (banners) state.banners = banners;
      })
      .addCase(highlightCoversBreathSelection, (state, action) => {
        const { content } = applyCourseReducer(state, action);
        if (content) state.content = content;
      });
  },
});

export const {
  toggleQuiz,
  setQuizzes,
  highlightAttemptBreathSelection,
  dismissOption,
  dismissFollowupOption,
  dismissChoice,
  dismissQuestion,
  dismissQuiz,
  setSelected,
  setFollowupId,
  setRouteToggleMarks,
  clearRouteToggleMarks,
} = quizSlice.actions;

export default quizSlice.reducer; 