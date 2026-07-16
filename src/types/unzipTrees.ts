import type { CourseTrees, QuizTrees, TutorialTrees } from '../library/controlPanelUtils';

export interface ItemWithTutorialTrees {
  TreesId: number;
  Trees: TutorialTrees;
}

export interface ItemWithCourseTrees {
  TreesId: number;
  Trees: CourseTrees;
}

export interface ItemWithQuizTrees {
  TreesId: number;
  Trees: QuizTrees;
}
