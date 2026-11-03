/**
 * Slim subset of studio's `components/Core/types.ts` + `actionSlice` Status + `rowSlice` Row.
 * Images has no cpanel / Core entity classes, so only the row/metadata shapes the viewer uses live here.
 */

export interface Status {
  initial: number;
  current: number;
  owner?: boolean;
}

export interface Row {
  id: string;
  index: number;
  order: number;
  frozen: boolean;
  checked: boolean;
  deleted: boolean;
  modified: boolean;
}

export interface Metadata {
  owner: boolean;
  ordinal?: number;
  interaction?: boolean;
  communications?: string;
  instructionId?: (string | number)[] | number;
  foundationId?: (string | number)[];
  bossId?: (string | number)[] | number;
  minionId?: (string | number)[] | number;
  filterId?: (string | number)[] | number;
  sifterId?: (string | number)[] | number;
  dashboardId?: (string | number)[] | number;
  underbossId?: (string | number)[] | number;
  lowersifterId?: (string | number)[] | number;
  highersifterId?: (string | number)[] | number;
}

export interface TabulatorProps {
  metadata?: Metadata;
  index?: number;
  order?: number;
  checked?: boolean;
  frozen?: boolean;
  password?: string;
  modified?: boolean;
  keywords?: string[];
  deleted?: boolean;
  reordered?: boolean;
  stated?: boolean;
  type?: string;
}

export interface LinkTableProps {
  interaction?: boolean;
  communications?: string;
  ordinal?: number;
  source?: string;
  filterId?: number;
  sifterId?: number;
  dashboardId?: number | number[];
  instructionId?: number | number[];
  underbossId?: number;
  bossId?: number;
  minionId?: number;
  owner?: boolean;
}

export interface DatabaseTableProps {
  descendentsSums: Record<string, number>;
  status?: number | Status;
  id: number | string;
  sizeInBytes: number;
  filter?: string;
  sifter?: string;
  dashboard?: string;
  instruction?: string;
  underboss?: string;
  boss?: string;
  minion?: string;
  details?: string;
  imageurl?: string;
  username?: string;
  email?: string;
  purpose?: string;
}

export type DataRow = TabulatorProps & DatabaseTableProps;
export type CpanelRow = LinkTableProps & DatabaseTableProps & { isOpen?: boolean };

/** Entity descriptor; the viewer only needs its name (studio's Core classes carry the rest). */
export interface BaseEntity {
  name: string;
}

export interface BaseFormattedData<T = Record<string, unknown>> {
  rows: Row[];
  statuses: Array<{ id: string; status: Status; modified?: boolean }>;
  texts: DataRow[] & Partial<T>;
}
