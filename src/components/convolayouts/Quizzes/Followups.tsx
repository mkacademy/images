import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import Followup from './Followup';
import { RootState } from '../../../store';
import { Banner, Pennant, SlideItem } from '../../../store/slices/courseSlice';
import type { Submition } from '../../../store/slices/quizSlice';
import {
  getSavedAttemptValue,
  getSubmittedOptionIdsForQuestion,
} from '../../../library/quizSubmissionUtils';

interface FollowupsProps {
  parent: Banner;
  visible: Pennant[];
  quizPennants: Submition[];
}

const getPennantSlideItems = (content: RootState['quiz']['content'], pennantId: number): SlideItem[] => {
  const group = content.find((g) => g.slides?.some((row) => row[0]?.bannerId === pennantId));
  if (!group || !group.slides) return [];
  const rows = group.slides.filter((row) => row[0]?.bannerId === pennantId);
  if (rows.length === 0) return [];
  return rows.flat();
};

const Followups: React.FC<FollowupsProps> = ({
  parent,
  visible,
  quizPennants,
}) => {
  const content = useSelector((state: RootState) => state.quiz.content);
  const followupCombinations = useSelector((state: RootState) => state.quiz.followupCombinations);
  const quizBannerId = parent.bannerId ?? -1;

  const getAttemptForFollowup = useCallback((followupId: number): string | null => {
    return getSavedAttemptValue(followupId, quizPennants, quizBannerId);
  }, [quizPennants, quizBannerId]);

  const getSubmittedIdsForFollowup = useCallback((followupId: number): string[] => {
    return getSubmittedOptionIdsForQuestion(quizBannerId, followupId, quizPennants);
  }, [quizPennants, quizBannerId]);

  return (
    <React.Fragment>
      {visible.map((followup) => {
        return (
          <Followup
            key={followup.id}
            pennant={followup}
            combs={followupCombinations[followup.id] ?? []}
            slideItems={getPennantSlideItems(content, followup.id)}
            attemptValue={getAttemptForFollowup(followup.id)}
            submittedOptionIds={getSubmittedIdsForFollowup(followup.id)}
          />
        );
      })}
    </React.Fragment>
  );
};

export default Followups;
