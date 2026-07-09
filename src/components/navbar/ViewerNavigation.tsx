import React, { useMemo } from 'react';
import { Image } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  buildConvolutionNavigateTo,
  warnConvolutionCsFsqConflict,
} from '../../library/convolutionNavSearch';
import {
  deepLinkExtraParams,
  isViewerLoadingRoute,
  isViewerLoginRoute,
  isViewerNotFoundRoute,
  resolveViewerDeepLinkSearch,
} from '../../loadingRouteUtils';
import * as styles from '../../styles/shortcuts.module.css';

const quizIcon = new URL('../../images/7128236.png', import.meta.url).href;
const courseIcon = new URL('../../images/2643368.png', import.meta.url).href;
const tutorialIcon = new URL('../../images/5609505.png', import.meta.url).href;

interface ViewerNavigationProps {
  convCss?: string;
}

const ViewerNavigation: React.FC<ViewerNavigationProps> = ({ convCss = 'carders' }) => {
  const { pathname, search } = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const fsq = useSelector((state: RootState) => state.settings.fsq);
  const isUnzipCourses = useSelector((state: RootState) => state.settings.isUnzipCourses);
  const isUnzipQuizzes = useSelector((state: RootState) => state.settings.isUnzipQuizzes);
  const isUnzipTutorials = useSelector((state: RootState) => state.settings.isUnzipTutorials);

  const params = useMemo(() => {
    const resolved = resolveViewerDeepLinkSearch(search);
    const raw = resolved.startsWith('?') ? resolved.slice(1) : resolved;
    const sp = new URLSearchParams(raw);
    const result: Record<string, string> = {};
    sp.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, [search]);

  const activeApps = [isUnzipTutorials, isUnzipCourses, isUnzipQuizzes].filter(Boolean).length;
  if (
    activeApps < 2 ||
    isViewerLoginRoute(pathname) ||
    isViewerNotFoundRoute(pathname, search) ||
    isViewerLoadingRoute(pathname, search)
  ) {
    return null;
  }

  const stickyFsq = { fsq: fsq > 0 ? fsq : 10 };
  const cssClass = `${styles.shortcut} ${styles[convCss] ?? ''}`;
  const container = `${styles['shortcut-Container']} ${styles[convCss] ?? ''}`;
  const isTutorial = pathname.includes('/tutorial');
  const isCourse = pathname.includes('/course');
  const isQuiz = pathname.includes('/quiz');

  const linkParams = deepLinkExtraParams(search);
  const ldr =
    new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('ldr') ??
    (() => {
      const resolved = resolveViewerDeepLinkSearch(search);
      return resolved.startsWith('?') ? `/${resolved}` : `/?${resolved}`;
    })();

  const convolutionLinkProps = (route: string) => {
    const target = buildConvolutionNavigateTo(route, undefined, stickyFsq, {
      ldr,
      ...linkParams,
    });
    return {
      to: target ?? { pathname: route },
      state: {
        selectedT: parseInt(params.tutorial ?? '-1', 10),
        selectedC: parseInt(params.course ?? '-1', 10),
        selectedQ: parseInt(params.quiz ?? '-1', 10),
      },
      onClick: (e: React.MouseEvent) => {
        if (!target) {
          e.preventDefault();
          warnConvolutionCsFsqConflict(dispatch);
        }
      },
    };
  };

  return (
    <>
      {!isQuiz && isUnzipQuizzes && (
        <div className={container}>
          <Link {...convolutionLinkProps('/convolution/quiz')} aria-label="Open quiz">
            <Image className={cssClass} src={quizIcon} alt="" />
          </Link>
        </div>
      )}
      {!isTutorial && isUnzipTutorials && (
        <div className={container}>
          <Link {...convolutionLinkProps('/convolution/tutorial')} aria-label="Open tutorial">
            <Image className={cssClass} src={tutorialIcon} alt="" />
          </Link>
        </div>
      )}
      {!isCourse && isUnzipCourses && (
        <div className={container}>
          <Link {...convolutionLinkProps('/convolution/course')} aria-label="Open course">
            <Image className={cssClass} src={courseIcon} alt="" />
          </Link>
        </div>
      )}
    </>
  );
};

export default ViewerNavigation;
