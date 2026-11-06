import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { rootIdsFromTree, type PagerScreen } from '../library/sessionPager';

const EMPTY = new Set<number>();

/**
 * Root banner / quiz ids the screen may show for the session pager's current item.
 * `null` = no pager set yet (show everything, as before).
 */
export const useSessionPagerVisibleIds = (screen: PagerScreen): Set<number> | null => {
  const active = useSelector((state: RootState) => state.sessionPager.sessionIds.length > 0);
  const hidden = useSelector((state: RootState) => state.sessionPager.screenHidden);
  const itemId = useSelector((state: RootState) => state.sessionPager.visibleItemId[screen]);
  const tree = useSelector((state: RootState) => {
    if (itemId === null) return undefined;
    if (screen === 'tutorial') return state.settings.TutorialTrees[itemId];
    if (screen === 'course') return state.settings.CourseTrees[itemId];
    return state.settings.QuizTrees[itemId];
  });
  return useMemo(() => {
    if (!active) return null;
    if (hidden || itemId === null) return EMPTY;
    return rootIdsFromTree(tree);
  }, [active, hidden, itemId, tree]);
};
