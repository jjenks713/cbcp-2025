import {
  createClient,
  type Asset,
  type EntryFieldTypes,
  type EntrySkeletonType,
  type UnresolvedLink,
} from 'contentful';

// -----------------------------------------------------------------------
// Client
// -----------------------------------------------------------------------

const SPACE_ID = process.env.REACT_APP_CONTENTFUL_SPACE_ID;
const ENVIRONMENT = process.env.REACT_APP_CONTENTFUL_ENVIRONMENT || 'master';
const ACCESS_TOKEN = process.env.REACT_APP_CONTENTFUL_DELIVERY_TOKEN;

const isConfigured = Boolean(SPACE_ID && ACCESS_TOKEN);

export const contentfulClient = isConfigured
  ? createClient({
      space: SPACE_ID as string,
      environment: ENVIRONMENT,
      accessToken: ACCESS_TOKEN as string,
    })
  : null;

if (!isConfigured && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(
    '[contentful] REACT_APP_CONTENTFUL_SPACE_ID / REACT_APP_CONTENTFUL_DELIVERY_TOKEN are not set — falling back to local placeholder content.'
  );
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/**
 * Turns a Contentful asset's protocol-relative file URL into an https URL.
 * Accepts an unresolved link too (e.g. when `include` depth didn't reach
 * it, or the asset is unpublished) and just returns undefined for those.
 */
export function assetUrl(
  asset?: Asset | UnresolvedLink<'Asset'> | null
): string | undefined {
  const url = asset && 'fields' in asset ? asset.fields?.file?.url : undefined;
  if (typeof url !== 'string' || !url) return undefined;
  return url.startsWith('//') ? `https:${url}` : url;
}

// -----------------------------------------------------------------------
// Normalized shapes consumed by the UI (kept close to the original
// hardcoded data shapes already used in src/Features/sections/*)
// -----------------------------------------------------------------------

export type ArtItem = {
  id: string;
  title: string;
  /** Primary category name for compact display (first of `categories`). */
  category: string;
  /** Every category name this piece is tagged with. */
  categories?: string[];
  /** Same entries as `categories`, but Contentful entry ids — use these for filtering. */
  categoryIds?: string[];
  description: string;
  medium?: string;
  size?: string;
  edition?: string;
  coverUrl: string;
  /** Additional images (e.g. a book's page spreads), in order. */
  imageUrls?: string[];
};

export type ArtistProfile = {
  name: string;
  role: string;
  photoUrl?: string;
  bio: string;
  piecesSold: number;
  followers: number;
  yearsCreating: number;
};

/** A top-level shop category, as shown on the homepage shop cards. */
export type ShopCategory = {
  name: string;
  icon: string;
  content: string;
  path: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
};

/** A top-level category with its subcategories nested underneath. */
export type CategoryNode = Category & { children: Category[] };

// -----------------------------------------------------------------------
// Raw Contentful field shapes (loosely typed — only what we read)
// -----------------------------------------------------------------------

interface CategoryFields {
  name: EntryFieldTypes.Symbol;
  slug: EntryFieldTypes.Symbol;
  description?: EntryFieldTypes.Text;
  parentCategory?: EntryFieldTypes.EntryLink<CategorySkeleton>;
  showInApp?: EntryFieldTypes.Boolean;
}
type CategorySkeleton = EntrySkeletonType<CategoryFields, 'category'>;

interface ArtworkFields {
  title: EntryFieldTypes.Symbol;
  categories: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<CategorySkeleton>>;
  description?: EntryFieldTypes.Text;
  medium?: EntryFieldTypes.Symbol;
  size?: EntryFieldTypes.Symbol;
  edition?: EntryFieldTypes.Symbol;
  coverImage?: EntryFieldTypes.AssetLink;
  images?: EntryFieldTypes.Array<EntryFieldTypes.AssetLink>;
  featured?: EntryFieldTypes.Boolean;
  showInApp?: EntryFieldTypes.Boolean;
}
type ArtworkSkeleton = EntrySkeletonType<ArtworkFields, 'artwork'>;

interface ArtistFields {
  name: EntryFieldTypes.Symbol;
  role?: EntryFieldTypes.Symbol;
  photo?: EntryFieldTypes.AssetLink;
  bio?: EntryFieldTypes.Text;
  piecesSold?: EntryFieldTypes.Integer;
  followers?: EntryFieldTypes.Integer;
  yearsCreating?: EntryFieldTypes.Integer;
  showInApp?: EntryFieldTypes.Boolean;
}
type ArtistSkeleton = EntrySkeletonType<ArtistFields, 'artist'>;

interface ShopCategoryFields {
  name: EntryFieldTypes.Symbol;
  slug: EntryFieldTypes.Symbol;
  parentCategory?: EntryFieldTypes.EntryLink<ShopCategorySkeleton>;
  description?: EntryFieldTypes.Text;
  icon?: EntryFieldTypes.Symbol;
  order?: EntryFieldTypes.Integer;
  showInApp?: EntryFieldTypes.Boolean;
}
type ShopCategorySkeleton = EntrySkeletonType<ShopCategoryFields, 'shopCategory'>;

interface FaqFields {
  question: EntryFieldTypes.Symbol;
  answer: EntryFieldTypes.Text;
  order?: EntryFieldTypes.Integer;
  showInApp?: EntryFieldTypes.Boolean;
}
type FaqSkeleton = EntrySkeletonType<FaqFields, 'faq'>;

// -----------------------------------------------------------------------
// Fetchers — each resolves to [] / undefined (never throws) so callers can
// fall back to local placeholder data when Contentful isn't reachable or
// simply has no entries yet. Every query only returns entries switched on
// with showInApp (the admin panel's "Show in App"), so content can be
// added ahead of time and revealed later.
// -----------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  if (!contentfulClient) return [];
  try {
    const res = await contentfulClient.getEntries<CategorySkeleton>({
      content_type: 'category',
      'fields.showInApp': true,
      order: ['fields.name'],
    });
    const categories: Category[] = res.items.map((item) => ({
      id: item.sys.id,
      name: item.fields.name,
      slug: item.fields.slug,
      description: item.fields.description,
      parentId: item.fields.parentCategory?.sys?.id,
    }));
    return withoutHiddenAncestors(categories);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contentful] getCategories failed:', err);
    return [];
  }
}

/**
 * The query already drops hidden categories; this also drops any whose
 * parent (or grandparent, ...) is hidden - hiding Prints hides Artist Books.
 */
function withoutHiddenAncestors(categories: Category[]): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const isVisible = (category: Category) => {
    const seen = new Set<string>();
    for (let current = category; current.parentId; ) {
      if (seen.has(current.id)) return false; // malformed parent loop
      seen.add(current.id);
      const parent = byId.get(current.parentId);
      if (!parent) return false;
      current = parent;
    }
    return true;
  };
  return categories.filter(isVisible);
}

/**
 * A category linked from an artwork arrives through the include, not the
 * filtered category query, so check Show in App here - on it and, when
 * resolved, its parent.
 */
function isShownLinkedCategory(cat: unknown): boolean {
  if (!cat || typeof cat !== 'object' || !('fields' in cat)) return false;
  const fields = (cat as { fields?: { showInApp?: boolean; parentCategory?: unknown } }).fields;
  if (fields?.showInApp !== true) return false;
  const parent = fields.parentCategory;
  if (parent && typeof parent === 'object' && 'fields' in parent) return isShownLinkedCategory(parent);
  return true;
}

/** Preferred display order for top-level categories; anything else sorts after these, alphabetically. */
const CATEGORY_ORDER = ['Prints', 'Drawings', 'Commissions'];

/** getCategories(), grouped into top-level categories with their subcategories nested inside. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const categories = await getCategories();
  const topLevel = categories.filter((c) => !c.parentId);
  const byParent = new Map<string, Category[]>();
  categories
    .filter((c) => c.parentId)
    .forEach((c) => {
      const siblings = byParent.get(c.parentId as string) ?? [];
      siblings.push(c);
      byParent.set(c.parentId as string, siblings);
    });

  return topLevel
    .map((c) => ({ ...c, children: byParent.get(c.id) ?? [] }))
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.name);
      const bi = CATEGORY_ORDER.indexOf(b.name);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
}

export async function getArtworks(opts?: { featuredOnly?: boolean }): Promise<ArtItem[]> {
  if (!contentfulClient) return [];
  try {
    const res = await contentfulClient.getEntries<ArtworkSkeleton>({
      content_type: 'artwork',
      'fields.showInApp': true,
      include: 2,
      // Newest first — no more manually-maintained display order field.
      order: ['-sys.createdAt'],
      ...(opts?.featuredOnly ? { 'fields.featured': true } : {}),
    });
    return res.items.map((item) => {
      const categoryEntries = (item.fields.categories ?? []).filter(isShownLinkedCategory);
      const categories = categoryEntries
        .map((cat) => ('fields' in cat ? cat.fields?.name : undefined))
        .filter((name): name is string => Boolean(name));
      const categoryIds = categoryEntries.map((cat) => cat.sys.id);
      const imageUrls = (item.fields.images ?? [])
        .map((img) => assetUrl(img))
        .filter((url): url is string => Boolean(url));

      return {
        id: item.sys.id,
        title: item.fields.title,
        category: categories[0] ?? '',
        categories,
        categoryIds,
        description: item.fields.description ?? '',
        medium: item.fields.medium,
        size: item.fields.size,
        edition: item.fields.edition,
        coverUrl: assetUrl(item.fields.coverImage) ?? '',
        imageUrls,
      };
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contentful] getArtworks failed:', err);
    return [];
  }
}

export async function getArtist(): Promise<ArtistProfile | undefined> {
  if (!contentfulClient) return undefined;
  try {
    const res = await contentfulClient.getEntries<ArtistSkeleton>({
      content_type: 'artist',
      'fields.showInApp': true,
      limit: 1,
    });
    const item = res.items[0];
    if (!item) return undefined;
    return {
      name: item.fields.name,
      role: item.fields.role ?? '',
      photoUrl: assetUrl(item.fields.photo),
      bio: item.fields.bio ?? '',
      piecesSold: item.fields.piecesSold ?? 0,
      followers: item.fields.followers ?? 0,
      yearsCreating: item.fields.yearsCreating ?? 0,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contentful] getArtist failed:', err);
    return undefined;
  }
}

/** Top-level shop categories only - subcategories (those with a parent) group products, not homepage cards. */
export async function getShopCategories(): Promise<ShopCategory[]> {
  if (!contentfulClient) return [];
  try {
    const res = await contentfulClient.getEntries<ShopCategorySkeleton>({
      content_type: 'shopCategory',
      'fields.showInApp': true,
      'fields.parentCategory[exists]': false,
      order: ['fields.order'],
    });
    return res.items.map((item) => ({
      name: item.fields.name,
      icon: item.fields.icon ?? '',
      content: item.fields.description ?? '',
      path: `/shop/${item.fields.slug}`,
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contentful] getShopCategories failed:', err);
    return [];
  }
}

export async function getFaqs(): Promise<Faq[]> {
  if (!contentfulClient) return [];
  try {
    const res = await contentfulClient.getEntries<FaqSkeleton>({
      content_type: 'faq',
      'fields.showInApp': true,
      order: ['fields.order'],
    });
    return res.items.map((item) => ({
      id: item.sys.id,
      question: item.fields.question,
      answer: item.fields.answer,
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contentful] getFaqs failed:', err);
    return [];
  }
}
