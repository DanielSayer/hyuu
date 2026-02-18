import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  enabled?: boolean;
};

export function useInfiniteScroll({
  hasMore,
  isLoadingMore,
  onLoadMore,
  rootMargin = "200px 0px",
  enabled = true,
}: UseInfiniteScrollOptions) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const element = targetRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, hasMore, isLoadingMore, onLoadMore, rootMargin]);

  return targetRef;
}
