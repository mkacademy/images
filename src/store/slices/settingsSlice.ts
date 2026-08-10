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
  randomizedType: 'Imageurls' | 'details' | 'both';
}

const initialSettings: SettingsState = {
  unzippedTrees: [],
  TutorialTrees: {},
  CourseTrees: {},
  QuizTrees: {},
  isUnzipCourses: true,
  isUnzipQuizzes: true,
  isNotUnzipping: true,
  isUnzipCourses_: true,
  isUnzipQuizzes_: true,
  randomizedType: 'both',
  isUnzipTutorials: true,
  isUnzipTutorials_: true,
  unzipCoursesType: "incoming_and_outgoing",
  unzipQuizzesType: "incoming_and_outgoing",
  unzipTutorialsType: "incoming_and_outgoing",
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
    /** Bulk-register Trees maps from auto-unzip (avoids N× setCourses/setTutorials/setQuizzes). */
    registerUnzippedContentTrees: (state, action: PayloadAction<Partial<unzippedTrees>>) => {
      const { tutorialTrees, courseTrees, quizTrees } = action.payload;
      if (tutorialTrees) {
        for (const [id, trees] of Object.entries(tutorialTrees)) {
          state.TutorialTrees[Number(id)] = trees;
        }
      }
      if (courseTrees) {
        for (const [id, trees] of Object.entries(courseTrees)) {
          state.CourseTrees[Number(id)] = trees;
        }
      }
      if (quizTrees) {
        for (const [id, trees] of Object.entries(quizTrees)) {
          state.QuizTrees[Number(id)] = trees;
        }
      }
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
  addUnzippedTrees,
  registerUnzippedContentTrees,
  randomizedTypeSelected,
} = settingsSlice.actions;

export default settingsSlice.reducer;
