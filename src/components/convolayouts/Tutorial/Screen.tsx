import Slide from './Slide';
import Banner from './Banner';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Content,
  toggleTutorial,
  Banner as BannerType,
} from '../../../store/slices/tutorialSlice';
import { RootState } from '../../../store/types';
import { _500 as NotFound } from '../../views/404';
import * as styles from '../../../styles/404.module.css';
import { useApplyRouterSelections, useClearFsqOnEscapeWhenUnselected, useExitExpandedOnEscape } from '../../../Hooks/useShortcuts';
interface ScreenProps {
  noTutorials: boolean;
  onRouterSelection?: () => void;
}

export interface LengthItem {
  total: number;
  id: number;
}

const Screen: React.FC<ScreenProps> = ({ noTutorials, onRouterSelection }) => {
  const positionY = useRef(-1);
  const dispatch = useDispatch();
  const { state: routerState } = useLocation();
  useApplyRouterSelections(!noTutorials, routerState);
  const banners = useSelector((state: RootState) => state.tutorial.banners);
  const content = useSelector((state: RootState) => state.tutorial.content);
  const selected = useSelector((state: RootState) => state.tutorial.selected);


  useEffect(() => {
    const handleScroll = () => {
      if (selected === -1) {
        const change = Math.abs(window.scrollY - positionY.current);
        if (change < 1000) positionY.current = window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selected]);

  const isExpanded = !noTutorials && selected > -1 && !!banners[selected];
  useExitExpandedOnEscape(isExpanded, () => {
    if (selected === -1) return;
    const b = banners[selected];
    if (!b) return;
    if (positionY.current > -1) {
      setTimeout(() => window.scrollTo(0, positionY.current), 500);
    }
    dispatch(toggleTutorial({ selectedId: b.id }));
  });
  useClearFsqOnEscapeWhenUnselected(selected === -1);

  if (noTutorials) return null;

  const banner = banners[selected];
  const defaultItem: Partial<Content> = { bannerId: 0 };
  const predicate = ({ isDismissed }: { isDismissed?: boolean }) => isDismissed === false;
  const predicate0 = ([{ bannerId } = defaultItem]: Partial<Content>[]) => bannerId === banner?.id;
  const lengths: LengthItem[] = content.map(([{ bannerId } = defaultItem]: Partial<Content>[], i: number) => ({
    total: content[i].length ?? 0,
    id: bannerId || 0
  }));
  const slides = content.find(predicate0);
  const visible = slides?.filter(predicate) ?? [];

  return (
    <>
      {banner ? (
        <>
          <Banner
            id={banner.id}
            leftQuote={undefined}
            positionY={positionY}
            title={banner.title || ''}
            quote={banner.quote || ''}
            isHighlighted={banner.isHighlighted}
            total={lengths.find(({ id }: LengthItem) => id === banner.id)?.total}
            selector={() => { onRouterSelection?.(); }}
            toggler={(payload: { selectedId?: number, canToggle?: boolean }) => dispatch(toggleTutorial(payload))}
          />
          {visible.length > 0 ? (
            visible.map((slide: Content, i: number) => (
              <Slide
                key={slide.id}
                slide={{
                  id: slide.id,
                  content: slide.content || '',
                  imageurl: slide.imageurl || '',
                  isHighlighted: slide.isHighlighted || false
                }}
                leftIMG={i % 2 !== 0}
                selector={() => { onRouterSelection?.(); }}
              />
            ))
          ) : (
            <div className={`${styles["notFound"]} ${styles["bigger"]}`}>
              <NotFound message="oops! nothing in here" />
            </div>
          )}
        </>
      ) : (
        banners.filter(predicate).map((banner: BannerType, i: number) => (
          <Banner
            id={banner.id}
            key={banner.id}
            positionY={positionY}
            leftQuote={i % 2 !== 0}
            title={banner.title || ''}
            quote={banner.quote || ''}
            isHighlighted={banner.isHighlighted}
            total={lengths.find(({ id }: LengthItem) => id === banner.id)?.total}
            selector={() => { onRouterSelection?.(); }}
            toggler={(payload: { selectedId?: number, canToggle?: boolean }) => dispatch(toggleTutorial(payload))}
          />
        ))
      )}
    </>
  );
};

export default Screen;
