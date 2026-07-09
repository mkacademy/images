import type { AppDispatch } from '../store';
import { appendShortcut } from '../store/slices/errorSlice';

/** Records a keyboard chord for the shortcut log (viewer: minimal). */
export const recordKeyboardShortcutFromChord = (
  dispatch: AppDispatch,
  chordPrefix: string,
): void => {
  dispatch(appendShortcut(chordPrefix));
};
