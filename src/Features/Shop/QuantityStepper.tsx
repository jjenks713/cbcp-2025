import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

type Props = {
  value: number;
  // Lowest allowed quantity. 0 (default) = going below 1 removes the line
  // (cart drawer); 1 = choosing how many to add (item drawer).
  min?: number;
  // Highest allowed quantity (the stock available)
  max: number;
  onChange: (quantity: number) => void;
  // For screen readers, e.g. "Bat Tote Bag"
  itemName: string;
};

// – 2 + pill for choosing a quantity - in the cart drawer's lines and the
// item drawer.
export default function QuantityStepper({ value, min = 0, max, onChange, itemName }: Props) {
  const atMax = value >= max;
  const atMin = value <= min;
  const removes = min === 0 && value === 1;

  return (
    <Stack
      direction="row"
      alignItems="center"
      role="group"
      aria-label={`Quantity of ${itemName}`}
      sx={{
        bgcolor: 'primary.main',
        color: 'secondary.main',
        borderRadius: 5,
        boxShadow: 3,
        width: 'fit-content',
        '& .Mui-disabled': { color: 'rgba(0, 0, 0, 0.3) !important' },
      }}
    >
      <IconButton
        size="small"
        onClick={() => onChange(value - 1)}
        disabled={atMin}
        aria-label={removes ? `Remove ${itemName} from cart` : `One less ${itemName}`}
        sx={{ color: 'inherit' }}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography variant="subtitle2" aria-live="polite" sx={{ minWidth: 20, textAlign: 'center' }}>
        {value}
      </Typography>
      <Tooltip title={atMax ? `Only ${max} available` : ''}>
        {/* span so the tooltip still shows while the button is disabled */}
        <span>
          <IconButton
            size="small"
            onClick={() => onChange(value + 1)}
            disabled={atMax}
            aria-label={`One more ${itemName}`}
            sx={{ color: 'inherit' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
