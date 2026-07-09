/** Keyword search / route-traversal types. Viewer uses {@link emptySelectedRoute} only. */

export interface Search {
  keyword: string;
  count: string | number;
}

export interface SelectedRoute {
  traversal: string;
  keywords: Search[];
  index: number;
}

export const emptySelectedRoute: SelectedRoute = {
  traversal: '',
  keywords: [],
  index: 0,
};
