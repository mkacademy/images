import type { Middleware } from '@reduxjs/toolkit';
import selectedRouteMatcher from './selectedRouteMatcher';
import hydrationOnCurAppChange from './hydrationOnCurAppChange';

/** Viewer middleware — route sync for PNC open/close/chapter navigation. */
export const preThunkMiddleware: Middleware[] = [selectedRouteMatcher];

export const postThunkMiddleware: Middleware[] = [hydrationOnCurAppChange];
