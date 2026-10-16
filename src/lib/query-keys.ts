// Every TanStack Query cache key in one place, grouped so a whole area can
// be invalidated at once - e.g. queryClient.invalidateQueries({ queryKey:
// queryKeys.content.all }) refetches all public Contentful content.
export const queryKeys = {
  // Public site content, read from the Contentful Delivery API.
  content: {
    all: ['content'] as const,
    artworks: (opts?: { featuredOnly?: boolean }) => ['content', 'artworks', opts ?? {}] as const,
    categories: () => ['content', 'categories'] as const,
    artist: () => ['content', 'artist'] as const,
    faqs: () => ['content', 'faqs'] as const,
    shopCategories: () => ['content', 'shopCategories'] as const,
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
  },
};
