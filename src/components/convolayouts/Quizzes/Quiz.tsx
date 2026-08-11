import React from 'react';
import LinkifiedText from '../../LinkifiedText';
import * as quizStyles from '../../../styles/quiz.module.css';
import * as courseStyles from '../../../styles/course.module.css';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/types';

const styleProps = {
  colSm12: courseStyles['col-sm-12'],
  colMd12: courseStyles['col-md-12'],
  colLg6: courseStyles['col-lg-6'],
  colXl6: courseStyles['col-xl-6'],
  colXl12: quizStyles['col-xl-12'],
  colXl3: quizStyles['col-xl-3'],
  colMd6: quizStyles['col-md-6'],
  bgColorGray: courseStyles['bg-color-gray'],
  textColorWhite: courseStyles['text-color-white'],
  textColorGray: courseStyles['text-color-gray'],
  flexCenter: courseStyles['flex-center'],
  quote: courseStyles["quote"],
  quoteContainer: courseStyles['quote-container'],
  row: quizStyles["row"],
  dismissBtn: courseStyles["dismissBtn"],
  progress: quizStyles["progress"],
  banner: courseStyles["banner"],
  section: courseStyles["section"],
  sectionMinH: courseStyles['section-min-h'],
  siteName: courseStyles['site-name'],
  card: quizStyles["card"],
  quizContainer: quizStyles["quiz-container"],
  container: quizStyles["container"],
  padding: quizStyles["padding"],
  mB30: quizStyles["m-b-30"],
  cardBlock: quizStyles["card-block"],
  textCGreen: quizStyles["text-c-green"],
  progressBar: quizStyles['progress-bar'],
  textCRed: quizStyles["text-c-red"],
  progressBarYellow: quizStyles["progress-bar-yellow"],
  progressBarGreen: quizStyles["progress-bar-green"],
  progressBarRed: quizStyles['progress-bar-red'],
  cardProjProgress: quizStyles['proj-progress-card'],
  ml10: quizStyles['m-l-10'],
  bgColorPrimary: courseStyles['bg-color-primary'],
}

interface QuizProps {
  id: number;
  total: number;
  title: string;
  quote: string;
  leftQuote?: boolean;
  isHighlighted?: boolean;
  positionY?: React.RefObject<number>;
  toggler: (payload: { selectedId?: number, canToggle?: boolean }) => void;
}

const quoteCss = `quote ${styleProps.quote}`;
const contCss = `flex-center p-3 p-md-5 ${styleProps.flexCenter}`;
const origQuoteCss = `quote text-color-gray ${styleProps.quote} ${styleProps.textColorGray}`;
const isHighlight = `bg-color-gray text-color-white ${styleProps.bgColorGray} ${styleProps.textColorWhite}`;

const Quiz: React.FC<QuizProps> = ({
  id,
  total,
  title,
  quote,
  toggler,
  leftQuote,
  positionY,
  isHighlighted,
}) => {
  const banner = `${title?.toUpperCase()} (${total ?? 0})`;
  const isClickable = leftQuote !== undefined;
  const isMaximumFeatures = useSelector((state: RootState) => 
    !state.settings.isUnzipCourses && !state.settings.isUnzipQuizzes && !state.settings.isUnzipTutorials);
  const onExit = () => {
    if (positionY?.current !== undefined && positionY.current > -1) {
      setTimeout(() => window.scrollTo(0, positionY.current), 500);
    }
    toggler({ selectedId: id });
  };

  const dismissHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (!isClickable) onExit();
  };

  return (
    <div>
      <section className={`row section banner pb-lg-3 ${styleProps.row} ${styleProps.banner} ${styleProps.section}`}>
        {leftQuote && (
          <div
            className={`${styleProps.colSm12} ${styleProps.colMd12} ${styleProps.colLg6} ${styleProps.colXl6}`}
          >
            <div className={isHighlighted ? isHighlight + contCss : contCss}>
                <q className={isHighlighted ? quoteCss : origQuoteCss}>
                  &nbsp;
                  <span className={`${styleProps.quoteContainer}`}>
                    <LinkifiedText text={quote} maxLength={500} />
                  </span>
                  &nbsp;
                </q>
            </div>
          </div>
        )}
        <div
          onClick={isClickable ? () => toggler({ selectedId: id }) : undefined}
          className={`${styleProps.colSm12} ${styleProps.colMd12} ${styleProps.colLg6} ${styleProps.colXl6} p-0`}
        >
          {(isMaximumFeatures || !isClickable) && <span className={`${styleProps.dismissBtn}`} onClick={dismissHandler}>
            ×
          </span>}
          <div className={`flex-center p-5 bg-color-primary section-min-h  ${styleProps.flexCenter} ${styleProps.bgColorPrimary} ${styleProps.sectionMinH} ${styleProps.banner}`}>
            <h1 className={`text-color-white site-name ${styleProps.textColorWhite} ${styleProps.siteName}`}>{banner}</h1>
          </div>
        </div>
        {!leftQuote && (
          <div
            className={`${styleProps.colSm12} ${styleProps.colMd12} ${styleProps.colLg6} ${styleProps.colXl6}`}
          >
            <div className={isHighlighted ? isHighlight + contCss : contCss}>
                <q className={isHighlighted ? quoteCss : origQuoteCss}>
                  &nbsp;
                  <span className={`${styleProps.quoteContainer}`}>
                    <LinkifiedText text={quote} maxLength={500} />
                  </span>
                  &nbsp;
                </q>
            </div>
          </div>
        )}
      </section>
      <div className={`quiz-container ${styleProps.quizContainer}`}>  
        <div className={`padding ${styleProps.padding}`}> 
          <div className={`row container d-flex justify-content-center ${styleProps.row} ${styleProps.container}  `}>
            <div className={`${styleProps.colXl12}`}>
              <div className={`card proj-progress-card ${styleProps.card} ${styleProps.cardProjProgress}`}>
                <div className={`card-block ${styleProps.cardBlock}`}>
                  <div className={`row ${styleProps.row}`}>
                    <div className={`${styleProps.colXl3} ${styleProps.colMd6}`}>
                      <h6>Hard Questions</h6>
                      <h5 className={`m-b-30 f-w-700 ${styleProps.mB30}`}>
                        532<span className={`text-c-green m-l-10 ${styleProps.textCGreen} ${styleProps.ml10}`}>+1.69%</span>
                      </h5>
                      <div className={`progress ${styleProps.progress}`}>
                        <div
                          className={`progress-bar bg-c-red ${styleProps.progressBar} ${styleProps.progressBarRed}`}
                          style={{ width: "25%" }}
                        ></div>
                      </div>
                    </div>
                    <div className={`${styleProps.colXl3} ${styleProps.colMd6}`}>
                      <h6>Medium Questions</h6>
                      <h5 className={`m-b-30 f-w-700 ${styleProps.mB30}`}>
                        4,569<span className={`text-c-red m-l-10 ${styleProps.textCRed} ${styleProps.ml10}`}>-0.5%</span>
                      </h5>
                      <div className={`progress ${styleProps.progress}`}>
                        <div
                          className={`progress-bar bg-c-blue ${styleProps.progressBar}`}
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </div>
                    <div className={`${styleProps.colXl3} ${styleProps.colMd6}`}>
                      <h6>Easy Questions</h6>
                      <h5 className={`m-b-30 f-w-700 ${styleProps.mB30}`}>
                        89%<span className={`text-c-green m-l-10 ${styleProps.textCGreen} ${styleProps.ml10}`}>+0.99%</span>
                      </h5>
                      <div className={`progress ${styleProps.progress}`}>
                        <div
                          className={`progress-bar bg-c-green ${styleProps.progressBar} ${styleProps.progressBarGreen}`} 
                          style={{ width: "85%" }}
                        ></div>
                      </div>
                    </div>
                    <div className={`${styleProps.colXl3} ${styleProps.colMd6}`}>
                      <h6>Bonus Questions</h6>
                      <h5 className={`m-b-30 f-w-700 ${styleProps.mB30} `}>
                        365<span className={`text-c-green m-l-10 ${styleProps.textCGreen} ${styleProps.ml10}`}>+0.35%</span>
                      </h5>
                      <div className={`progress ${styleProps.progress}`}>
                        <div
                          className={`progress-bar bg-c-yellow ${styleProps.progressBar} ${styleProps.progressBarYellow}`}
                          style={{ width: "45%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz; 