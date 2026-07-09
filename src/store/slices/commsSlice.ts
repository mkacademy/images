import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  updateSteps,
  updateTutorials,
  updateQuizzes,
  updateCourses,
} from '../../library/actions';
import { signedOut } from './sessionSlice';
import { orderPredicate, contiguousOrdinalPred, textsMergerComms } from '../../library/sliceUtils';
import {
  mergeOutgoingMessages,
  createCommsStartIdInitial,
  inDashPred,
  inFilPred,
  inIntrPred,
  inSiftPred,
  outDashPred,
  outFilPred,
  outIntrPred,
  outSiftPred,
  type IncomingMessage,
  type OutgoingMessage,
  type Tutor,
  CommsState,
} from '../../library/commsUtils';
import type { CommunicationReply } from '../../library/commsUtils';

export type {
  TutorType,
  TutorStatus,
  TutorSelectedPayload,
  Tutor,
  IncomingType,
  IncomingMessage,
  OutgoingType,
  OutgoingMessage,
  CommsStartId,
  CommsState,
  CommsModifiedOrdinalBatch,
  CommsModifiedOrdinals,
  CommsModifiedOrdinalLane,
} from '../../library/commsUtils';

export {
  createCommsStartIdInitial,
} from '../../library/commsUtils';

const initialState: CommsState = {
  startId: createCommsStartIdInitial(),
  modifiedOrdinals: {},
  outgoing: [],
  incoming: [],
  tutors: [],
};

const commsSlice = createSlice({
  name: 'comms',
  initialState,
  reducers: {
    toggleTutor: (state, action: PayloadAction<string>) => {
      state.tutors = state.tutors.map((tutor) =>
        action.payload === tutor.id + tutor.type
          ? { ...tutor, isDismissed: !tutor.isDismissed }
          : tutor
      );
    },
    toggleOutgoing: (state, action: PayloadAction<string>) => {
      state.outgoing = state.outgoing.map((message) =>
        action.payload === message.id + message.type
          ? { ...message, isDismissed: !message.isDismissed }
          : message
      );
    },
    updateCommunicationStatus: (state, action: PayloadAction<CommunicationReply>) => {
      const { parentId, childId, status } = action.payload;
      state.outgoing = state.outgoing.map((message) => {
        if (message.id === childId && message.targets?.find((target) => parseInt(target.toString()) === parentId))
          return { ...message, isModified: false, status: { ...message.status, communications: status } };
        else return message;
      });
    },
    toggleIncoming: (state, action: PayloadAction<string>) => {
      state.incoming = state.incoming.map((message) =>
        action.payload === message.id + message.type
          ? { ...message, isDismissed: !message.isDismissed }
          : message
      );
    },
    setTutors: (state, action: PayloadAction<Tutor[]>) => {
      state.tutors = Object.values(
        [...state.tutors, ...action.payload].reduce((prev: Record<number, Tutor>, cur) => {
          prev[cur.id] = prev[cur.id]
            ? {
              ...cur,
              isHighlighted: prev[cur.id].isHighlighted,
              isDismissed: prev[cur.id].isDismissed,
              checked: prev[cur.id].checked
            }
            : cur;
          return prev;
        }, {})
      ).sort(orderPredicate).map((row, index, array) => contiguousOrdinalPred(row, index, array));
    },
    setIncomings: (state, action: PayloadAction<IncomingMessage[]>) => {
      state.incoming = Object.values(
        [...state.incoming, ...action.payload].reduce((prev: Record<string, IncomingMessage>, cur: IncomingMessage) => {
          const identifier = cur.id + cur.type;
          prev[identifier] = prev[identifier]
            ? {
              ...cur,
              isDismissed: prev[identifier].isDismissed,
              isHighlighted: prev[identifier].isHighlighted,
              mailers: prev[identifier].mailers ? [...prev[identifier].mailers, cur.mailer] : [prev[identifier].mailer, cur.mailer],
            }
            : cur;
          return prev;
        }, {})
      ).sort(orderPredicate).map((row, index, array) => contiguousOrdinalPred(row, index, array));
    },
    setOutgoings: (state, action: PayloadAction<OutgoingMessage[]>) => {
      state.outgoing = mergeOutgoingMessages(state.outgoing, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signedOut, () => initialState)
      .addCase(updateCourses, (state, action) => {
        state.outgoing = state.outgoing.map(textsMergerComms(action.payload, outSiftPred));
        state.incoming = state.incoming.map(textsMergerComms(action.payload, inSiftPred));
      })
      .addCase(updateTutorials, (state, action) => {
        state.outgoing = state.outgoing.map(textsMergerComms(action.payload, outFilPred));
        state.incoming = state.incoming.map(textsMergerComms(action.payload, inFilPred));
      })
      .addCase(updateSteps, (state, action) => {
        state.outgoing = state.outgoing.map(textsMergerComms(action.payload, outIntrPred));
        state.incoming = state.incoming.map(textsMergerComms(action.payload, inIntrPred));
      })
      .addCase(updateQuizzes, (state, action) => {
        state.outgoing = state.outgoing.map(textsMergerComms(action.payload, outDashPred));
        state.incoming = state.incoming.map(textsMergerComms(action.payload, inDashPred));
      });
  }
});

export const {
  toggleTutor,
  toggleOutgoing,
  updateCommunicationStatus,
  toggleIncoming,
  setTutors,
  setIncomings,
  setOutgoings,
} = commsSlice.actions;

export default commsSlice.reducer;
