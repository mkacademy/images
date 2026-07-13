import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { hydrationDelay } from '../utils';
import { deHydratedRowsDataFetcher } from './Thunks';
import type { QueryParams } from './types';
import type { RootState } from '../store';
import { flushHydrationStoreBuffer } from './hydrationPayloadBuffer';
import type { HydrationFetchSpec } from './hydrationQueue';
import { toImageHydrationFetchSpecs } from './imageHydrationUtils';

type DeriveImageHydrationLegQueries = () => QueryParams[];

let activeKey: string | null = null;
let deriveNextLeg: DeriveImageHydrationLegQueries | null = null;
let legQueue: HydrationFetchSpec[] = [];
let currentLegIndex = 0;
let totalLegs = 0;
let totalQueries = 0;
let completedQueries = 0;
let itemsInCurrentLeg = 0;
let itemIndexInLeg = 0;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let isIncognitoSession = false;

type PendingImageHydrationStart = {
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>;
  key: string;
  deriveLeg: DeriveImageHydrationLegQueries;
  firstLegQueries: QueryParams[];
  estimatedTotalLegs: number;
  estimatedTotalQueries: number;
  isIncognito: boolean;
};

let pendingRestart: PendingImageHydrationStart | null = null;

const clearPendingTimeout = (): void => {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
};

export const getImageHydrationKey = (): string | null => activeKey;

export const isImageHydrationBusy = (): boolean =>
  inFlight || pendingTimeout !== null || activeKey !== null;

export const supersedeImageHydration = (): void => {
  if (!activeKey && !deriveNextLeg && legQueue.length === 0 && !inFlight) return;
  clearPendingTimeout();
  legQueue = [];
  deriveNextLeg = null;
  activeKey = null;
  pendingRestart = null;
  flushHydrationStoreBuffer();
};

const tryPendingRestart = (): void => {
  if (inFlight || pendingTimeout || !pendingRestart) return;
  const pending = pendingRestart;
  pendingRestart = null;
  startImageHydration(
    pending.dispatch,
    pending.key,
    pending.deriveLeg,
    pending.firstLegQueries,
    pending.estimatedTotalLegs,
    pending.estimatedTotalQueries,
    pending.isIncognito,
  );
};

const finishSession = (): void => {
  flushHydrationStoreBuffer();
  if (activeKey) {
    console.log('[ImageHydration] done', activeKey);
  }
  activeKey = null;
  deriveNextLeg = null;
  legQueue = [];
  inFlight = false;
  tryPendingRestart();
};

const scheduleNext = (dispatch: ThunkDispatch<RootState, unknown, UnknownAction>): void => {
  clearPendingTimeout();
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    void runNext(dispatch);
  }, hydrationDelay);
};

const startCurrentLeg = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  specs: HydrationFetchSpec[],
): void => {
  legQueue = [...specs];
  itemsInCurrentLeg = specs.length;
  itemIndexInLeg = 0;
  if (legQueue.length === 0) {
    void advanceLeg(dispatch);
    return;
  }
  scheduleNext(dispatch);
};

const advanceLeg = async (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
): Promise<void> => {
  const sessionKey = activeKey;
  if (!sessionKey || !deriveNextLeg) {
    finishSession();
    return;
  }

  flushHydrationStoreBuffer();
  const nextLegQueries = deriveNextLeg();
  if (nextLegQueries.length === 0) {
    finishSession();
    return;
  }

  currentLegIndex += 1;
  console.log('[ImageHydration] leg', `${currentLegIndex}/${totalLegs}`, sessionKey);
  startCurrentLeg(dispatch, toImageHydrationFetchSpecs(nextLegQueries, isIncognitoSession));
};

const runNext = async (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
): Promise<void> => {
  const sessionKey = activeKey;
  if (!sessionKey) return;

  if (legQueue.length === 0) {
    await advanceLeg(dispatch);
    return;
  }

  const spec = legQueue.shift()!;
  inFlight = true;
  itemIndexInLeg += 1;
  completedQueries += 1;

  try {
    await dispatch(deHydratedRowsDataFetcher({
      fetcher: spec.fetcher,
      hydrationSeekIds: spec.hydrationSeekIds,
      skipQueueLifecycle: true,
    })).unwrap();
  } catch {
    // Continue serial queue after per-item failure.
  } finally {
    inFlight = false;
    console.log(
      '[ImageHydration]',
      `${completedQueries}/${totalQueries}`,
      sessionKey,
      `leg ${currentLegIndex}/${totalLegs} item ${itemIndexInLeg}/${itemsInCurrentLeg}`,
    );
  }

  if (activeKey !== sessionKey) {
    tryPendingRestart();
    return;
  }

  if (legQueue.length === 0) {
    await advanceLeg(dispatch);
    return;
  }

  scheduleNext(dispatch);
};

export const startImageHydration = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  key: string,
  deriveLeg: DeriveImageHydrationLegQueries,
  firstLegQueries: QueryParams[],
  estimatedTotalLegs: number,
  estimatedTotalQueries: number,
  isIncognito: boolean,
): void => {
  if (key === activeKey && (inFlight || legQueue.length > 0 || deriveNextLeg !== null)) {
    return;
  }

  if (inFlight || pendingTimeout) {
    pendingRestart = {
      dispatch,
      key,
      deriveLeg,
      firstLegQueries,
      estimatedTotalLegs,
      estimatedTotalQueries,
      isIncognito,
    };
    return;
  }

  clearPendingTimeout();
  deriveNextLeg = deriveLeg;
  activeKey = key;
  currentLegIndex = 1;
  totalLegs = Math.max(1, estimatedTotalLegs);
  totalQueries = estimatedTotalQueries;
  completedQueries = 0;
  isIncognitoSession = isIncognito;
  legQueue = [];

  const firstSpecs = toImageHydrationFetchSpecs(firstLegQueries, isIncognito);
  if (firstSpecs.length === 0) {
    activeKey = null;
    deriveNextLeg = null;
    return;
  }

  console.log('[ImageHydration] start', key, `legs ${totalLegs}`, `queries ${totalQueries}`);
  console.log('[ImageHydration] leg', `1/${totalLegs}`, key);
  startCurrentLeg(dispatch, firstSpecs);
};
