import React, { useCallback, useEffect, useState } from 'react';
import { isMarkdownSlotValue } from '../../../library/imageUtils';
import * as styles from '../../../styles/course.module.css';
import { getSectionClass, SlideType } from './Content';
import MarkdownExpandPane from './MarkdownExpandPane';

/** Same gate as the MD Snapshot card — show expand whenever the slot is markdown. */
export const canExpandMarkdownSlot = (imageurl: string): boolean =>
  isMarkdownSlotValue(imageurl);

type ExpandRenderProps = {
  canExpand: boolean;
  onExpand: () => void;
};

type MarkdownExpandableSectionProps = {
  leftIMG: boolean;
  slide: SlideType;
  children: (props: ExpandRenderProps) => React.ReactNode;
};

const MarkdownExpandableSection: React.FC<MarkdownExpandableSectionProps> = ({
  leftIMG,
  slide,
  children,
}) => {
  const canExpand = canExpandMarkdownSlot(slide.imageurl);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!canExpand) setExpanded(false);
  }, [canExpand, slide.imageurl]);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [expanded]);

  const onExpand = useCallback(() => {
    if (!canExpand) return;
    setExpanded(true);
  }, [canExpand]);

  const onClose = useCallback(() => {
    setExpanded(false);
  }, []);

  const sectionClass = [
    getSectionClass(leftIMG),
    expanded ? styles['markdownExpanded'] : '',
  ].filter(Boolean).join(' ');

  return (
    <section className={sectionClass}>
      {expanded ? (
        <MarkdownExpandPane imageurl={slide.imageurl} onClose={onClose} />
      ) : (
        children({ canExpand, onExpand })
      )}
    </section>
  );
};

export default MarkdownExpandableSection;
