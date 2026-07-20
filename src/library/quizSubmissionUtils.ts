import { Buffer } from 'buffer';
import type { Submition } from './QuizUtils';
import { textEllipsis } from '../utils';

/** Decode a saved submission's base64 quote into choice key → option id(s). */
export const getChoices = ({ quote }: Partial<Submition>): { [x: string]: (string | null | undefined)[] } => {
  let latestChoice: { [x: string]: (string | null | undefined)[] } = {};
  try {
    const obj = JSON.parse(Buffer.from(quote || '', 'base64').toString()) as { [x: string]: (string | null)[] };
    const [key, value] = Object.entries(obj)?.pop() || [];
    latestChoice = { [key as string]: [Object.values(value ?? []).pop()] };
  } catch (error) {
    console.log('incorrect format ' + textEllipsis(quote || '', 30));
  } finally {
    return latestChoice;
  }
};

/** Build a read-only attempt map from saved dashboardsfilters (quiz pennants). */
export const getSavedAttempts = (
  pennants: Submition[],
): Record<string, { [x: string]: string | null | undefined }> => {
  return pennants
    .map(getChoices)
    .map((choice) => {
      const [key, value] = Object.entries(choice).pop() || [];
      return { [key as string]: { [key as string]: value?.pop() } };
    })
    .reduce((prev, cur) => ({ ...prev, ...cur }), {});
};

const isNonEmptyOptionId = (v: string | null | undefined): v is string => v != null && v !== '';

/** All saved option ids for a question from dashboardsfilters on its quiz. */
export const getSubmittedOptionIdsForQuestion = (
  quizBannerId: number,
  questionId: number,
  pennants: Submition[],
): string[] => {
  const ids = new Set<string>();
  pennants
    .filter((p) => p.bannerId === quizBannerId)
    .map(getChoices)
    .forEach((choices) => {
      Object.values(choices).flat().filter(isNonEmptyOptionId).forEach((v) => ids.add(v));
    });
  return Array.from(ids);
};

/** Saved option id for a single question/follow-up from dashboardsfilters. */
export const getSavedAttemptValue = (
  choiceId: number,
  pennants: Submition[],
  quizBannerId: number,
): string | null => {
  const identifier = `choice${choiceId}`;
  const saved = getSavedAttempts(pennants.filter((p) => p.bannerId === quizBannerId));
  const value = saved[identifier]?.[identifier];
  return value != null && value !== '' ? value : null;
};
