/**
 * Comments body API – paths for /api/commentsbody.
 * Message bodies live under bosses/minions/underbosses instructions routes.
 */
import { getBaseUrl } from '../utils';

export const COMMENTS_API_BASE = '/api/comments';
export const COMMENTSBODY_API_BASE = '/api/commentsbody';

export const commentsPath = (path: string) => `${getBaseUrl()}${COMMENTS_API_BASE}${path}`;
export const commentsbodyPath = (path: string) => `${getBaseUrl()}${COMMENTSBODY_API_BASE}${path}`;

export const COMMENTS_BODY_PATHS = {
  bossesInstructions: '/bosses/instructions',
  underbossesInstructions: '/underbosses/instructions',
  minionsInstructions: '/minions/instructions',
} as const;

export type CommentsBodyPath =
  | (typeof COMMENTS_BODY_PATHS)[keyof typeof COMMENTS_BODY_PATHS];

export interface CommentContentQuery {
  take?: number | null;
  skip?: number | null;
  search?: string | null;
  isMutating?: boolean | null;
  childIds?: number[] | null;
  parentIds?: number[] | null;
  isPrivateView?: boolean | null;
}

export interface CommentbodyArgs {
  args: CommentContentQuery;
  mailer: number | null;
  curToken: string | null;
  mutateRole: string | null;
}
