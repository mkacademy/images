import React, { useEffect } from 'react';
import { _500 as Notfound } from '../components/views/404';
import QuizzesScreen from '../components/convolayouts/Quizzes/Screen';
import { CourseGlobal } from '../components/views/wrappers/courseGlobal';
import { ArticleSelector, FollowupsSelector } from '../components/convolutions/ViewSelector';
import ArticleNavFooter from '../components/convolutions/ArticleNavFooter';
import Comments from '../components/views/Comments';
import * as courseStyles from '../styles/course.module.css';
import * as _404styles from '../styles/404.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { clearContentTypeSelected } from '../store/slices/settingsSlice';
import { useHydrateContainer } from '../Hooks/useHydrateContainer';
import { useImageHydration } from '../Hooks/useImageHydration';
import { usePncEmptyMessage } from '../Hooks/usePncEmptyMessage';

interface QuizReadOnlyProps {
  setWebApp: (app: string) => void;
  noQuizzes: boolean;
}

const QuizReadOnly: React.FC<QuizReadOnlyProps> = ({ setWebApp, noQuizzes }) => {
  const dispatch = useDispatch();
  const selectedBannerIndex = useSelector((state: RootState) => state.quiz.selected);
  const followupId = useSelector((state: RootState) => state.quiz.followupId);
  const banners = useSelector((state: RootState) => state.quiz.quizzes);
  const bannerId = banners[selectedBannerIndex]?.id ?? -1;
  const showComments = selectedBannerIndex > -1 && !noQuizzes;
  const emptyMessage = usePncEmptyMessage();

  useHydrateContainer('quiz', bannerId, selectedBannerIndex > -1 && !noQuizzes);
  useImageHydration('quiz', bannerId, selectedBannerIndex > -1 && !noQuizzes);

  useEffect(() => {
    setWebApp('quiz');
    dispatch(clearContentTypeSelected('quiz'));
  }, [setWebApp, dispatch]);

  return (
    <CourseGlobal>
      <div className={`container ${courseStyles['course']}`}>
        {noQuizzes ? (
          <div className={`${_404styles['notFound']} ${_404styles['bigger']}`}>
            <Notfound message={emptyMessage} />
          </div>
        ) : (
          <QuizzesScreen noQuizzes={noQuizzes} />
        )}
        <ArticleNavFooter>
          {followupId !== undefined ? (
            <FollowupsSelector noArticles={noQuizzes} />
          ) : (
            <ArticleSelector content="Quizzes" noArticles={noQuizzes} />
          )}
        </ArticleNavFooter>
        {showComments && bannerId > 0 && <Comments commentsId={bannerId} _for="quiz" />}
      </div>
    </CourseGlobal>
  );
};

export default QuizReadOnly;
