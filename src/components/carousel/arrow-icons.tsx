import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';

type Props = { isRTL?: boolean };

export function LeftIcon({ isRTL }: Props) {
  return isRTL ? <ChevronRight /> : <ChevronLeft />;
}

export function RightIcon({ isRTL }: Props) {
  return isRTL ? <ChevronLeft /> : <ChevronRight />;
}
