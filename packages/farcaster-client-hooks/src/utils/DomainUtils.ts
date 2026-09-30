export const isValidDomain = (domain: string): boolean => {
  if (!domain || !domain.includes('.')) {
    return false;
  }
  try {
    const url = new URL(`https://${domain}`);
    return url.hostname === domain && !domain.includes('/');
  } catch {
    return false;
  }
};
