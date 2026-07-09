import { createAction } from '@reduxjs/toolkit';
import { BaseFormattedData, DataRow, BaseEntity, Row } from '../../types/cpanel';
import Boss from '../../components/Core/Boss';
import Minion from '../../components/Core/Minion';
import Sifter from '../../components/Core/Sifter';
import Filter from '../../components/Core/Filter';
import Underboss from '../../components/Core/Underboss';
import Dashboard from '../../components/Core/Dashboard';
import Instruction from '../../components/Core/Instruction';

export type { Row };

export type EntityTypeMap = {
  bosses: Boss;
  minions: Minion;
  sifters: Sifter;
  filters: Filter;
  underbosses: Underboss;
  dashboards: Dashboard;
  instructions: Instruction;
  foundation: BaseEntity;
};

export interface ResultPayload {
  entity: string;
  payload: DataRow[];
  isAppend?: boolean;
  keywords?: string[];
  parent: string | undefined;
}

export interface FormattedRowsPayload {
  data: BaseFormattedData<EntityTypeMap[keyof EntityTypeMap]>;
  keywords?: string[];
  operation?: string;
  content: DataRow[];
  dest?: string;
  orig?: string;
  GUID?: string;
}

/** Query type string used by hydration/fetch utilities (legacy row append action name). */
export const ROW_APPEND_QUERY_TYPE = 'row/appendRowz';

/** Dispatched on login/reset; sessionSlice listens for side effects. */
export const clearData = createAction('row/clearData');
