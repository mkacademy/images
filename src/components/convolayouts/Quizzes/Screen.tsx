import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Quiz from './Quiz';
import Questions from './Questions';
import Followups from './Followups';
import { _500 as NotFound } from '../../views/404';
import useMediaQuery from '../../../Hooks/useQueryMedia';
import {
  toggleQuiz,
  setFollowupId,
} from '../../../store/slices/quizSlice';
import { RootState } from '../../../store';
import { Banner, Pennant } from '../../../store/slices/courseSlice';
import * as _404styles from '../../../styles/404.module.css';
import * as quizStyles from '../../../styles/quiz.module.css';
import { Attempt } from '../../../store/slices/quizSlice';
import { useApplyRouterSelections, useClearFsqOnEscapeWhenUnselected, useExitExpandedOnEscape } from '../../../Hooks/useShortcuts';

const styleProps = {
  notFound: _404styles["notFound"],
  bigger: _404styles["bigger"],
}

interface ScreenProps {
  noQuizzes: boolean;
  onRouterSelection?: () => void;
}

export interface HandleDismissParams {
  id: number;
  choice?: Record<string, Attempt>;
  isShow?: boolean;
  isDismissed?: boolean;
  ids?: number[];
}

const FOLLOWUPS_CROSSFADE_MS = 220;

const Screen: React.FC<ScreenProps> = ({ noQuizzes, onRouterSelection }) => {
  const positionY = useRef<number>(-1);
  const followupPanelSnapRef = useRef<{ parent: Banner; visible: Pennant[] } | null>(null);
  const [followupExitHold, setFollowupExitHold] = useState(false);
  const prevShowFollowupsRef = useRef(false);
  const dispatch = useDispatch();
  const { screen } = useMediaQuery();
  const { state: routerState } = useLocation();
  useApplyRouterSelections(!noQuizzes, routerState);
  const quizzes = useSelector((state: RootState) => state.quiz.quizzes);
  const banners = useSelector((state: RootState) => state.quiz.banners);
  const selected = useSelector((state: RootState) => state.quiz.selected);
  const followupId = useSelector((state: RootState) => state.quiz.followupId);


  useEffect(() => {
    const handleScroll = () => {
      if (selected === -1 && followupId === undefined) {
        const change = Math.abs(window.scrollY - positionY.current);
        if (change < 1000) positionY.current = window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [positionY, selected, followupId]);

  const isFollowupExpanded = !noQuizzes && followupId !== undefined;
  const isQuizExpanded = !isFollowupExpanded && !noQuizzes && selected > -1 && !!quizzes[selected];
  useExitExpandedOnEscape(isQuizExpanded, () => {
    if (selected === -1) return;
    const q = quizzes[selected];
    if (!q) return;
    if (positionY.current > -1)
      setTimeout(() => window.scrollTo(0, positionY.current), 500);
    dispatch(toggleQuiz({ selectedId: q.id }));
  });

  useExitExpandedOnEscape(isFollowupExpanded, () => {
    if (positionY.current > -1)
      setTimeout(() => window.scrollTo(0, positionY.current), 500);
    dispatch(setFollowupId(undefined));
  });
  useClearFsqOnEscapeWhenUnselected(selected === -1 && followupId === undefined);

  const quiz = quizzes[selected];
  const slides = banners.filter((banner: Banner) => banner.bannerId === quiz?.id);
  const visible = slides.filter(({ isDismissed }: Banner) => isDismissed === false);
  const parent = banners.find((b: Banner) => b.id === followupId);
  /** Parent banner belongs to the expanded quiz; otherwise follow-up UI still shows empty state. */
  const followupContextValid =
    !!quiz && !!parent && parent.bannerId === quiz.id;
  const followupPennants = followupContextValid ? parent.pennants ?? [] : [];
  const visibleFollowups = followupPennants.filter((p) => p.isDismissed === false);
  /** Crossfade + panel track Redux follow-up mode, not only "resolved" parent (fixes empty / edge cases). */
  const inFollowupView = followupId !== undefined && !!quiz;

  useEffect(() => {
    if (followupContextValid && parent) {
      followupPanelSnapRef.current = { parent, visible: visibleFollowups };
    } else if (inFollowupView && !followupContextValid) {
      followupPanelSnapRef.current = null;
    }
  }, [followupContextValid, parent, visibleFollowups, inFollowupView]);

  useEffect(() => {
    const prev = prevShowFollowupsRef.current;
    prevShowFollowupsRef.current = inFollowupView;

    if (inFollowupView) {
      setFollowupExitHold(false);
      return;
    }
    if (prev && !inFollowupView && followupPanelSnapRef.current) {
      setFollowupExitHold(true);
      const tid = window.setTimeout(() => {
        setFollowupExitHold(false);
        followupPanelSnapRef.current = null;
      }, FOLLOWUPS_CROSSFADE_MS);
      return () => window.clearTimeout(tid);
    }
  }, [inFollowupView]);

  const exitingSnap = followupExitHold ? followupPanelSnapRef.current : null;
  const showFollowupsPanel = inFollowupView || !!exitingSnap;
  const followupPanelProps = inFollowupView
    ? followupContextValid && parent
      ? { parent, visible: visibleFollowups }
      : { parent: null as Banner | null, visible: visibleFollowups }
    : exitingSnap;

  const handleToggleQuiz = useCallback((payload: { selectedId?: number, canToggle?: boolean }) =>
    dispatch(toggleQuiz(payload)), [dispatch]);

  if (noQuizzes) return null;

  return (
    <React.Fragment>
      {quiz ? (
        <React.Fragment>
          <Quiz
            {...quiz}
            positionY={positionY}
            total={slides.length}
            toggler={handleToggleQuiz}
          />
          <div
            className={`${quizStyles['quiz-crossfade']} ${
              inFollowupView ? quizStyles['quiz-crossfade--followups'] : quizStyles['quiz-crossfade--questions']
            }`}
          >
            <div className={quizStyles['quiz-crossfade-layer']}>
              {visible.length > 0 ? (
                <Questions
                  visible={visible}
                />
              ) : (
                <div className={`${styleProps["notFound"]} ${styleProps["bigger"]}`}>
                  <NotFound message="oops! nothing in here" />
                </div>
              )}
            </div>
            <div className={quizStyles['quiz-crossfade-layer']}>
              {showFollowupsPanel && followupPanelProps ? (
                followupPanelProps.parent && followupPanelProps.visible.length > 0 ? (
                  <Followups
                    visible={followupPanelProps.visible}
                  />
                ) : (
                  <div className={`${styleProps["notFound"]} ${styleProps["bigger"]}`}>
                    <NotFound message="oops! nothing in here" />
                  </div>
                )
              ) : null}
            </div>
          </div>
        </React.Fragment>
      ) : (
        quizzes
          .filter(({ isDismissed }) => isDismissed === false)
          .map((quiz, i) => {
            const { id } = quiz;
            return (
              <Quiz
                key={id}
                {...quiz}
                positionY={positionY}
                toggler={handleToggleQuiz}  
                leftQuote={screen > 2 ? i % 2 !== 0 : false}
                total={banners.filter(({ bannerId }) => bannerId === id).length}
              />
            );
          })
      )}
    </React.Fragment>
  );
};

export default Screen; 