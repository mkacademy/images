import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { signedOut } from './sessionSlice';
import {
  orderPredicate,
  textsMerger,
  ordinalsUpdator,
  metadataUpdator,
} from '../../library/sliceUtils';
import {
  updateSteps,
  updateTutorials,
  updateStepsOrdinals,
  updateRootsOrdinals,
  updateRootsMetadata,
  updateStepsMetadata,
} from '../../library/actions';
import type {
  Banner,
  dismissTutorialPayload,
  SetTutorialsPayload,
  TutorialState,
} from '../../library/TutorialUtils';
import {
  applySetTutorials,
  applyDismissTutorial,
  applyHighlightContentBreathSelection,
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
    dismissTutorial: (state, action: PayloadAction<dismissTutorialPayload>) => {
      applyDismissTutorial(state, action.payload);
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
    highlightContentBreathSelection: (state, action: PayloadAction<{ ids: number[]; isHighlighted?: boolean }>) => {
      applyHighlightContentBreathSelection(state, action.payload);
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
      .addCase(updateStepsOrdinals, (state, action) => {
        state.content = assignTutorialContentContiguousOrdinals(
          state.content.map((rows) => rows.map(ordinalsUpdator(action.payload, true))),
        );
      })
      .addCase(updateStepsMetadata, (state, action) => {
        state.content = assignTutorialContentContiguousOrdinals(
          state.content.map((rows) => rows.map(metadataUpdator(action.payload, true))),
        );
      })
      .addCase(updateRootsOrdinals, (state, action) => {
        state.banners = state.banners.map(ordinalsUpdator(action.payload, false)).sort(orderPredicate);
      })
      .addCase(updateRootsMetadata, (state, action) => {
        state.banners = state.banners.map(metadataUpdator(action.payload, false)).sort(orderPredicate);
      });
  },
});

export const {
  setTutorials,
  dismissTutorial,
  toggleTutorial,
  highlightContentBreathSelection,
  setSelected,
} = tutorialSlice.actions;

export default tutorialSlice.reducer;
