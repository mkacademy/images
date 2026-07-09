import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DataRow } from '../../types/cpanel';
import { IconKey } from '../../library/entityIcons';

export interface Traversal {
  urlID: string;
  contentIds: number[];
  encodedData: string;
  from: string;
  fromIMG: string;
  toIMG: string;
  parentData: ParentData;
  to: string;
  prefix?: string;
  search?: string;
}

export interface InteractionOption {
  undone: boolean;
  owner: boolean | null;
}

export interface InteractionState {
  options: InteractionOption[];
  clicked: number[];
}

export interface ViewState {
  menus: number;
  pages: string[];
  yoinks: string[];
  keyids: number[];
  keywords: string[];
  selectedMenu: number;
  params: UrlParamsPayload;
  icons: Record<IconKey, string> | undefined;
  parentIndeces: number[];
  parent: string | undefined;
  entity: string | undefined;
  isFetching: boolean;
  message: string | undefined;
  toggleLayout: boolean;
  actionType: string | undefined;
  parentData: ParentData | undefined;
  fetchedData: DataRow[] | undefined;
  interactions: InteractionState | undefined;
  exportedData: Traversal[] | DataRow[] | undefined;
  exportedDatas: Record<string, DataRow[]> | undefined;
  requestIsProcessing: boolean;
  requestIsFetching: boolean;
  requestIsSkeletons: boolean;
  visibility: {
    searches: boolean;
    parents: boolean;
  };
}

export interface ParentData {
  parent?: string;
  curApp: number;
  IDs: string[];
}

export interface UrlParamsPayload {
  encodedData?: string;
  target?: string;
}

export interface RequestPayload {
  message?: string;
  completed: boolean;
}

const initialState: ViewState = {
  menus: 1,
  pages: [],
  yoinks: [],
  params: {},
  keyids: [],
  keywords: [],
  selectedMenu: 0,
  icons: undefined,
  parentIndeces: [],
  parent: undefined,
  entity: undefined,
  isFetching: false,
  message: undefined,
  toggleLayout: true,
  actionType: undefined,
  parentData: undefined,
  fetchedData: undefined,
  interactions: undefined,
  exportedData: undefined,
  exportedDatas: undefined,
  requestIsFetching: false,
  requestIsSkeletons: false,
  requestIsProcessing: false,
  visibility: { searches: true, parents: true },
};
export const COMPLETED_MESSAGE = "completed requested actions";
const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    cpanelMessage: (state, action: PayloadAction<string>) => {
      const iswaiting = state.message?.endsWith("please wait")
        || (state.message?.startsWith("hydrating") && !action.payload.startsWith("hydrating"));
      state.message = !iswaiting ? action.payload : state.message;
    },
    viewRequestFetching: (state, action: PayloadAction<boolean>) => {
      state.requestIsFetching = action.payload;
    },
    viewRequest: (state, action: PayloadAction<RequestPayload>) => {
      const { message, completed } = action.payload;
      state.requestIsProcessing = !completed;
      state.message = message ?? COMPLETED_MESSAGE;
    },
    clearEscrow: (state) => {
      console.log("cleared_view");
      state.fetchedData = undefined;
      state.interactions = undefined;
    },
  },
});

export const {
  cpanelMessage,
  viewRequestFetching,
  viewRequest,
  clearEscrow,
} = viewSlice.actions;

export default viewSlice.reducer;
