import { useEffect, useState } from 'react';

/**
 * Fetches a list from Contentful and swaps it in once it arrives.
 * Starts (and stays on, if the fetch fails or the space has no entries
 * yet) the given `fallback` list, so sections never render empty/broken
 * while Contentful content is still being authored.
 */
export function useContentfulList<T>(fetcher: () => Promise<T[]>, fallback: T[]): T[] {
  const [data, setData] = useState<T[]>(fallback);

  useEffect(() => {
    let active = true;

    fetcher().then((items) => {
      if (active && items.length > 0) setData(items);
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}

/** Same idea as useContentfulList, for a single (0-or-1) entry fetch. */
export function useContentfulSingle<T>(
  fetcher: () => Promise<T | undefined>,
  fallback: T
): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    let active = true;

    fetcher().then((item) => {
      if (active && item) setData(item);
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}
