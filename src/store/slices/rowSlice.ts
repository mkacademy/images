import { createAction } from '@reduxjs/toolkit';
import { BaseFormattedData, DataRow, BaseEntity, Row } from '../../types/cpanel';

export type { Row };

export type EntityTypeMap = {
  bosses: BaseEntity;
  minions: BaseEntity;
  sifters: BaseEntity;
  filters: BaseEntity;
  underbosses: BaseEntity;
  dashboards: BaseEntity;
  instructions: BaseEntity;
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
