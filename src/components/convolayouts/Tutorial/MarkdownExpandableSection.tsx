import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { isMarkdownSlotValue, isPlainTextSlotValue } from '../../../library/imageUtils';
import * as styles from '../../../styles/course.module.css';
import { getSectionClass, SlideType } from './Content';

// react-markdown + remark-gfm stay out of the main bundle until a markdown row expands.
const MarkdownExpandPane = lazy(() => import('./MarkdownExpandPane'));

/** Same gate as the Snapshot card — show expand for markdown or plain-text slots. */
export const canExpandMarkdownSlot = (imageurl: string): boolean =>
  isMarkdownSlotValue(imageurl) || isPlainTextSlotValue(imageurl);

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
  // Markdown / plain-text rows open expanded so the document is visible immediately.
  const [expanded, setExpanded] = useState(canExpand);

  useEffect(() => {
    if (!canExpand) setExpanded(false);
  }, [canExpand, slide.imageurl]);

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
        <Suspense fallback={null}>
          <MarkdownExpandPane imageurl={slide.imageurl} onClose={onClose} />
        </Suspense>
      ) : (
        children({ canExpand, onExpand })
      )}
    </section>
  );
};

export default MarkdownExpandableSection;
