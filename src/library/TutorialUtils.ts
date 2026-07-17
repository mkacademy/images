import type { Draft } from 'immer';
import { Metadata } from '../utils';
import type { TutorialTrees } from './controlPanelUtils';
import {
  contiguousOrdinalBannersPred,
  contiguousOrdinalContentPred,
  mergeSlides,
  orderPredicate,
  sorter,
  tutorialBannerDedupKey,
} from './sliceUtils';

/**
 * Tracks ordinal edits from UI reorder reducers: item kind → parent banner id (-1 if absent) →
 * append-only batches of { entityId → new ordinal }.
 */
export interface TutorialState {
  selected: number;
  noTutorials: boolean;
  content: Content[][];
  banners: Banner[];
}

export interface Banner {
  id: number;
  sender?: string;
  owner: boolean;
  quote: string;
  title: string;
  ordinal: number;
  filterId?: number;
  bannerId?: number;
  metadata?: Metadata;
  sizeInBytes: number;
  isDismissed: boolean;
  isHighlighted: boolean;
  status: number;
  contiguousOrdinal?: number;
  descendentsSums: Record<string, number>;
  modified?: boolean;
  edited?: boolean;
}

export interface Content {
  id: number;
  sender?: string;
  owner: boolean;
  title: string;
  ordinal: number;
  content: string;
  bannerId: number;
  imageurl: string;
  metadata?: Metadata;
  sizeInBytes: number;
  isHighlighted: boolean;
  status: number;
  contiguousOrdinal?: number;
  descendentsSums: Record<string, number>;
  isDismissed: boolean;
  modified?: boolean;
  edited?: boolean;
}

export interface dismissTutorialPayload {
  ids: number[];
  isShow?: boolean;
  isDismissed?: boolean;
}

export interface SetTutorialsPayload {
  TreesId?: number;
  banners: Banner[];
  content: Content[][];
  Trees?: TutorialTrees;
}

export type WritableContent = Draft<Content>;
export type WritableBanner = Draft<Banner>;
export type WritableContentArray = Draft<Content[]>;

export function findTutorialContentRow(
  content: WritableContentArray[],
  id: number,
): WritableContentArray | null {
  for (const row of content) {
    if (row.some((slide) => slide.id === id)) return row;
  }
  return null;
}

export const tutorialSlideExists = (
  content: WritableContentArray[],
  id: number,
  bannerId: number,
) =>
  content.some((row) =>
    row.some((slide) => slide.id === id && slide.bannerId === bannerId),
  );

/** Assign unique contiguous ordinals across all tutorial content rows (flat order). */
export function assignTutorialContentContiguousOrdinals(
  content: WritableContentArray[],
): WritableContentArray[] {
  let offset = 0;
  return content.map((row) => {
    const sorted = sorter([...row]) as WritableContentArray;
    const updated = contiguousOrdinalContentPred(sorted as Content[], offset) as WritableContentArray;
    offset += updated.length;
    return updated;
  });
}

export const applySetTutorials = (state: TutorialState, payload: SetTutorialsPayload) => {
  const { banners: newBanners = [], content: newContent = [] } = payload;
  const newBannerState = contiguousOrdinalBannersPred(
    Object.values(
      [...newBanners, ...state.banners].reduce((prev, cur) => {
        prev[tutorialBannerDedupKey(cur)] = cur;
        return prev;
      }, {} as Record<string, Banner>)
    ).sort(orderPredicate)
  );
  const newNoTutorials =
    !state.banners.length ? newBannerState.length === 0 : state.noTutorials;
  if (newContent.length > 0) {
    const newContentState = mergeSlides(newContent, state.content);
    state.banners = newBannerState;
    state.noTutorials = newNoTutorials;
    state.content = assignTutorialContentContiguousOrdinals(newContentState);
  } else {
    state.banners = newBannerState;
    state.noTutorials = newNoTutorials;
  }
};
