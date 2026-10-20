import { request, withAuth } from './api';

// Mirrors the shapes server/src/lib/contentfulFields.js produces: content
// type schemas trimmed to what a form needs, and entry fields already
// unwrapped from Contentful's per-locale/Link wrappers into flat values
// (links are just the linked entry/asset id).

type LinkType = 'Entry' | 'Asset';

export type FieldDef = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  linkType?: LinkType;
  linkContentTypes?: string[];
  // Contentful regexp validation, e.g. shopCategory.slug's format
  pattern?: { pattern: string; flags?: string; message?: string };
  // Contentful range validation (numbers), e.g. shopItem.price's min of 0
  range?: { min?: number; max?: number; message?: string };
  items?: {
    type: string;
    linkType?: LinkType;
    linkContentTypes?: string[];
  };
};

export type ContentType = {
  id: string;
  name: string;
  displayField: string;
  fields: FieldDef[];
};

export type FieldValue = string | number | boolean | string[] | null;

export type Entry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, FieldValue>;
};

export type Asset = {
  id: string;
  title: string;
  url: string | null;
};

// Fields the API generates on create and ignores on save - a shop item's
// ID is what orders will reference, so it's never typed in or changed.
// Mirrors GENERATED_FIELDS in server/src/routes/admin-contentful.js.
export const GENERATED_FIELDS: Record<string, string[]> = { shopItem: ['itemId'] };

export const isGeneratedField = (contentTypeId: string, fieldId: string) =>
  GENERATED_FIELDS[contentTypeId]?.includes(fieldId) ?? false;

/** What the entries table asks the API for - one page, searched and filtered server-side. */
export type EntriesPageParams = {
  page: number;
  rowsPerPage: number;
  search: string;
  // The link field to filter on (e.g. artwork's categories) and the ids
  // it must link to any of; no filter when linkIds is empty.
  linkField?: string;
  linkIds: string[];
  show: 'all' | 'shown' | 'hidden';
};

export type EntriesPage = { entries: Entry[]; total: number };

const BASE = '/api/admin/contentful';

export function createAdminApi(token: string | null) {
  const headers = withAuth(token);

  return {
    getContentTypes: () =>
      request<{ contentTypes: ContentType[] }>(`${BASE}/content-types`, { headers }).then((r) => r.contentTypes),

    getAssets: () => request<{ assets: Asset[] }>(`${BASE}/assets`, { headers }).then((r) => r.assets),

    getEntries: (contentTypeId: string) =>
      request<{ entries: Entry[] }>(`${BASE}/entries/${contentTypeId}`, { headers }).then((r) => r.entries),

    getEntriesPage: (contentTypeId: string, { page, rowsPerPage, search, linkField, linkIds, show }: EntriesPageParams) => {
      const query = new URLSearchParams({ skip: String(page * rowsPerPage), limit: String(rowsPerPage), show });
      if (search.trim()) query.set('search', search.trim());
      if (linkField && linkIds.length) {
        query.set('linkField', linkField);
        query.set('linkIds', linkIds.join(','));
      }
      return request<EntriesPage>(`${BASE}/entries/${contentTypeId}?${query}`, { headers });
    },

    createEntry: (contentTypeId: string, fields: Entry['fields']) =>
      request<{ entry: Entry }>(`${BASE}/entries/${contentTypeId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields }),
      }).then((r) => r.entry),

    updateEntry: (contentTypeId: string, entryId: string, fields: Entry['fields']) =>
      request<{ entry: Entry }>(`${BASE}/entries/${contentTypeId}/${entryId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ fields }),
      }).then((r) => r.entry),

    deleteEntry: (contentTypeId: string, entryId: string) =>
      request<void>(`${BASE}/entries/${contentTypeId}/${entryId}`, { method: 'DELETE', headers }),

    uploadAsset: (file: File, title = file.name.replace(/\.[^.]+$/, '')) => {
      const body = new FormData();
      body.append('file', file);
      body.append('title', title);
      return request<{ asset: { id: string; url: string | null } }>(`${BASE}/assets`, {
        method: 'POST',
        headers,
        body,
      }).then((r): Asset => ({ id: r.asset.id, url: r.asset.url, title }));
    },
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;

/** Contentful Images API resize, for small previews of full-size uploads. */
export function thumbUrl(url: string | null, size = 160) {
  return url ? `${url}?w=${size}&h=${size}&fit=thumb` : undefined;
}

/** The label an entry is known by - its content type's display field, e.g. a category's name. */
export function entryLabel(entry: Entry | undefined, contentType: ContentType | undefined) {
  const value = entry && contentType ? entry.fields[contentType.displayField] : null;
  return value ? String(value) : 'Untitled';
}

/**
 * entryLabel, prefixed with the parent's label for nestable types (category,
 * shopCategory) so subcategories read unambiguously: "Stickers › Pokemon
 * Stickers". The parent is looked up among the same type's entries.
 */
export function entryPathLabel(entry: Entry, contentType: ContentType | undefined, sameTypeEntries: Entry[] = []) {
  const parentId = entry.fields.parentCategory;
  const parent = typeof parentId === 'string' ? sameTypeEntries.find((e) => e.id === parentId) : undefined;
  const label = entryLabel(entry, contentType);
  return parent ? `${entryLabel(parent, contentType)} › ${label}` : label;
}

// "Custom Prints!" -> "custom-prints" - the format slug fields require.
export function slugify(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
