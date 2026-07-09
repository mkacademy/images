import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { InsertStatsPayload } from '../../library/actions';
import { getCurAppName } from '../../utils';
import {
  insertCourseCounts,
  insertIncomingCounts,
  insertOutgoingCounts,
  insertQuizzesCounts,
  insertTutorialCounts,
  insertTutorsCounts,
} from '../slices/statsSlice';
import type { RootState } from '../index';

/** Replaces statsMiddleware for viewer bulk-fetch stats updates. */
export function applyInsertStats(
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  action: InsertStatsPayload,
): void {
  const { screen, counts, totals, query, requestId } = action;
  const {
    search: { selectedRoute },
    session: { curApp, curMailer },
    pagination: { selectedRoutes: routes },
    tutorial: { selected: selectedT, banners },
    course: { selected: selectedC, banners: pennants },
    quiz: { selected: selectedQ, banners: pennantz, quizzes },
  } = action.state;

  switch (screen) {
    case 'cpanel': {
      const appScreen = getCurAppName(curApp);
      if (appScreen !== 'cpanel' && appScreen !== screen) {
        applyInsertStats(dispatch, { ...action, screen: appScreen });
      }
      break;
    }
    case 'tutorial':
      dispatch(
        insertTutorialCounts({
          selected: selectedT,
          selectedRoute,
          totals,
          routes,
          banners,
          curApp,
          curMailer,
          counts,
          query,
          requestId,
        }),
      );
      break;
    case 'course':
      dispatch(
        insertCourseCounts({
          selected: selectedC,
          selectedRoute,
          totals,
          pennants,
          routes,
          curApp,
          curMailer,
          counts,
          query,
          requestId,
        }),
      );
      break;
    case 'quiz':
      dispatch(
        insertQuizzesCounts({
          selected: selectedQ,
          selectedRoute,
          totals,
          quizzes,
          pennantz,
          routes,
          curApp,
          curMailer,
          counts,
          query,
          requestId,
        }),
      );
      break;
    case 'tutors':
      dispatch(
        insertTutorsCounts({
          selectedRoute,
          curApp,
          totals,
          curMailer,
          counts,
          routes,
          query,
          requestId,
        }),
      );
      break;
    case 'incoming':
      dispatch(
        insertIncomingCounts({
          selectedRoute,
          curApp,
          totals,
          curMailer,
          counts,
          routes,
          query,
          requestId,
        }),
      );
      break;
    case 'outgoing':
      dispatch(
        insertOutgoingCounts({
          selectedRoute,
          curApp,
          totals,
          curMailer,
          counts,
          routes,
          query,
          requestId,
        }),
      );
      break;
    default:
      break;
  }
}
