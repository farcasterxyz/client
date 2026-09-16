export const isSolanaAddress = (address: string) => {
  return address.match(/^[1-9A-HJ-NP-Za-km-z]{44}$/);
};
