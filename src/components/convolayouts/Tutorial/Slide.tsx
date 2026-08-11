import React from 'react';
import Content, { SlideType } from './Content';
import MarkdownExpandableSection from './MarkdownExpandableSection';
import Snapshot from './Snapshot';

interface SlideProps {
  leftIMG: boolean;
  slide: SlideType;
}

const Slide: React.FC<SlideProps> = ({ leftIMG, slide }) => (
  <MarkdownExpandableSection leftIMG={leftIMG} slide={slide}>
    {({ canExpand, onExpand }) => (
      <>
        {leftIMG && <Snapshot slide={slide} />}
        <Content
          slide={slide}
          canExpandMarkdown={canExpand}
          onExpandMarkdown={onExpand}
        />
        {!leftIMG && <Snapshot slide={slide} />}
      </>
    )}
  </MarkdownExpandableSection>
);

export default Slide;
