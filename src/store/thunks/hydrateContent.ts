import { createAsyncThunk } from '@reduxjs/toolkit';
import { abortIfHydrationDisabled, handleHydrationLogic } from '../../library/hydrationUtils';
import { isDehydrated } from '../../library/controlPanelUtils';
import { getActiveWebapp } from '../../library/hydrationQueue';
import type { RootState } from '../index';

export type HydrateContentWebapp = 'tutorial' | 'course' | 'quiz';

/** Runs multi-leg hydration for active webapps (replaces hydrateData middleware path). */
export const hydrateContent = createAsyncThunk(
  'content/hydrateContent',
  async (webapps: HydrateContentWebapp[] | undefined, { dispatch, getState }) => {
    const state = getState() as RootState;
    if (abortIfHydrationDisabled(() => state)) return { started: false };

    const targets: HydrateContentWebapp[] = webapps ?? [];
    if (targets.length === 0) {
      const { isUnzipTutorials, isUnzipCourses, isUnzipQuizzes } = state.settings;
      if (isUnzipTutorials) targets.push('tutorial');
      if (isUnzipCourses) targets.push('course');
      if (isUnzipQuizzes) targets.push('quiz');
    }

    for (const webapp of targets) {
      if (getActiveWebapp()) break;
      handleHydrationLogic(
        webapp,
        getState as () => RootState,
        dispatch,
        [isDehydrated],
      );
    }

    return { started: targets.length > 0 };
  },
);

/** Scoped re-hydrate for dehydrated children under one banner. */
export const hydrateContainer = createAsyncThunk(
  'content/hydrateContainer',
  async (
    { webapp, bannerId }: { webapp: HydrateContentWebapp; bannerId: number },
    { dispatch, getState },
  ) => {
    const scopedDehydrated = (row: Parameters<typeof isDehydrated>[0]) =>
      isDehydrated(row) && (
        row.bannerId === bannerId ||
        row.filterId === bannerId ||
        row.sifterId === bannerId ||
        row.dashboardId === bannerId
      );

    handleHydrationLogic(
      webapp,
      getState as () => RootState,
      dispatch,
      [scopedDehydrated],
      undefined,
      undefined,
      { bypassShouldHydrate: true },
    );

    return { webapp, bannerId };
  },
);
