import React, { RefObject } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/types';
import {
  BannerSection,
  BannerQuoteColumn,
  BannerTitleColumn,
} from './Container';

interface BannerProps {
  id: number;
  total?: number;
  title: string;
  quote: string;
  isShow?: boolean;
  leftQuote?: boolean;
  isHighlighted?: boolean;
  positionY?: RefObject<number>;
  toggler: (payload: { selectedId?: number; canToggle?: boolean }) => void;
  dismisser?: (payload: { id: number; isShow?: boolean }) => void;
  selector: (payload: { ids: number[] }) => void;
}

const Banner: React.FC<BannerProps> = ({
  id,
  total,
  title,
  quote,
  isShow,
  toggler,
  selector,
  dismisser,
  leftQuote,
  positionY,
  isHighlighted,
}) => {
  const banner = `${title.toUpperCase()} (${total ?? 0})`;
  const isClickable = leftQuote !== undefined;
  const isMaximumFeatures = useSelector((state: RootState) =>
    !state.settings.isUnzipCourses && !state.settings.isUnzipQuizzes && !state.settings.isUnzipTutorials);

  const onExit = () => {
    if (positionY?.current && positionY.current > -1)
      setTimeout(() => window.scrollTo(0, positionY.current), 500);
    toggler({ selectedId: id });
  };

  const dismissHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isClickable) onExit();
    else dismisser?.({ id, isShow });
  };

  const selectHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    selector({ ids: [id] });
  };

  const quoteColumnProps = {
    quote,
    isHighlighted,
    onSelect: selectHandler,
  };

  return (
    <BannerSection>
      {leftQuote && <BannerQuoteColumn {...quoteColumnProps} />}
      <BannerTitleColumn
        bannerLabel={banner}
        dismissHandler={dismissHandler}
        showDismiss={isMaximumFeatures || !isClickable}
        onWrapperClick={isClickable ? () => toggler({ selectedId: id }) : undefined}
      />
      {!leftQuote && <BannerQuoteColumn {...quoteColumnProps} />}
    </BannerSection>
  );
};

export default Banner;
