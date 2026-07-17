
import { SessionState } from './slices/sessionSlice';
import { ViewState } from './slices/viewSlice';
import { ErrorState } from './slices/errorSlice';
import { CourseState } from './slices/courseSlice';
import { PaginationState } from './slices/paginationSlice';
import { QuizState } from './slices/quizSlice';
import { TutorialState } from './slices/tutorialSlice';
import { CommsState } from './slices/commsSlice';
import { SettingsState } from './slices/settingsSlice';
import { CommentsState } from './slices/commentsSlice';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

export interface RootState {
  session: SessionState;
  view: ViewState;
  error: ErrorState;
  comms: CommsState;
  tutorial: TutorialState;
  course: CourseState;
  quiz: QuizState;
  pagination: PaginationState;
  settings: SettingsState;
  comments: CommentsState;
}

/** Matches store/index AppDispatch — thunk-capable for async actions. */
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
