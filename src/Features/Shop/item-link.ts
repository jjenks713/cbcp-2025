import { type ShopProduct } from '../../lib/contentful';

// Links straight to a shop item: its category's shop page with ?item=<id>,
// which opens that item's drawer (see Shop.tsx) - e.g.
// /shop/prints?item=abc123. Used by the cart's item names.
export const ITEM_PARAM = 'item';

export const shopItemHref = (item: Pick<ShopProduct, 'id' | 'categorySlug'>) =>
  `${item.categorySlug ? `/shop/${encodeURIComponent(item.categorySlug)}` : '/shop'}?${ITEM_PARAM}=${encodeURIComponent(item.id)}`;
