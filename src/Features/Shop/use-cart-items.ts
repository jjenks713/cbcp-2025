import { useMemo } from 'react';

import { lineKey, useCart } from '../../lib/cart-context';
import { useShopCatalog, variantFor, type ShopItem } from '../../hooks/queries/shop';

export type CartItem = {
  // lineKey - the item plus its size
  key: string;
  item: ShopItem;
  size?: string;
  // This size's price (sizes can cost different amounts)
  price: number;
  quantity: number;
  lineTotal: number;
  // Most this line can go up to: this size's stock
  maxQuantity: number;
};

/**
 * The cart's lines matched up with the current shop items and their stock.
 * Lines for items that are gone or hidden (or a size the item no longer
 * offers) are left out and reported as staleKeys. Each line is capped at
 * its own size's stock; anything beyond it shows as 0 ("Sold out") so it
 * can be removed rather than silently vanishing.
 */
export function useCartItems() {
  const { lines } = useCart();
  // Nothing to look up while the cart is empty - this runs in the nav on
  // every page, so don't fetch the whole shop for it.
  const catalog = useShopCatalog({ enabled: lines.length > 0 });

  return useMemo(() => {
    const byId = new Map((catalog.data ?? []).map((item) => [item.id, item]));

    const items: CartItem[] = lines.flatMap((line) => {
      const item = byId.get(line.id);
      if (!item) return [];
      if (Boolean(line.size) !== (item.sizes.length > 0)) return [];
      const variant = variantFor(item, line.size);
      if (!variant) return [];
      const quantity = Math.min(line.quantity, Math.max(variant.stock, 0));
      return [
        {
          key: lineKey(line),
          item,
          size: line.size,
          price: variant.price,
          quantity,
          lineTotal: quantity * variant.price,
          maxQuantity: Math.max(variant.stock, 0),
        },
      ];
    });

    // Lines for items that are gone/hidden or a size no longer offered -
    // only known once the shop data has loaded.
    const validKeys = new Set(items.map((i) => i.key));
    const staleKeys = catalog.data ? lines.map(lineKey).filter((key) => !validKeys.has(key)) : [];

    return {
      items,
      staleKeys,
      subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
      loading: lines.length > 0 && catalog.isPending,
    };
  }, [lines, catalog.data, catalog.isPending]);
}
