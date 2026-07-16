
import type { NavigateFunction } from 'react-router-dom';
import type { AppDispatch } from '../store';
import { prependWarning } from '../store/slices/errorSlice';

/** Viewer nav: fsq is always appended (uncoupled from shouldHydrate). */
export type StickyFsqOptions = {
  fsq: number;
};

export const rebuildConvolutionSearch = (
  currentSearch: string,
): string | undefined | null => {
  const raw = currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch;
  const params = new URLSearchParams(raw);
  const csEncoded = params.get('cs') ?? undefined;
  const extraParams: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key !== 'cs' && key !== 'fsq') extraParams[key] = value;
  });
  return buildConvolutionNavSearch(
    csEncoded,
    Object.keys(extraParams).length > 0 ? extraParams : undefined,
  );
};

export const syncConvolutionUrlFsq = (
  dispatch: AppDispatch,
  navigate: NavigateFunction,
  pathname: string,
  currentSearch: string,
): boolean => {
  if (!isFsqEligiblePathname(pathname)) return true;
  const search = rebuildConvolutionSearch(currentSearch);
  if (search === null) {
    warnConvolutionCsFsqConflict(dispatch);
    return false;
  }
  navigate({ pathname, search }, { replace: true });
  return true;
};

export type ConvolutionNavigateTo = {
  pathname: string;
  search: string | undefined;
};

const FSQ_ELIGIBLE_PATHS = new Set([
  '/convolution/tutorial',
  '/convolution/course',
  '/convolution/quiz',
]);

/** Routes where fetch-sequence (`fsq`) query params are meaningful. */
export const isFsqEligiblePathname = (pathname: string): boolean =>
  FSQ_ELIGIBLE_PATHS.has(pathname);

const parseGoBackUrl = (goBackUrl: string): ConvolutionNavigateTo => {
  const url = new URL(goBackUrl, 'http://local');
  return { pathname: url.pathname, search: url.search || undefined };
};

const wouldAppendCs = (csEncoded?: string, extraParams?: Record<string, string>) =>
  Boolean(csEncoded) || extraParams?.cs !== undefined;

const wouldAppendFsq = (extraParams?: Record<string, string>) => extraParams?.fsq !== undefined;

/** `cs` and `fsq` are mutually exclusive in convolution query strings. */
export const isConvolutionNavCancelled = (
  csEncoded?: string,
  extraParams?: Record<string, string>,
): boolean =>
  wouldAppendCs(csEncoded, extraParams) && wouldAppendFsq(extraParams);

export const CONVOLUTION_CS_FSQ_CONFLICT_MESSAGE =
  'Navigation cancelled: saved search (cs) and fetch sequence (fsq) cannot both appear in the query string.';

export const warnConvolutionCsFsqConflict = (dispatch: AppDispatch) => {
  dispatch(prependWarning(CONVOLUTION_CS_FSQ_CONFLICT_MESSAGE));
};

export const buildConvolutionNavSearch = (
  csEncoded?: string,
  extraParams?: Record<string, string>,
): string | undefined | null => {
  if (isConvolutionNavCancelled(csEncoded, extraParams)) return null;

  const params = new URLSearchParams();
  if (csEncoded) params.set('cs', csEncoded);
  // Viewer always appends fsq (uncoupled from shouldHydrate).
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }
  const search = params.toString();
  return search ? `?${search}` : undefined;
};

export const buildConvolutionNavigateTo = (
  pathname: string,
  csEncoded?: string,
  extraParams?: Record<string, string>,
): ConvolutionNavigateTo | null => {
  const search = buildConvolutionNavSearch(csEncoded, extraParams);
  if (search === null) return null;
  return { pathname, search };
};

export const navigateConvolutionOrWarn = (
  dispatch: AppDispatch,
  navigate: NavigateFunction,
  pathname: string,
  csEncoded?: string,
  extraParams?: Record<string, string>,
): boolean => {
  const target = buildConvolutionNavigateTo(pathname, csEncoded, extraParams);
  if (!target) {
    warnConvolutionCsFsqConflict(dispatch);
    return false;
  }
  navigate(target);
  return true;
};

/** Removes `fsq` from a location search string; returns `false` when `fsq` was not present. */
export const stripFsqFromSearch = (search: string): string | undefined | false => {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  if (!params.has('fsq')) return false;
  params.delete('fsq');
  const next = params.toString();
  return next ? `?${next}` : undefined;
};
