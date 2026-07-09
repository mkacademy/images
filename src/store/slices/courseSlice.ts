import { signedOut } from './sessionSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  textsMerger,
  ordinalsUpdator,
  metadataUpdator,
  orderPredicate,
  getSlideIndeces,
} from '../../library/sliceUtils';
import {
  updateCourses,
  updateRootsOrdinals,
  updatePennantsOrdinals,
  updateCoversOrdinals,
  updateStepsOrdinals,
  updateTutorials,
  updateSteps,
  erasePayload,
  updateRootsMetadata,
  updatePennantsMetadata,
  updateCoversMetadata,
  updateStepsMetadata,
} from '../../library/actions';

import type {
  Banner,
  Pennant,
  SetCoursesPayload,
  SlideGroup,
  SlideItem,
  dismissCoursePayload,
  dismissSlidePayload,
  CourseHighlightSlideBreathSelectionPayload,
  CourseHighlightCoversBreathSelectionPayload,
  CourseSetSlidesPayload,
  CourseState,
} from '../../library/CourseUtils';
import {
  applyClearSelectedCourseState,
  applyDismissChapter,
  applyDismissSlide,
  applyDismissCourseWithSelection,
  applyDismissCourseWithoutSelection,
  applyHighlightCoversBreathSelection,
  applyHighlightCourseDepthSelection,
  applyHighlightPennantDepthSelection,
  applyHighlightSlideBreathSelection,
  applySetChaptersViaPennantId,
  applySetChaptersViaSlideId,
  applySetCourses,
  applySetSlides,
  applyUpdateCoversMetadata,
  applyUpdateCoversOrdinals,
  applyUpdateSteps,
  createCourseStartIdInitial,
  type CourseStartId,
} from '../../library/CourseUtils';

export type {
  SlideGroupItem,
  SlideGroup,
  SlideItem,
  Banner,
  Pennant,
  CourseState,
  CourseStartId,
  SetCoursesPayload,
  dismissCoursePayload,
  dismissSlidePayload,
  CourseModifiedOrdinals,
  CourseSetSlidesPayload,
  CourseModifiedOrdinalBatch,
  CourseHighlightSlideBreathSelectionPayload,
  CourseHighlightCoversBreathSelectionPayload,
} from '../../library/CourseUtils';

export {
  isSlideGroupItem,
  getBannerChaptersCouplings,
  resolveChaptersForSlideInSelectedCourse,
  resolveSlidesForChapterInSelectedCourse,
} from '../../library/CourseUtils';

const initialState: CourseState = {
  startId: createCourseStartIdInitial(),
  modifiedOrdinals: {},
  noCourses: true,
  couplings: {},
  selected: -1,
  chapters: [],
  content: [],
  banners: [],
};

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    toggleCourse: (state, action: PayloadAction<{ selectedId?: number, canToggle?: boolean }>) => {
      const { selectedId, canToggle = true } = action.payload;
      const index = state.banners.findIndex(({ id }) => id === selectedId);
      if (canToggle && state.selected === index) {
        state.selected = -1;
      } else {
        state.selected = index;
      }
      state.chapters = [];
    },
    setSelected: (state, action: PayloadAction<number>) => {
      if (action.payload >= -1) {
        state.selected = action.payload;
        state.chapters = [];
      }
    },
    setChapters: (state, action: PayloadAction<number[]>) => {
      if (state.selected < 0 && state.chapters.length > 0) {
        state.chapters = [];
        return;
      }
      state.chapters = action.payload;
    },
    resetChapters: (state) => {
      state.chapters = [];
    },
    setChaptersViaSlideId: (state, action: PayloadAction<number>) => {
      applySetChaptersViaSlideId(state, action.payload);
    },
    setChaptersViaPennantId: (state, action: PayloadAction<number>) => {
      applySetChaptersViaPennantId(state, action.payload);
    },
    setCourses: (state, action: PayloadAction<SetCoursesPayload>) => {
      applySetCourses(state, action.payload);
    },
    setSlides: (state, action: PayloadAction<CourseSetSlidesPayload>) => {
      applySetSlides(state, action.payload);
    },
    highlightSlideBreathSelection: (state, action: PayloadAction<CourseHighlightSlideBreathSelectionPayload>) => {
      applyHighlightSlideBreathSelection(state, action.payload);
    },
    highlightCourseBreathSelection: (state, action: PayloadAction<{ ids: number[]; isHighlighted?: boolean }>) => {
      const { ids, isHighlighted } = action.payload;
      const { banners, selected } = state;
      const bannerIds = selected === -1
        ? banners.map(({ id }) => id).filter((id) => ids.includes(id))
        : [banners[selected]?.id];
      const newState = banners.map((banner: Banner) =>
        bannerIds.includes(banner.id)
          ? { ...banner, isHighlighted: isHighlighted ?? !banner.isHighlighted }
          : banner
      );
      state.banners = newState;
    },
    highlightPennantBreathSelection: (state, action: PayloadAction<{ ids: number[]; isHighlighted?: boolean }>) => {
      const { banners } = state;
      const { ids, isHighlighted } = action.payload;
      const newState = banners.map((banner: Banner) => {
        return {
          ...banner,
          pennants: banner.pennants.map((pennant: Pennant) =>
            ids.includes(pennant.id)
              ? { ...pennant, isHighlighted: isHighlighted ?? !pennant.isHighlighted }
              : pennant
          ),
        }
      });
      state.banners = newState;
    },
    highlightCoversBreathSelection: (state, action: PayloadAction<CourseHighlightCoversBreathSelectionPayload>) => {
      applyHighlightCoversBreathSelection(state, action.payload);
    },
    highlightPennantDepthSelection: (state, action: PayloadAction<{ ids: number[]; isHighlighted?: boolean }>) => {
      applyHighlightPennantDepthSelection(state, action.payload);
    },
    highlightCourseDepthSelection: (state, action: PayloadAction<{ ids: number[]; isHighlighted?: boolean }>) => {
      applyHighlightCourseDepthSelection(state, action.payload);
    },
    dismissCourse: (state, action: PayloadAction<dismissCoursePayload>) => {
      const { ids, isShow, isDismissed } = action.payload;
      if (ids.length === 0 || state.selected > -1) return;
      for (const id of ids) applyDismissCourseWithoutSelection(state, id, isDismissed, isShow);
    },
    dimissMainslide: (state, action: PayloadAction<dismissCoursePayload>) => {
      const { ids, isDismissed } = action.payload;
      if (ids.length === 0) return;
      for (const id of ids) applyDismissCourseWithSelection(state, id, isDismissed);
    },
    dismissChapter: (state, action: PayloadAction<dismissCoursePayload>) => {
      applyDismissChapter(state, action.payload);
    },
    dismissSlide: (state, action: PayloadAction<dismissSlidePayload>) => {
      applyDismissSlide(state, action.payload);
    },
    clearSelected: (state, action: PayloadAction<erasePayload>) => {
      applyClearSelectedCourseState(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signedOut, () => initialState)
      .addCase(updateTutorials, (state, action) => {
        const { banners } = state;
        const nState = banners.map(({ pennants, ...fields }: Banner) => ({
          pennants: pennants.map(pennant => ({
            ...pennant,
            ...textsMerger(action.payload)(pennant)
          })),
          ...fields,
        }));
        state.banners = nState;
      })
      .addCase(updateSteps, (state, action) => {
        applyUpdateSteps(state, action.payload);
      })
      .addCase(updateCourses, (state, action) => {
        const { banners } = state;
        const nState = banners.map(banner => ({
          ...banner,
          ...textsMerger(action.payload)(banner)
        })) as Banner[];
        state.banners = nState;
      })
      .addCase(updateRootsOrdinals, (state, action) => {
        const { banners } = state;
        const nState = banners.map(banner => ({
          ...banner,
          ordinal: action.payload.find(({ id }) => id === banner.id)?.ordinal ?? banner.ordinal
        }));
        state.banners = nState.sort(orderPredicate);
      })
      .addCase(updateRootsMetadata, (state, action) => {
        const { banners } = state;
        const nState = banners.map(banner => ({
          ...banner,
          ...(action.payload.find(({ id }) => id === banner.id) ?? {}),
        }));
        state.banners = nState;
      })
      .addCase(updatePennantsOrdinals, (state, action) => {
        const { banners } = state;
        const nState = banners.map(({ pennants, ...fields }: Banner) => ({
          ...fields,
          pennants: pennants.map(ordinalsUpdator(action.payload, true)).sort(orderPredicate)
        }));
        state.banners = nState;
        state.couplings = getSlideIndeces(nState, state.content);
      })
      .addCase(updatePennantsMetadata, (state, action) => {
        const { banners } = state;
        const nState = banners.map(({ pennants, ...fields }: Banner) => ({
          ...fields,
          pennants: pennants.map(metadataUpdator(action.payload, true)).sort(orderPredicate)
        }));
        state.banners = nState;
        state.couplings = getSlideIndeces(nState, state.content);
      })
      .addCase(updateCoversOrdinals, (state, action) => {
        applyUpdateCoversOrdinals(state, action.payload);
      })
      .addCase(updateCoversMetadata, (state, action) => {
        applyUpdateCoversMetadata(state, action.payload);
      })
      .addCase(updateStepsOrdinals, (state, action) => {
        const { content } = state;
        const nState = content.map(({ slides, ...fields }: SlideGroup) => ({
          ...fields,
          slides: slides.map((rows: SlideItem[]) =>
            rows.map(ordinalsUpdator(action.payload, true)).sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0))
          ),
        })) as SlideGroup[];
        state.content = nState;
      })
      .addCase(updateStepsMetadata, (state, action) => {
        const { content } = state;
        const nState = content.map(({ slides, ...fields }: SlideGroup) => ({
          ...fields,
          slides: slides.map((rows: SlideItem[]) =>
            rows.map(metadataUpdator(action.payload, true)).sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0))
          ),
        })) as SlideGroup[];
        state.content = nState;
      });
  },
});

export const {
  toggleCourse,
  setCourses,
  setSlides,
  dismissSlide,
  highlightSlideBreathSelection,
  highlightCourseBreathSelection,
  highlightPennantBreathSelection,
  highlightCoversBreathSelection,
  highlightPennantDepthSelection,
  highlightCourseDepthSelection,
  dismissCourse,
  dimissMainslide,
  dismissChapter,
  clearSelected,
  setSelected,
  setChapters,
  resetChapters,
  setChaptersViaSlideId,
  setChaptersViaPennantId,
} = courseSlice.actions;

export const clearCourseSelected = clearSelected;

export default courseSlice.reducer; 