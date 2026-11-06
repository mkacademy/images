import React from "react";
import { RootState } from "../../store";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSessionPagerVisibleIds } from "../../Hooks/useSessionPagerVisibleIds";
import * as styles from "../../styles/course.module.css";
import { setFollowupId, setSelected as setSelectedQuiz } from "../../store/slices/quizSlice";
import {
  getBannerChaptersCouplings,
  resetChapters,
  setChapters,
  setSelected as setSelectedCourse
} from "../../store/slices/courseSlice";
import { setSelected as setSelectedTutorial } from "../../store/slices/tutorialSlice";
const vs = {
  tcg: styles['text-color-gray'],
  mf: styles['minimum-features'],
};

interface ArticleSelectorProps {
  noArticles: boolean;
  content: string;
}

const ArticleSelector: React.FC<ArticleSelectorProps> = ({ content, noArticles }) => {
  const dispatch = useDispatch();
  const tSelected = useSelector((state: RootState) => state.tutorial.selected);
  const cSelected = useSelector((state: RootState) => state.course.selected);
  const tBanners = useSelector((state: RootState) => state.tutorial.banners);
  const qSelected = useSelector((state: RootState) => state.quiz.selected);
  const cBanners = useSelector((state: RootState) => state.course.banners);
  const qBanners = useSelector((state: RootState) => state.quiz.quizzes);
  const visibleIds = useSessionPagerVisibleIds(
    content === "Tutorials" ? 'tutorial' : content === "Courses" ? 'course' : 'quiz',
  );

  const selected =
    content === "Tutorials"
      ? tSelected
      : content === "Courses"
        ? cSelected
        : qSelected;

  const allBanners: { id: number }[] =
    content === "Tutorials"
      ? tBanners
      : content === "Courses"
        ? cBanners
        : qBanners;

  // With the session pager active, step only through the current item's banners.
  const visibleIndices = React.useMemo(
    () => allBanners
      .map((banner, index) => (!visibleIds || visibleIds.has(banner.id) ? index : -1))
      .filter((index) => index > -1),
    [allBanners, visibleIds],
  );
  const total = visibleIndices.length;
  const position = visibleIndices.indexOf(selected);
  const nextIndex = visibleIndices.find((index) => index > selected);
  const prevIndex = [...visibleIndices].reverse().find((index) => index < selected);

  const label =
    content === "Tutorials"
      ? "Tutorial"
      : content === "Courses"
        ? "Course"
        : "Quiz";

  const countLabel = selected < 0 || position < 0 ? `${label}(${total})` : `${label}(${position + 1} - ${total})`;

  const isNextDisabled = selected < 0 || nextIndex === undefined;
  const isPrevDisabled = selected <= 0 || prevIndex === undefined;

  const goTo = React.useCallback((index: number | undefined) => {
    if (index === undefined) return;
    if (content === "Tutorials")
      dispatch(setSelectedTutorial(index));
    else if (content === "Courses")
      dispatch(setSelectedCourse(index));
    else if (content === "Quizzes")
      dispatch(setSelectedQuiz(index));
  }, [content, dispatch]);

  const goNext = React.useCallback(() => {
    if (!isNextDisabled) goTo(nextIndex);
  }, [isNextDisabled, goTo, nextIndex]);

  const goPrev = React.useCallback(() => {
    if (!isPrevDisabled) goTo(prevIndex);
  }, [isPrevDisabled, goTo, prevIndex]);

  const nextHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    goNext();
  };

  const prevHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    goPrev();
  };

  const viewHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    if (content === "Tutorials")
      dispatch(setSelectedTutorial(-1));
    else if (content === "Courses")
      dispatch(setSelectedCourse(-1));
    else if (content === "Quizzes")
      dispatch(setSelectedQuiz(-1));
  };

  if (noArticles) return null;

  return (
    <React.Fragment>
      <Link
        to="#"
        onClick={prevHandler}
        className={`${vs.tcg} ${isPrevDisabled ? '' : vs.mf} ms-1`}
      >
        <span className="current-year">Prev</span>
      </Link>
      <Link to="#" onClick={viewHandler} className={`${vs.tcg} ${vs.mf} ms-1`}>
        <span className="current-year">{countLabel}</span>
      </Link>
      <Link
        to="#"
        onClick={nextHandler}
        className={`${vs.tcg} ${isNextDisabled ? '' : vs.mf} ms-1`}
      >
        <span className="current-year">Next</span>
      </Link>
    </React.Fragment>
  );
};

interface ChaptersSelectorProps {
  noArticles: boolean;
  chapters: number[];
}

const ChaptersSelector: React.FC<ChaptersSelectorProps> = ({ noArticles, chapters }) => {
  const dispatch = useDispatch();
  const selected = useSelector((state: RootState) => state.course.selected);
  const banners = useSelector((state: RootState) => state.course.banners);
  const content = useSelector((state: RootState) => state.course.content);
  const couplings = useSelector((state: RootState) => state.course.couplings);

  const selectedBanner = banners[selected];
  const chapterCouplings = selectedBanner
    ? getBannerChaptersCouplings({ content, couplings }, selectedBanner.id)
    : [];

  const selectedPositions = chapters.length > 0
    ? chapterCouplings
      .map((coupling, i) => (coupling.some((value) => chapters.includes(value)) ? i : -1))
      .filter((i) => i >= 0)
    : [];
  const lowestChapterPosition = selectedPositions.length > 0 ? Math.min(...selectedPositions) : -1;

  const isPrevDisabled = lowestChapterPosition <= 0;
  const isNextDisabled = lowestChapterPosition === -1 || lowestChapterPosition >= chapterCouplings.length - 1;

  const goPrev = React.useCallback(() => {
    if (isPrevDisabled) return;
    const prevChapterPosition = lowestChapterPosition - 1;
    if (prevChapterPosition < 0 || prevChapterPosition >= chapterCouplings.length) return;
    dispatch(setChapters(chapterCouplings[prevChapterPosition]));
  }, [isPrevDisabled, lowestChapterPosition, chapterCouplings, dispatch]);

  const goNext = React.useCallback(() => {
    if (isNextDisabled) return;
    const nextChapterPosition = lowestChapterPosition + 1;
    if (nextChapterPosition < 0 || nextChapterPosition >= chapterCouplings.length) return;
    dispatch(setChapters(chapterCouplings[nextChapterPosition]));
  }, [isNextDisabled, lowestChapterPosition, chapterCouplings, dispatch]);

  const prevHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    goPrev();
  };

  const nextHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    goNext();
  };

  const viewHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(resetChapters());
  };

  if (noArticles || selected < 0 || !selectedBanner || chapterCouplings.length === 0) return null;

  const total = chapterCouplings.length;
  const countLabel = lowestChapterPosition < 0
    ? `Chapter(${total})`
    : `Chapter(${lowestChapterPosition + 1} - ${total})`;

  return (
    <React.Fragment>
      <Link
        to="#"
        onClick={prevHandler}
        className={`${vs.tcg} ${isPrevDisabled ? '' : vs.mf} ms-1`}
      >
        <span className="current-year">Prev</span>
      </Link>
      <Link to="#" onClick={viewHandler} className={`${vs.tcg} ${vs.mf} ms-1`}>
        <span className="current-year">{countLabel}</span>
      </Link>
      <Link
        to="#"
        onClick={nextHandler}
        className={`${vs.tcg} ${isNextDisabled ? '' : vs.mf} ms-1`}
      >
        <span className="current-year">Next</span>
      </Link>
    </React.Fragment>
  );
};

interface FollowupsSelectorProps {
  noArticles: boolean;
}

const FollowupsSelector: React.FC<FollowupsSelectorProps> = ({ noArticles }) => {
  const dispatch = useDispatch();
  const quizzes = useSelector((state: RootState) => state.quiz.quizzes);
  const banners = useSelector((state: RootState) => state.quiz.banners);
  const selected = useSelector((state: RootState) => state.quiz.selected);
  const followupId = useSelector((state: RootState) => state.quiz.followupId);

  const selectedQuiz = quizzes[selected];
  const followupBanners = selectedQuiz
    ? banners.filter((banner) => banner.bannerId === selectedQuiz.id)
    : [];
  const currentFollowupPosition = followupBanners.findIndex((banner) => banner.id === followupId);
  const isPrevDisabled = currentFollowupPosition <= 0;
  const isNextDisabled = currentFollowupPosition === -1 || currentFollowupPosition >= followupBanners.length - 1;

  const goPrev = React.useCallback(() => {
    if (isPrevDisabled) return;
    const previousBanner = followupBanners[currentFollowupPosition - 1];
    if (!previousBanner) return;
    dispatch(setFollowupId(previousBanner.id));
  }, [isPrevDisabled, followupBanners, currentFollowupPosition, dispatch]);

  const goNext = React.useCallback(() => {
    if (isNextDisabled) return;
    const nextBanner = followupBanners[currentFollowupPosition + 1];
    if (!nextBanner) return;
    dispatch(setFollowupId(nextBanner.id));
  }, [isNextDisabled, followupBanners, currentFollowupPosition, dispatch]);

  const prevHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    goPrev();
  };

  const nextHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    goNext();
  };

  const viewHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(setFollowupId(undefined));
  };

  if (noArticles || selected < 0 || followupId === undefined || followupBanners.length === 0) return null;

  const total = followupBanners.length;
  const countLabel = currentFollowupPosition < 0
    ? `Followup(${total})`
    : `Followup(${currentFollowupPosition + 1} - ${total})`;

  return (
    <React.Fragment>
      <Link
        to="#"
        onClick={prevHandler}
        className={`${vs.tcg} ${isPrevDisabled ? '' : vs.mf} ms-1`}
      >
        <span className="current-year">Prev</span>
      </Link>
      <Link to="#" onClick={viewHandler} className={`${vs.tcg} ${vs.mf} ms-1`}>
        <span className="current-year">{countLabel}</span>
      </Link>
      <Link
        to="#"
        onClick={nextHandler}
        className={`${vs.tcg} ${isNextDisabled ? '' : vs.mf} ms-1`}
      >
        <span className="current-year">Next</span>
      </Link>
    </React.Fragment>
  );
};

export { ArticleSelector, ChaptersSelector, FollowupsSelector };
