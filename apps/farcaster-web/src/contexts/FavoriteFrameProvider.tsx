import { AddMiniApp, MiniAppClientEvent } from '@farcaster/miniapp-host';
import { ApiFrame } from 'farcaster-client-data';
import {
  useAddFavoriteFrame,
  useRemoveFavoriteFrame,
} from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';

import { ConfirmFavoriteFrameDialog } from '~/components/frames/ConfirmFavoriteFrameDialog';
import { ConfirmRemoveFavoriteFrameDialog } from '~/components/frames/ConfirmRemoveFavoriteFrameDialog';
import { toast } from '~/utils/toast';

type FavoriteFrameParams = {
  frame: ApiFrame;
  emit: ((event: MiniAppClientEvent) => void) | undefined;
  // True (default): render in a full-screen portal, render centered with full-screen overlay when frame is not open
  // False: render as absolute element, render on bottom with limited overlay when frame is open
  renderInPortal?: boolean;
};

type AddState = FavoriteFrameParams & {
  emitOnRejection?: boolean;
  resolve: (value: AddMiniApp.AddMiniAppResult) => void;
  reject: (e: unknown) => void;
};

type RemoveState = FavoriteFrameParams & {
  resolve: (removed: boolean) => void;
  reject: (e: unknown) => void;
};

export type FavoriteFrameContextValue = {
  confirmAddFavoriteFrame: (
    params: Omit<AddState, 'resolve' | 'reject'>,
  ) => Promise<AddMiniApp.AddMiniAppResult>;
  confirmRemoveFavoriteFrame: (
    params: Omit<RemoveState, 'resolve' | 'reject'>,
  ) => Promise<boolean>;
  resetAddFavoriteFrame: () => void;
};

const FavoriteFrameContext = React.createContext<FavoriteFrameContextValue>({
  confirmAddFavoriteFrame: async () => {
    throw new Error('Must be called in FavoriteFrameContext provider');
  },
  confirmRemoveFavoriteFrame: () => {
    throw new Error('Must be called in FavoriteFrameContext provider');
  },
  resetAddFavoriteFrame: () => {
    throw new Error('Must be called in FavoriteFrameContext provider');
  },
});

type FavoriteFrameProviderProps = {
  children: React.ReactNode;
};

export const useFavoriteFrame = () => React.useContext(FavoriteFrameContext);

export const FavoriteFrameProvider: React.FC<FavoriteFrameProviderProps> = ({
  children,
}) => {
  const [addState, setAddState] = useState<AddState | null>(null);
  const [removeState, setRemoveState] = useState<RemoveState | null>(null);
  const addFavoriteFrame = useAddFavoriteFrame();
  const removeFavoriteFrame = useRemoveFavoriteFrame();

  const confirmAddFavoriteFrame = useCallback(
    async (params: Omit<AddState, 'resolve' | 'reject'>) => {
      return new Promise<AddMiniApp.AddMiniAppResult>((resolve, reject) => {
        setAddState({
          ...params,
          resolve,
          reject,
        });
      });
    },
    [],
  );

  const confirmRemoveFavoriteFrame = useCallback(
    async (params: Omit<RemoveState, 'resolve' | 'reject'>) => {
      return new Promise<boolean>((resolve, reject) => {
        setRemoveState({
          ...params,
          resolve,
          reject,
        });
      });
    },
    [],
  );

  const resetAddFavoriteFrame = useCallback(() => {
    setAddState(null);
  }, []);

  const handleDismiss = useCallback(() => {
    // Resolve the frame action promise if user clicked outside the modal
    if (addState) {
      addState.reject(new AddMiniApp.RejectedByUser());

      if (addState.emitOnRejection) {
        addState.emit?.({
          event: 'miniapp_add_rejected',
          reason: 'rejected_by_user',
        });
      }
    }
    if (removeState) {
      removeState.resolve(false);
    }

    setAddState(null);
    setRemoveState(null);
  }, [addState, removeState]);

  return (
    <FavoriteFrameContext.Provider
      value={{
        confirmAddFavoriteFrame,
        confirmRemoveFavoriteFrame,
        resetAddFavoriteFrame,
      }}
    >
      {children}

      {!!addState && (
        <ConfirmFavoriteFrameDialog
          frame={addState.frame}
          onClose={handleDismiss}
          onConfirm={async () => {
            try {
              const result = await addFavoriteFrame({
                domain: addState.frame.domain,
                name: addState.frame.name,
                author: addState.frame.author,
                url: addState.frame.homeUrl,
              });

              toast({
                message: `${addState.frame.name} added to Farcaster`,
                type: 'success',
              });

              addState.resolve({
                notificationDetails: result.notificationDetails,
              });

              addState.emit?.({
                event: 'miniapp_added',
                notificationDetails: result.notificationDetails,
              });
            } catch (e) {
              addState.reject(e);
              toast({ message: 'Failed to add mini app', type: 'error' });
            } finally {
              setAddState(null);
            }
          }}
          renderInPortal={addState.renderInPortal}
        />
      )}

      {!!removeState && (
        <ConfirmRemoveFavoriteFrameDialog
          frame={removeState.frame}
          onClose={handleDismiss}
          onConfirm={async () => {
            try {
              await removeFavoriteFrame({
                domain: removeState.frame.domain,
                name: removeState.frame.name,
                url: removeState.frame.homeUrl,
                author: removeState.frame.author,
              });

              toast({
                message: `${removeState.frame.name} removed from Farcaster`,
              });

              removeState.resolve(true);
              removeState.emit?.({ event: 'miniapp_removed' });
            } catch (e) {
              removeState.reject(e);
              toast({ message: 'Failed to remove mini app', type: 'error' });
            } finally {
              setRemoveState(null);
            }
          }}
          renderInPortal={removeState.renderInPortal}
        />
      )}
    </FavoriteFrameContext.Provider>
  );
};
