import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { mutateCurApp } from '../slices/sessionSlice';
import { abortIfHydrationDisabled } from '../../library/hydrationUtils';
import { isHydrationSessionBusy } from '../../library/hydrationQueue';
import { hydrateContent, type HydrateContentWebapp } from '../thunks/hydrateContent';

const isPncWebapp = (app: string): app is HydrateContentWebapp =>
  app === 'tutorial' || app === 'course' || app === 'quiz';

/** Starts hydration when switching PNC screens (editor HydrationManager + mutateCurApp). */
const hydrationOnCurAppChange: Middleware<{}, RootState> = ({ dispatch, getState }) => (next) => (action) => {
  const result = next(action);

  if (!mutateCurApp.match(action) || !isPncWebapp(action.payload)) return result;

  const {
    settings: { isUnzipCourses, isUnzipTutorials, isUnzipQuizzes },
  } = getState();

  const shouldRun =
    (action.payload === 'tutorial' && isUnzipTutorials) ||
    (action.payload === 'course' && isUnzipCourses) ||
    (action.payload === 'quiz' && isUnzipQuizzes);

  if (!shouldRun || abortIfHydrationDisabled(getState)) return result;

  const { hydrationQueries } = getState().session;
  if (hydrationQueries > 0 || isHydrationSessionBusy()) return result;

  setTimeout(() => {
    void dispatch(hydrateContent([action.payload]));
  }, 0);

  return result;
};

export default hydrationOnCurAppChange;
