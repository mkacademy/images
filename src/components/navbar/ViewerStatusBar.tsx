import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../store';
import { COMPLETED_MESSAGE, cpanelMessage } from '../../store/slices/viewSlice';
import {
  isViewerLoadingRoute,
  isViewerLoginRoute,
  isViewerNotFoundRoute,
  isViewerUnknownRoute,
} from '../../loadingRouteUtils';
import * as styles from '../../styles/roletoggler.module.css';

const PNC_ROUTE_RE = /^\/convolution\/(tutorial|course|quiz)\/?$/;

/** Editor RoleToggler parity: shows `view.message` (hydration progress, etc.). */
const ViewerStatusBar: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();
  const message = useSelector((state: RootState) => state.view.message);
  const isRequestProcessing = useSelector((state: RootState) => state.view.requestIsProcessing);

  const pncMatch = pathname.match(PNC_ROUTE_RE);
  const convCss = pncMatch?.[1];

  const refs = useRef({ isRequestProcessing, message });
  useEffect(() => {
    refs.current = { isRequestProcessing, message };
  }, [isRequestProcessing, message]);

  // Idle message is empty in viewer (editor unzip / non-maximum mode parity).
  useEffect(() => {
    const { isRequestProcessing: processing, message: current } = refs.current;
    if (!processing || current === COMPLETED_MESSAGE) {
      const timeoutId = setTimeout(() => {
        const latest = refs.current;
        if (!latest.isRequestProcessing || latest.message === COMPLETED_MESSAGE) {
          dispatch(cpanelMessage(''));
        }
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [message, isRequestProcessing, dispatch]);

  if (
    isViewerLoginRoute(pathname) ||
    isViewerNotFoundRoute(pathname, search) ||
    isViewerUnknownRoute(pathname) ||
    isViewerLoadingRoute(pathname, search) ||
    !convCss
  ) {
    return null;
  }

  if (!message) return null;

  return (
    <div className={`${styles.notRolePicker} ${convCss}`}>
      <div className={`role ${styles.role}`}>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default ViewerStatusBar;
