import { useFlags } from 'launchdarkly-react-client-sdk';

import { RouterLink } from '../components/RouterLink';
import { ETSY_SHOP_URL } from '../lib/links';

/**
 * Whether the in-app shop is live: the hide-cbcp-shop LaunchDarkly flag
 * is off. Reads as false (Etsy) until LaunchDarkly has loaded, since the
 * flag defaults to hidden.
 */
export function useShopEnabled() {
  // Flag keys are camelCased by the SDK (hide-cbcp-shop -> hideCbcpShop).
  const { hideCbcpShop = true } = useFlags();
  return !hideCbcpShop;
}

export type ShopLinkProps =
  | { component: typeof RouterLink; href: string }
  | { component: 'a'; href: string; target: '_blank'; rel: 'noopener' };

/**
 * Props for any "shop" link - spread onto an MUI Button / Link /
 * IconButton. Goes to the in-app shop (or `path` within it, e.g. a
 * category: /shop/stickers) while the shop is enabled, and to Etsy in a
 * new tab otherwise. Use this for every shop link so they all follow the
 * flag; only links that are explicitly *about* Etsy (e.g. showing the
 * etsy.com address) should use ETSY_SHOP_URL directly.
 */
export function useShopLink(path = '/shop'): ShopLinkProps {
  return useShopEnabled()
    ? { component: RouterLink, href: path }
    : { component: 'a', href: ETSY_SHOP_URL, target: '_blank', rel: 'noopener' };
}
