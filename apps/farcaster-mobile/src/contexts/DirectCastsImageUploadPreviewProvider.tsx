import { ApiDirectCastMessageMetadata } from 'farcaster-client-data';
import React from 'react';

type DirectCastImage = {
  uri: string;
  height: number;
  width: number;
};

export type AssetToImageUrlUpdateCallback = ({
  message,
  metadata,
}: {
  message: string;
  metadata: ApiDirectCastMessageMetadata | undefined;
}) => Promise<void>;

type DirectCastsImagePreviewContextValue = {
  existingNormalizedText: string | undefined;
  conversationName: string | undefined;
  selectedAsset: DirectCastImage | undefined;
  setup: ({
    asset,
    conversationName,
    normalizedText,
    callback,
    resetAssetCallback,
  }: {
    asset: DirectCastImage;
    conversationName: string;
    normalizedText: string;
    callback: AssetToImageUrlUpdateCallback;
    resetAssetCallback: () => void;
  }) => void;
  reset: () => void;
  triggerAssetToImageUrlCallback: AssetToImageUrlUpdateCallback | undefined;
  resetAssetCallback: (() => void) | undefined;
};

const DirectCastsImagePreviewContext =
  React.createContext<DirectCastsImagePreviewContextValue>({} as never);

type DirectCastsImagePreviewProviderProps = {
  children: React.ReactNode;
};

const DirectCastsImagePreviewProvider: React.FC<
  DirectCastsImagePreviewProviderProps
> = ({ children }) => {
  const [conversationName, setConversationName] = React.useState<
    string | undefined
  >(undefined);

  const [existingNormalizedText, setExistingNormalizedText] = React.useState<
    string | undefined
  >(undefined);

  const [selectedAsset, setAsset] = React.useState<DirectCastImage | undefined>(
    undefined,
  );

  const assetToImageCallback =
    React.useRef<AssetToImageUrlUpdateCallback>(undefined);
  const resetAssetCallback = React.useRef<() => void>(undefined);

  const setup = React.useCallback(
    ({
      asset,
      conversationName,
      normalizedText,
      callback,
      resetAssetCallback: rac,
    }: {
      asset: DirectCastImage;
      conversationName: string;
      normalizedText: string;
      callback: AssetToImageUrlUpdateCallback;
      resetAssetCallback: () => void;
    }) => {
      setConversationName(conversationName);
      setExistingNormalizedText(normalizedText);
      setAsset(asset);

      assetToImageCallback.current = callback;
      resetAssetCallback.current = rac;
    },
    [],
  );

  const reset = React.useCallback(() => {
    setConversationName(undefined);
    setAsset(undefined);
    assetToImageCallback.current = undefined;
    resetAssetCallback.current = undefined;
  }, [resetAssetCallback]);

  const triggerAssetToImageUrlCallback = React.useCallback(
    async ({
      message,
      metadata,
    }: {
      message: string;
      metadata: ApiDirectCastMessageMetadata | undefined;
    }) => {
      if (typeof assetToImageCallback.current !== 'undefined') {
        await assetToImageCallback.current({ message, metadata });
      }
    },
    [assetToImageCallback],
  );

  const resetAll = React.useCallback(() => {
    if (typeof resetAssetCallback.current !== 'undefined') {
      resetAssetCallback.current();
    }
  }, []);

  return (
    <DirectCastsImagePreviewContext.Provider
      value={{
        setup,
        reset,
        conversationName,
        existingNormalizedText,
        selectedAsset,
        triggerAssetToImageUrlCallback,
        resetAssetCallback: resetAll,
      }}
    >
      {children}
    </DirectCastsImagePreviewContext.Provider>
  );
};

DirectCastsImagePreviewProvider.displayName = 'DirectCastsImagePreviewProvider';

const useDirectCastsImagePreview = () =>
  React.useContext(DirectCastsImagePreviewContext);

export { DirectCastsImagePreviewProvider, useDirectCastsImagePreview };
