import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../store';
import { COMPLETED_MESSAGE, cpanelMessage } from '../../store/slices/viewSlice';
import { resetHydrationQueries } from '../../store/slices/sessionSlice';
import {
  isViewerLoadingRoute,
  isViewerLoginRoute,
  isViewerNotFoundRoute,
  isViewerUnknownRoute,
} from '../../loadingRouteUtils';
import * as styles from '../../styles/hydrationProgress.module.css';

const PNC_ROUTE_RE = /^\/convolution\/(tutorial|course|quiz)\/?$/;

/** Thin top progress bar for hydration (replaces text status messages). */
const ViewerStatusBar: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();
  const message = useSelector((state: RootState) => state.view.message);
  const remaining = useSelector((state: RootState) => state.session.hydrationQueries);
  const total = useSelector((state: RootState) => state.session.hydrationQueriesTotal);

  const [exiting, setExiting] = useState(false);
  const [displayWidth, setDisplayWidth] = useState(0);

  const pncMatch = pathname.match(PNC_ROUTE_RE);
  const onViewerRoute = Boolean(pncMatch);

  const active = total > 0;
  const rawProgress = total > 0 ? ((total - remaining) / total) * 100 : 0;
  // Keep a visible stub while work remains so the bar appears immediately.
  const progress = remaining > 0 ? Math.max(rawProgress, 8) : active ? 100 : 0;

  useEffect(() => {
    if (!active) {
      setExiting(false);
      setDisplayWidth(0);
      return;
    }

    setExiting(false);
    setDisplayWidth(progress);

    if (remaining > 0) return;

    const fadeId = window.setTimeout(() => setExiting(true), 200);
    const resetId = window.setTimeout(() => {
      dispatch(resetHydrationQueries());
      setDisplayWidth(0);
      setExiting(false);
    }, 450);

    return () => {
      window.clearTimeout(fadeId);
      window.clearTimeout(resetId);
    };
  }, [active, progress, remaining, dispatch]);

  // Clear completion text leftover from hydration session lifecycle.
  useEffect(() => {
    if (message !== COMPLETED_MESSAGE) return;
    const timeoutId = window.setTimeout(() => {
      dispatch(cpanelMessage(''));
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [message, dispatch]);

  if (
    isViewerLoginRoute(pathname) ||
    isViewerNotFoundRoute(pathname, search) ||
    isViewerUnknownRoute(pathname) ||
    isViewerLoadingRoute(pathname, search) ||
    !onViewerRoute
  ) {
    return null;
  }

  if (!active && !exiting) return null;

  return (
    <div
      className={`${styles.track}${exiting ? ` ${styles.trackExiting}` : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(displayWidth)}
      aria-label="Hydration progress"
    >
      <div className={styles.bar} style={{ width: `${displayWidth}%` }} />
    </div>
  );
};

export default ViewerStatusBar;
