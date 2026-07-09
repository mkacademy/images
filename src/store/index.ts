import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import commsReducer from './slices/commsSlice';
import statsReducer from './slices/statsSlice';
import errorReducer from './slices/errorSlice';
import courseReducer from './slices/courseSlice';
import quizReducer from './slices/quizSlice';
import settingsReducer from './slices/settingsSlice';
import tutorialReducer from './slices/tutorialSlice';
import viewReducer from './slices/viewSlice';
import commentsReducer from './slices/commentsSlice';
import paginationReducer from './slices/paginationSlice';
import { bindHydrationPayloadDispatch } from '../library/hydrationPayloadBuffer';
import { bindHydrationQueueDispatch } from '../library/hydrationQueue';
import { preThunkMiddleware, postThunkMiddleware } from './middleware';

/** Viewer store: core slices + pagination for fetch/route pipeline. */
export const store = configureStore({
  reducer: {
    session: sessionReducer,
    comms: commsReducer,
    comments: commentsReducer,
    tutorial: tutorialReducer,
    course: courseReducer,
    quiz: quizReducer,
    view: viewReducer,
    settings: settingsReducer,
    stats: statsReducer,
    error: errorReducer,
    pagination: paginationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      serializableCheck: { warnAfter: 128 },
    })
      .prepend(...preThunkMiddleware)
      .concat(...postThunkMiddleware),
});

bindHydrationPayloadDispatch(store.dispatch);
bindHydrationQueueDispatch(store.dispatch, store.getState);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
