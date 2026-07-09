import React from 'react';
import { Image } from 'react-bootstrap';
import { createSearchParams, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { signOut } from '../../utils';
import { clearEscrow } from '../../store/slices/viewSlice';
import { clearData as clearReducers } from '../../store/slices/rowSlice';
import * as styles from '../../styles/shortcuts.module.css';
import ViewerNavigation from './ViewerNavigation';
import { isViewerLoadingRoute, isViewerLoginRoute, isViewerNotFoundRoute } from '../../loadingRouteUtils';
import { useFetchSequence } from '../../Hooks/useFetchSequence';

const account = new URL('../../Images/user.png', import.meta.url).href;
const exit = new URL('../../Images/3094700.png', import.meta.url).href;
const fetchdataRed = new URL('../../Images/fetchdata_red.png', import.meta.url).href;
const loading = new URL('../../Images/loading.gif', import.meta.url).href;

interface ViewerUiShortcutsProps {
  convCss?: string;
}

const PNC_ROUTE_RE = /^\/convolution\/(tutorial|course|quiz)\/?$/;

const ViewerUiShortcuts: React.FC<ViewerUiShortcutsProps> = ({ convCss = 'carders' }) => {
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();
  const showCuts = useSelector((state: RootState) => state.session.showShortcuts);
  const authenticated = useSelector((state: RootState) => state.session.authenticated);
  const pauseFetchers = useSelector((state: RootState) => state.session.pauseFetchers);
  const requestIsFetching = useSelector((state: RootState) => state.view.requestIsFetching);
  const hydrationQueries = useSelector((state: RootState) => state.session.hydrationQueries);
  const selectedTutorial = useSelector((state: RootState) => state.tutorial.selected);
  const selectedCourse = useSelector((state: RootState) => state.course.selected);
  const selectedQuiz = useSelector((state: RootState) => state.quiz.selected);

  const pncMatch = pathname.match(PNC_ROUTE_RE);
  const webapp = pncMatch?.[1] ?? '';
  const hasBannerSelected =
    (webapp === 'tutorial' && selectedTutorial > -1) ||
    (webapp === 'course' && selectedCourse > -1) ||
    (webapp === 'quiz' && selectedQuiz > -1);
  const { sequenceQueryHandler } = useFetchSequence({
    webapp,
    formatter: webapp,
    isLoading: requestIsFetching,
    search,
  });

  if (!showCuts) return null;

  if (
    isViewerLoginRoute(pathname) ||
    isViewerNotFoundRoute(pathname, search) ||
    isViewerLoadingRoute(pathname, search)
  ) {
    return null;
  }

  const cssClass = `${styles.shortcut} ${styles[convCss] ?? ''}`;
  const container = `${styles['shortcut-Container']} ${styles[convCss] ?? ''}`;
  const loginSearch = createSearchParams({ redirectUrl: pathname + search }).toString();
  const showFetchSequence = Boolean(pncMatch) && hasBannerSelected;
  const isHydrating = hydrationQueries > 0;

  const handleFetchSequenceClick = (e: React.MouseEvent) => {
    if (isHydrating) return;
    sequenceQueryHandler(e);
  };

  const handleAccountClick = (e: React.MouseEvent) => {
    if (!authenticated) return;
    e.preventDefault();
    dispatch(clearReducers());
    dispatch(clearEscrow());
    dispatch({ type: signOut(pauseFetchers) });
  };

  return (
    <div className={styles.shortcuts}>
      <ViewerNavigation convCss={convCss} />
      {showFetchSequence && (
        <div
          className={container}
          onClick={handleFetchSequenceClick}
          style={{
            position: 'relative',
            cursor: isHydrating ? 'not-allowed' : 'pointer',
            filter: isHydrating ? 'grayscale(1) brightness(0.65)' : 'none',
            transition: 'filter 0.2s ease-in-out',
          }}
          role="button"
          tabIndex={isHydrating ? -1 : 0}
          aria-disabled={isHydrating}
          aria-label={isHydrating ? 'Run fetch sequence (hydration in progress)' : 'Run fetch sequence'}
          onKeyDown={(e) => {
            if (isHydrating) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sequenceQueryHandler(e as unknown as React.MouseEvent);
            }
          }}
        >
          <Image
            className={cssClass}
            src={fetchdataRed}
            alt=""
            style={{
              top: 0,
              left: 0,
              position: 'absolute',
              opacity: requestIsFetching ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
          />
          <Image
            className={cssClass}
            src={loading}
            alt=""
            style={{
              top: 0,
              left: 0,
              position: 'absolute',
              opacity: requestIsFetching ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
            }}
          />
        </div>
      )}
      <div className={container} style={{ position: 'relative' }}>
        <Link
          to={{ pathname: '/login', search: loginSearch }}
          onClick={handleAccountClick}
          aria-label={authenticated ? 'Sign out' : 'Sign in'}
        >
          <Image
            className={cssClass}
            src={account}
            alt=""
            style={{
              top: 0,
              left: 0,
              position: 'absolute',
              opacity: authenticated ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
          />
          <Image
            className={cssClass}
            src={exit}
            alt=""
            style={{
              top: 0,
              left: 0,
              position: 'absolute',
              opacity: authenticated ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
            }}
          />
        </Link>
      </div>
    </div>
  );
};

export default ViewerUiShortcuts;
