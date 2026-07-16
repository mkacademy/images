import React from 'react';
import { Image } from 'react-bootstrap';
import { createSearchParams, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { signOut } from '../../utils';
import { clearData as clearReducers } from '../../store/slices/rowSlice';
import * as styles from '../../styles/shortcuts.module.css';
import ViewerNavigation from './ViewerNavigation';
import { isViewerLoadingRoute, isViewerLoginRoute, isViewerNotFoundRoute, isViewerUnknownRoute } from '../../loadingRouteUtils';

const account = new URL('../../Images/user.png', import.meta.url).href;
const exit = new URL('../../Images/3094700.png', import.meta.url).href;

interface ViewerUiShortcutsProps {
  convCss?: string;
}

const ViewerUiShortcuts: React.FC<ViewerUiShortcutsProps> = ({ convCss = 'carders' }) => {
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();
  const showCuts = useSelector((state: RootState) => state.session.showShortcuts);
  const authenticated = useSelector((state: RootState) => state.session.authenticated);
  const pauseFetchers = useSelector((state: RootState) => state.session.pauseFetchers);

  if (!showCuts) return null;

  if (
    isViewerLoginRoute(pathname) ||
    isViewerNotFoundRoute(pathname, search) ||
    isViewerUnknownRoute(pathname) ||
    isViewerLoadingRoute(pathname, search)
  ) {
    return null;
  }

  const cssClass = `${styles.shortcut} ${styles[convCss] ?? ''}`;
  const container = `${styles['shortcut-Container']} ${styles[convCss] ?? ''}`;
  const loginSearch = createSearchParams({ redirectUrl: pathname + search }).toString();

  const handleAccountClick = (e: React.MouseEvent) => {
    if (!authenticated) return;
    e.preventDefault();
    dispatch(clearReducers());
    dispatch({ type: signOut(pauseFetchers) });
  };

  return (
    <div className={styles.shortcuts}>
      <ViewerNavigation convCss={convCss} />
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
