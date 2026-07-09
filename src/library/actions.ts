import { createAction } from '@reduxjs/toolkit';
import type { Metadata, Status } from '../types/cpanel';
import type { StatsMiddlewareState } from '../store/types';
import type { Executedquery, FetchDataPayload } from './ThunksUtils';
import type { OwnershipPayload } from './middlewareTypes';

/** Hydration + slice merge payloads */
export interface UpdatePayload {
  id: number;
  quote?: string;
  title?: string;
  ordinal?: number;
  content?: string;
  imageurl?: string;
  bannerId?: number;
  filterId?: number;
  sizeInBytes?: number;
  isDismissed?: boolean;
  isHighlighted?: boolean;
  status?: Status | number;
  descendentsSums?: Record<string, number>;
  modified?: boolean;
  edited?: boolean;
}

export interface OrdinalUpdate {
  id: number;
  ordinal: number;
  bannerIds: number[];
}

export interface MetadataUpdate {
  id: number;
  owner: boolean;
  ordinal: number;
  bannerId?: number;
}

export interface MetadataPayload {
  interaction?: boolean;
  data: Metadata[];
  GUID?: string;
  orig: string;
  dest: string;
}

export interface erasePayload {
  Ids?: number[] | string[];
  IDs?: number[];
  route?: string;
  isShow: boolean;
}

export interface InitReloadingPayload {
  isAppend?: boolean;
  isPrivate?: boolean;
  isFetching?: boolean;
  isIncognito?: boolean;
}

export interface InsertStatsPayload {
  screen: string;
  state: StatsMiddlewareState;
  totals: Record<string, number>;
  counts: Record<string, Record<string, number>>;
  query: Record<string, Record<string, Executedquery>>;
  requestId?: string;
}

export { type OwnershipPayload } from './middlewareTypes';

export const isPersistableOrdinal = (ordinal: number): boolean =>
  Number.isFinite(ordinal) && ordinal >= 0;

export const sanitizeNumericOrdinalBatch = (
  batch: Record<number, number>,
): Record<number, number> => {
  const sanitized: Record<number, number> = {};
  for (const [idStr, ordinal] of Object.entries(batch)) {
    if (isPersistableOrdinal(ordinal)) sanitized[Number(idStr)] = ordinal;
  }
  return sanitized;
};

export const sanitizeStringKeyOrdinalBatch = (
  batch: Record<string, number>,
): Record<string, number> => {
  const sanitized: Record<string, number> = {};
  for (const [key, ordinal] of Object.entries(batch)) {
    if (isPersistableOrdinal(ordinal)) sanitized[key] = ordinal;
  }
  return sanitized;
};

/** Session / view lifecycle */
export const fetchingCompleted = createAction<{ dest?: string; orig?: string }>('fetchingCompleted');
export const hydrateData = createAction<number>('hydrateData');
export const hydratedThenFetch = createAction<FetchDataPayload>('hydratedThenFetch');
export const initReloading = createAction<InitReloadingPayload>('initReloading');
export const insertMetadata = createAction<MetadataPayload>('insertMetadata');

/** Hydration row + metadata merges */
export const updateTutorials = createAction<UpdatePayload[]>('updateTutorials');
export const updateCourses = createAction<UpdatePayload[]>('updateCourses');
export const updateQuizzes = createAction<UpdatePayload[]>('updateQuizzes');
export const updateSteps = createAction<UpdatePayload[]>('updateSteps');

export const updateStepsOrdinals = createAction<OrdinalUpdate[]>('updateStepsOrdinals');
export const updateCoversOrdinals = createAction<OrdinalUpdate[]>('updateCoversOrdinals');
export const updateQuestionsOrdinals = createAction<OrdinalUpdate[]>('updateQuestionsOrdinals');
export const updatePennantsOrdinals = createAction<OrdinalUpdate[]>('updatePennantsOrdinals');
export const updateRootsOrdinals = createAction<OrdinalUpdate[]>('updateRootsOrdinals');
export const updateQuizOrdinals = createAction<OrdinalUpdate[]>('updateQuizOrdinals');

export const updateStepsMetadata = createAction<MetadataUpdate[]>('updateStepsMetadata');
export const updateCoversMetadata = createAction<MetadataUpdate[]>('updateCoversMetadata');
export const updateQuestionsMetadata = createAction<MetadataUpdate[]>('updateQuestionsMetadata');
export const updatePennantsMetadata = createAction<MetadataUpdate[]>('updatePennantsMetadata');
export const updateRootsMetadata = createAction<MetadataUpdate[]>('updateRootsMetadata');
export const updateQuizMetadata = createAction<MetadataUpdate[]>('updateQuizMetadata');
export const updateAnswersMetadata = createAction<MetadataUpdate[]>('updateAnswersMetadata');

/** Comms hydration (cross-slice updates still referenced by commsSlice extraReducers) */
export const updateBosses = createAction<UpdatePayload[]>('updateBosses');
export const updateUnderbosses = createAction<UpdatePayload[]>('updateUnderbosses');
export const updateMinions = createAction<UpdatePayload[]>('updateMinions');

/** Editor tree-selection dispatches (no-op in viewer; kept for layout prop compatibility) */
export const TutorialRootTreeSelection = createAction<{ ids: number[]; isHighlighted?: boolean }>('TutorialRootTreeSelection');
export const CourseRootTreeSelection = createAction<{ ids: number[]; isHighlighted?: boolean }>('CourseRootTreeSelection');
export const QuizRootTreeSelection = createAction<{ ids: number[]; isHighlighted?: boolean }>('QuizRootTreeSelection');
export const CoursePennantTreeSelection = createAction<{ ids: number[]; isHighlighted?: boolean }>('CoursePennantTreeSelection');
export const QuizQuestionTreeSelection = createAction<{ ids: number[]; isHighlighted?: boolean }>('QuizQuestionTreeSelection');

/** Bottom-left o on quiz questions: toggles dashboardsfilters ↔ dashboardssifters. */
export const toggleQuizQuestionSubmissionRoute = createAction<{ bannerId: number }>('toggleQuizQuestionSubmissionRoute');
/** Bottom-right o on quiz questions: toggles dashboardssifters ↔ siftersinstructions. */
export const toggleQuizQuestionOptionsRoute = createAction<{ bannerId: number }>('toggleQuizQuestionOptionsRoute');
/** Bottom-left o on quiz follow-ups: toggles siftersfilters ↔ dashboardsfilters. */
export const toggleQuizFollowupSubmissionRoute = createAction<{ bannerId: number }>('toggleQuizFollowupSubmissionRoute');
/** Bottom-right o on quiz follow-ups: toggles siftersfilters ↔ filtersinstructions. */
export const toggleQuizFollowupOptionsRoute = createAction<{ bannerId: number }>('toggleQuizFollowupOptionsRoute');
