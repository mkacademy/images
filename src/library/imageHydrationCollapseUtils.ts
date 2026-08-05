import type { RootState } from '../store';
import type { UpdatePayload } from './actions';
import type { SlideGroup } from './CourseUtils';
import {
  hasMediaBase64Payload,
  isMimeOnlyMediaUrl,
  toPermanentMediaSlotSentinel,
} from './imageUtils';

type ImageurlCarrier = { id?: number; imageurl?: string };

/** Minimal row shape from hydration fetch payloads. */
export type ImageHydrationFetchRow = {
  id?: number | string;
  imageurl?: string;
};

const collectCourseLikeInstructionRows = (content: readonly SlideGroup[]): ImageurlCarrier[] => {
  const rows: ImageurlCarrier[] = [];
  for (const slideGroup of content) {
    for (const key of Object.keys(slideGroup)) {
      if (key === 'slides') continue;
      const item = slideGroup[key as keyof SlideGroup];
      if (item != null && typeof item === 'object' && 'id' in item) {
        rows.push(item as ImageurlCarrier);
      }
    }
    for (const slideRow of slideGroup.slides ?? []) {
      rows.push(...slideRow);
    }
  }
  return rows;
};

export const findInstructionRowImageurlById = (
  state: RootState,
  id: number,
): string | undefined => {
  for (const rows of state.tutorial.content) {
    for (const row of rows) {
      if (row.id === id) return row.imageurl;
    }
  }

  for (const row of collectCourseLikeInstructionRows(state.course.content)) {
    if (row.id === id) return row.imageurl;
  }

  for (const row of collectCourseLikeInstructionRows(state.quiz.content)) {
    if (row.id === id) return row.imageurl;
  }

  return undefined;
};

/**
 * When image hydration gets no usable payload for a seek id, collapse its local mime-only
 * `imageurl` to a permanent bare sentinel so it is not re-queued. Payload is `{ id, imageurl }`
 * only — never sets `edited` / `modified`.
 */
export const buildEmptyImageHydrationCollapseUpdates = (
  seekIds: readonly number[],
  state: RootState,
): UpdatePayload[] => {
  const updates: UpdatePayload[] = [];
  for (const id of seekIds) {
    const current = findInstructionRowImageurlById(state, id);
    if (typeof current !== 'string' || !isMimeOnlyMediaUrl(current)) continue;
    const sentinel = toPermanentMediaSlotSentinel(current);
    if (!sentinel || sentinel === current) continue;
    updates.push({ id, imageurl: sentinel });
  }
  return updates;
};

/** True when a fetched instruction row carries a loadable media payload in `imageurl`. */
export const instructionRowHasHydratedMedia = (row: ImageHydrationFetchRow): boolean => {
  const imageurl = typeof row.imageurl === 'string' ? row.imageurl : '';
  return hasMediaBase64Payload(imageurl);
};

export const partitionImageHydrationRows = <T extends ImageHydrationFetchRow>(
  seekIds: readonly number[],
  rows: readonly T[],
): { hydratedRows: T[]; collapseSeekIds: number[] } => {
  const byId = new Map<number, T>();
  for (const row of rows) {
    const id = parseInt(String(row.id), 10);
    if (Number.isFinite(id) && id > 0) byId.set(id, row);
  }

  const hydratedRows: T[] = [];
  const collapseSeekIds: number[] = [];
  for (const id of seekIds) {
    const row = byId.get(id);
    if (row && instructionRowHasHydratedMedia(row)) {
      hydratedRows.push(row);
    } else {
      collapseSeekIds.push(id);
    }
  }
  return { hydratedRows, collapseSeekIds };
};
