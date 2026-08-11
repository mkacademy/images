import React from 'react';
import { Image } from 'react-bootstrap';
import LinkifiedText from '../../LinkifiedText';
import { placeholder } from "../../../utils";
import * as styles from '../../../styles/course.module.css';
import { isMediaSlotValue, resolveMediaSlotSrc } from '../../../library/imageUtils';

const fullscreenIcon = new URL('../../../Images/fullscreen.png', import.meta.url).href;

export const slideStyles = {
  row: styles["row"],
  section: styles["section"],
  leftImage: styles["leftImage"],
  flexCol: styles['flex-col'],
  rightImage: styles["rightImage"],
  arrowLeft: styles['arrow-left'],
  arrowRight: styles['arrow-right'],
  flexCenter: styles['flex-center'],
  imgHighlited: styles['imgHighlited'],
  controlsRow: styles['controls_row'],
  textContainer: styles['text-container'],
  quoteContainer: styles['quote-container'],
  textColorWhite: styles['text-color-white'],
  textColorGray: styles['text-color-gray'],
  bgColorGray: styles['bg-color-gray'],
  colSm12: styles['col-sm-12'],
  colMd12: styles['col-md-12'],
  colLg6: styles['col-lg-6'],
  colXl6: styles['col-xl-6'],
  markdownExpandBtn: styles['markdownExpandBtn'],
};

export const isHighlight = `bg-color-gray text-color-white ${slideStyles.bgColorGray} ${slideStyles.textColorWhite}`;
export const snapCss = ` ${slideStyles.colSm12} ${slideStyles.colMd12} ${slideStyles.colLg6} ${slideStyles.colXl6} p-0 ${slideStyles.controlsRow}`;
export const contCss = `flex-center pl-3 pr-3 pt-3 pl-md-5 pr-md-5 pt-lg-0 ${slideStyles.flexCenter}`;

export interface SlideType {
  id: number;
  content: string;
  imageurl: string;
  isHighlighted: boolean;
}

interface ContentProps {
  slide: SlideType;
  canExpandMarkdown?: boolean;
  onExpandMarkdown?: () => void;
}

const Content: React.FC<ContentProps> = ({
  canExpandMarkdown = false,
  onExpandMarkdown,
  slide: { id, content, isHighlighted = false } = {
    id: -1,
    content: "",
    isHighlighted: false,
  },
}) => {
  const imageUrl = resolveMediaSlotSrc(content);
  const expandHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    onExpandMarkdown?.();
  };
  const expandBtn = canExpandMarkdown && onExpandMarkdown ? (
    <button
      type="button"
      className={slideStyles.markdownExpandBtn}
      onClick={expandHandler}
      title="View markdown"
      aria-label="View markdown"
    >
      <Image src={fullscreenIcon} alt="" />
    </button>
  ) : null;

  return (
    <React.Fragment>
      {isMediaSlotValue(content) ? (
        <div
          className={isHighlighted ? slideStyles.imgHighlited + snapCss : snapCss}
        >
          {expandBtn}
          <img
            src={imageUrl}
            alt="placeholder"
            className="img-fluid"
            onError={(e) => {
              e.currentTarget.onerror = null;
              console.log("image_error");
              e.currentTarget.src = placeholder;
            }}
          />
        </div>
      ) : (
        <div
          className={`${slideStyles.colSm12} ${slideStyles.colMd12} ${slideStyles.colLg6} ${slideStyles.colXl6}`}
        >
          {expandBtn}
          <div className={isHighlighted ? isHighlight + contCss : contCss}>
            <div className={`flex-center flex-col ${slideStyles.flexCenter} ${slideStyles.flexCol}`}>
              <p className={`text-container ${slideStyles.textContainer}`}>
                <span className={slideStyles.quoteContainer}>
                  <LinkifiedText text={content} />
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export const getSectionClass = (leftIMG: boolean) => {
  const leftImagecss = `row section ${slideStyles.row} ${slideStyles.section} ${slideStyles.leftImage}`;
  const rightImagecss = `row section ${slideStyles.row} ${slideStyles.section} ${slideStyles.rightImage}`;
  return leftIMG ? leftImagecss : rightImagecss;
};

export default Content;
