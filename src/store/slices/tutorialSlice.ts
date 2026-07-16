import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { signedOut } from './sessionSlice';
import {
  orderPredicate,
  textsMerger,
  metadataUpdator,
} from '../../library/sliceUtils';
import {
  updateSteps,
  updateTutorials,
  updateRootsMetadata,
  updateStepsMetadata,
} from '../../library/actions';
import type {
  SetTutorialsPayload,
  TutorialState,
} from '../../library/TutorialUtils';
import {
  applySetTutorials,
  assignTutorialContentContiguousOrdinals,
  createTutorialStartIdInitial,
} from '../../library/TutorialUtils';

export type {
  TutorialModifiedOrdinalBatch,
  TutorialModifiedOrdinals,
  TutorialClearSelectedErasePayload,
  TutorialStartId,
  TutorialState,
  Banner,
  Content,
  SetTutorialsPayload,
  dismissTutorialPayload,
  TutorialReOrderSelectionPayload,
} from '../../library/TutorialUtils';

export {
  createTutorialStartIdInitial,
  ordinalForReorder,
  findTutorialContentRow,
  applyOrdinalRangeReorder,
  tutorialSlideExists,
} from '../../library/TutorialUtils';

const initialState: TutorialState = {
  startId: createTutorialStartIdInitial(),
  modifiedOrdinals: {},
  noTutorials: true,
  selected: -1,
  content: [],
  banners: [],
};

const tutorialSlice = createSlice({
  name: 'tutorial',
  initialState,
  reducers: {
    setTutorials: (state, action: PayloadAction<SetTutorialsPayload>) => {
      applySetTutorials(state, action.payload);
    },
    toggleTutorial: (state, action: PayloadAction<{ selectedId?: number, canToggle?: boolean }>) => {
      const { selectedId, canToggle = true } = action.payload;
      const index = state.banners.findIndex(({ id }) => id === selectedId);
      if (canToggle && state.selected === index) {
        state.selected = -1;
      } else {
        state.selected = index;
      }
    },
    setSelected: (state, action: PayloadAction<number>) => {
      if (action.payload >= -1) state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signedOut, () => initialState)
      .addCase(updateSteps, (state, action) => {
        state.content = state.content.map((rows) => rows.map(textsMerger(action.payload)));
      })
      .addCase(updateTutorials, (state, action) => {
        state.banners = state.banners.map(textsMerger(action.payload));
      })
      .addCase(updateStepsMetadata, (state, action) => {
        state.content = assignTutorialContentContiguousOrdinals(
          state.content.map((rows) => rows.map(metadataUpdator(action.payload, true))),
        );
      })
      .addCase(updateRootsMetadata, (state, action) => {
        state.banners = state.banners.map(metadataUpdator(action.payload, false)).sort(orderPredicate);
      });
  },
});

export const {
  setTutorials,
  toggleTutorial,
  setSelected,
} = tutorialSlice.actions;

export default tutorialSlice.reducer;
