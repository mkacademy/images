import { SelectedRoute } from './slices/searchSlice';
import { SessionState } from './slices/sessionSlice';
import { ViewState } from './slices/viewSlice';
import { ErrorState } from './slices/errorSlice';
import { CourseState } from './slices/courseSlice';
import { PaginationState } from './slices/paginationSlice';
import { QuizState } from './slices/quizSlice';
import { TutorialState } from './slices/tutorialSlice';
import { CommsState } from './slices/commsSlice';
import { SettingsState } from './slices/settingsSlice';
import { StatsState } from './slices/statsSlice';
import { CommentsState } from './slices/commentsSlice';
import { store } from './index';

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
  stats: StatsState;
  comments: CommentsState;
}

export type AppDispatch = typeof store.dispatch;

export interface StatsMiddlewareState {
  session: {
    curApp: SessionState['curApp'];
    curMailer: SessionState['curMailer'];
  };
  search: {
    selectedRoute: SelectedRoute;
  };
  pagination: {
    selectedRoutes: PaginationState['selectedRoutes'];
  };
  tutorial: {
    selected: TutorialState['selected'];
    banners: TutorialState['banners'];
  };
  course: {
    selected: CourseState['selected'];
    banners: CourseState['banners'];
  };
  quiz: {
    selected: QuizState['selected'];
    banners: QuizState['banners'];
    quizzes: QuizState['quizzes'];
  };
}
