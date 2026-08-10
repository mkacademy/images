import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  resetChapters,
  resolveSlidesForChapterInSelectedCourse,
  setChaptersViaPennantId,
  SlideItem,
} from '../../../store/slices/courseSlice';
import { setPagedRoute } from '../../../store/slices/paginationSlice';
import { prependWarning } from '../../../store/slices/errorSlice';
import { useChapterEscape } from '../../../Hooks/useShortcuts';
import * as styles from '../../../styles/404.module.css';
import { _500 as Notfound } from '../../../components/views/404';
import { SlideType } from '../Tutorial/Content';
import Slide from '../Tutorial/Slide';
import ChapterBanner from './Banner';
import { RootState } from '../../../store/types';
import { countSlideItemsByBannerId } from '../../../library/CourseUtils';

const CHAPTER_LIST_ROUTE = 'siftersfilters';
const CHAPTER_OPEN_ROUTE = 'filtersinstructions';

export interface ChapterSlideRow {
  item: SlideItem;
  slideIndex: number;
}

interface ChaptersProps {
  chapters: number[];
  slides: SlideItem[][];
}
const NO_SLIDES = 'This chapter has no steps';
const NO_COUPLING = 'This chapter has steps, but no coupling';
const NO_CONTEXT = 'This chapter is not in the selected course';
const NO_COVER = 'This Chapter has slides, but no covers matches its ordinal, so chapters cannot be linked.';
const Chapters: React.FC<ChaptersProps> = ({
  slides,
  chapters: chapterIndexes,
}) => {
  const dispatch = useDispatch();
  const course = useSelector((state: RootState) => state.course);
  const curApp = useSelector((state: RootState) => state.session.curApp);
  const { banners, selected } = course;
  const [showSelected, setShowSelected] = useState(false);
  const openSelectedChapter = useCallback(() => {
    setShowSelected(true);
    dispatch(setPagedRoute([curApp, CHAPTER_OPEN_ROUTE]));
  }, [curApp, dispatch]);
  const closeSelectedChapter = useCallback(() => {
    setShowSelected(false);
    dispatch(setPagedRoute([curApp, CHAPTER_LIST_ROUTE]));
  }, [curApp, dispatch]);
  const toggleShowSelected = () => {
    if (showSelected) closeSelectedChapter();
    else openSelectedChapter();
  };
  useChapterEscape(
    showSelected,
    closeSelectedChapter,
    () => {
      console.log('Chapter mode disabled');
      dispatch(resetChapters());
    },
  );
  const slideCountsByPennantBannerId = useMemo(
    () =>
      countSlideItemsByBannerId(slides, (item) => item.isDismissed === false),
    [slides]
  );
  const chapterSlideRows: ChapterSlideRow[] = chapterIndexes.length > 0
    ? (() => {
      const seenSlideIds = new Set<number>();
      return [...new Set(chapterIndexes)].flatMap((slideIndex) =>
        (slides[slideIndex] ?? []).map((item) => ({
          item,
          slideIndex,
        }))
      ).filter((row) => {
        if (seenSlideIds.has(row.item.id)) return false;
        seenSlideIds.add(row.item.id);
        return true;
      });
    })()
    : [];
  const firstSlide = chapterSlideRows[0]?.item;
  const selectedBanner = selected > -1 ? banners[selected] : undefined;
  const selectedPennant = selectedBanner?.pennants?.find((pennant) => pennant.id === firstSlide?.bannerId);
  const pennantTotal = selectedPennant
    ? slideCountsByPennantBannerId.get(selectedPennant.id) ?? 0
    : undefined;
  const allPennants = selectedBanner?.pennants ?? [];

  const pennantChapterWrapperClick = useCallback(
    (pennantId: number): React.MouseEventHandler<HTMLDivElement> =>
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
        const res = resolveSlidesForChapterInSelectedCourse(course, pennantId);
        if (res === 'ok') dispatch(setChaptersViaPennantId(pennantId));
        else if (res === 'no-slides') dispatch(prependWarning(NO_SLIDES));
        else if (res === 'no-coupling') dispatch(prependWarning(NO_COUPLING));
        else if (res === 'no-ordinal-match') dispatch(prependWarning(NO_COVER));
        else if (res === 'no-context') dispatch(prependWarning(NO_CONTEXT));
      },
    [course, dispatch]
  );


  if (allPennants.length === 0) {
    return (
      <div className={`${styles["notFound"]} ${styles["bigger"]}`}>
        <Notfound message="oops! nothing in here" />
      </div>
    );
  }

  return (
    <>
      {showSelected ? (
        <>
          {selectedPennant && (
            <ChapterBanner
              titleColumnSelected
              total={pennantTotal}
              leftQuote={undefined}
              id={selectedPennant.id}
              title={selectedPennant.title || ''}
              quote={selectedPennant.quote || ''}
              onWrapperClick={toggleShowSelected}
              isHighlighted={selectedPennant.isHighlighted}
            />
          )}
          {chapterSlideRows.length === 0 ? (
            <div className={`${styles["notFound"]} ${styles["bigger"]}`}>
              <Notfound message="oops! nothing in here" />
            </div>
          ) : (
            chapterSlideRows.map((row, i: number) => {
              const slide: SlideType = {
                id: row.item.id,
                content: row.item.content || '',
                imageurl: row.item.imageurl || '',
                isHighlighted: row.item.isHighlighted || false,
              };
              return (
                <Slide
                  slide={slide}
                  key={`${row.slideIndex}-${row.item.id}`}
                  leftIMG={i % 2 !== 0}
                />
              );
            })
          )}
        </>
      ) : (
        allPennants.map((pennant, i: number) => {
          const selectedOrdinal = selectedPennant?.ordinal;
          const isRedPennant =
            selectedOrdinal !== undefined && pennant.ordinal === selectedOrdinal;
          return (
            <ChapterBanner
              key={pennant.id}
              id={pennant.id}
              leftQuote={i % 2 !== 0}
              title={pennant.title || ''}
              quote={pennant.quote || ''}
              isHighlighted={pennant.isHighlighted}
              onWrapperClick={isRedPennant ? toggleShowSelected : pennantChapterWrapperClick(pennant.id)}
              total={slideCountsByPennantBannerId.get(pennant.id) ?? 0}
              titleColumnSelected={isRedPennant}
            />
          );
        })
      )}
    </>
  );
};

export default Chapters;
