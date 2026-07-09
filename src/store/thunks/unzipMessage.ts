import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  FS,
  FF,
  FD,
  sifterTypes,
  filterTypes,
  dashboardTypes,
} from '../../library/commsUtils';
import { parse, unSignMZip, unSignTZip, unSignQZip } from '../../library/EncodingManagerUtils';
import { flushCourseTrees, flushQuizTrees, flushTutorialTrees } from '../../library/controlPanelUtilz';
import { isFetchSequenceRunning } from '../../library/ThunksUtils';
import type { ItemWithCourseTrees, ItemWithQuizTrees, ItemWithTutorialTrees } from '../../types/unzipTrees';
import type { IncomingMessage, OutgoingMessage } from '../slices/commsSlice';
import { setCourses } from '../slices/courseSlice';
import { setQuizzes } from '../slices/quizSlice';
import { setTutorials } from '../slices/tutorialSlice';
import {
  addUnzippedTrees,
  completedUnzipping,
  MappedCourseTrees,
  MappedQuizTrees,
  MappedTutorialTrees,
} from '../slices/settingsSlice';
import type { RootState } from '../index';
import { hydrateContent } from './hydrateContent';
import {
  getDeepLinkTreeIds,
  hasLoadingDeepLinkParams,
  resolveViewerDeepLinkSearch,
} from '../../loadingRouteUtils';

const UNZIP_COMPLETE_POLL_MS = 2000;

const matchesTargetTree = (messageId: number, targetTreeId: number | undefined): boolean =>
  targetTreeId === undefined || messageId === targetTreeId;

const scheduleCompletedUnzippingWhenIdle = (
  dispatch: (action: ReturnType<typeof completedUnzipping>) => void,
) => {
  const attempt = () => {
    if (isFetchSequenceRunning()) {
      setTimeout(attempt, UNZIP_COMPLETE_POLL_MS);
      return;
    }
    dispatch(completedUnzipping(true));
  };
  setTimeout(attempt, UNZIP_COMPLETE_POLL_MS);
};

/** Unzips comms payloads into Trees + skeleton PNC rows (replaces HydrationManager). */
export const unzipMessage = createAsyncThunk(
  'content/unzipMessage',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const {
      settings: {
        isUnzipCourses,
        isUnzipTutorials,
        isUnzipQuizzes,
        unzipCoursesType,
        unzipTutorialsType,
        unzipQuizzesType,
        TutorialTrees,
        CourseTrees,
        QuizTrees,
      },
      comms: { outgoing, incoming },
      session: { username },
    } = state;

    const viewerSearch = typeof window !== 'undefined'
      ? resolveViewerDeepLinkSearch(window.location.search)
      : '';
    if (!hasLoadingDeepLinkParams(viewerSearch)) {
      scheduleCompletedUnzippingWhenIdle(dispatch);
      return { hasTrees: false as const };
    }

    const treeIds = getDeepLinkTreeIds(viewerSearch);
    const tutorialTrees: ItemWithTutorialTrees[] = [];
    const courseTrees: ItemWithCourseTrees[] = [];
    const quizTrees: ItemWithQuizTrees[] = [];

    if (isUnzipCourses && treeIds.course !== undefined) {
      const targetTreeId = treeIds.course;
      const unzippedTreeIds = Object.keys(CourseTrees).map(Number);
      if (unzipCoursesType === 'outgoing' || unzipCoursesType === 'incoming_and_outgoing') {
        courseTrees.push(
          ...outgoing
            .filter(({ type, id }: OutgoingMessage) =>
              sifterTypes.includes(type) &&
              !unzippedTreeIds.includes(id) &&
              matchesTargetTree(id, targetTreeId))
            .map(({ id, text }: OutgoingMessage) => ({ TreesId: id, ...parse(text, username || '', unSignMZip) }))
            .map(({ TreesId, Trees }: ItemWithCourseTrees) => ({ TreesId, Trees: Trees ?? {} })),
        );
      }
      if (unzipCoursesType === 'incoming' || unzipCoursesType === 'incoming_and_outgoing') {
        courseTrees.push(
          ...incoming
            .filter(({ type, id }: IncomingMessage) =>
              type === FS &&
              !unzippedTreeIds.includes(id) &&
              matchesTargetTree(id, targetTreeId))
            .map(({ id, text }: IncomingMessage) => ({ TreesId: id, ...parse(text, username || '', unSignMZip) }))
            .map(({ TreesId, Trees }: ItemWithCourseTrees) => ({ TreesId, Trees: Trees ?? {} })),
        );
      }
    }

    if (isUnzipTutorials && treeIds.tutorial !== undefined) {
      const targetTreeId = treeIds.tutorial;
      const unzippedTreeIds = Object.keys(TutorialTrees).map(Number);
      if (unzipTutorialsType === 'outgoing' || unzipTutorialsType === 'incoming_and_outgoing') {
        tutorialTrees.push(
          ...outgoing
            .filter(({ type, id }: OutgoingMessage) =>
              filterTypes.includes(type) &&
              !unzippedTreeIds.includes(id) &&
              matchesTargetTree(id, targetTreeId))
            .map(({ id, text }: OutgoingMessage) => ({ TreesId: id, ...parse(text, username || '', unSignTZip) }))
            .map(({ TreesId, Trees }: ItemWithTutorialTrees) => ({ TreesId, Trees: Trees ?? {} })),
        );
      }
      if (unzipTutorialsType === 'incoming' || unzipTutorialsType === 'incoming_and_outgoing') {
        tutorialTrees.push(
          ...incoming
            .filter(({ type, id }: IncomingMessage) =>
              type === FF &&
              !unzippedTreeIds.includes(id) &&
              matchesTargetTree(id, targetTreeId))
            .map(({ id, text }: IncomingMessage) => ({ TreesId: id, ...parse(text, username || '', unSignTZip) }))
            .map(({ TreesId, Trees }: ItemWithTutorialTrees) => ({ TreesId, Trees: Trees ?? {} })),
        );
      }
    }

    if (isUnzipQuizzes && treeIds.quiz !== undefined) {
      const targetTreeId = treeIds.quiz;
      const unzippedTreeIds = Object.keys(QuizTrees).map(Number);
      if (unzipQuizzesType === 'outgoing' || unzipQuizzesType === 'incoming_and_outgoing') {
        quizTrees.push(
          ...outgoing
            .filter(({ type, id }: OutgoingMessage) =>
              dashboardTypes.includes(type) &&
              !unzippedTreeIds.includes(id) &&
              matchesTargetTree(id, targetTreeId))
            .map(({ id, text }: OutgoingMessage) => ({ TreesId: id, ...parse(text, username || '', unSignQZip) }))
            .map(({ TreesId, Trees }: ItemWithQuizTrees) => ({ TreesId, Trees: Trees ?? {} })),
        );
      }
      if (unzipQuizzesType === 'incoming' || unzipQuizzesType === 'incoming_and_outgoing') {
        quizTrees.push(
          ...incoming
            .filter(({ type, id }: IncomingMessage) =>
              type === FD &&
              !unzippedTreeIds.includes(id) &&
              matchesTargetTree(id, targetTreeId))
            .map(({ id, text }: IncomingMessage) => ({ TreesId: id, ...parse(text, username || '', unSignQZip) }))
            .map(({ TreesId, Trees }: ItemWithQuizTrees) => ({ TreesId, Trees: Trees ?? {} })),
        );
      }
    }

    for (const c of courseTrees) {
      const { Trees = {}, TreesId = 0 } = c;
      const { content: flushedContent, banners: flushedBanners } = flushCourseTrees(Trees);
      dispatch(setCourses({
        content: flushedContent ?? [],
        banners: flushedBanners ?? [],
        Trees,
        TreesId,
      }));
    }

    for (const t of tutorialTrees) {
      const { Trees = {}, TreesId = 0 } = t;
      const { content: flushedContent, banners: flushedBanners } = flushTutorialTrees(Trees);
      dispatch(setTutorials({
        banners: flushedBanners ?? [],
        content: flushedContent ?? [],
        Trees,
        TreesId,
      }));
    }

    for (const q of quizTrees) {
      const { Trees = {}, TreesId = 0 } = q;
      const { quizzes: flushedQuizzes, content: flushedContent, banners: flushedBanners } = flushQuizTrees(Trees);
      dispatch(setQuizzes({
        quizzes: flushedQuizzes ?? [],
        banners: flushedBanners ?? [],
        content: flushedContent ?? [],
        Trees,
        TreesId,
      }));
    }

    const hasTrees = courseTrees.length > 0 || tutorialTrees.length > 0 || quizTrees.length > 0;
    scheduleCompletedUnzippingWhenIdle(dispatch);

    if (hasTrees) {
      dispatch(addUnzippedTrees({
        tutorialTrees: tutorialTrees.reduce((acc: MappedTutorialTrees, t) => {
          acc[t.TreesId] = t.Trees;
          return acc;
        }, {}),
        courseTrees: courseTrees.reduce((acc: MappedCourseTrees, c) => {
          acc[c.TreesId] = c.Trees;
          return acc;
        }, {}),
        quizTrees: quizTrees.reduce((acc: MappedQuizTrees, q) => {
          acc[q.TreesId] = q.Trees;
          return acc;
        }, {}),
      }));
      await dispatch(hydrateContent());
    }

    return { hasTrees };
  },
);
