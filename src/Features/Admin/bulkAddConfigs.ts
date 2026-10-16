import { type Entry } from '../../lib/admin-contentful';
import { type InventoryInput } from '../../lib/shop-api';

// What the bulk add dialog needs to know about a content type: which field
// names the entry, which links it to categories, the extra per-image
// fields to ask for, and how one row becomes an entry. One config per
// content type that supports bulk add (see BULK_ADD_CONFIGS).

export type BulkFieldKind =
  // Dollars, 0 or more, e.g. 4.5
  | 'price'
  // Whole number, 0 or more, e.g. stock
  | 'count'
  | 'text';

export type BulkField = {
  id: string;
  label: string;
  kind: BulkFieldKind;
  required?: boolean;
  // Field width on wider screens; the name field takes the rest.
  width: number;
};

export type BulkRow = {
  name: string;
  // Raw input per BulkField id, converted in toFields.
  values: Record<string, string>;
  // Every entry gets the same category selection.
  categoryIds: string[];
  // The uploaded image.
  assetId: string;
};

export type BulkAddConfig = {
  contentTypeId: string;
  title: string;
  // Singular/plural for counts, e.g. "3 items"
  noun: [string, string];
  nameLabel: string;
  categoryTypeId: string;
  categoryLabel: string;
  multipleCategories: boolean;
  categoryHelp: string;
  rowFields: BulkField[];
  toFields: (row: BulkRow) => Entry['fields'];
  // Stock rows to save to the inventory once the entry exists (shop items
  // - stock isn't a Contentful field).
  inventoryFor?: (row: BulkRow) => InventoryInput[];
};

const SHOP_ITEM: BulkAddConfig = {
  contentTypeId: 'shopItem',
  title: 'Bulk Add Shop Items',
  noun: ['item', 'items'],
  nameLabel: 'Name',
  categoryTypeId: 'shopCategory',
  categoryLabel: 'Category',
  multipleCategories: false,
  categoryHelp: 'Every item below goes into this category - usually a subcategory, e.g. Stickers › Pokemon Stickers',
  rowFields: [
    { id: 'price', label: 'Price', kind: 'price', required: true, width: 120 },
    { id: 'stock', label: 'Stock', kind: 'count', required: true, width: 100 },
  ],
  toFields: ({ name, values, categoryIds, assetId }) => ({
    name,
    category: categoryIds[0],
    price: Number(values.price),
    images: [assetId],
    // Hidden until switched on from the table, like any new entry.
    showInApp: false,
  }),
  // Bulk-added items have no sizes, so one stock row.
  inventoryFor: ({ values }) => [{ size: null, stock: Number(values.stock), price: null }],
};

const ARTWORK: BulkAddConfig = {
  contentTypeId: 'artwork',
  title: 'Bulk Add Artwork',
  noun: ['artwork', 'artworks'],
  nameLabel: 'Title',
  categoryTypeId: 'category',
  categoryLabel: 'Categories',
  multipleCategories: true,
  categoryHelp: 'Every artwork below goes into these categories, e.g. Drawings',
  rowFields: [
    { id: 'medium', label: 'Medium', kind: 'text', width: 180 },
    { id: 'size', label: 'Size', kind: 'text', width: 110 },
  ],
  toFields: ({ name, values, categoryIds, assetId }) => ({
    title: name,
    categories: categoryIds,
    // Blank text is dropped by the API rather than saved as "".
    medium: values.medium.trim(),
    size: values.size.trim(),
    coverImage: assetId,
    showInApp: false,
  }),
};

export const BULK_ADD_CONFIGS: Record<string, BulkAddConfig> = {
  shopItem: SHOP_ITEM,
  artwork: ARTWORK,
};
