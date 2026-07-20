import React, { useCallback } from 'react';
import Question from './Question';
import { Banner, SlideGroup, SlideGroupItem } from '../../../store/slices/courseSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import type { Submition } from '../../../store/slices/quizSlice';
import {
  getSavedAttemptValue,
  getSubmittedOptionIdsForQuestion,
} from '../../../library/quizSubmissionUtils';

interface QuestionsProps {
  visible: Banner[];
  pennants: Submition[];
  quizBannerId: number;
}

const contPred =
  (banner: Banner) =>
    (slideGroup: SlideGroup) =>
      Object.values(slideGroup).some((item: SlideGroupItem) => item.bannerId === banner?.id);

const Questions: React.FC<QuestionsProps> = ({
  visible,
  pennants,
  quizBannerId,
}) => {
  const content = useSelector((state: RootState) => state.quiz.content);
  const combinations = useSelector((state: RootState) => state.quiz.combinations);

  const getAttemptForQuestion = useCallback((questionId: number): string | null => {
    return getSavedAttemptValue(questionId, pennants, quizBannerId);
  }, [pennants, quizBannerId]);

  const getSubmittedIdsForQuestion = useCallback((question: Banner): string[] => {
    return getSubmittedOptionIdsForQuestion(quizBannerId, question.id, pennants);
  }, [pennants, quizBannerId]);

  return (
    <React.Fragment>
      {visible.map((question) => (
        <Question
          slide={question}
          key={question.id}
          choices={content.find(contPred(question))}
          combs={combinations[content.findIndex(contPred(question))]}
          attempt={getAttemptForQuestion(question.id)}
          submittedOptionIds={getSubmittedIdsForQuestion(question)}
        />
      ))}
    </React.Fragment>
  );
};

export default Questions;
