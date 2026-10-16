import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../lib/query-keys';
import {
  getArtist,
  getArtworks,
  getCategories,
  getFaqs,
  getShopCategories,
  getShopCategoryList,
  getShopItems,
} from '../../lib/contentful';

// Public site content from Contentful. Each hook is cached under its own
// key, so e.g. the home page sections and the gallery share one artworks
// fetch instead of each loading it. The lib/contentful fetchers log and
// swallow their own errors (returning [] / undefined), so these queries
// effectively always succeed - sections fall back via withFallback.

export const useArtworks = (opts?: { featuredOnly?: boolean }) =>
  useQuery({ queryKey: queryKeys.content.artworks(opts), queryFn: () => getArtworks(opts) });

export const useCategories = () => useQuery({ queryKey: queryKeys.content.categories(), queryFn: getCategories });

// null when there's no (visible) artist entry - a query can't resolve to undefined.
export const useArtist = () =>
  useQuery({ queryKey: queryKeys.content.artist(), queryFn: async () => (await getArtist()) ?? null });

export const useFaqs = () => useQuery({ queryKey: queryKeys.content.faqs(), queryFn: getFaqs });

export const useShopCategories = () =>
  useQuery({ queryKey: queryKeys.content.shopCategories(), queryFn: getShopCategories });

// The shop page: every visible category (subcategories too) and product.
export const useShopCategoryList = () =>
  useQuery({ queryKey: queryKeys.content.shopCategoryList(), queryFn: getShopCategoryList });

// `enabled: false` skips the fetch (e.g. the nav's cart while it's empty).
export const useShopItems = ({ enabled = true } = {}) =>
  useQuery({ queryKey: queryKeys.content.shopItems(), queryFn: getShopItems, enabled });

/**
 * A query's list, or `fallback` while it loads, if it fails, or if
 * Contentful has no entries yet - so sections never render empty/broken
 * while content is still being authored.
 */
export function withFallback<T>(data: T[] | undefined, fallback: T[]): T[] {
  return data && data.length > 0 ? data : fallback;
}
