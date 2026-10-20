import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useResponsive } from '../../hooks/use-responsive';
import { useShopCategoryList } from '../../hooks/queries/content';
import { useShopCatalog, type ShopItem } from '../../hooks/queries/shop';
import { type ShopCategoryOption } from '../../lib/contentful';
import { useCart } from '../../lib/cart-context';
import { ITEM_PARAM } from './item-link';
import ShopItemCard, { ShopItemCardSkeleton } from './ShopItemCard';
import { ShopCategoryChips, ShopCategorySidebar, type CategoryNode } from './ShopCategoryFilter';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name' },
] as const;

type Sort = (typeof SORT_OPTIONS)[number]['value'];

const SORTERS: Record<Sort, (a: ShopItem, b: ShopItem) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

const byOrder = (a: ShopCategoryOption, b: ShopCategoryOption) => a.order - b.order || a.name.localeCompare(b.name);

/** Top-level categories (in admin order) with their subcategories nested. */
function buildTree(categories: ShopCategoryOption[]): CategoryNode[] {
  return categories
    .filter((c) => !c.parentId)
    .sort(byOrder)
    .map((parent) => ({ ...parent, children: categories.filter((c) => c.parentId === parent.id).sort(byOrder) }));
}

/** The category's id plus every category nested under it. */
function withDescendants(rootId: string, categories: ShopCategoryOption[]) {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

// The in-app shop: every visible shop item, filterable by category (the
// category lives in the URL - /shop/stickers - so the home page's shop
// cards link straight to it) and sortable. Layout adapted from the Zone
// template's e-commerce catalog page. Only reachable while the
// hide-cbcp-shop flag is off (see App/ShopGate.tsx).
export default function Shop() {
  const mdUp = useResponsive('up', 'md');
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [sort, setSort] = useState<Sort>('newest');

  const categoriesQuery = useShopCategoryList();
  const itemsQuery = useShopCatalog();
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const tree = useMemo(() => buildTree(categories), [categories]);
  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const loading = categoriesQuery.isPending || itemsQuery.isPending;

  const items = useMemo(() => {
    const all = itemsQuery.data ?? [];
    const allowed = selectedCategory ? withDescendants(selectedCategory.id, categories) : null;
    return all.filter((item) => !allowed || allowed.has(item.categoryId)).sort(SORTERS[sort]);
  }, [itemsQuery.data, selectedCategory, categories, sort]);

  const selectCategory = (slug?: string) => navigate(slug ? `/shop/${slug}` : '/shop');

  // ?item=<id> (e.g. an item name clicked in the cart) opens that item's
  // drawer; once the drawer closes, the param is dropped so a refresh
  // doesn't reopen it.
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedItemId = searchParams.get(ITEM_PARAM);
  const { itemDrawerId, openItem } = useCart();
  useEffect(() => {
    if (linkedItemId) openItem(linkedItemId);
  }, [linkedItemId, openItem]);
  const drawerWasOpen = useRef(false);
  useEffect(() => {
    if (itemDrawerId) {
      drawerWasOpen.current = true;
    } else if (drawerWasOpen.current) {
      drawerWasOpen.current = false;
      if (linkedItemId) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete(ITEM_PARAM);
            return next;
          },
          { replace: true }
        );
      }
    }
  }, [itemDrawerId, linkedItemId, setSearchParams]);

  // A link to a category that's hidden or gone - show everything instead.
  const unknownCategory = Boolean(categorySlug) && !loading && !selectedCategory;

  return (
    <Container sx={{ py: { xs: 5, md: 10 } }}>
      <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'unset' }, mb: { xs: 4, md: 6 } }}>
        <Typography variant="overline" sx={{ color: 'text.disabled' }}>
          Creepy but Cute Press
        </Typography>
        <Typography variant="h2">{selectedCategory?.name ?? 'Shop'}</Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 8 }}>
        {mdUp ? (
          <Box sx={{ width: 220, flexShrink: 0 }}>
            <ShopCategorySidebar tree={tree} selected={selectedCategory?.slug} onSelect={selectCategory} />
          </Box>
        ) : (
          <ShopCategoryChips tree={tree} selected={selectedCategory?.slug} onSelect={selectCategory} />
        )}

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {loading ? ' ' : `${items.length} item${items.length === 1 ? '' : 's'}`}
            </Typography>
            <TextField
              select
              size="small"
              label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              sx={{ width: 200, borderRadius: 1 }}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem 
                  sx={{ color: 'secondary.main' }}
                  key={option.value} 
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {unknownCategory && (
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              That category isn&apos;t available - showing everything instead.
            </Typography>
          )}

          {!loading && items.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', py: 10, textAlign: 'center' }}>
              {selectedCategory ? 'Nothing in this category yet.' : 'The shop is being stocked - check back soon.'}
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                rowGap: 4,
                columnGap: 3,
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
              }}
            >
              {loading
                ? Array.from({ length: 8 }, (_, i) => <ShopItemCardSkeleton key={i} />)
                : items.map((item) => <ShopItemCard key={item.id} item={item} />)}
            </Box>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
