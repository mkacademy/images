import React, { useEffect } from 'react';
import { _500 as Notfound } from '../components/views/404';
import CourseCanopy from '../components/convolayouts/Course/Canopy';
import { ArticleSelector, ChaptersSelector } from '../components/convolutions/ViewSelector';
import ArticleNavFooter from '../components/convolutions/ArticleNavFooter';
import { CourseGlobal } from '../components/views/wrappers/courseGlobal';
import Comments from '../components/views/Comments';
import * as pennantStyles from '../styles/course.module.css';
import * as styles from '../styles/404.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { clearContentTypeSelected } from '../store/slices/settingsSlice';
import { useHydrateContainer } from '../Hooks/useHydrateContainer';
import { usePncEmptyMessage } from '../Hooks/usePncEmptyMessage';

interface CourseReadOnlyProps {
  setWebApp: (app: string) => void;
  noCourses: boolean;
}

const CourseReadOnly: React.FC<CourseReadOnlyProps> = ({ setWebApp, noCourses }) => {
  const dispatch = useDispatch();
  const selectedBannerIndex = useSelector((state: RootState) => state.course.selected);
  const chapters = useSelector((state: RootState) => state.course.chapters);
  const banners = useSelector((state: RootState) => state.course.banners);
  const bannerId = banners[selectedBannerIndex]?.id ?? -1;
  const showComments = selectedBannerIndex > -1 && !noCourses;
  const chapterIndexes = chapters ?? [];
  const emptyMessage = usePncEmptyMessage();

  useHydrateContainer('course', bannerId, selectedBannerIndex > -1 && !noCourses);

  useEffect(() => {
    setWebApp('course');
    dispatch(clearContentTypeSelected('course'));
  }, [setWebApp, dispatch]);

  return (
    <CourseGlobal>
      <div className={`container ${pennantStyles['course']}`}>
        {noCourses ? (
          <div className={`${styles['notFound']} ${styles['bigger']}`}>
            <Notfound message={emptyMessage} />
          </div>
        ) : (
          <CourseCanopy noCourses={noCourses} />
        )}
        <ArticleNavFooter>
          {chapterIndexes.length === 0 ? (
            <ArticleSelector content="Courses" noArticles={noCourses} />
          ) : (
            <ChaptersSelector noArticles={noCourses} chapters={chapterIndexes} />
          )}
        </ArticleNavFooter>
        {showComments && bannerId > 0 && <Comments commentsId={bannerId} _for="course" />}
      </div>
    </CourseGlobal>
  );
};

export default CourseReadOnly;
