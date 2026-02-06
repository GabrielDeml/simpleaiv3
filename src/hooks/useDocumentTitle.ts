import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
      ? `${title} | SimpleAI`
      : 'SimpleAI — Interactive Machine Learning Playground';
  }, [title]);
}
