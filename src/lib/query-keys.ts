import { type EntriesPageParams } from './admin-contentful';
import { type ArtworksPageParams, type ShopItemsPageParams } from './contentful';

// Every TanStack Query cache key in one place, grouped so a whole area can
// be invalidated at once - e.g. queryClient.invalidateQueries({ queryKey:
// queryKeys.content.all }) refetches all public Contentful content.
export const queryKeys = {
  // Public site content, read from the Contentful Delivery API.
  content: {
    all: ['content'] as const,
    artworks: (opts?: { featuredOnly?: boolean }) => ['content', 'artworks', opts ?? {}] as const,
    // One page of the gallery grid, and a single piece (a deep link to one
    // that isn't on the page being shown).
    artworksPage: (params: ArtworksPageParams) => ['content', 'artworksPage', params] as const,
    artwork: (id: string) => ['content', 'artwork', id] as const,
    categories: () => ['content', 'categories'] as const,
    artist: () => ['content', 'artist'] as const,
    faqs: () => ['content', 'faqs'] as const,
    shopCategories: () => ['content', 'shopCategories'] as const,
    shopCategoryList: () => ['content', 'shopCategoryList'] as const,
    shopItems: () => ['content', 'shopItems'] as const,
    // One page of the shop grid.
    shopItemsPage: (params: ShopItemsPageParams) => ['content', 'shopItemsPage', params] as const,
  },
  // Shop data from the API (stock and per-size prices).
  shop: {
    all: ['shop'] as const,
    inventory: () => ['shop', 'inventory'] as const,
  },
  // The logged-in user (GET /api/auth/me). Not keyed by token (keeps it out
  // of devtools) - auth-context resets this on login/logout instead.
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  // Admin panel data, via the API's Contentful Management routes.
  admin: {
    all: ['admin'] as const,
    contentTypes: () => ['admin', 'contentTypes'] as const,
    assets: () => ['admin', 'assets'] as const,
    entries: (contentTypeId: string) => ['admin', 'entries', contentTypeId] as const,
    // Pages of the entries table - under entryPages() so a save can
    // invalidate every page of a type at once.
    entryPages: (contentTypeId: string) => ['admin', 'entryPages', contentTypeId] as const,
    entriesPage: (contentTypeId: string, params: EntriesPageParams) =>
      ['admin', 'entryPages', contentTypeId, params] as const,
    inventory: (itemId: string) => ['admin', 'inventory', itemId] as const,
  },
};
