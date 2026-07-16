import React, { useEffect } from 'react';
import { _500 as Notfound } from '../components/views/404';
import * as styles from '../styles/404.module.css';
import Tutorials from '../components/convolayouts/Tutorial/Screen';
import { ArticleSelector } from '../components/convolutions/ViewSelector';
import ArticleNavFooter from '../components/convolutions/ArticleNavFooter';
import * as courseStyles from '../styles/course.module.css';
import { CourseGlobal } from '../components/views/wrappers/courseGlobal';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Comments from '../components/views/Comments';
import { useHydrateContainer } from '../Hooks/useHydrateContainer';
import { useImageHydration } from '../Hooks/useImageHydration';
import { usePncEmptyMessage } from '../Hooks/usePncEmptyMessage';

interface TutorialReadOnlyProps {
  setWebApp: (app: string) => void;
  noTutorials: boolean;
}

const TutorialReadOnly: React.FC<TutorialReadOnlyProps> = ({ setWebApp, noTutorials }) => {
  const selectedBannerIndex = useSelector((state: RootState) => state.tutorial.selected);
  const banners = useSelector((state: RootState) => state.tutorial.banners);
  const bannerId = banners[selectedBannerIndex]?.id ?? -1;
  const showComments = selectedBannerIndex > -1 && !noTutorials;
  const emptyMessage = usePncEmptyMessage();

  useHydrateContainer('tutorial', bannerId, selectedBannerIndex > -1 && !noTutorials);
  useImageHydration('tutorial', bannerId, selectedBannerIndex > -1 && !noTutorials);

  useEffect(() => {
    setWebApp('tutorial');
  }, [setWebApp]);

  return (
    <CourseGlobal>
      <div className={`container ${courseStyles['course']}`}>
        {noTutorials ? (
          <div className={`${styles['notFound']} ${styles['bigger']}`}>
            <Notfound message={emptyMessage} />
          </div>
        ) : (
          <Tutorials noTutorials={noTutorials} />
        )}
        <ArticleNavFooter>
          <ArticleSelector content="Tutorials" noArticles={noTutorials} />
        </ArticleNavFooter>
        {showComments && bannerId > 0 && <Comments commentsId={bannerId} _for="tutorial" />}
      </div>
    </CourseGlobal>
  );
};

export default TutorialReadOnly;
