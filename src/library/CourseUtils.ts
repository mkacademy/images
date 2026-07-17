import { Metadata } from "../utils";
import type { CourseTrees } from "./controlPanelUtils";
import {
  sorterCourse,
  contiguousOrdinalBannersPred,
  getSlideIndeces,
  getCoverCouplingIndexes,
  mergePennants,
  orderPredicate,
  mergeSlideshows,
  courseBannerDedupKey,
  textsMerger,
  metadataUpdator,
  type CourseCouplings,
} from "./sliceUtils";
import { type MetadataUpdate, type UpdatePayload } from "./actions";

export interface SlideItem {
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
  descendentsSums: Record<string, number>;
  contiguousOrdinal?: number;
  isDismissed: boolean;
  modified?: boolean;
  edited?: boolean;
}

export interface SlideGroupItem {
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
  descendentsSums: Record<string, number>;
  contiguousOrdinal?: number;
  isDismissed: boolean;
  modified?: boolean;
  edited?: boolean;
};

export interface SlideGroup {
  [key: number]: SlideGroupItem;
  slides: SlideItem[][];
}

export interface Banner {
  id: number;
  sender?: string;
  owner: boolean;
  quote: string;
  title: string;
  ordinal: number;
  sifterId?: number;
  metadata?: Metadata;
  sizeInBytes: number;
  isDismissed: boolean;
  isHighlighted: boolean;
  status: number;
  contiguousOrdinal?: number;
  descendentsSums: Record<string, number>;
  pennants: Pennant[];
  modified?: boolean;
  bannerId?: number;
  edited?: boolean;
}

export interface Pennant {
  id: number;
  sender?: string;
  owner: boolean;
  quote: string;
  title: string;
  ordinal: number;
  bannerId: number;
  filterId?: number;
  metadata?: Metadata;
  sizeInBytes: number;
  isDismissed: boolean;
  isHighlighted: boolean;
  status: number;
  descendentsSums: Record<string, number>;
  contiguousOrdinal?: number;
  modified?: boolean;
  edited?: boolean;
}

/** One batch of id → new `ordinal` values recorded after a reorder action. */
export type CourseModifiedOrdinalBatch = Record<number, number>;

/**
 * Tracks ordinal edits from UI reorder reducers: item kind → parent id (-1 if absent) →
 * append-only batches of { entityId → new ordinal }. Parent id resolves as follows:
 * - `banner`: course banner.bannerId ?? -1 (root)
 * - `pennant`: parent course banner id
 * - `cover`: parent course banner id
 * - `slide`: parent pennant id
 */
export interface CourseState {
  /** Nested as courseId → coverId → slide indexes (guards shared cover ids across courses). */
  couplings: CourseCouplings;
  content: SlideGroup[];
  noCourses: boolean;
  banners: Banner[];
  selected: number;
  chapters: number[];
}

/** One slide row (`SlideItem[]`) that contains `slideId`, if any. Used for Ctrl+range slide reorder. */
export function findCourseSlideRowForSlideId(
  content: SlideGroup[],
  slideId: number,
): SlideItem[] | null {
  for (const group of content) {
    for (const row of group.slides ?? []) {
      if (row.some((s) => s.id === slideId)) return row;
    }
  }
  return null;
}

/** Mainslide/cover thumb entries for the slide group that contains `coverId`. */
export function findSlideGroupForCoverId(
  content: SlideGroup[],
  coverId: number,
): { groupIndex: number; entries: [string, SlideGroupItem][] } | null {
  for (let groupIndex = 0; groupIndex < content.length; groupIndex++) {
    const group = content[groupIndex];
    const entries = Object.entries(group).filter(([key, v]) => {
      if (key === 'slides') return false;
      return typeof v === 'object' && v !== null && 'id' in v && 'ordinal' in v;
    }) as [string, SlideGroupItem][];
    if (entries.some(([, v]) => v.id === coverId)) return { groupIndex, entries };
  }
  return null;
}

export interface SetCoursesPayload {
  TreesId?: number;
  banners: Banner[];
  content: SlideGroup[];
  Trees?: CourseTrees;
}

export const isSlideGroupItem = (item: unknown): item is SlideGroupItem =>
  typeof item === 'object' &&
  item !== null &&
  !Array.isArray(item) &&
  'id' in item &&
  'bannerId' in item &&
  'ordinal' in item;

export const getBannerChaptersCouplings = (
  { content, couplings }: Pick<CourseState, 'content' | 'couplings'>,
  bannerId: number
): number[][] =>
  content
    .flatMap((group) =>
      Object.values(group).filter(
        (item): item is SlideGroupItem => isSlideGroupItem(item) && item.bannerId === bannerId
      )
    )
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((item) => getCoverCouplingIndexes(couplings, bannerId, item.id))
    .filter((coupling) => coupling.length > 0);

/**
 * Same resolution as setChaptersViaSlideId. Use to decide whether a slide can enable chapter mode.
 * - `ok` — coupling has at least one index; safe to dispatch setChaptersViaSlideId.
 * - `no-coupling` — slide is in the selected course’s content but couplings are missing/empty; warn user.
 * - `no-context` — reducer would no-op (e.g. wrong course selected); do not show a coupling warning.
 */
export const resolveChaptersForSlideInSelectedCourse = (
  state: Pick<CourseState, 'selected' | 'banners' | 'content' | 'couplings'>,
  slideId: number
): 'ok' | 'no-coupling' | 'no-context' => {
  if (state.selected < 0) return 'no-context';
  const selectedBanner = state.banners[state.selected];
  if (!selectedBanner) return 'no-context';
  const selectedContent = state.content.find((group) => group[0]?.bannerId === selectedBanner.id);
  if (!selectedContent) return 'no-context';
  const matched = Object.values(selectedContent).find(
    (item): item is SlideGroupItem => isSlideGroupItem(item) && item.id === slideId
  );
  if (!matched) return 'no-context';
  const c = getCoverCouplingIndexes(state.couplings, selectedBanner.id, matched.id);
  if (c.length > 0) return 'ok';
  return 'no-coupling';
};

/**
 * Slide-group item (cover) whose couplings row applies to this pennant — same pairing rules as {@link getSlideIndeces}.
 */
export const getSlideGroupItemForPennantChapterCoupling = (
  selectedContent: SlideGroup,
  pennant: Pennant
): SlideGroupItem | undefined => {
  const slides = selectedContent.slides ?? [];
  for (const value of Object.values(selectedContent)) {
    if (!isSlideGroupItem(value)) continue;
    if (value.bannerId !== pennant.bannerId || value.ordinal !== pennant.ordinal) continue;
    const hasPennantSlide = slides.some(
      (slideArray) => slideArray.length > 0 && slideArray[0].bannerId === pennant.id
    );
    if (hasPennantSlide) return value;
  }
  return undefined;
};

/** True if the course slide matrix has at least one row whose first slide uses this pennant id. */
export const pennantHasAssignedSlideRowsInGroup = (
  selectedContent: SlideGroup,
  pennantId: number
): boolean =>
  (selectedContent.slides ?? []).some(
    (slideArray) => slideArray.length > 0 && slideArray[0].bannerId === pennantId
  );

/**
 * One pass over the course slide matrix: count slide items per {@link SlideItem.bannerId} (pennant id).
 * Only rows matching `predicate` are included (e.g. same dismissed / active filter as chapter rows).
 */
export const countSlideItemsByBannerId = (
  slides: SlideItem[][],
  predicate: (item: SlideItem) => boolean
): Map<number, number> => {
  const counts = new Map<number, number>();
  for (const row of slides) {
    if (!row) continue;
    for (const item of row) {
      if (!predicate(item)) continue;
      const { bannerId } = item;
      counts.set(bannerId, (counts.get(bannerId) ?? 0) + 1);
    }
  }
  return counts;
};

export type ResolveSlidesForChapterInSelectedCourseResult =
  | 'ok'
  | 'no-slides'
  | 'no-context'
  | 'no-ordinal-match'
  | 'no-coupling';

/**
 * Reverse of {@link resolveChaptersForSlideInSelectedCourse}: resolve chapter coupling from a pennant id
 * (same key as {@link getSlideIndeces} / setChaptersViaSlideId, but keyed by pennant).
 *
 * - `no-ordinal-match` — pennant has slide rows in the course group, but no slide-group item
 *   shares its banner/ordinal pairing (cannot attach chapter coupling to a cover).
 */
export const resolveSlidesForChapterInSelectedCourse = (
  state: Pick<CourseState, 'selected' | 'banners' | 'content' | 'couplings'>,
  pennantId: number
): ResolveSlidesForChapterInSelectedCourseResult => {
  if (state.selected < 0) return 'no-context';
  const selectedBanner = state.banners[state.selected];
  if (!selectedBanner) return 'no-context';
  const pennant = selectedBanner.pennants?.find((p) => p.id === pennantId);
  if (!pennant) return 'no-context';
  const selectedContent = state.content.find((group) => group[0]?.bannerId === selectedBanner.id);
  if (!selectedContent) return 'no-context';
  const matched = getSlideGroupItemForPennantChapterCoupling(selectedContent, pennant);
  if (!matched) {
    if (pennantHasAssignedSlideRowsInGroup(selectedContent, pennantId))
      return 'no-ordinal-match';
    return 'no-slides';
  }
  const c = getCoverCouplingIndexes(state.couplings, selectedBanner.id, matched.id);
  if (c.length > 0) return 'ok';
  return 'no-coupling';
};

export const applySetChaptersViaSlideId = (state: CourseState, slideId: number): void => {
  if (state.selected < 0 || (state.chapters && state.chapters.length > 0)) return;
  const selectedBanner = state.banners[state.selected];
  if (!selectedBanner) return;
  const selectedContent = state.content.find((group) => group[0]?.bannerId === selectedBanner.id);
  if (!selectedContent) return;
  const matchedSlideGroupItem = Object.values(selectedContent).find(
    (item): item is SlideGroupItem => isSlideGroupItem(item) && item.id === slideId
  );
  if (!matchedSlideGroupItem) return;
  state.chapters = getCoverCouplingIndexes(
    state.couplings,
    selectedBanner.id,
    matchedSlideGroupItem.id
  );
};

export const applySetChaptersViaPennantId = (state: CourseState, pennantId: number): void => {
  if (state.selected < 0) return;
  const selectedBanner = state.banners[state.selected];
  if (!selectedBanner) return;
  const pennant = selectedBanner.pennants?.find((p) => p.id === pennantId);
  if (!pennant) return;
  const selectedContent = state.content.find((group) => group[0]?.bannerId === selectedBanner.id);
  if (!selectedContent) return;
  const matched = getSlideGroupItemForPennantChapterCoupling(selectedContent, pennant);
  if (!matched) return;
  const c = getCoverCouplingIndexes(state.couplings, selectedBanner.id, matched.id);
  if (c.length === 0) return;
  state.chapters = c;
};

export const applySetCourses = (state: CourseState, payload: SetCoursesPayload): void => {
  const { banners: newBanners = [], content: newContent = [] } = payload;
  const mergedBanners = [...newBanners, ...state.banners].reduce((prev, cur) => {
    const id = courseBannerDedupKey(cur);
    const curPennants = prev[id]?.pennants;
    prev[id] =
      curPennants === undefined
        ? cur
        : {
            ...cur,
            pennants: mergePennants({
              pennants: curPennants,
              newPennants: cur.pennants,
            }) as Pennant[],
          };
    return prev;
  }, {} as Record<string, Banner>);

  const stateBanner = contiguousOrdinalBannersPred(
    Object.values(mergedBanners).sort(orderPredicate)
  ) as Banner[];
  state.noCourses = stateBanner.length === 0;
  state.banners = stateBanner;
  if (newContent.length > 0) {
    const newContentState = mergeSlideshows(newContent, state.content).map(sorterCourse);
    state.couplings = getSlideIndeces(stateBanner, newContentState);
    state.content = newContentState;
  } else state.couplings = getSlideIndeces(stateBanner, state.content);
};

export const applyUpdateSteps = (state: CourseState, payload: UpdatePayload[]): void => {
  const { content } = state;
  const nState = content.map((steps: SlideGroup) =>
    Object.entries(steps)
      .map(([key, row]: [string, SlideGroupItem | SlideItem[][]]) => {
        if (key === "slides") {
          const predicate = (row: SlideItem) => ({
            ...row,
            ...textsMerger(payload)(row),
          });
          const mapped = (row as SlideItem[][]).map((rows: SlideItem[]) => rows.map(predicate));
          return [key, mapped];
        }
        const updates = textsMerger(payload)(row as SlideGroupItem);
        return [key, { ...row, ...updates }];
      })
      .reduce(
        (prev: SlideGroup, [key, value]) => ({ ...prev, [key as keyof SlideGroup]: value }),
        {} as SlideGroup
      )
  );
  state.content = nState;
};

export const applyUpdateCoversMetadata = (state: CourseState, payload: MetadataUpdate[]): void => {
  const { content } = state;
  const nState = content.map(({ slides, ...fields }: SlideGroup) => {
    const updatedFields = Object.entries(fields).reduce(
      (acc, [key, value]) => {
        if (typeof value === "object" && value !== null && "ordinal" in value)
          acc[key] = metadataUpdator(payload, true)(value);
        else acc[key] = value;
        return acc;
      },
      {} as { [x: number]: SlideGroupItem }
    );

    return {
      ...updatedFields,
      slides,
    };
  });
  state.content = nState;
  state.couplings = getSlideIndeces(state.banners, nState);
};
