import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import type { HydrateContentWebapp } from '../store/thunks/hydrateContent';
import { isHydrationSessionBusy } from '../library/hydrationQueue';
import {
  getImageHydrationKey,
  isImageHydrationBusy,
  startImageHydration,
  supersedeImageHydration,
} from '../library/imageHydrationQueue';
import {
  createImageHydrationLegDeriver,
  estimateImageHydrationLegCount,
  estimateImageHydrationQueryCount,
  getInstructionsParentFromRoute,
} from '../library/imageHydrationUtils';

const buildImageHydrationKey = (
  webapp: string,
  bannerId: number,
  route: string,
  chapters: number[],
  followupId: number | undefined,
): string => `${webapp}:${bannerId}:${route}:${chapters.join(',')}:${followupId ?? ''}`;

/** Starts serial take=1 image hydration for the opened instructions container after main hydration completes. */
export function useImageHydration(
  webapp: HydrateContentWebapp,
  bannerId: number,
  enabled: boolean,
): void {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const hydrationQueries = useSelector((state: RootState) => state.session.hydrationQueries);
  const curApp = useSelector((state: RootState) => state.session.curApp);
  const isIncognito = useSelector((state: RootState) => state.session.isIncognito);
  const route = useSelector((state: RootState) => state.pagination.selectedRoutes[curApp] ?? '');
  const chapters = useSelector((state: RootState) => state.course.chapters);
  const followupId = useSelector((state: RootState) => state.quiz.followupId);

  useEffect(() => {
    const routeParent = getInstructionsParentFromRoute(route);
    const key = buildImageHydrationKey(webapp, bannerId, route, chapters, followupId);
    const shouldRun = enabled && bannerId > 0 && routeParent !== null;
    const mainHydrationIdle = hydrationQueries === 0 && !isHydrationSessionBusy();

    if (!shouldRun) {
      supersedeImageHydration();
      return;
    }

    const activeKey = getImageHydrationKey();
    if (activeKey && activeKey !== key) {
      supersedeImageHydration();
    }

    if (!mainHydrationIdle) return;
    if (activeKey === key && isImageHydrationBusy()) return;
    if (activeKey === key) return;

    const getState = () => store.getState();
    const { deriveNextLeg } = createImageHydrationLegDeriver(
      getState,
      webapp,
      bannerId,
      chapters,
      followupId,
      routeParent,
    );
    const firstLegQueries = deriveNextLeg();
    if (firstLegQueries.length === 0) return;

    const estimatedTotalLegs = estimateImageHydrationLegCount(
      getState,
      webapp,
      bannerId,
      chapters,
      followupId,
      routeParent,
    );
    const estimatedTotalQueries = estimateImageHydrationQueryCount(
      getState,
      webapp,
      bannerId,
      chapters,
      followupId,
      routeParent,
    );

    startImageHydration(
      dispatch,
      key,
      deriveNextLeg,
      firstLegQueries,
      estimatedTotalLegs,
      estimatedTotalQueries,
      isIncognito,
    );
  }, [
    dispatch,
    store,
    webapp,
    bannerId,
    route,
    chapters,
    followupId,
    hydrationQueries,
    enabled,
    isIncognito,
  ]);

  useEffect(() => () => {
    supersedeImageHydration();
  }, []);
}
