import { Carousel } from "react-bootstrap";
import '../../../styles/indicators.module.css';
import * as quizStyles from '../../../styles/quiz.module.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFollowupId } from '../../../store/slices/quizSlice';
import { Pennant, SlideItem } from '../../../store/slices/courseSlice';
import { RootState } from '../../../store/types';
import { getOptionsFromSlideItems, computeRanCombs, filterCombinationsForRandomizedType } from '../../../library/QuizUtils';
import { isValidDataUrl } from '../../../library/imageUtils';
import LinkifiedText from '../../LinkifiedText';
import { placeholder } from '../../../utils';
import OptionContent from './OptionContent';
import QuizRouteToggleOs from './QuizRouteToggleOs';

const styleProps = {
  msSm5: quizStyles['ms-sm-5'],
  psSm5: quizStyles['ps-sm-5'],
  question: quizStyles["question"],
  options: quizStyles['options'],
  optionImageLayer: quizStyles['optionImageLayer'],
  checkmark: quizStyles["checkmark"],
  clearChoiceBtn: quizStyles["clearChoiceBtn"],
  clearChoiceBtnSubmitted: quizStyles["clearChoiceBtnSubmitted"],
  clearChoiceBtnNeedsResubmit: quizStyles["clearChoiceBtnNeedsResubmit"],
  highlighted: quizStyles["highlighted"],
  highlighQuestion: quizStyles['highligh-question'],
  questionContainer: quizStyles['question-container'],
};

interface FollowupProps {
  pennant: Pennant;
  combs?: string[][];
  slideItems: SlideItem[];
}
const optionsContainerCss = "ms-md-3 ms-sm-3 ps-md-5 ps-sm-3";
const isHighlight = `highligh-question ${styleProps.highlighQuestion}`;
const contCss = `question-container ${styleProps.questionContainer} mt-sm-5`;

const Followup: React.FC<FollowupProps> = ({
  pennant,
  slideItems,
  combs = [],
}) => {
  const { id: questionId = -1, quote = "", isHighlighted = false } = pennant;
  const identifier = "choice" + questionId;
  const randomizedType = useSelector((state: RootState) => state.settings.randomizedType);
  const choice = useRef<Record<string, string | null>>({ [identifier]: null });
  const contClass = isHighlighted ? (isHighlight + ' ' + contCss) : contCss;
  const processedOptions = useMemo(() => getOptionsFromSlideItems(slideItems), [slideItems]);
  const displayCombinations = useMemo(
    () => filterCombinationsForRandomizedType(combs, randomizedType),
    [combs, randomizedType],
  );
  const [ranCombs, setRanCombs] = useState<number[]>([]);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  useEffect(() => {
    choice.current = { [identifier]: null };
  }, [identifier]);

  useEffect(() => {
    setRanCombs(computeRanCombs(
      combs,
      randomizedType,
    ));
  }, [combs, randomizedType]);

  const exitFollowupsHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    dispatch(setFollowupId(undefined));
  };

  return (
    <div className={contClass}>
      <span
        className={`clearChoiceBtn ${styleProps.clearChoiceBtn}`}
        style={{ right: 0, left: 'auto' }}
        onClick={exitFollowupsHandler}
        role="button"
        aria-label="Back to questions"
      >
        ←
      </span>
      <div className={`question ms-sm-5 ps-sm-5 pt-2 ${styleProps.question} ${styleProps.msSm5} ${styleProps.psSm5}`}>
        <div className="py-2 h5">
          <b>
            <LinkifiedText text={quote} />
          </b>
        </div>
        <div ref={optionsContainerRef} className={optionsContainerCss} id="options">
          <Carousel
            key={`${randomizedType}`}
            indicatorLabels={ranCombs.map(() => 'carousel-indicator')}
            controls={false}
            interval={null}
            touch={false}
            slide={false}
          >
            {ranCombs.map((random, i) => (
              <Carousel.Item key={i}>
                {(displayCombinations[random] ?? []).map((id: string) => {
                  const option = processedOptions.find(opt => opt.id === id) || { value: '' };
                  const hasImage = isValidDataUrl(option.value);
                  const imageUrl = hasImage ? option.value : placeholder;
                  return (
                    <label className={`options ${styleProps.options}`} key={id}>
                      <OptionContent
                        hasImage={hasImage}
                        imageUrl={imageUrl}
                        textValue={option.value}
                        placeholder={placeholder}
                        imageWrapperClassName={styleProps.optionImageLayer}
                      />
                      <input
                        value={id}
                        type="radio"
                        name={identifier}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          choice.current[e.target.name] = newValue;
                          const inputs = optionsContainerRef.current?.querySelectorAll<HTMLInputElement>(`input[name="${identifier}"]`) ?? [];
                          inputs.forEach((input: HTMLInputElement) => { input.checked = input === e.target; });
                        }}
                      />
                      <span className={styleProps.checkmark}></span>
                    </label>
                  );
                })}
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      </div>
      <QuizRouteToggleOs view="followup" bannerId={questionId} />
    </div>
  );
};

export default Followup;
