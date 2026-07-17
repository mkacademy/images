import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from '../../library/Thunks';
import { buildFetchDataPayload } from '../../library/ThunksUtils';
import { LOADING_DEEP_LINK_PAIRS, LoadingDeepLinkPair, parseLoadingTreeFlags, primaryLoadingWebapp, resolveViewerDeepLinkSearch } from '../../loadingRouteUtils';
import {
  completedUnzipping,
  toggleUnzipCourses,
  toggleUnzipQuizzes,
  toggleUnzipTutorials,
  unzipCoursesTypeSelected,
  unzipTutorialsTypeSelected,
  unzipQuizzesTypeSelected,
  randomizedTypeSelected,
} from '../slices/settingsSlice';
import { setCurPage } from '../../library/Thunks';
import { unzipMessage } from './unzipMessage';
import { parseUnzipQueryParam } from '../../library/unzipQuery';
import { parseRandomizedQueryParam } from '../../library/randomizedQuery';
import type { AppDispatch, RootState } from '../index';

export interface LoadPncContentArg {
  search: string;
  foundPairs?: LoadingDeepLinkPair[];
}

const parseFoundPairs = (search: string): LoadingDeepLinkPair[] => {
  const resolvedSearch = resolveViewerDeepLinkSearch(search);
  const searchParams = new URLSearchParams(
    resolvedSearch.startsWith('?') ? resolvedSearch.slice(1) : resolvedSearch,
  );
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return LOADING_DEEP_LINK_PAIRS.filter((pair) => {
    const hasTreeId = params[pair.zipper] !== undefined;
    const hasBannerId = params[pair.webapp] !== undefined;
    return hasTreeId && hasBannerId;
  });
};

type LoadPncResult =
  | { skipped: true }
  | { skipped: false; fetched: boolean; unzipped: boolean };

/** Orchestrates bulk fetch → unzip → hydrate for Loading deep-links. */
export const loadPncContent = createAsyncThunk<
  LoadPncResult,
  LoadPncContentArg,
  { state: RootState; dispatch: AppDispatch }
>(
  'content/loadPncContent',
  async ({ search, foundPairs: pairsArg }, { dispatch }) => {
    const resolvedSearch = resolveViewerDeepLinkSearch(search);
    const foundPairs = pairsArg ?? parseFoundPairs(resolvedSearch);
    const treeFlags = parseLoadingTreeFlags(resolvedSearch);
    const hasTreeParams = treeFlags.hasTutorial || treeFlags.hasCourse || treeFlags.hasQuiz;
    if (foundPairs.length === 0 && !hasTreeParams) return { skipped: true as const };

    const hasTutorial = foundPairs.length > 0
      ? foundPairs.some((p) => p.webapp === 'tutorial')
      : treeFlags.hasTutorial;
    const hasCourse = foundPairs.length > 0
      ? foundPairs.some((p) => p.webapp === 'course')
      : treeFlags.hasCourse;
    const hasQuiz = foundPairs.length > 0
      ? foundPairs.some((p) => p.webapp === 'quiz')
      : treeFlags.hasQuiz;
    const webapp = primaryLoadingWebapp(resolvedSearch, foundPairs);

    dispatch(toggleUnzipTutorials(hasTutorial));
    dispatch(toggleUnzipCourses(hasCourse));
    dispatch(toggleUnzipQuizzes(hasQuiz));
    const unzipTypes = parseUnzipQueryParam(resolvedSearch);
    if (unzipTypes.tutorial) dispatch(unzipTutorialsTypeSelected(unzipTypes.tutorial));
    if (unzipTypes.course) dispatch(unzipCoursesTypeSelected(unzipTypes.course));
    if (unzipTypes.quiz) dispatch(unzipQuizzesTypeSelected(unzipTypes.quiz));
    const randomizedType = parseRandomizedQueryParam(resolvedSearch);
    if (randomizedType) dispatch(randomizedTypeSelected(randomizedType));
    dispatch(completedUnzipping(true));
    setCurPage(0);

    const fetchResult = await dispatch(
      fetchData(
        buildFetchDataPayload(
          { isUnzipCourses: hasCourse, isUnzipQuizzes: hasQuiz, isUnzipTutorials: hasTutorial },
          {
            search: resolvedSearch,
            webapp,
            convolution: webapp,
          },
        ),
      ),
    );

    if (fetchData.rejected.match(fetchResult)) {
      return { skipped: false as const, fetched: false, unzipped: false };
    }

    await dispatch(unzipMessage());

    return { skipped: false as const, fetched: true, unzipped: true };
  },
);
