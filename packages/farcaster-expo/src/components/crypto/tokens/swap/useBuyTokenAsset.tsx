import type { ApiTokenLink } from 'farcaster-client-data';
import { useCallback, useEffect, useRef, useState } from 'react';

type AssetPickerType = 'crypto' | 'cash';

const DEFAULT_ASSET_PICKER_TYPE: AssetPickerType = 'crypto';

export function useBuyTokenAsset({ buyToken }: { buyToken?: ApiTokenLink }): {
  assetPickerType: AssetPickerType;
  setAssetPickerType: (type: AssetPickerType) => void;
} {
  const prevBuyTokenSymbol = useRef<string | undefined>(undefined);
  const [assetPickerType = DEFAULT_ASSET_PICKER_TYPE, setAssetPickerTypeLocal] =
    useState<AssetPickerType>(DEFAULT_ASSET_PICKER_TYPE);
  const setAssetPickerType = useCallback(
    (type: AssetPickerType) => {
      setAssetPickerTypeLocal(type);
    },
    [setAssetPickerTypeLocal],
  );

  useEffect(() => {
    if (buyToken?.ticker !== prevBuyTokenSymbol.current) {
      prevBuyTokenSymbol.current = buyToken?.ticker;
      setAssetPickerType(DEFAULT_ASSET_PICKER_TYPE);
    }
  }, [buyToken, setAssetPickerType]);

  return {
    assetPickerType: assetPickerType,
    setAssetPickerType,
  } satisfies {
    assetPickerType: AssetPickerType;
    setAssetPickerType: (type: AssetPickerType) => void;
  };
}
