import React from 'react';
import Content, { getSectionClass, SlideType } from './Content';
import Snapshot from './Snapshot';

interface SlideProps {
  leftIMG: boolean;
  slide: SlideType;
}

const Slide: React.FC<SlideProps> = ({ leftIMG, slide }) => {
  const imgcss = getSectionClass(leftIMG);
  return (
    <section className={imgcss}>
      {leftIMG && <Snapshot slide={slide} />}
      <Content slide={slide} />
      {!leftIMG && <Snapshot slide={slide} />}
    </section>
  );
};

export default Slide;
