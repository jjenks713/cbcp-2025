import { useMemo } from 'react';

import { useCart } from '../../lib/cart-context';
import { type ShopItem } from '../../lib/contentful';
import { useShopItems } from '../../hooks/queries/content';

export type CartItem = { item: ShopItem; quantity: number; lineTotal: number };

/**
 * The cart's lines matched up with the current shop items. Lines for items
 * that are gone or hidden are left out, and quantities are capped at the
 * stock on hand (sold-out items show with quantity 0 so they can be
 * removed rather than silently vanishing).
 */
export function useCartItems() {
  const { lines } = useCart();
  // Nothing to look up while the cart is empty - this runs in the nav on
  // every page, so don't fetch the whole shop for it.
  const itemsQuery = useShopItems({ enabled: lines.length > 0 });

  return useMemo(() => {
    const byId = new Map((itemsQuery.data ?? []).map((item) => [item.id, item]));
    const items: CartItem[] = lines.flatMap((line) => {
      const item = byId.get(line.id);
      if (!item) return [];
      const quantity = Math.min(line.quantity, Math.max(item.stock, 0));
      return [{ item, quantity, lineTotal: quantity * item.price }];
    });
    return {
      items,
      subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
      loading: lines.length > 0 && itemsQuery.isPending,
    };
  }, [lines, itemsQuery.data, itemsQuery.isPending]);
}
