import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { type ShopCategoryOption } from '../../lib/contentful';

export type CategoryNode = ShopCategoryOption & { children: ShopCategoryOption[] };

type Props = {
  tree: CategoryNode[];
  // Selected category's slug; undefined = everything
  selected?: string;
  onSelect: (slug?: string) => void;
};

// Category list for the shop: a sidebar of top-level categories with their
// subcategories indented underneath (desktop, styled after the Zone
// template's filter-category), or a scrolling chip row (mobile).
export function ShopCategorySidebar({ tree, selected, onSelect }: Props) {
  const row = (label: string, slug: string | undefined, indent = false) => (
    <Stack
      key={slug ?? 'all'}
      component="button"
      type="button"
      direction="row"
      alignItems="center"
      onClick={() => onSelect(slug)}
      aria-current={selected === slug ? 'true' : undefined}
      sx={{
        p: 0,
        pl: indent ? 2.5 : 0,
        border: 0,
        bgcolor: 'transparent',
        color: selected === slug ? 'primary.main' : 'text.secondary',
        typography: 'body2',
        fontWeight: selected === slug ? 'fontWeightBold' : 'fontWeightRegular',
        cursor: 'pointer',
        textAlign: 'left',
        '&:hover': { color: 'primary.main' },
      }}
    >
      <ChevronRightIcon sx={{ fontSize: 14, mr: 1 }} />
      {label}
    </Stack>
  );

  return (
    <Stack spacing={1.5}>
      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        Categories
      </Typography>
      {row('All', undefined)}
      {tree.map((node) => [row(node.name, node.slug), ...node.children.map((child) => row(child.name, child.slug, true))])}
    </Stack>
  );
}

export function ShopCategoryChips({ tree, selected, onSelect }: Props) {
  const options = [
    { label: 'All', slug: undefined as string | undefined },
    ...tree.flatMap((node) => [
      { label: node.name, slug: node.slug as string | undefined },
      ...node.children.map((child) => ({ label: child.name, slug: child.slug as string | undefined })),
    ]),
  ];

  return (
    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mx: -2, px: 2 }}>
      {options.map((option) => (
        <Chip
          key={option.slug ?? 'all'}
          label={option.label}
          color={selected === option.slug ? 'primary' : 'default'}
          variant={selected === option.slug ? 'filled' : 'outlined'}
          onClick={() => onSelect(option.slug)}
          sx={{ flexShrink: 0 }}
        />
      ))}
    </Stack>
  );
}
