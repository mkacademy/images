import React from 'react';
import { placeholder, textEllipsis } from "../../../utils";
import { isVisualSlotValue, resolveMediaSlotSrc } from '../../../library/imageUtils';
import { contCss, isHighlight, SlideType, slideStyles } from '../Tutorial/Content';

interface SnapshotProps {
  slide: SlideType;
  onSnapshotClick?: (e: React.MouseEvent) => void;
}

const Snapshot: React.FC<SnapshotProps> = ({
  slide: { imageurl = "", isHighlighted = false } = {
    id: -1,
    imageurl: "",
    isHighlighted: false,
  },
  onSnapshotClick,
}) => {
  const imageUrl = resolveMediaSlotSrc(imageurl);

  return (
    <React.Fragment>
      {isVisualSlotValue(imageurl) ? (
        <div className={`${slideStyles.colSm12} ${slideStyles.colMd12} ${slideStyles.colLg6} ${slideStyles.colXl6} p-0 ${slideStyles.controlsRow}`}>
          <img
            src={imageUrl}
            alt="placeholder"
            className="img-fluid"
            onClick={onSnapshotClick}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = placeholder;
            }}
          />
        </div>
      ) : (
        <div className={`${slideStyles.colSm12} ${slideStyles.colMd12} ${slideStyles.colLg6} ${slideStyles.colXl6}`}>
          <div onClick={onSnapshotClick} className={isHighlighted ? isHighlight + contCss : contCss}>
            <div className={`flex-center flex-col ${slideStyles.flexCenter} ${slideStyles.flexCol}`}>
              <p className={`text-container ${slideStyles.textContainer}`}>
                <span className={slideStyles.quoteContainer}>
                  {textEllipsis(imageurl)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Snapshot;
