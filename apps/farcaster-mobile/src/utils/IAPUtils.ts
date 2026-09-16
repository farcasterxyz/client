const ALLOWED_FOR_ADVANCED_SIGNER_FLOW = new Set<number>([]);

const SIGNER_PRODUCT_NAMES = [
  'Tier 1 Signer',
  'Tier 2 Signer',
  'Tier 3 Signer',
  'Tier 4 Signer',
  'Tier 5 Signer',
  'Tier 6 Signer',
  'Tier 7 Signer',
  'Tier 8 Signer',
  'Tier 9 Signer',
  'Tier 10 Signer',
  'Tier 11 Signer',
  'Tier 12 Signer',
  'Tier 13 Signer',
  'Tier 14 Signer',
  'Tier 15 Signer',
];

const canAccessAdvancedSignerProducts = ({ fid }: { fid: number }) => {
  return ALLOWED_FOR_ADVANCED_SIGNER_FLOW.has(fid);
};

const getAdvancedSignerProducts = ({
  fid,
  skus,
}: {
  fid: number;
  skus: string[];
}) => {
  if (!canAccessAdvancedSignerProducts({ fid })) {
    return undefined;
  }

  if (skus.length === 0) {
    return undefined;
  }

  // Sort for now since we want it to be price ordered
  // and product ids are already string sorted.
  // Since this feature is somewhat debug flow for now it
  // is a fine assumption.
  skus.sort();

  const all = skus.reduce(
    (all, sku, index) => {
      all[sku] = {
        productId: sku,
        productName: SIGNER_PRODUCT_NAMES[index],
      };
      return all;
    },
    {} as {
      [sku: string]: {
        productName: string;
        productId: string;
      };
    },
  );

  return Object.values(all);
};

export { canAccessAdvancedSignerProducts, getAdvancedSignerProducts };
