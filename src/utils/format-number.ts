export function fShortenNumber(number: number) {
  const fm = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(number);
  return fm.replace(/[+-]/g, '');
}
