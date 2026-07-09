import type { CpanelRow } from '../types/cpanel';
import type { Banner } from '../store/slices/courseSlice';
import type { Quiz } from '../store/slices/quizSlice';

export interface AddedItem {
  id: number;
  bannerIds: number[];
}

export interface ExtractToCpanelPayload {
  source: string;
  dismisstype: boolean;
  timestamp: string;
  approute: string;
}

export interface FinalizeUnjoinPayload {
  from: string;
  to: string;
  parent: string;
  entity: string;
}

export interface FinalizejoinPayload {
  from: string;
  to: string;
}

export interface FinalizeDeletePayload {
  from: string;
  to: string;
}

export interface FinalizeAddPayload {
  from: string;
  to: string;
}

export interface InitNavigatorPayload {
  encodedData: string;
  entity: string;
  prefix?: string;
}

export interface PayloadWithFromTo {
  from: string;
  to: string;
}

export const newShortcutEscrowStashTimestamp = (): string =>
  `Escrowed_items-${Date.now()}`;

export const withHierarchyStamp = (
  timestamp: string,
  webappIndex: number,
  hierarchyIndex: number,
): string => `${timestamp}-${webappIndex}-${hierarchyIndex}`;

export interface OutgoingThunkPayload {
  content: { records: Record<string, Record<string, CpanelRow[]>> };
}

export interface IncomingThunkPayload {
  content: { records: Record<string, Record<string, CpanelRow[]>> };
  mailer: number;
}

export interface TutorsThunkPayload {
  content: { records: Record<string, Record<string, CpanelRow[]>> };
}

export interface TutorialThunkPayload {
  content: {
    records: {
      foundationFilters: {
        records?: { filtersInstructions: { instructions: CpanelRow[]; filters: CpanelRow[] } };
        foundation: CpanelRow[];
        filters: CpanelRow[];
      };
    };
  };
}

export interface PennantThunkPayload {
  content: {
    records: {
      siftersFilters: { filters: CpanelRow[]; sifters: CpanelRow[] };
      banners: Banner[];
    };
  };
}

export interface SubmissionThunkPayload {
  content: {
    records: {
      dashboardsFilters: { filters: CpanelRow[]; dashboards: CpanelRow[] };
      quizzes: Quiz[];
    };
  };
}

export interface CourseThunkPayload {
  content: {
    records: {
      foundationSifters: {
        records?: { siftersInstructions: { instructions: CpanelRow[]; sifters: CpanelRow[] } };
        foundation: CpanelRow[];
        sifters: CpanelRow[];
      };
    };
  };
}

export interface QuizThunkPayload {
  content: {
    records: {
      foundationDashboards: { foundation: CpanelRow[]; dashboards: CpanelRow[] };
    };
  };
}

export interface QuestionThunkPayload {
  content: {
    records: {
      dashboardsSifters: { sifters: CpanelRow[]; dashboards: CpanelRow[] };
    };
  };
}
