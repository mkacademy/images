import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toggleTutorial } from '../store/slices/tutorialSlice';
import { toggleCourse } from '../store/slices/courseSlice';
import { toggleQuiz } from '../store/slices/quizSlice';
import { AppDispatch } from '../store';
import { isFsqEligiblePathname, stripFsqFromSearch } from '../library/convolutionNavSearch';

const IGNORE_ESC_IN = 'input, textarea, select, [contenteditable="true"]';

export function useExitExpandedOnEscape(isExpanded: boolean, onExit: () => void): void {
  const dispatch = useDispatch<AppDispatch>();
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    if (!isExpanded) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.ctrlKey) return;
      const el = event.target as HTMLElement | null;
      if (el?.closest(IGNORE_ESC_IN)) return;
      event.preventDefault();
      onExitRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExpanded, dispatch]);
}

export function useClearFsqOnEscapeWhenUnselected(isUnselected: boolean): void {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!isUnselected || !isFsqEligiblePathname(pathname)) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.ctrlKey) return;
      const el = event.target as HTMLElement | null;
      if (el?.closest(IGNORE_ESC_IN)) return;

      const nextSearch = stripFsqFromSearch(search || '');
      if (nextSearch === false) return;

      event.preventDefault();
      navigate({ pathname, search: nextSearch }, { replace: true });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isUnselected, pathname, search, dispatch, navigate]);
}

type RouterSelectionState = {
  selectedT?: number;
  selectedC?: number;
  selectedQ?: number;
};

let lastAppliedRouterSelectionKey: string | null = null;

const routerSelectionKey = (state: RouterSelectionState): string =>
  `${state.selectedT ?? ''}:${state.selectedC ?? ''}:${state.selectedQ ?? ''}`;

export function useChapterEscape(
  isChapterOpen: boolean,
  onCloseChapter: () => void,
  onExitChapterMode: () => void,
): void {
  const dispatch = useDispatch<AppDispatch>();
  const onCloseRef = useRef(onCloseChapter);
  const onExitRef = useRef(onExitChapterMode);
  const isChapterOpenRef = useRef(isChapterOpen);
  onCloseRef.current = onCloseChapter;
  onExitRef.current = onExitChapterMode;
  isChapterOpenRef.current = isChapterOpen;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.ctrlKey) return;
      const el = event.target as HTMLElement | null;
      if (el?.closest(IGNORE_ESC_IN)) return;
      event.preventDefault();
      if (isChapterOpenRef.current) onCloseRef.current();
      else onExitRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);
}

export function useApplyRouterSelections(
  hasContent: boolean,
  routerState: unknown,
): void {
  const dispatch = useDispatch();

  useEffect(() => {
    if (
      !hasContent ||
      !routerState ||
      typeof routerState !== 'object' ||
      (!('selectedT' in routerState) && !('selectedC' in routerState) && !('selectedQ' in routerState))
    ) return;
    const { selectedT, selectedC, selectedQ } = routerState as RouterSelectionState;
    const selectionKey = routerSelectionKey({ selectedT, selectedC, selectedQ });
    if (lastAppliedRouterSelectionKey === selectionKey) return;
    lastAppliedRouterSelectionKey = selectionKey;

    if (selectedT !== undefined && selectedT > -1)
      setTimeout(() => dispatch(toggleTutorial({ selectedId: selectedT, canToggle: false })), 500);
    if (selectedC !== undefined && selectedC > -1)
      setTimeout(() => dispatch(toggleCourse({ selectedId: selectedC, canToggle: false })), 500);
    if (selectedQ !== undefined && selectedQ > -1)
      setTimeout(() => dispatch(toggleQuiz({ selectedId: selectedQ, canToggle: false })), 500);
  }, [dispatch, hasContent, routerState]);
}
