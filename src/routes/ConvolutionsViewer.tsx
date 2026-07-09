import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { mutateCurApp } from '../store/slices/sessionSlice';
import { RootState } from '../store';
import TutorialReadOnly from './TutorialReadOnly';
import CourseReadOnly from './CourseReadOnly';
import QuizReadOnly from './QuizReadOnly';
import { useApplyRouterSelections } from '../Hooks/useShortcuts';
import {
  hasLoadingTreeParams,
  parseLoadingDeepLinkPairs,
  resolveViewerDeepLinkSearch,
} from '../loadingRouteUtils';
import { loadPncContent } from '../store/thunks/contentPipeline';

const ConvolutionsViewer: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, UnknownAction>>();
  const location = useLocation();
  const authenticated = useSelector((state: RootState) => state.session.authenticated);
  const curToken = useSelector((state: RootState) => state.session.curToken);
  const noQuizzes = useSelector((state: RootState) => state.quiz.noQuizzes);
  const noCourses = useSelector((state: RootState) => state.course.noCourses);
  const noTutorials = useSelector((state: RootState) => state.tutorial.noTutorials);
  const isUnzipCourses = useSelector((state: RootState) => state.settings.isUnzipCourses);
  const isUnzipQuizzes = useSelector((state: RootState) => state.settings.isUnzipQuizzes);
  const isUnzipTutorials = useSelector((state: RootState) => state.settings.isUnzipTutorials);

  const initialLocalApp = location.pathname?.toLowerCase()?.split('/').pop() ?? 'tutorial';
  const [localapp, setLocalApp] = useState(initialLocalApp);

  useEffect(() => {
    dispatch(mutateCurApp(localapp));
  }, [localapp, dispatch]);

  const deepLinkSearch = useMemo(
    () => resolveViewerDeepLinkSearch(location.search),
    [location.search],
  );
  const deepLinkPairs = useMemo(
    () => parseLoadingDeepLinkPairs(deepLinkSearch),
    [deepLinkSearch],
  );
  const hasTreeParams = useMemo(
    () => hasLoadingTreeParams(deepLinkSearch),
    [deepLinkSearch],
  );

  useEffect(() => {
    if (deepLinkPairs.length === 0 && !hasTreeParams) return;

    const needsContent =
      (hasTreeParams && (noTutorials || noCourses || noQuizzes)) ||
      deepLinkPairs.some((pair) => {
        if (pair.webapp === 'tutorial') return noTutorials;
        if (pair.webapp === 'course') return noCourses;
        return noQuizzes;
      });
    if (!needsContent) return;

    void dispatch(loadPncContent({ search: deepLinkSearch, foundPairs: [...deepLinkPairs] }));
  }, [
    deepLinkSearch,
    deepLinkPairs,
    hasTreeParams,
    dispatch,
    authenticated,
    curToken,
    noTutorials,
    noCourses,
    noQuizzes,
  ]);

  const hasContent =
    (localapp === 'tutorial' && !noTutorials) ||
    (localapp === 'course' && !noCourses) ||
    (localapp === 'quiz' && !noQuizzes);

  useApplyRouterSelections(hasContent, location.state);

  return (
    <Routes>
      {isUnzipTutorials && (
        <Route
          path="tutorial"
          element={<TutorialReadOnly setWebApp={setLocalApp} noTutorials={noTutorials} />}
        />
      )}
      {isUnzipCourses && (
        <Route
          path="course"
          element={<CourseReadOnly setWebApp={setLocalApp} noCourses={noCourses} />}
        />
      )}
      {isUnzipQuizzes && (
        <Route
          path="quiz"
          element={<QuizReadOnly setWebApp={setLocalApp} noQuizzes={noQuizzes} />}
        />
      )}
      <Route
        path="*"
        element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>No content route matched. Return to the loading page and pick a link.</p>
          </div>
        }
      />
    </Routes>
  );
};

export default ConvolutionsViewer;
