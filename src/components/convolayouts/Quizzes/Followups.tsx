import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Followup from './Followup';
import { RootState } from '../../../store';
import { Pennant, SlideItem } from '../../../store/slices/courseSlice';

interface FollowupsProps {
  visible: Pennant[];
}

const getPennantSlideItems = (content: RootState['quiz']['content'], pennantId: number): SlideItem[] => {
  const group = content.find((g) => g.slides?.some((row) => row[0]?.bannerId === pennantId));
  if (!group || !group.slides) return [];
  const rows = group.slides.filter((row) => row[0]?.bannerId === pennantId);
  if (rows.length === 0) return [];
  return rows.flat();
};

const Followups: React.FC<FollowupsProps> = ({
  visible,
}) => {
  const content = useSelector((state: RootState) => state.quiz.content);
  const followupCombinations = useSelector((state: RootState) => state.quiz.followupCombinations)


  return (
    <React.Fragment>
      {visible.map((followup) => {
        return (
          <Followup
            key={followup.id}
            pennant={followup}
            combs={followupCombinations[followup.id] ?? []}
            slideItems={getPennantSlideItems(content, followup.id)}
          />
        );
      })}
    </React.Fragment>
  );
};

export default Followups;
