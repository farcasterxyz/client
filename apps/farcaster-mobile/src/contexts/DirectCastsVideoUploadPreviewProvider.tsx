import { ApiDirectCastMessageMetadata } from 'farcaster-client-data';
import React from 'react';

type DirectCastImage = {
  uri: string;
  height: number;
  width: number;
};

export type AssetToVideoUrlUpdateCallback = ({
  message,
  metadata,
}: {
  message: string;
  metadata: ApiDirectCastMessageMetadata | undefined;
}) => Promise<void>;

type DirectCastsVideoPreviewContextValue = {
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
    callback: AssetToVideoUrlUpdateCallback;
    resetAssetCallback: () => void;
  }) => void;
  reset: () => void;
  triggerAssetToVideoUrlCallback: AssetToVideoUrlUpdateCallback | undefined;
  resetAssetCallback: (() => void) | undefined;
};

const DirectCastsVideoPreviewContext =
  React.createContext<DirectCastsVideoPreviewContextValue>({} as never);

type DirectCastsVideoPreviewProviderProps = {
  children: React.ReactNode;
};

const DirectCastsVideoPreviewProvider: React.FC<
  DirectCastsVideoPreviewProviderProps
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
    React.useRef<AssetToVideoUrlUpdateCallback>(undefined);
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
      callback: AssetToVideoUrlUpdateCallback;
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

  const triggerAssetToVideoUrlCallback = React.useCallback(
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
    <DirectCastsVideoPreviewContext.Provider
      value={{
        setup,
        reset,
        conversationName,
        existingNormalizedText,
        selectedAsset,
        triggerAssetToVideoUrlCallback,
        resetAssetCallback: resetAll,
      }}
    >
      {children}
    </DirectCastsVideoPreviewContext.Provider>
  );
};

DirectCastsVideoPreviewProvider.displayName = 'DirectCastsVideoPreviewProvider';

const useDirectCastsVideoPreview = () =>
  React.useContext(DirectCastsVideoPreviewContext);

export { DirectCastsVideoPreviewProvider, useDirectCastsVideoPreview };
