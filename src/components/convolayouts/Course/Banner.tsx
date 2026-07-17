import React from 'react';
import { useDispatch } from 'react-redux';
import { resetChapters } from '../../../store/slices/courseSlice';
import {
  BannerSection,
  BannerQuoteColumn,
  BannerTitleColumn,
} from '../Tutorial/Container';
import { prependError } from '../../../store/slices/errorSlice';

interface BannerProps {
  id: number;
  total?: number;
  title: string;
  quote: string;
  leftQuote?: boolean;
  isHighlighted?: boolean;
  titleColumnSelected?: boolean;
  onWrapperClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Banner: React.FC<BannerProps> = ({
  id,
  total,
  title,
  quote,
  leftQuote,
  isHighlighted,
  onWrapperClick,
  titleColumnSelected = false,
}) => {
  const dispatch = useDispatch();
  const banner = `${title.toUpperCase()} (${total ?? 0})`;

  const dismissHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(resetChapters());
    dispatch(prependError('Chapter mode disabled'));
  };

  const quoteColumnProps = {
    quote,
    isHighlighted,
  };

  return (
    <BannerSection>
      {leftQuote && <BannerQuoteColumn {...quoteColumnProps} />}
      <BannerTitleColumn
        bannerLabel={banner}
        dismissHandler={dismissHandler}
        onWrapperClick={onWrapperClick}
        titleColumnSelected={titleColumnSelected}
      />
      {!leftQuote && <BannerQuoteColumn {...quoteColumnProps} />}
    </BannerSection>
  );
};

export default Banner;
