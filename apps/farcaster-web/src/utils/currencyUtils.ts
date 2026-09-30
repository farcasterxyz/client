const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const formatCents = (cents: number) => usdFormatter.format(cents / 100);
