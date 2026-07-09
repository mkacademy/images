import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const WAIT = 'Loading ... please wait';
const OOPS = 'oops! nothing in here';

/**
 * Editor parity for empty PnC state, plus viewer unzip/hydration:
 * `isNotUnzipping === false` means bulk fetch finished and unzip/hydrate may still run.
 */
export function usePncEmptyMessage(): string {
  const requestIsFetching = useSelector((state: RootState) => state.view.requestIsFetching);
  const requestIsSkeletons = useSelector((state: RootState) => state.view.requestIsSkeletons);
  const hydrationQueries = useSelector((state: RootState) => state.session.hydrationQueries);
  const isNotUnzipping = useSelector((state: RootState) => state.settings.isNotUnzipping);
  const isUnzipTutorials = useSelector((state: RootState) => state.settings.isUnzipTutorials);
  const isUnzipCourses = useSelector((state: RootState) => state.settings.isUnzipCourses);
  const isUnzipQuizzes = useSelector((state: RootState) => state.settings.isUnzipQuizzes);

  const unzipActive = isUnzipTutorials || isUnzipCourses || isUnzipQuizzes;
  const pipelineBusy = unzipActive && !isNotUnzipping;

  const isLoading =
    requestIsFetching ||
    requestIsSkeletons ||
    hydrationQueries > 0 ||
    pipelineBusy;

  return isLoading ? WAIT : OOPS;
}
