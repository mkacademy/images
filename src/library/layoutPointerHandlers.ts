import type { MouseEvent as ReactMouseEvent } from 'react';

/** Read-only viewer: simple click handler without editor selection modifiers. */
export const layoutCellPointerHandlers = (onSelect: (event: ReactMouseEvent) => void) => ({
  onClick: onSelect,
});
