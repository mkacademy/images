import type { AppDispatch } from '../store';
import type { MetadataPayload } from './actions';
import type { ResultPayload } from '../store/slices/rowSlice';
import {
  applyHydrateMetadata,
  applyHydrateRows,
  type HydrationStoreUpdate,
} from '../store/thunks/applyHydration';

const HYDRATION_STORE_FLUSH_MS = 1000;

let rowsBuffer = new Map<string, ResultPayload>();
let metadataBuffer = new Map<string, MetadataPayload>();
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let dispatchRef: AppDispatch | null = null;

export const bindHydrationPayloadDispatch = (dispatch: AppDispatch): void => {
  dispatchRef = dispatch;
};

const rowsBufferKey = (payload: ResultPayload): string =>
  `${payload.entity}:${payload.parent ?? ''}`;

const metadataBufferKey = (payload: MetadataPayload): string =>
  `${payload.orig.toLowerCase()}:${payload.dest.toLowerCase()}`;

const mergeRows = (existing: ResultPayload, incoming: ResultPayload): ResultPayload => ({
  ...incoming,
  payload: [...existing.payload, ...incoming.payload],
});

const mergeMetadata = (existing: MetadataPayload, incoming: MetadataPayload): MetadataPayload => ({
  ...incoming,
  data: [...existing.data, ...incoming.data],
});

const hasBufferedItems = (): boolean =>
  rowsBuffer.size > 0 || metadataBuffer.size > 0;

const scheduleFlush = (): void => {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushHydrationStoreBuffer();
    if (hasBufferedItems()) scheduleFlush();
  }, HYDRATION_STORE_FLUSH_MS);
};

export const enqueueHydrationStoreUpdate = (update: HydrationStoreUpdate): void => {
  const rowsKey = rowsBufferKey(update.rows);
  const existingRows = rowsBuffer.get(rowsKey);
  rowsBuffer.set(rowsKey, existingRows ? mergeRows(existingRows, update.rows) : update.rows);

  const metadataKey = metadataBufferKey(update.metadata);
  const existingMetadata = metadataBuffer.get(metadataKey);
  metadataBuffer.set(
    metadataKey,
    existingMetadata ? mergeMetadata(existingMetadata, update.metadata) : update.metadata,
  );

  scheduleFlush();
};

/** Immediately applies pooled hydration payloads to the store. */
export const flushHydrationStoreBuffer = (): void => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  if (!hasBufferedItems() || !dispatchRef) return;

  for (const rows of rowsBuffer.values()) {
    applyHydrateRows(dispatchRef, rows);
  }
  for (const metadata of metadataBuffer.values()) {
    applyHydrateMetadata(dispatchRef, metadata);
  }

  rowsBuffer = new Map();
  metadataBuffer = new Map();
};

/** Clears pooled payloads without writing them to the store. */
export const resetHydrationStoreBuffer = (): void => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  rowsBuffer = new Map();
  metadataBuffer = new Map();
};
