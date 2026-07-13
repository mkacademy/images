import type { RootState } from '../store';

/** Pennant ids implied by the currently selected course chapter slide indexes. */
export const getPennantIdsFromSelectedChapters = (
  course: Pick<RootState['course'], 'banners' | 'selected' | 'content' | 'chapters'>,
): number[] => {
  const { banners, selected, content, chapters } = course;
  if (chapters.length === 0 || selected < 0) return [];
  const selectedBanner = banners[selected];
  if (!selectedBanner) return [];
  const selectedContent = content.find((group) => group[0]?.bannerId === selectedBanner.id);
  const slides = selectedContent?.slides;
  if (!slides) return [];
  const pennantIds = new Set<number>();
  for (const chapterIndex of chapters) {
    const slideRow = slides[chapterIndex];
    const firstSlide = slideRow?.[0];
    if (firstSlide?.bannerId) pennantIds.add(firstSlide.bannerId);
  }
  return [...pennantIds];
};
