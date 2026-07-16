import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../../store/types';
import {
    SlideGroup,
    toggleCourse,
    Banner as CourseBannerType,
} from '../../../store/slices/courseSlice';
import CoversBanner from '../../convolayouts/Tutorial/Banner';
import Chapters from './Chapters';
import { contentPred as courseContentPred } from './Screen';
import { LengthItem } from '../Tutorial/Screen';
import { useApplyRouterSelections, useClearFsqOnEscapeWhenUnselected, useExitExpandedOnEscape } from '../../../Hooks/useShortcuts';
import Covers from './Covers';
import { SlideGroupItem } from '../../../store/slices/courseSlice';

interface CanopyProps {
    noCourses: boolean;
    onRouterSelection?: () => void;
}

const Canopy: React.FC<CanopyProps> = ({ noCourses, onRouterSelection }) => {
    const positionY = useRef(-1);
    const dispatch = useDispatch();
    const { state: routerState } = useLocation();
    useApplyRouterSelections(!noCourses, routerState);
    const banners = useSelector((state: RootState) => state.course.banners);
    const content = useSelector((state: RootState) => state.course.content);
    const selected = useSelector((state: RootState) => state.course.selected);
    const chapters = useSelector((state: RootState) => state.course.chapters) ?? [];

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

    const isChapterExpanded = !noCourses && chapters.length > 0 && selected > -1 && !!banners[selected];
    const isCoverExpanded = !isChapterExpanded && !noCourses && selected > -1 && !!banners[selected];

    useExitExpandedOnEscape(isCoverExpanded, () => {
        if (selected === -1) return;
        const b = banners[selected];
        if (!b) return;
        if (positionY.current > -1) {
            setTimeout(() => window.scrollTo(0, positionY.current), 500);
        }
        dispatch(toggleCourse({ selectedId: b.id }));
    });
    useClearFsqOnEscapeWhenUnselected(selected === -1);

    if (noCourses) return null;

    const banner = banners[selected];
    const showChapters = chapters.length > 0;
    const match = content.find(courseContentPred(banner));
    const { slides = [], ...covers } = match ?? {};
    const slideGroupItems: SlideGroupItem[] = Object.values(covers);
    const lengths: LengthItem[] = content.map((group: SlideGroup) => {
        const { slides, ...slideGroupItems } = group;
        return {
            total: Object.keys(slideGroupItems).length ?? 0,
            id: group[0]?.bannerId || 0
        };
    });
    return (
        <>
            {banner ? (
                <>
                    {showChapters ? (
                        <Chapters
                            slides={slides}
                            chapters={chapters}
                            onRouterSelection={onRouterSelection}
                        />
                    ) : (
                        <Covers
                            banner={banner}
                            positionY={positionY}
                            covers={slideGroupItems}
                            onRouterSelection={onRouterSelection}
                            total={lengths.find(({ id }: LengthItem) => id === banner.id)?.total}
                        />
                    )}
                </>
            ) : (
                banners.map((banner: CourseBannerType, i: number) => (
                    <CoversBanner
                        id={banner.id}
                        key={banner.id}
                        positionY={positionY}
                        leftQuote={i % 2 !== 0}
                        title={banner.title || ''}
                        quote={banner.quote || ''}
                        isHighlighted={banner.isHighlighted}
                        total={lengths.find(({ id }: LengthItem) => id === banner.id)?.total}
                        selector={() => { }}
                        toggler={(payload: { selectedId?: number, canToggle?: boolean }) => dispatch(toggleCourse(payload))}
                    />
                ))
            )}
        </>
    );
};

export default Canopy;
