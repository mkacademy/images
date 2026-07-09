import { signedOut } from './sessionSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchData } from '../../library/Thunks';
import { CourseTrees, QuizTrees, TutorialTrees } from '../../library/controlPanelUtils';
import { setQuizzes } from './quizSlice';
import { setTutorials } from './tutorialSlice';
import { setCourses } from './courseSlice';

export interface SerializableFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string;
}

export interface MappedTutorialTrees {
  [key: number]: TutorialTrees;
}

export interface MappedCourseTrees {
  [key: number]: CourseTrees;
}

export interface MappedQuizTrees {
  [key: number]: QuizTrees;
}

export interface unzippedTrees {
  tutorialTrees: MappedTutorialTrees;
  courseTrees: MappedCourseTrees;
  quizTrees: MappedQuizTrees;
}

export interface SettingsState {
  unzippedTrees: unzippedTrees[];
  TutorialTrees: MappedTutorialTrees;
  CourseTrees: MappedCourseTrees;
  QuizTrees: MappedQuizTrees;
  quota: number;
  email: string;
  userapp: number;
  adminapp: number;
  uploads: SerializableFile[];
  catalina: number;
  memberapp: number;
  username: string;
  dowTok: boolean;
  characters: number;
  txtimg: boolean;
  seltype: boolean;
  eXport: boolean;
  iMport: boolean;
  txtswap: boolean;
  isValid: boolean;
  cacher: string;
  isTabled: boolean;
  take: number | undefined;
  affix: string | undefined;
  amendAttempts: number;
  isDemoted: boolean;
  deletedOrphans: number;
  isPromoted: boolean;
  isEnabled: boolean;
  isDisabled: boolean;
  formatters: string;
  dismisstype: boolean;
  source: string | undefined;
  algorithm: string;
  delaccount: boolean;
  domain: boolean;
  role: string;
  verifyAttempts: number;
  seconds: number | undefined;
  voucher: string | undefined;
  exRoots: boolean | undefined;
  padding: number | undefined;
  creates: number | undefined;
  selectedRoutes: string[];
  registerAttempts: number;
  permittedRoutes: string[];
  action: string;
  approute: string | undefined;
  timestamp: string | undefined;
  skeletonsFrom: string | undefined;
  commentsFrom: string | undefined;
  isExtractKeys: boolean;
  isExtractAlgo: boolean;
  exHistory: boolean | undefined;
  selectedChild: string;
  availability: boolean;
  isParentSelection: boolean;
  selectedParent: string;
  prefix: string;
  connects: string;
  isAssembleBase64: boolean;
  isCoursesToQuizzes: boolean;
  isTutorialsToCourses: boolean;
  isDepthSelection: boolean;
  isBreathSelection: boolean;
  isRemoveTrees: boolean;
  isInsertTrees: boolean;
  isAssembleTexts: boolean;
  isUnzipCourses: boolean;
  isUnzipCourses_: boolean;
  isUnzipTutorials: boolean;
  isUnzipTutorials_: boolean;
  isUnzipQuizzes: boolean;
  isUnzipQuizzes_: boolean;
  unzipCoursesType: string;
  unzipTutorialsType: string;
  unzipQuizzesType: string;
  isNotUnzipping: boolean;
  isNotSkeletons: boolean;
  clearType: boolean;
  clearContentType: string;
  status: number | undefined;
  assertOwnership?: boolean;
  createTutorialPreset: string;
  createQuizPreset: string;
  createCoursePreset: string;
  currentToIncludeInTemplates: string;
  isIncludeCurrentIntemplates: boolean;
  showCopyIcons: boolean;
  aquiredClipboardConsent: boolean;
  editMode: boolean;
  shouldDelete: boolean;
  shiftKeyDown: boolean;
  ctrlKeyDown: boolean;
  altKeyDown: boolean;
  activeShortcuts: string;
  fetchTutorialPreset: string;
  fetchQuizPreset: string;
  fetchCoursePreset: string;
  currentToIncludeInSkeletons: string;
  isIncludeCurrentInSkeletons: boolean;
  fetchTutorialCommentsPreset: string;
  fetchQuizCommentsPreset: string;
  fetchCourseCommentsPreset: string;
  fetchCommentsType: string;
  currentToExportComments: string;
  isExportComments: boolean;
  shouldHydrate: boolean;
  queryLimit: number;
  fsq: number;
  includeBase64: boolean;
  /** Seconds between fMP4 snapshot captures in Settings → ColTen. */
  snapshotIntervalSec: number;
  randomizedType: 'Imageurls' | 'details' | 'both';
}

const getLocalDateTimeInputValue = (): string => {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  // datetime-local in the UI expects "YYYY-MM-DDTHH:mm", but the app stores "YYYY-MM-DD HH:mm".
};

const initialSettings: SettingsState = {
  unzippedTrees: [],
  TutorialTrees: {},
  CourseTrees: {},
  QuizTrees: {},
  quota: 0,
  take: 1,
  email: "",
  userapp: 0,
  adminapp: 0,
  uploads: [],
  catalina: 1,
  memberapp: 0,
  domain: true,
  username: "",
  dowTok: false,
  characters: 0,
  txtimg: false,
  seltype: true,
  eXport: false,
  iMport: false,
  txtswap: false,
  isValid: false,
  cacher: "rows",
  isTabled: true,
  affix: undefined,
  amendAttempts: 0,
  isDemoted: false,
  deletedOrphans: 0,
  isPromoted: false,
  isEnabled: false,
  isDisabled: false,
  dismisstype: true,
  source: undefined,
  algorithm: "none",
  delaccount: false,
  role: "ROLE_USER",
  verifyAttempts: 0,
  seconds: undefined,
  skeletonsFrom: getLocalDateTimeInputValue(),
  commentsFrom: getLocalDateTimeInputValue(),
  voucher: undefined,
  exRoots: undefined,
  padding: undefined,
  creates: undefined,
  selectedRoutes: [],
  registerAttempts: 0,
  permittedRoutes: [],
  action: "tabulator",
  availability: false,
  approute: undefined,
  timestamp: undefined,
  isExtractKeys: false,
  isExtractAlgo: false,
  exHistory: undefined,
  selectedChild: "[TO]",
  formatters: "cpanelapp",
  isParentSelection: true,
  selectedParent: "[FROM]",
  prefix: "/app/tabulator/",
  connects: "--CHOOSE_WHO_CAN_CONNECT_TO_SELECTED--",
  isAssembleBase64: false,
  isCoursesToQuizzes: false,
  isTutorialsToCourses: false,
  isBreathSelection: true,
  isDepthSelection: false,
  isRemoveTrees: false,
  isInsertTrees: false,
  isUnzipCourses: true,
  isUnzipQuizzes: true,
  isUnzipCourses_: true,
  isUnzipQuizzes_: true,
  isAssembleTexts: false,
  isUnzipTutorials: true,
  isUnzipTutorials_: true,
  status: undefined,
  unzipCoursesType: "incoming_and_outgoing",
  unzipQuizzesType: "incoming_and_outgoing",
  unzipTutorialsType: "incoming_and_outgoing",
  clearContentType: "tutorial",
  isNotUnzipping: true,
  isNotSkeletons: true,
  clearType: true,
  assertOwnership: undefined,
  createQuizPreset: "1_10_4_1",
  createCoursePreset: "1_10_4",
  createTutorialPreset: "1_10",
  currentToIncludeInTemplates: "tutorial",
  isIncludeCurrentIntemplates: false,
  showCopyIcons: false,
  aquiredClipboardConsent: false,
  editMode: false,
  shouldDelete: false,
  shiftKeyDown: false,
  ctrlKeyDown: false,
  altKeyDown: false,
  activeShortcuts: 'b',
  fetchTutorialPreset: "1_10",
  fetchQuizPreset: "1_10",
  fetchCoursePreset: "1_10",
  currentToIncludeInSkeletons: "tutorial",
  isIncludeCurrentInSkeletons: false,
  fetchTutorialCommentsPreset: "within_10_hours",
  fetchQuizCommentsPreset: "within_10_hours",
  fetchCourseCommentsPreset: "within_10_hours",
  fetchCommentsType: "tutorial",
  currentToExportComments: "tutorial",
  isExportComments: false,
  shouldHydrate: true,
  queryLimit: 50,
  fsq: 10,
  includeBase64: true,
  snapshotIntervalSec: 1,
  randomizedType: 'both',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettings,
  reducers: {
    toggleUnzipCourses: (state, action: PayloadAction<boolean | undefined>) => {
      if (action.payload !== undefined) state.isUnzipCourses = action.payload;
      else state.isUnzipCourses = !state.isUnzipCourses;
    },
    toggleUnzipTutorials: (state, action: PayloadAction<boolean | undefined>) => {
      if (action.payload !== undefined) state.isUnzipTutorials = action.payload;
      else state.isUnzipTutorials = !state.isUnzipTutorials;
    },
    toggleUnzipQuizzes: (state, action: PayloadAction<boolean | undefined>) => {
      if (action.payload !== undefined) state.isUnzipQuizzes = action.payload;
      else state.isUnzipQuizzes = !state.isUnzipQuizzes;
    },
    unzipCoursesTypeSelected: (state, action: PayloadAction<string>) => {
      state.unzipCoursesType = action.payload;
    },
    unzipTutorialsTypeSelected: (state, action: PayloadAction<string>) => {
      state.unzipTutorialsType = action.payload;
    },
    unzipQuizzesTypeSelected: (state, action: PayloadAction<string>) => {
      state.unzipQuizzesType = action.payload;
    },
    completedUnzipping: (state, action: PayloadAction<boolean>) => {
      state.isNotUnzipping = action.payload;
    },
    addUnzippedTrees: (state, action: PayloadAction<unzippedTrees>) => {
      state.unzippedTrees.push(action.payload);
    },
    clearContentTypeSelected: (state, action: PayloadAction<string>) => {
      state.clearContentType = action.payload;
    },
    finalizePostHydrationSettings: (state) => {
      state.fsq = 10;
    },
    fsqSelected: (state, action: PayloadAction<number>) => {
      state.fsq = action.payload;
    },
    randomizedTypeSelected: (state, action: PayloadAction<SettingsState['randomizedType']>) => {
      state.randomizedType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signedOut, (state) => {
        console.log("cleared_settings");
        const isUnzipTutorials_ = state.isUnzipTutorials_;
        const isUnzipCourses_ = state.isUnzipCourses_;
        const isUnzipQuizzes_ = state.isUnzipQuizzes_;
        const isUnzipTutorials = state.isUnzipTutorials;
        const isUnzipCourses = state.isUnzipCourses;
        const isUnzipQuizzes = state.isUnzipQuizzes;
        const unzipTutorialsType = state.unzipTutorialsType;
        const unzipCoursesType = state.unzipCoursesType;
        const unzipQuizzesType = state.unzipQuizzesType;
        const voucher = state.voucher;
        Object.assign(state, initialSettings);
        state.isUnzipTutorials_ = isUnzipTutorials_;
        state.isUnzipCourses_ = isUnzipCourses_;
        state.isUnzipQuizzes_ = isUnzipQuizzes_;
        state.isUnzipTutorials = isUnzipTutorials;
        state.isUnzipCourses = isUnzipCourses;
        state.isUnzipQuizzes = isUnzipQuizzes;
        state.unzipTutorialsType = unzipTutorialsType;
        state.unzipCoursesType = unzipCoursesType;
        state.unzipQuizzesType = unzipQuizzesType;
        state.voucher = voucher;
      })
      .addCase(setTutorials, (state, action) => {
        if (action.payload.Trees && action.payload.TreesId)
          state.TutorialTrees[action.payload.TreesId] = action.payload.Trees;
      })
      .addCase(setCourses, (state, action) => {
        if (action.payload.Trees && action.payload.TreesId)
          state.CourseTrees[action.payload.TreesId] = action.payload.Trees;
      })
      .addCase(setQuizzes, (state, action) => {
        if (action.payload.Trees && action.payload.TreesId)
          state.QuizTrees[action.payload.TreesId] = action.payload.Trees;
      })
      .addCase(fetchData.fulfilled, (state) => {
        if (state.isUnzipCourses || state.isUnzipTutorials || state.isUnzipQuizzes)
          state.isNotUnzipping = false;
      })
      .addCase(fetchData.rejected, (state) => {
        if (state.isUnzipCourses || state.isUnzipTutorials || state.isUnzipQuizzes)
          state.isNotUnzipping = false;
      });
  }
});

export const {
  toggleUnzipCourses,
  toggleUnzipTutorials,
  toggleUnzipQuizzes,
  unzipCoursesTypeSelected,
  unzipTutorialsTypeSelected,
  unzipQuizzesTypeSelected,
  completedUnzipping,
  clearContentTypeSelected,
  addUnzippedTrees,
  finalizePostHydrationSettings,
  fsqSelected,
  randomizedTypeSelected,
} = settingsSlice.actions;

export default settingsSlice.reducer;
