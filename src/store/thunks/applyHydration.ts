import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { MetadataPayload } from '../../library/actions';
import {
  updateCourses,
  updateQuizzes,
  updateSteps,
  updateTutorials,
  updateAnswersMetadata,
  updateCoversMetadata,
  updatePennantsMetadata,
  updateQuestionsMetadata,
  updateQuizMetadata,
  updateRootsMetadata,
  updateStepsMetadata,
} from '../../library/actions';
import type { Metadata } from '../../types/cpanel';
import type { ResultPayload } from '../slices/rowSlice';
import type { RootState } from '../index';
import { fetchedHandles } from '../slices/errorSlice';

/** Applies hydrated row payloads to PNC slices (replaces DismissalsManager hydrateRows). */
export function applyHydrateRows(
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  { entity, payload }: ResultPayload,
): void {
  switch (entity) {
    case 'dashboards': {
      const updates = payload.map(({ dashboard, modified, ...siever }) => ({
        ...siever,
        title: dashboard,
        edited: modified,
        id: parseInt(siever.id.toString(), 10),
      }));
      dispatch(updateQuizzes(updates));
      break;
    }
    case 'sifters': {
      const updates = payload.map(({ sifter, modified, ...siever }) => ({
        ...siever,
        title: sifter,
        edited: modified,
        id: parseInt(siever.id.toString(), 10),
      }));
      dispatch(updateCourses(updates));
      break;
    }
    case 'filters': {
      const updates = payload.map(({ filter, modified, ...classifier }) => ({
        ...classifier,
        title: filter,
        edited: modified,
        id: parseInt(classifier.id.toString(), 10),
      }));
      dispatch(updateTutorials(updates));
      break;
    }
    case 'instructions': {
      const updates = payload.map(({ instruction, modified, ...step }) => ({
        ...step,
        edited: modified,
        title: instruction,
        id: parseInt(step.id.toString(), 10),
      }));
      dispatch(updateSteps(updates));
      break;
    }
    default:
      break;
  }
}

/** Applies hydrated metadata to PNC slices (replaces BlobsManager hydrateMetadata). */
export function applyHydrateMetadata(
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  { data, orig: parent, dest: entity }: MetadataPayload,
): void {
  const rootPred = (childId: string) => (row: Metadata) => ({
    id: row[childId],
    owner: row.owner ?? false,
    ordinal: row.ordinal ?? 0,
  });

  const nonRootPred = (parentId: string, childId: string) => (row: Metadata) => ({
    id: row[childId],
    bannerId: row[parentId],
    owner: row.owner ?? false,
    ordinal: row.ordinal ?? 0,
  });

  switch (parent.toLowerCase() + entity.toLowerCase()) {
    case 'foundationsifters': {
      dispatch(updateRootsMetadata(data.map(rootPred('sifterId'))));
      break;
    }
    case 'foundationfilters': {
      dispatch(updateRootsMetadata(data.map(rootPred('filterId'))));
      break;
    }
    case 'foundationdashboards': {
      dispatch(updateQuizMetadata(data.map(rootPred('dashboardId'))));
      break;
    }
    case 'dashboardssifters': {
      dispatch(updateQuestionsMetadata(data.map(nonRootPred('dashboardId', 'sifterId'))));
      break;
    }
    case 'dashboardsfilters': {
      dispatch(updateAnswersMetadata(data.map(nonRootPred('dashboardId', 'filterId'))));
      break;
    }
    case 'filtersinstructions': {
      dispatch(updateStepsMetadata(data.map(nonRootPred('filterId', 'instructionId'))));
      break;
    }
    case 'siftersinstructions': {
      dispatch(updateCoversMetadata(data.map(nonRootPred('sifterId', 'instructionId'))));
      break;
    }
    case 'siftersfilters': {
      dispatch(updatePennantsMetadata(data.map(nonRootPred('sifterId', 'filterId'))));
      break;
    }
    default:
      break;
  }
}

export type HydrationStoreUpdate = {
  rows: ResultPayload;
  metadata: MetadataPayload;
  handles?: Parameters<typeof fetchedHandles>[0];
};

/** Applies a pooled hydration update directly to the store. */
export function applyHydrationStoreUpdate(
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
  update: HydrationStoreUpdate,
): void {
  applyHydrateRows(dispatch, update.rows);
  applyHydrateMetadata(dispatch, update.metadata);
  if (update.handles && Object.keys(update.handles).length > 0) {
    dispatch(fetchedHandles(update.handles));
  }
}
