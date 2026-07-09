import { Middleware, type Dispatch } from '@reduxjs/toolkit';
import { bannerRoutes, getCurAppName, pncApps } from '../../utils';
import { setPagedRoute, updateCsObj } from '../slices/paginationSlice';
import { emptySelectedRoute } from '../slices/searchSlice';
import {
  resetChapters,
  setChapters,
  setChaptersViaPennantId,
  setChaptersViaSlideId,
  setSelected as setSelectedCourse,
  toggleCourse,
} from '../slices/courseSlice';
import {
  setSelected as setSelectedQuiz,
  toggleQuiz,
  setFollowupId,
  setRouteToggleMarks,
  clearRouteToggleMarks,
} from '../slices/quizSlice';
import {
  setSelected as setSelectedTutorial,
  toggleTutorial,
} from '../slices/tutorialSlice';
import type { RootState } from '../index';
import {
  toggleQuizFollowupOptionsRoute,
  toggleQuizFollowupSubmissionRoute,
  toggleQuizQuestionOptionsRoute,
  toggleQuizQuestionSubmissionRoute,
} from '../../library/actions';
import {
  dispatchQuizPagedRoute,
  getQuizSelectedRoute,
  QUIZ_ROUTES,
  computeRouteToggleClick,
  routeMatchesRouteToggleMarks,
  isRouteToggleSessionActive,
  type QuizRouteToggleSide,
  type QuizRouteToggleView,
} from '../../library/quizRouteMatcherUtils';

type PncToggleType =
  | typeof toggleTutorial.type
  | typeof toggleCourse.type
  | typeof toggleQuiz.type;

const getDefaultChildRoute = (key: PncToggleType): string => {
  switch (key) {
    case toggleTutorial.type:
    case toggleCourse.type:
      return 'instructions';
    case toggleQuiz.type:
      return 'sifters';
    default:
      throw new Error('a default child route is required per connected app!');
  }
};

const getChapterChildRoute = (): string => 'filtersinstructions';

const getConnectedAppSelector = (key: PncToggleType, state: RootState): number => {
  switch (key) {
    case toggleCourse.type:
      return state.course.selected;
    case toggleTutorial.type:
      return state.tutorial.selected;
    case toggleQuiz.type:
      return state.quiz.selected;
    default:
      throw new Error('a selected root index property is required per connected app!');
  }
};

const getToggleTargetIndex = (
  toggleType: PncToggleType,
  state: RootState,
  selectedId?: number,
): number => {
  if (selectedId === undefined) return -1;
  switch (toggleType) {
    case toggleTutorial.type:
      return state.tutorial.banners.findIndex(({ id }) => id === selectedId);
    case toggleCourse.type:
      return state.course.banners.findIndex(({ id }) => id === selectedId);
    case toggleQuiz.type:
      return state.quiz.quizzes.findIndex(({ id }) => id === selectedId);
    default:
      return -1;
  }
};

const dispatchOpenPncChildRoute = (
  dispatch: (action: ReturnType<typeof setPagedRoute>) => void,
  state: RootState,
  toggleType: PncToggleType,
): void => {
  const {
    pagination: { selectedRoutes },
    session: { curApp },
  } = state;
  const { traversal } = emptySelectedRoute;

  const inValidRoute = Object.entries(selectedRoutes).find(
    ([a, r]) => parseInt(a, 10) === curApp && typeof r === 'string' && r.startsWith('foundation'),
  );
  if (!inValidRoute) return;

  if (traversal === undefined || traversal === null || traversal === '' || traversal.startsWith('foundation')) {
    const [_, route] = inValidRoute;
    const validRoute = route.replace('foundation', '') + getDefaultChildRoute(toggleType);
    setTimeout(() => dispatch(setPagedRoute([curApp, validRoute])));
  } else {
    setTimeout(() => dispatch(setPagedRoute([curApp, traversal])));
  }
};

const dispatchClosePncFoundationRoute = (
  dispatch: (action: ReturnType<typeof setPagedRoute>) => void,
  state: RootState,
): void => {
  const {
    pagination: { selectedRoutes },
    session: { curApp },
  } = state;

  const inValidRoute = Object.entries(selectedRoutes).find(
    ([a, r]) => parseInt(a, 10) === curApp && typeof r === 'string' && !r.startsWith('foundation'),
  );
  if (!inValidRoute) return;

  const [app] = inValidRoute;
  const name = getCurAppName(app);
  const validRoute = bannerRoutes[pncApps.findIndex((n) => n === name)];
  setTimeout(() => dispatch(setPagedRoute([curApp, validRoute])));
};

const syncPncRouteForSelection = (
  dispatch: (action: ReturnType<typeof setPagedRoute>) => void,
  getState: () => RootState,
  toggleType: PncToggleType,
  prevSelected: number,
  nextSelected: number,
): void => {
  if (prevSelected === -1 && nextSelected >= 0) {
    dispatchOpenPncChildRoute(dispatch, getState(), toggleType);
  } else if (prevSelected >= 0 && nextSelected === -1) {
    dispatchClosePncFoundationRoute(dispatch, getState());
  }
};

const syncRouteToggleMarksWithRoute = (
  dispatch: Dispatch,
  getState: () => RootState,
): void => {
  const { routeToggleGreenIds, routeToggleOrangeMarks } = getState().quiz;
  const route = getQuizSelectedRoute(getState());
  if (
    isRouteToggleSessionActive(routeToggleGreenIds, routeToggleOrangeMarks) &&
    !routeMatchesRouteToggleMarks(route, routeToggleGreenIds, routeToggleOrangeMarks)
  ) {
    dispatch(clearRouteToggleMarks());
  }
};

const handleQuizRouteToggle = (
  dispatch: Dispatch,
  getState: () => RootState,
  view: QuizRouteToggleView,
  side: QuizRouteToggleSide,
  bannerId: number,
): void => {
  const state = getState();
  const current = getQuizSelectedRoute(state);
  const { routeToggleGreenIds, routeToggleOrangeMarks, routeTogglePrimarySide } = state.quiz;
  const wasInactive = !isRouteToggleSessionActive(routeToggleGreenIds, routeToggleOrangeMarks);
  const result = computeRouteToggleClick(
    { bannerId, view, side },
    routeToggleGreenIds,
    routeToggleOrangeMarks,
    routeTogglePrimarySide,
    current,
  );
  dispatch(setRouteToggleMarks({
    greenIds: result.greenIds,
    orangeMarks: result.orangeMarks,
    primarySide: result.primarySide,
  }));
  const becameActive = isRouteToggleSessionActive(result.greenIds, result.orangeMarks);
  if (result.route !== current || (wasInactive && becameActive)) {
    dispatchQuizPagedRoute(dispatch, getState, result.route);
  }
};

/** Keeps pagination.selectedRoutes in sync when PNC content is opened, closed, or chapter-scoped. */
const selectedRouteMatcher: Middleware<{}, RootState> = ({ getState, dispatch }) => (next) => (action) => {
  if (updateCsObj.match(action)) {
    const { curApp } = getState().session;
    return next(updateCsObj([curApp, action.payload as string]));
  }

  if (setPagedRoute.match(action)) {
    const result = Array.isArray(action.payload)
      ? next(action)
      : (() => {
        const { curApp } = getState().session;
        return next(setPagedRoute([curApp, action.payload]));
      })();
    syncRouteToggleMarksWithRoute(dispatch, getState);
    return result;
  }

  if (toggleQuiz.match(action) || toggleCourse.match(action) || toggleTutorial.match(action)) {
    const state = getState();
    const toggleType = action.type as PncToggleType;
    const selected = getConnectedAppSelector(toggleType, state);
    const { selectedId, canToggle = true } = action.payload;
    const targetIndex = getToggleTargetIndex(toggleType, state, selectedId);

    const isClosing = canToggle && selected >= 0 && targetIndex >= 0 && selected === targetIndex;
    const isOpening = targetIndex >= 0 && (selected === -1 || selected !== targetIndex);

    if (isClosing) {
      dispatchClosePncFoundationRoute(dispatch, state);
    } else if (isOpening) {
      dispatchOpenPncChildRoute(dispatch, state, toggleType);
    }
    return next(action);
  }

  if (setSelectedTutorial.match(action)) {
    const prevSelected = getState().tutorial.selected;
    syncPncRouteForSelection(
      dispatch,
      getState,
      toggleTutorial.type,
      prevSelected,
      action.payload,
    );
    return next(action);
  }

  if (setSelectedCourse.match(action)) {
    const prevSelected = getState().course.selected;
    syncPncRouteForSelection(
      dispatch,
      getState,
      toggleCourse.type,
      prevSelected,
      action.payload,
    );
    return next(action);
  }

  if (setSelectedQuiz.match(action)) {
    const prevSelected = getState().quiz.selected;
    syncPncRouteForSelection(
      dispatch,
      getState,
      toggleQuiz.type,
      prevSelected,
      action.payload,
    );
    return next(action);
  }

  if (
    setChapters.match(action) ||
    setChaptersViaSlideId.match(action) ||
    setChaptersViaPennantId.match(action) ||
    resetChapters.match(action)
  ) {
    const state = getState();
    const {
      pagination: { selectedRoutes },
      session: { curApp },
      course: { chapters, selected },
    } = state;
    const { traversal } = emptySelectedRoute;
    const chapterChildRoute = getChapterChildRoute();

    if (resetChapters.match(action)) {
      if (chapters.length > 0) {
        const onChapterRoute = Object.entries(selectedRoutes).find(
          ([a, r]) =>
            parseInt(a, 10) === curApp &&
            typeof r === 'string' &&
            r === chapterChildRoute,
        );
        if (onChapterRoute) {
          const [app] = onChapterRoute;
          const name = getCurAppName(app);
          const foundationRoute = bannerRoutes[pncApps.findIndex((n) => n === name)];
          const validRoute =
            foundationRoute.replace('foundation', '') + getDefaultChildRoute(toggleCourse.type);
          setTimeout(() => dispatch(setPagedRoute([curApp, validRoute])));
        }
      }
    } else if (chapters.length === 0 && selected > -1) {
      const notOnChapterRoute = Object.entries(selectedRoutes).find(
        ([a, r]) =>
          parseInt(a, 10) === curApp &&
          typeof r === 'string' &&
          r !== chapterChildRoute,
      );
      if (notOnChapterRoute) {
        if (
          traversal === undefined ||
          traversal === null ||
          traversal === '' ||
          traversal.startsWith('foundation') ||
          traversal.startsWith('sifters')
        ) {
          setTimeout(() => dispatch(setPagedRoute([curApp, chapterChildRoute])));
        } else {
          setTimeout(() => dispatch(setPagedRoute([curApp, traversal])));
        }
      }
    }
    return next(action);
  }

  if (toggleQuizQuestionSubmissionRoute.match(action)) {
    handleQuizRouteToggle(dispatch, getState, 'question', 'left', action.payload.bannerId);
    return next(action);
  }

  if (toggleQuizQuestionOptionsRoute.match(action)) {
    handleQuizRouteToggle(dispatch, getState, 'question', 'right', action.payload.bannerId);
    return next(action);
  }

  if (toggleQuizFollowupSubmissionRoute.match(action)) {
    handleQuizRouteToggle(dispatch, getState, 'followup', 'left', action.payload.bannerId);
    return next(action);
  }

  if (toggleQuizFollowupOptionsRoute.match(action)) {
    handleQuizRouteToggle(dispatch, getState, 'followup', 'right', action.payload.bannerId);
    return next(action);
  }

  if (setFollowupId.match(action)) {
    const result = next(action);
    if (getState().quiz.selected > -1) {
      const route = action.payload === undefined
        ? QUIZ_ROUTES.dashboardSifters
        : QUIZ_ROUTES.siftersFilters;
      dispatchQuizPagedRoute(dispatch, getState, route);
    }
    syncRouteToggleMarksWithRoute(dispatch, getState);
    return result;
  }

  return next(action);
};

export default selectedRouteMatcher;
