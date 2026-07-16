import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/types';
import {
  toggleCourse,
  SlideItem,
  Banner,
  SlideGroup,
  SlideGroupItem,
} from '../../../store/slices/courseSlice';
import Pennant from './Pennant';
import SlideShow from './SlideShow';
import * as styles from '../../../styles/404.module.css';
import useMediaQuery from '../../../Hooks/useQueryMedia';
import { _500 as Notfound } from '../../../components/views/404';
import { useClearFsqOnEscapeWhenUnselected, useExitExpandedOnEscape } from '../../../Hooks/useShortcuts';

interface CourseProps {
  noCourses: boolean;
}

const dismissedPred = (item: { isDismissed?: boolean }) => item.isDismissed === false;
const pennantsPred = (item: Banner) =>
  item.pennants?.some(({ isDismissed }) => isDismissed === false);
const slidesPred = (slides: SlideItem[][], courseCouplings: Record<number, number[]>) => (item: SlideGroupItem) =>
  getSlideItems(courseCouplings, item.id, slides).some(dismissedPred);
export const contentPred = (pennant: Banner) => (group: SlideGroup) => group[0]?.bannerId === pennant?.id;
const getSlideItems = (courseCouplings: Record<number, number[]>, id: number, slides: SlideItem[][]) => {
  const slideIndexes = courseCouplings[id] ?? [];
  return slideIndexes.map((index) => slides[index] ?? []).flat();
};

const totalPred = (group: SlideGroup) => {
  const { slides, ...thumbs } = group;
  return [
    {
      total: Object.keys(thumbs).length,
      id: thumbs[0]?.bannerId,
    },
    ...slides.map((slide: SlideItem[]) => ({
      total: slide.length,
      id: slide[0]?.bannerId,
    })),
  ];
};

const Course: React.FC<CourseProps> = ({ noCourses }) => {
  const positionY = useRef(-1);
  const dispatch = useDispatch();
  const { screen } = useMediaQuery();

  const banners = useSelector((state: RootState) => state.course.banners);
  const content = useSelector((state: RootState) => state.course.content);
  const selected = useSelector((state: RootState) => state.course.selected);
  const couplings = useSelector((state: RootState) => state.course.couplings);

  const pennant = banners[selected];
  const match = content.find(contentPred(pennant));
  const { slides = [], ...thumbs } = match ?? {};
  const slideshows = Object.values(thumbs ?? {});
  const courseCouplings = pennant ? (couplings[pennant.id] ?? {}) : {};
  const visibles = slideshows.filter(slidesPred(slides, courseCouplings));

  const lengths =  content.map(totalPred).flat();

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

  const isExpanded = !noCourses && selected > -1 && !!banners[selected];
  useExitExpandedOnEscape(isExpanded, () => {
    if (selected === -1) return;
    const p = banners[selected];
    if (!p) return;
    if (positionY.current > -1) {
      setTimeout(() => window.scrollTo(0, positionY.current), 500);
    }
    dispatch(toggleCourse({ selectedId: p.id }));
  });
  useClearFsqOnEscapeWhenUnselected(selected === -1);

  if (noCourses) return null;
  return (
    <React.Fragment>
      {pennant ? (
        <React.Fragment>
          <Pennant
            key={pennant.id}
            totals={lengths}
            positionY={positionY}
            selector={() => {}}
            chooser={() => {}}
            discarder={() => {}}
            dismisser={() => {}}
            toggler={(payload) => dispatch(toggleCourse(payload))}
            pennants={[pennant, ...pennant.pennants?.map(p => ({
              ...p,
              pennants: [],
              sifterId: p.filterId,
            }))].filter(dismissedPred)}
          />
          {visibles.length > 0 ? (
            visibles.map((thumb, k) => {
              const i = courseCouplings[thumb.id]?.[0] ?? -1;
              const slideItems = getSlideItems(courseCouplings, thumb.id, slides);
              const slideshow = [{ ...thumb }, ...slideItems];
              const visibles = slideshow.filter(dismissedPred);
              return (
                <SlideShow
                  key={thumb.id}
                  slides={visibles}
                  leftIMG={screen > 2 ? k % 2 !== 0 : false}
                />
              );
            })
          ) : (
            <div className={`${styles["notFound"]} ${styles["bigger"]}`}>
              <Notfound message="oops! nothing in here" />
            </div>
          )}
        </React.Fragment>
      ) : (
        banners.filter(pennantsPred).map((pennant, i) => (
          <Pennant
            key={pennant.id}
            totals={lengths}
            positionY={positionY}
            selector={() => {}}
            chooser={() => {}}
            dismisser={() => {}}
            toggler={(payload) => dispatch(toggleCourse(payload))}
            leftQuote={screen > 2 ? i % 2 !== 0 : false}
            pennants={[pennant, ...pennant.pennants?.map(p => ({
              ...p,
              pennants: [],
              sifterId: p.filterId,
            }))].filter(dismissedPred)}
          />
        ))
      )}
    </React.Fragment>
  );
};

export default Course; 