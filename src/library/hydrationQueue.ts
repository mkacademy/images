import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { hydrationDelay } from '../utils';
import { anonymousFetch, authenticatedFetch } from './ThunksUtils';
import { deHydratedRowsDataFetcher } from './Thunks';
import type { QueryParams } from './types';
import type { RootState } from '../store';
import { hydrateData } from './actions';
import { resetHydrationQueries } from '../store/slices/sessionSlice';
import { viewRequest } from '../store/slices/viewSlice';
import {
  flushHydrationStoreBuffer,
} from './hydrationPayloadBuffer';
import {
  type HydrationLegProgress,
} from './hydrationLegUtils';
import { prependError } from '../store/slices/errorSlice';

type DeriveHydrationLegQueries = () => QueryParams[];

export const getActiveWebapp = (): string | undefined => activeWebapp;

export const clearActiveWebapp = (): void => {
  activeWebapp = undefined;
  bypassShouldHydrateSession = false;
};

const HYDRATION_BATCH_SIZE = 10;

type QueryFetcher = () => ReturnType<typeof anonymousFetch>;

export type HydrationFetchSpec = {
  fetcher: QueryFetcher;
  hydrationSeekIds: number[];
};

let activeWebapp: string | undefined;
let hydrationQueue: HydrationFetchSpec[] = [];
let hydrationQueueActive = false;
let hydrationCancelled = false;
let currentBatchTimeouts: NodeJS.Timeout[] = [];
let batchSize = 0;
let batchTimeoutsFired = 0;
let batchInFlight = 0;
let deriveNextLeg: DeriveHydrationLegQueries | null = null;
let currentLegIndex = 0;
let totalLegs = 0;
let isIncognitoSession = false;
let hydrationAttemptedSeekIds: Set<number> | null = null;
let bypassShouldHydrateSession = false;
let lifecycleDispatch: ThunkDispatch<RootState, unknown, UnknownAction> | null = null;

export const bindHydrationQueueDispatch = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
): void => {
  lifecycleDispatch = dispatch;
};

export const isBypassShouldHydrateSession = (): boolean => bypassShouldHydrateSession;

export const bindHydrationAttemptScope = (attemptedSeekIds: Set<number> | null): void => {
  hydrationAttemptedSeekIds = attemptedSeekIds;
};

export const markHydrationAttemptedSeekIds = (ids: number[]): void => {
  if (!hydrationAttemptedSeekIds) return;
  ids.forEach((id) => hydrationAttemptedSeekIds!.add(id));
};

const extractHydrationSeekIds = (query: QueryParams): number[] => {
  const seek = query.seek;
  if (!Array.isArray(seek)) return [];
  return seek.filter((id) => Number.isFinite(id) && id > 0);
};

export const isHydrationQueueActive = (): boolean =>
  deriveNextLeg !== null || hydrationQueueActive || batchInFlight > 0;

export const isHydrationCancelled = (): boolean => hydrationCancelled;

export const getHydrationInFlightCount = (): number => batchInFlight;

export const isHydrationSessionBusy = (): boolean =>
  deriveNextLeg !== null || hydrationQueueActive || batchInFlight > 0;

export const getHydrationLegProgress = (): HydrationLegProgress => ({
  currentLeg: totalLegs > 0 ? currentLegIndex + 1 : 0,
  totalLegs,
});

export const getHydrationQueueLength = (): number => {
  const undispatchedInCurrentBatch = Math.max(0, batchSize - batchTimeoutsFired);
  return hydrationQueue.length + undispatchedInCurrentBatch + batchInFlight;
};

const resetLegSessionState = (): void => {
  deriveNextLeg = null;
  currentLegIndex = 0;
  totalLegs = 0;
  isIncognitoSession = false;
};

const resetCurrentLegQueueState = (): void => {
  currentBatchTimeouts.forEach(clearTimeout);
  currentBatchTimeouts = [];
  hydrationQueue = [];
  batchSize = 0;
  batchTimeoutsFired = 0;
  batchInFlight = 0;
};

const resetHydrationQueueState = (): void => {
  resetCurrentLegQueueState();
  hydrationQueueActive = false;
  hydrationCancelled = false;
  resetLegSessionState();
  bypassShouldHydrateSession = false;
  flushHydrationStoreBuffer();
  clearActiveWebapp();
  bindHydrationAttemptScope(null);
};

export const clearHydrationQueue = (): void => {
  resetCurrentLegQueueState();
  hydrationQueue = [];
  hydrationQueueActive = false;
  hydrationCancelled = true;
  resetLegSessionState();
  flushHydrationStoreBuffer();
  lifecycleDispatch?.(resetHydrationQueries());
  bindHydrationAttemptScope(null);
  if (batchInFlight === 0) {
    hydrationCancelled = false;
    clearActiveWebapp();
  }
};

const dispatchBatch = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  batch: HydrationFetchSpec[],
): void => {
  batchSize = batch.length;
  batchTimeoutsFired = 0;
  batchInFlight = 0;
  currentBatchTimeouts = [];

  batch.forEach((spec, index) => {
    const timeout = setTimeout(() => {
      batchTimeoutsFired += 1;
      batchInFlight += 1;
      void dispatch(deHydratedRowsDataFetcher({
        fetcher: spec.fetcher,
        hydrationSeekIds: hydrationAttemptedSeekIds ? spec.hydrationSeekIds : undefined,
      }));
    }, (index + 1) * hydrationDelay);
    currentBatchTimeouts.push(timeout);
  });
};

const startLeg = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  legFetchSpecs: HydrationFetchSpec[],
): void => {
  resetCurrentLegQueueState();
  if (legFetchSpecs.length === 0) return;

  hydrationQueueActive = true;
  const firstBatch = legFetchSpecs.slice(0, HYDRATION_BATCH_SIZE);
  hydrationQueue = legFetchSpecs.slice(HYDRATION_BATCH_SIZE);
  dispatchBatch(dispatch, firstBatch);
};

const toFetchSpecs = (queries: QueryParams[]): HydrationFetchSpec[] =>
  queries.map((query) => ({
    fetcher: isIncognitoSession
      ? () => anonymousFetch(query)
      : () => authenticatedFetch(query),
    hydrationSeekIds: extractHydrationSeekIds(query),
  }));

export const startHydrationSession = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  webapp: string,
  isIncognito: boolean,
  deriveLeg: DeriveHydrationLegQueries,
  firstLegQueries: QueryParams[],
  estimatedTotalLegs: number,
  attemptedSeekIds?: Set<number>,
  bypassShouldHydrate = false,
): void => {
  bindHydrationQueueDispatch(dispatch);
  resetHydrationQueueState();
  if (firstLegQueries.length === 0) return;

  bypassShouldHydrateSession = bypassShouldHydrate;
  bindHydrationAttemptScope(attemptedSeekIds ?? null);
  hydrationQueueActive = true;
  activeWebapp = webapp;
  isIncognitoSession = isIncognito;
  deriveNextLeg = deriveLeg;
  totalLegs = estimatedTotalLegs;
  currentLegIndex = 0;
  startLeg(dispatch, toFetchSpecs(firstLegQueries));
};

const startNextLeg = (dispatch: ThunkDispatch<RootState, unknown, UnknownAction>): boolean => {
  if (!deriveNextLeg) return false;

  flushHydrationStoreBuffer();
  const nextLegQueries = deriveNextLeg();
  if (nextLegQueries.length === 0) {
    deriveNextLeg = null;
    return false;
  }

  currentLegIndex += 1;
  // Count this leg's queries so progress / idle detection span the full multi-leg session.
  dispatch(hydrateData(nextLegQueries.length));
  startLeg(dispatch, toFetchSpecs(nextLegQueries));
  return true;
};

const finishCancelledInFlight = (): void => {
  if (batchInFlight === 0) {
    hydrationCancelled = false;
    clearActiveWebapp();
  }
};

/** Called after each deHydratedRowsDataFetcher settles (replaces controlPanel middleware). */
export const onHydrationQueryComplete = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  errorMessage?: string,
): void => {
  if (errorMessage && !isHydrationCancelled()) {
    dispatch(prependError(errorMessage));
  }

  if (batchInFlight <= 0) return;

  batchInFlight -= 1;

  if (hydrationCancelled) {
    finishCancelledInFlight();
    return;
  }

  if (!hydrationQueueActive) return;
  if (batchInFlight > 0 || batchTimeoutsFired < batchSize) return;

  currentBatchTimeouts = [];

  if (hydrationQueue.length === 0) {
    if (startNextLeg(dispatch)) return;
    hydrationQueueActive = false;
    deriveNextLeg = null;
    return;
  }

  const nextBatch = hydrationQueue.splice(0, HYDRATION_BATCH_SIZE);
  dispatchBatch(dispatch, nextBatch);
};

export const onHydrationSessionIdle = (
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  getState: () => RootState,
): void => {
  if (getActiveWebapp() && !isHydrationCancelled()) {
    const { session: { hydrationQueries }, view: { requestIsProcessing } } = getState();
    // Fulfilled/rejected has not decremented yet; account for the query that just settled.
    const remaining = hydrationQueries - 1;
    if (remaining <= 0 && !requestIsProcessing && !isHydrationSessionBusy()) {
      flushHydrationStoreBuffer();
      clearActiveWebapp();
      dispatch(viewRequest({ completed: true }));
    }
  }
};
