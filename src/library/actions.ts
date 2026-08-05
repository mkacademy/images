import { createAction } from '@reduxjs/toolkit';
import type { Metadata, Status } from '../types/cpanel';
import type { FetchDataPayload } from './ThunksUtils';

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

export interface InitReloadingPayload {
  isAppend?: boolean;
  isPrivate?: boolean;
  isFetching?: boolean;
  isIncognito?: boolean;
}

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
/** Hydration fills / empty-miss collapses for *instructions; does not set `edited`. */
export const mediaHydration = createAction<UpdatePayload[]>('mediaHydration');

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

/** Bottom-left o on quiz questions: toggles dashboardsfilters ↔ dashboardssifters. */
export const toggleQuizQuestionSubmissionRoute = createAction<{ bannerId: number }>('toggleQuizQuestionSubmissionRoute');
/** Bottom-right o on quiz questions: toggles dashboardssifters ↔ siftersinstructions. */
export const toggleQuizQuestionOptionsRoute = createAction<{ bannerId: number }>('toggleQuizQuestionOptionsRoute');
/** Bottom-left o on quiz follow-ups: toggles siftersfilters ↔ dashboardsfilters. */
export const toggleQuizFollowupSubmissionRoute = createAction<{ bannerId: number }>('toggleQuizFollowupSubmissionRoute');
/** Bottom-right o on quiz follow-ups: toggles siftersfilters ↔ filtersinstructions. */
export const toggleQuizFollowupOptionsRoute = createAction<{ bannerId: number }>('toggleQuizFollowupOptionsRoute');
