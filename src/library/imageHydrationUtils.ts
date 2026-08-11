import type { RootState } from '../store';
import type { QueryParams } from './types';
import { isMarkdownDataUrl, isMimeOnlyMediaUrl } from './imageUtils';
import {
  getFiltersInstructions,
  getFixedSizeQueries,
  getSiftersInstructions,
  resolveHydrationSessionOptions,
} from './hydrationUtils';
import {
  estimateLegCount,
  takeFirstLegQueries,
} from './hydrationLegUtils';
import { anonymousFetch, authenticatedFetch } from './ThunksUtils';
import type { HydrationFetchSpec } from './hydrationQueue';
import type { HydrateContentWebapp } from '../store/thunks/hydrateContent';
import type { Content as TutorialContent } from './TutorialUtils';
import type { SlideItem, SlideGroupItem } from './CourseUtils';
import { ROW_APPEND_QUERY_TYPE } from '../store/slices/rowSlice';
import { getPennantIdsFromSelectedChapters } from './imageHydrationScope';

export type InstructionsRouteParent = 'filters' | 'sifters' | 'all';

export type ImageHydrationItem = {
  id: number;
  bannerId?: number;
  imageurl?: string;
};

/**
 * Images repo hydrates typed mime-only image + markdown slots
 * (`data:image/…`, `data:text/markdown`). Audio/video are not queued.
 * Bare sentinels (`data:image` / `data:text`) are never queued.
 */
export const isDehydratedImage = (item: ImageHydrationItem): boolean => {
  if (typeof item.imageurl !== 'string') return false;
  const url = item.imageurl;
  if (!url.startsWith('data:image') && !isMarkdownDataUrl(url)) return false;
  return isMimeOnlyMediaUrl(url);
};

export const getInstructionsParentFromRoute = (route: string): InstructionsRouteParent | null => {
  if (!route.endsWith('instructions')) return null;
  if (route.endsWith('filtersinstructions')) return 'filters';
  if (route.endsWith('siftersinstructions')) return 'sifters';
  return 'all';
};

const buildQueryTemplate = (state: RootState, webapp: string): QueryParams => {
  const {
    session: { isIncognito, isPrivate, fetchRole, curMailer, curToken },
  } = state;
  const baseParams: QueryParams = {
    limit: { take: 1, skip: 0 },
    type: ROW_APPEND_QUERY_TYPE,
    isPrivateView: false,
    hasCounts: false,
    entity: '',
    parent: '',
    seek: [],
    IDs: [],
  };
  if (isIncognito) return baseParams;
  return {
    ...baseParams,
    convolution: webapp,
    isPrivateView: !!curToken || isPrivate,
    mutateRole: fetchRole,
    mailer: curMailer,
    hasCounts: false,
    curToken,
  };
};

const belongsToAllowedParents = (
  row: ImageHydrationItem,
  allowedParentIds: Set<number>,
): boolean => row.bannerId !== undefined && allowedParentIds.has(row.bannerId);

export const buildContainerInstructionsQueries = (
  state: RootState,
  webapp: HydrateContentWebapp,
  bannerId: number,
  chapters: number[],
  followupId: number | undefined,
  routeParent: InstructionsRouteParent,
): QueryParams[] => {
  const { tutorial, course, quiz } = state;
  const queryTemplate = buildQueryTemplate(state, webapp);
  const queries: QueryParams[] = [];

  const imagePredicate = <T extends ImageHydrationItem>(
    allowedParentIds: Set<number>,
  ) => (item: T) => isDehydratedImage(item) && belongsToAllowedParents(item, allowedParentIds);

  const includeFilters = routeParent === 'filters' || routeParent === 'all';
  const includeSifters = routeParent === 'sifters' || routeParent === 'all';

  switch (webapp) {
    case 'tutorial': {
      if (!includeFilters) break;
      const allowed = new Set([bannerId]);
      const query = { ...queryTemplate, parent: 'filters', entity: 'instructions' };
      queries.push(
        ...getFiltersInstructions(
          tutorial.content,
          query,
          imagePredicate<TutorialContent>(allowed),
        ),
      );
      break;
    }
    case 'course': {
      const selectedBanner = course.banners.find((banner) => banner.id === bannerId);
      if (!selectedBanner) break;

      if (includeSifters) {
        const allowed = new Set([bannerId]);
        const query = { ...queryTemplate, parent: 'sifters', entity: 'instructions' };
        queries.push(
          ...getSiftersInstructions(
            course.content,
            query,
            imagePredicate<SlideGroupItem>(allowed),
          ),
        );
      }

      if (includeFilters) {
        const chapterPennantIds = chapters.length > 0
          ? getPennantIdsFromSelectedChapters(course)
          : [];
        const pennantIds = chapterPennantIds.length > 0
          ? chapterPennantIds
          : selectedBanner.pennants.map((pennant) => pennant.id);
        const allowed = new Set(pennantIds);
        const query = { ...queryTemplate, parent: 'filters', entity: 'instructions' };
        queries.push(
          ...getFiltersInstructions(
            course.content,
            query,
            imagePredicate<SlideItem>(allowed),
          ),
        );
      }
      break;
    }
    case 'quiz': {
      const selectedQuiz = quiz.quizzes.find((item) => item.id === bannerId);
      if (!selectedQuiz) break;

      const sifterBannerIds = quiz.banners
        .filter((banner) => banner.bannerId === bannerId)
        .map((banner) => banner.id);

      if (includeSifters && sifterBannerIds.length > 0) {
        const allowed = new Set(sifterBannerIds);
        const query = { ...queryTemplate, parent: 'sifters', entity: 'instructions' };
        queries.push(
          ...getSiftersInstructions(
            quiz.content,
            query,
            imagePredicate<SlideGroupItem>(allowed),
          ),
        );
      }

      if (includeFilters) {
        let pennantIds: number[];
        if (followupId !== undefined) {
          const followupBanner = quiz.banners.find((banner) => banner.id === followupId);
          pennantIds = followupBanner?.pennants.map((pennant) => pennant.id) ?? [];
        } else {
          pennantIds = quiz.banners
            .filter((banner) => banner.bannerId === bannerId)
            .flatMap((banner) => banner.pennants.map((pennant) => pennant.id));
        }
        if (pennantIds.length === 0) break;
        const allowed = new Set(pennantIds);
        const query = { ...queryTemplate, parent: 'filters', entity: 'instructions' };
        queries.push(
          ...getFiltersInstructions(
            quiz.content,
            query,
            imagePredicate<SlideItem>(allowed),
          ),
        );
      }
      break;
    }
    default:
      break;
  }

  return getFixedSizeQueries(queries, 1);
};

export type ImageHydrationLegDeriver = () => QueryParams[];

export const createImageHydrationLegDeriver = (
  getState: () => RootState,
  webapp: HydrateContentWebapp,
  bannerId: number,
  chapters: number[],
  followupId: number | undefined,
  routeParent: InstructionsRouteParent,
): { deriveNextLeg: ImageHydrationLegDeriver; maxQueriesPerLeg: number } => {
  const { maxQueriesPerLeg } = resolveHydrationSessionOptions(getState);

  const deriveNextLeg: ImageHydrationLegDeriver = () => {
    const ordered = buildContainerInstructionsQueries(
      getState(),
      webapp,
      bannerId,
      chapters,
      followupId,
      routeParent,
    );
    return takeFirstLegQueries(ordered, maxQueriesPerLeg);
  };

  return { deriveNextLeg, maxQueriesPerLeg };
};

export const estimateImageHydrationLegCount = (
  getState: () => RootState,
  webapp: HydrateContentWebapp,
  bannerId: number,
  chapters: number[],
  followupId: number | undefined,
  routeParent: InstructionsRouteParent,
): number => {
  const { maxQueriesPerLeg } = resolveHydrationSessionOptions(getState);
  const ordered = buildContainerInstructionsQueries(
    getState(),
    webapp,
    bannerId,
    chapters,
    followupId,
    routeParent,
  );
  return estimateLegCount(ordered.length, maxQueriesPerLeg);
};

export const estimateImageHydrationQueryCount = (
  getState: () => RootState,
  webapp: HydrateContentWebapp,
  bannerId: number,
  chapters: number[],
  followupId: number | undefined,
  routeParent: InstructionsRouteParent,
): number =>
  buildContainerInstructionsQueries(
    getState(),
    webapp,
    bannerId,
    chapters,
    followupId,
    routeParent,
  ).length;

const extractHydrationSeekIds = (query: QueryParams): number[] => {
  const seek = query.seek;
  if (!Array.isArray(seek)) return [];
  return seek.filter((id) => Number.isFinite(id) && id > 0);
};

export const toImageHydrationFetchSpecs = (
  queries: QueryParams[],
  isIncognito: boolean,
): HydrationFetchSpec[] =>
  queries.map((query) => ({
    fetcher: isIncognito
      ? () => anonymousFetch(query)
      : () => authenticatedFetch(query),
    hydrationSeekIds: extractHydrationSeekIds(query),
  }));
