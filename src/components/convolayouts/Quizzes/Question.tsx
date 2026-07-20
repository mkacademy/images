import { Carousel } from "react-bootstrap";
import '../../../styles/indicators.module.css';
import * as quizStyles from '../../../styles/quiz.module.css';
import { setFollowupId } from "../../../store/slices/quizSlice";
import React, { useEffect, useMemo, useState } from 'react';
import LinkifiedText from '../../LinkifiedText';
import { placeholder } from "../../../utils";
import { Banner, SlideGroup } from '../../../store/slices/courseSlice';
import { computeRanCombs, filterCombinationsForRandomizedType, getOptionsFromSlideGroup } from '../../../library/QuizUtils';
import { isValidDataUrl, resolveMediaSlotSrc } from '../../../library/imageUtils';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/types";
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
  highlighted: quizStyles["highlighted"],
  highlighQuestion: quizStyles['highligh-question'],
  questionContainer: quizStyles['question-container'],
}

interface QuestionProps {
  slide: Banner;
  combs?: string[][];
  choices: SlideGroup | undefined;
  attempt?: string | null;
  submittedOptionIds?: string[];
}

const optionsContainerCss = "ms-md-3 ms-sm-3 ps-md-5 ps-sm-3";
const isHighlight = `highligh-question ${styleProps.highlighQuestion}`;
const contCss = `question-container ${styleProps.questionContainer} mt-sm-5`;

const Question: React.FC<QuestionProps> = ({
  choices,
  combs: combinations = [],
  submittedOptionIds = [],
  attempt,
  slide: { id: questionId = -1, quote = "", isHighlighted = false },
}) => {
  const dispatch = useDispatch();
  const identifier = "choice" + questionId;
  const randomizedType = useSelector((state: RootState) => state.settings.randomizedType);
  const contClass = isHighlighted ? (isHighlight + ' ' + contCss) : contCss;
  const processedOptions = useMemo(() => getOptionsFromSlideGroup(choices), [choices]);
  const displayCombinations = useMemo(
    () => filterCombinationsForRandomizedType(combinations, randomizedType),
    [combinations, randomizedType],
  );
  const [ranCombs, setRanCombs] = useState<number[]>([]);
  const attemptValue = attempt ?? null;
  const hasSubmission = attemptValue != null && attemptValue !== '';

  useEffect(() => {
    setRanCombs(computeRanCombs(
      combinations,
      randomizedType,
      submittedOptionIds,
      attemptValue,
    ));
  }, [combinations, randomizedType, submittedOptionIds, attemptValue]);

  const openFollowupsHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    dispatch(setFollowupId(questionId));
  };

  return (
    <div className={contClass}>
      <span
        className={`clearChoiceBtn ${styleProps.clearChoiceBtn}${hasSubmission ? ` ${styleProps.clearChoiceBtnSubmitted}` : ''}`}
      >
        o
      </span>
      <span
        className={`clearChoiceBtn ${styleProps.clearChoiceBtn}`}
        style={{ right: 0, left: 'auto' }}
        onClick={openFollowupsHandler}
      >
        o
      </span>
      <div className={`question ms-sm-5 ps-sm-5 pt-2 ${styleProps.question} ${styleProps.msSm5} ${styleProps.psSm5}`}>
        <div className="py-2 h5">
          <b>
            <LinkifiedText text={quote} />
          </b>
        </div>
        <div className={optionsContainerCss} id="options">
          <Carousel
            key={`${attemptValue ?? ''}-${randomizedType}`}
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
                  const imageUrl = resolveMediaSlotSrc(option.value);
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
                        disabled
                        name={identifier}
                        defaultChecked={attemptValue === id}
                        readOnly
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
      <QuizRouteToggleOs view="question" bannerId={questionId} />
    </div>
  );
};

export default Question;
