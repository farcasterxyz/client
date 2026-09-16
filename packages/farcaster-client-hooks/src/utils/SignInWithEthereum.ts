// Doing this ourselves because:
// - The siwe packages relies on Buffer and for some reason our polyfill doesn't work so everything crashes
// - The SSX pacakage brings a ton of dependencies, which if anything exposes us to supply chain risk
export function generateSiweMessage({
  address,
  message,
  nonce,
  domain,
  origin,
  chainId,
}: {
  address: string;
  message: string;
  nonce: string;
  domain: string;
  origin: string;
  chainId: number;
}) {
  const date = new Date();
  const issuedAt = date.toISOString();

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    message,
    '',
    `URI: ${origin}`,
    `Version: 1`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}
