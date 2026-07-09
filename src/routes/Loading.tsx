import React, { useEffect, useMemo, useRef } from 'react';
import { NavigateOptions, useLocation, useNavigate } from 'react-router-dom';
import * as styles from '../styles/loading.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData, setCurPage } from '../library/Thunks';
import { buildFetchDataPayload } from '../library/ThunksUtils';
import { RootState, AppDispatch } from '../store';
import {
  LOADING_DEEP_LINK_PAIRS,
  deepLinkExtraParams,
  parseLoadingTreeFlags,
  primaryLoadingWebapp,
  resolveViewerDeepLinkSearch,
} from '../loadingRouteUtils';
import NotFound from '../components/views/NotFound';
import {
  completedUnzipping,
  toggleUnzipCourses,
  toggleUnzipQuizzes,
  toggleUnzipTutorials,
  finalizePostHydrationSettings,
  unzipCoursesTypeSelected,
  unzipTutorialsTypeSelected,
  unzipQuizzesTypeSelected,
  randomizedTypeSelected,
} from '../store/slices/settingsSlice';
import { unzipMessage } from '../store/thunks/unzipMessage';
import { buildConvolutionNavigateTo, warnConvolutionCsFsqConflict } from '../library/convolutionNavSearch';
import { parseUnzipQueryParam } from '../library/unzipQuery';
import { parseRandomizedQueryParam } from '../library/randomizedQuery';

const MIN_LOADING_DELAY_MS = 2_000;
const MAX_LOADING_WAIT_MS = 30_000;
const DEFAULT_VIEWER_FSQ = 10;

const Loading: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isNotUnzipping = useSelector((state: RootState) => state.settings.isNotUnzipping);
  const fsq = useSelector((state: RootState) => state.settings.fsq);
  const noTutorials = useSelector((state: RootState) => state.tutorial.noTutorials);
  const noCourses = useSelector((state: RootState) => state.course.noCourses);
  const noQuizzes = useSelector((state: RootState) => state.quiz.noQuizzes);
  const tutorialCount = useSelector((state: RootState) => state.tutorial.banners.length);
  const courseCount = useSelector((state: RootState) => state.course.banners.length);
  const quizCount = useSelector((state: RootState) => state.quiz.banners.length);

  const hasNavigated = useRef(false);
  const hasTriggeredUnzip = useRef(false);
  const fetchStarted = useRef(false);
  const prevIsNotUnzipping = useRef(isNotUnzipping);
  const loadStartedAt = useRef(Date.now());
  /** Set when fetch completes and unzip starts — mirrors editor hydrateEnabledAt. */
  const postFetchReadyAt = useRef<number | null>(null);
  const lastSearchRef = useRef(location.search);

  const { params, foundPairs, hasTutorial, hasCourse, hasQuiz, hasTreeParams } = useMemo(() => {
    const resolvedSearch = resolveViewerDeepLinkSearch(location.search);
    const searchParams = new URLSearchParams(
      resolvedSearch.startsWith('?') ? resolvedSearch.slice(1) : resolvedSearch,
    );
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const foundPairs = LOADING_DEEP_LINK_PAIRS.filter((pair) => {
      const hasTreeId = params[pair.zipper] !== undefined;
      const hasBannerId = params[pair.webapp] !== undefined;
      return hasTreeId && hasBannerId;
    });

    const treeFlags = parseLoadingTreeFlags(resolvedSearch);

    return {
      params,
      foundPairs,
      hasTutorial: treeFlags.hasTutorial,
      hasCourse: treeFlags.hasCourse,
      hasQuiz: treeFlags.hasQuiz,
      hasTreeParams: treeFlags.hasTutorial || treeFlags.hasCourse || treeFlags.hasQuiz,
    };
  }, [location.search]);

  const contentAlreadyLoaded = useMemo(
    () =>
      (hasTutorial && (!noTutorials || tutorialCount > 0)) ||
      (hasCourse && (!noCourses || courseCount > 0)) ||
      (hasQuiz && (!noQuizzes || quizCount > 0)),
    [
      hasTutorial,
      hasCourse,
      hasQuiz,
      noTutorials,
      noCourses,
      noQuizzes,
      tutorialCount,
      courseCount,
      quizCount,
    ],
  );

  useEffect(() => {
    if (lastSearchRef.current !== location.search) {
      lastSearchRef.current = location.search;
      loadStartedAt.current = Date.now();
      postFetchReadyAt.current = null;
      hasTriggeredUnzip.current = false;
      fetchStarted.current = false;
      prevIsNotUnzipping.current = true;
      hasNavigated.current = false;
    }
  }, [location.search]);

  useEffect(() => {
    if (!hasTreeParams && foundPairs.length === 0) return;
    if (contentAlreadyLoaded || fetchStarted.current) return;

    fetchStarted.current = true;
    const resolvedSearch = resolveViewerDeepLinkSearch(location.search);
    const webapp = primaryLoadingWebapp(resolvedSearch, foundPairs);
    const unzipTypes = parseUnzipQueryParam(resolvedSearch);
    dispatch(toggleUnzipTutorials(hasTutorial));
    dispatch(toggleUnzipCourses(hasCourse));
    dispatch(toggleUnzipQuizzes(hasQuiz));
    if (unzipTypes.tutorial) dispatch(unzipTutorialsTypeSelected(unzipTypes.tutorial));
    if (unzipTypes.course) dispatch(unzipCoursesTypeSelected(unzipTypes.course));
    if (unzipTypes.quiz) dispatch(unzipQuizzesTypeSelected(unzipTypes.quiz));
    const randomizedType = parseRandomizedQueryParam(resolvedSearch);
    if (randomizedType) dispatch(randomizedTypeSelected(randomizedType));
    dispatch(completedUnzipping(true));
    setCurPage(0);
    dispatch(
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
  }, [location.search, dispatch, foundPairs, hasTutorial, hasCourse, hasQuiz, hasTreeParams, contentAlreadyLoaded]);

  useEffect(() => {
    if (!hasTreeParams && foundPairs.length === 0) return;
    if (contentAlreadyLoaded) {
      if (postFetchReadyAt.current === null) postFetchReadyAt.current = Date.now();
      return;
    }

    const fetchJustCompleted = prevIsNotUnzipping.current && !isNotUnzipping;
    prevIsNotUnzipping.current = isNotUnzipping;

    if (fetchJustCompleted && !hasTriggeredUnzip.current) {
      hasTriggeredUnzip.current = true;
      postFetchReadyAt.current = Date.now();
      setTimeout(() => void dispatch(unzipMessage()));
    }
  }, [isNotUnzipping, foundPairs, hasTreeParams, dispatch, contentAlreadyLoaded]);

  useEffect(() => {
    if (!hasTreeParams && foundPairs.length === 0) return;
    if (hasNavigated.current) return;

    const stickyFsq = { fsq: fsq > 0 ? fsq : DEFAULT_VIEWER_FSQ };

    const proceed = () => {
      if (hasNavigated.current) return;

      if (foundPairs.length > 0) {
        dispatch(finalizePostHydrationSettings());
        const currentUrl = `${location.pathname}${location.search}`;
        const target = buildConvolutionNavigateTo(
          foundPairs[0].route,
          undefined,
          stickyFsq,
          { ldr: currentUrl, ...deepLinkExtraParams(location.search) },
        );
        if (!target) {
          warnConvolutionCsFsqConflict(dispatch);
          return;
        }

        const options: NavigateOptions = {
          replace: true,
          state: {
            selectedT: params.tutorial !== undefined ? parseInt(params.tutorial, 10) : -1,
            selectedC: params.course !== undefined ? parseInt(params.course, 10) : -1,
            selectedQ: params.quiz !== undefined ? parseInt(params.quiz, 10) : -1,
          },
        };

        hasNavigated.current = true;
        navigate(target, options);
        return;
      }

      dispatch(finalizePostHydrationSettings());
      const currentUrl = `${location.pathname}${location.search}`;
      const target = buildConvolutionNavigateTo(
        '/convolution/tutorial',
        undefined,
        stickyFsq,
        { ldr: currentUrl, ...deepLinkExtraParams(location.search) },
      );
      if (!target) {
        warnConvolutionCsFsqConflict(dispatch);
        return;
      }

      hasNavigated.current = true;
      navigate(target, {
        replace: true,
        state: { selectedT: -1, selectedC: -1, selectedQ: -1 },
      });
    };

    const now = Date.now();
    const loadMinRemaining = Math.max(0, MIN_LOADING_DELAY_MS - (now - loadStartedAt.current));
    const maxDeadline = loadStartedAt.current + MAX_LOADING_WAIT_MS;

    // Content already in store (e.g. return from login): only enforce overall min delay.
    if (contentAlreadyLoaded) {
      const timeout = setTimeout(proceed, loadMinRemaining);
      return () => clearTimeout(timeout);
    }

    // After fetch+unzip kicked off: wait min delay from that moment (editor hydrateEnabledAt path).
    if (postFetchReadyAt.current !== null) {
      const postFetchRemaining = Math.max(
        0,
        MIN_LOADING_DELAY_MS - (now - postFetchReadyAt.current),
      );
      const waitMs = Math.max(postFetchRemaining, loadMinRemaining);
      const timeout = setTimeout(proceed, waitMs);
      return () => clearTimeout(timeout);
    }

    // Still waiting on fetch: hold until postFetchReady or absolute max deadline.
    const waitMs = Math.max(0, maxDeadline - now);
    const timeout = setTimeout(proceed, waitMs);
    return () => clearTimeout(timeout);
  }, [
    location.pathname,
    location.search,
    navigate,
    dispatch,
    foundPairs,
    params,
    fsq,
    contentAlreadyLoaded,
    hasTreeParams,
    isNotUnzipping,
  ]);

  if (!hasTreeParams && foundPairs.length === 0) {
    return <NotFound />;
  }

  return (
    <div className={styles['ring']}>
      loading
      <span></span>
    </div>
  );
};

export default Loading;
