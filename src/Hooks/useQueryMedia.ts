import { medias } from '../utils';
import { useMediaQuery } from 'react-responsive';

const getScreenIndex = (screenQueries: boolean[]): number => {
  return screenQueries.length > 6 && screenQueries[6]
    ? 6
    : screenQueries.length > 5 && screenQueries[5]
      ? 5
      : screenQueries.length > 4 && screenQueries[4]
        ? 4
        : screenQueries.length > 3 && screenQueries[3]
          ? 3
          : screenQueries.length > 2 && screenQueries[2]
            ? 2
            : screenQueries.length > 1 && screenQueries[1]
              ? 1
              : 0;
};

interface UseQueryMediaReturn {
  screen: number;
  isTablet: boolean;
  isSmall: boolean;
  is14Inch: boolean;
  is15Inch: boolean;
  isDeskTop: boolean;
}

export default function useQueryMedia(): UseQueryMediaReturn {
  const isDeskTop = useMediaQuery(medias.DeskTop);
  const is15Inch = useMediaQuery(medias._15Inch);
  const is14Inch = useMediaQuery(medias._14Inch);
  const isSmall = useMediaQuery(medias.Small);
  const isTablet = useMediaQuery(medias.Tablet);
  const isPhablet = useMediaQuery(medias.Phablet);
  const isMobile = useMediaQuery(medias.Mobile);

  const sQ1 = [isMobile, isPhablet, isTablet];
  const sQ2 = [isSmall, is14Inch, is15Inch, isDeskTop];
  const screen = getScreenIndex(sQ1.concat(sQ2));

  return { screen, isTablet, isSmall, is14Inch, is15Inch, isDeskTop };
}
