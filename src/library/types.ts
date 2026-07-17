
import { CookIngredientsProps } from "../utils";
export interface CustomJwtPayload {
    sub: string;
    quota: number;
    userid: number;
    roles: string[];
    roleIds: number[];
}

export interface AuthPayload {
    email: string;
    seconds: number;
    password: string;
    selectedRole: string;
    ingredients: CookIngredientsProps;
}

export interface QueryParams {
  type?: string;
  IDs?: number[];
  entity?: string;
  webapp?: string;
  parent?: string;
  hasCounts?: boolean;
  convolution?: string;
  isPrivateView?: boolean;
  seek?: number[] | string;
  curToken?: string | null;
  mutateRole?: string | null;
  mailer?: number | undefined;
  limit?: { take: number | undefined; skip: number | undefined };
}
