import React from 'react';
import Question from './Question';
import { Banner, SlideGroup, SlideGroupItem } from '../../../store/slices/courseSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface QuestionsProps {
  visible: Banner[];
}

const contPred =
  (banner: Banner) =>
    (slideGroup: SlideGroup) =>
      Object.values(slideGroup).some((item: SlideGroupItem) => item.bannerId === banner?.id);

const Questions: React.FC<QuestionsProps> = ({
  visible,
}) => {
  const content = useSelector((state: RootState) => state.quiz.content);
  const combinations = useSelector((state: RootState) => state.quiz.combinations);


  return (
    <React.Fragment>
      {visible.map((question) => (
        <Question
          slide={question}
          key={question.id}
          choices={content.find(contPred(question))}
          combs={combinations[content.findIndex(contPred(question))]}
        />
      ))}
    </React.Fragment>
  );
};

export default Questions;
