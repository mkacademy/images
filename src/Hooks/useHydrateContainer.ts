import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { isDehydrated } from '../library/controlPanelUtils';
import { hydrateContainer, type HydrateContentWebapp } from '../store/thunks/hydrateContent';
import type { AppDispatch } from '../store';

/** Re-hydrates dehydrated children when a deep-linked banner is opened. */
export function useHydrateContainer(
  webapp: HydrateContentWebapp,
  bannerId: number,
  enabled: boolean,
): void {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!enabled || bannerId <= 0) return;
    dispatch(hydrateContainer({ webapp, bannerId }));
  }, [dispatch, webapp, bannerId, enabled]);
}

export function hasDehydratedChildren(
  rows: Array<{ id: number; bannerId?: number; filterId?: number; sifterId?: number; dashboardId?: number }>,
  bannerId: number,
): boolean {
  return rows.some((row) => {
    const underBanner =
      row.bannerId === bannerId ||
      row.filterId === bannerId ||
      row.sifterId === bannerId ||
      row.dashboardId === bannerId;
    return underBanner && isDehydrated(row);
  });
}
