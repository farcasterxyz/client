import { Octicons } from '@expo/vector-icons';
import { AddMiniApp, MiniAppClientEvent } from '@farcaster/miniapp-core';
import { ApiFrame } from 'farcaster-client-data';
import {
  useAddFavoriteFrame,
  useRemoveFavoriteFrame,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, {
  FC,
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

import { useBottomSheetModalRef } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { FrameIconImage } from '~/components/FrameIconImage';
import { BellIcon } from '~/components/images/BellIcon';
import { BellSlashIcon } from '~/components/images/BellSlashIcon';
import { PhoneIcon } from '~/components/images/PhoneIcon';
import { PhoneSlashIcon } from '~/components/images/PhoneSlashIcon';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text2 } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

type FavoriteFrameParams = {
  frame: ApiFrame;
  emit: ((event: MiniAppClientEvent) => void) | undefined;
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
};

const FavoriteFrameContext = React.createContext<FavoriteFrameContextValue>({
  confirmAddFavoriteFrame: async () => {
    throw new Error('Must be called in FavoriteFrameContext provider');
  },
  confirmRemoveFavoriteFrame: async () => {
    throw new Error('Must be called in FavoriteFrameContext provider');
  },
});

type FavoriteFrameProviderProps = {
  children: React.ReactNode;
};

export const useFavoriteFrame = () => React.useContext(FavoriteFrameContext);

export const FavoriteFrameProvider: React.FC<FavoriteFrameProviderProps> =
  React.memo(({ children }) => {
    const toast = useRootToast();
    const [addState, setAddState] = useState<AddState | null>(null);
    const [removeState, setRemoveState] = useState<RemoveState | null>(null);
    const modalRef = useBottomSheetModalRef();
    const addFavoriteFrame = useAddFavoriteFrame();
    const removeFavoriteFrame = useRemoveFavoriteFrame();
    const addResolvedRef = useRef<boolean>(false);

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

    // We use a ref to guard against duplicate events on add because we have a race condition:
    // the add bottom sheet uses the previous version of this callback, with a stale
    // addState value because the moment addState is set to null, the sheet is no longer
    // rendered (so it doesn't get the new handleDismiss) and calls the one it has while
    // unmounting
    const handleDismiss = useCallback(() => {
      // Resolve the frame action promise if user clicked outside the bottom sheet and we
      // haven't resolved already
      if (addState && !addResolvedRef.current) {
        addState.reject(new AddMiniApp.RejectedByUser());

        if (addState.emitOnRejection) {
          try {
            addState.emit?.({
              event: 'miniapp_add_rejected',
              reason: 'rejected_by_user',
            });
          } catch (error) {
            // Ignore errors since it's not critical
          }
        }
      }

      if (removeState) {
        removeState.resolve(false);
      }

      setAddState(null);
      setRemoveState(null);
      addResolvedRef.current = false;
    }, [addState, removeState]);

    const value = useMemo(
      () => ({
        confirmAddFavoriteFrame,
        confirmRemoveFavoriteFrame,
      }),
      [confirmAddFavoriteFrame, confirmRemoveFavoriteFrame],
    );

    // TODO better error boundary and no data states
    return (
      <FavoriteFrameContext.Provider value={value}>
        {children}

        {!!addState && (
          <AutoDisplayingBottomSheetModal
            name="confirmAddFavoriteFrame"
            ref={modalRef}
            onDismiss={handleDismiss}
          >
            <Suspense fallback={<LoadingIndicator />}>
              <ConfirmAddFavoriteFrameBottomSheet
                frame={addState.frame}
                onClose={() => {
                  setAddState(null);
                }}
                onConfirm={async () => {
                  try {
                    const result = await addFavoriteFrame({
                      domain: addState.frame.domain,
                      url: addState.frame.homeUrl,
                      author: addState.frame.author,
                      name: addState.frame.name,
                    });

                    toast.show(`${addState.frame.name} added to Farcaster`, {
                      type: 'generic',
                    });

                    addState.resolve({
                      notificationDetails: result.notificationDetails,
                    });

                    try {
                      addState.emit?.({
                        event: 'miniapp_added',
                        notificationDetails: result.notificationDetails,
                      });
                    } catch (error) {
                      // Ignore errors since it's not critical
                    }
                  } catch (e) {
                    addState.reject(e);
                    toast.show('Failed to add Mini App', { type: 'danger' });
                  } finally {
                    addResolvedRef.current = true;
                    setAddState(null);
                  }
                }}
              />
            </Suspense>
          </AutoDisplayingBottomSheetModal>
        )}

        {!!removeState && (
          <AutoDisplayingBottomSheetModal
            name="confirmRemoveFavoriteFrame"
            ref={modalRef}
            onDismiss={handleDismiss}
          >
            <Suspense fallback={<LoadingIndicator />}>
              <ConfirmRemoveFavoriteFrameBottomSheet
                frame={removeState.frame}
                onClose={() => {
                  setRemoveState(null);
                }}
                onConfirm={async () => {
                  try {
                    await removeFavoriteFrame({
                      domain: removeState.frame.domain,
                      name: removeState.frame.name,
                      url: removeState.frame.homeUrl,
                      author: removeState.frame.author,
                    });

                    toast.show(
                      `${removeState.frame.name} removed from Farcaster`,
                      {
                        type: 'generic',
                      },
                    );

                    removeState.resolve(true);

                    try {
                      removeState.emit?.({ event: 'miniapp_removed' });
                    } catch (error) {
                      // Ignore errors since it's not critical
                    }
                  } catch (e: unknown) {
                    removeState.reject(e);
                    toast.show('Failed to remove frame', { type: 'danger' });
                  } finally {
                    setRemoveState(null);
                  }
                }}
              />
            </Suspense>
          </AutoDisplayingBottomSheetModal>
        )}
      </FavoriteFrameContext.Provider>
    );
  });

interface ConfirmAddFavoriteFrameBottomSheetProps {
  frame: ApiFrame;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmAddFavoriteFrameBottomSheet: FC<
  ConfirmAddFavoriteFrameBottomSheetProps
> = ({ frame, onClose, onConfirm }) => {
  const t = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const permissions = useMemo(() => {
    const permissions = [
      {
        name: 'Add to Farcaster',
        icon: <PhoneIcon size={20} color={t.colors.text.primary} />,
      },
    ];

    if (frame.supportsNotifications) {
      permissions.push({
        name: 'Enable notifications',
        icon: <BellIcon size={20} color={t.colors.text.primary} />,
      });
    }

    return permissions;
  }, [frame.supportsNotifications, t.colors.text.primary]);

  const onConfirmWrapped = useCallback(() => {
    setSubmitting(true);
    onConfirm();
  }, [onConfirm]);

  return (
    <>
      <View style={[t.pX4, t.flexCol, t.itemsCenter, t.justifyCenter]}>
        <View style={[t.relative]}>
          <FrameIconImage imageUrl={frame.iconUrl} size={72} />
          <View
            style={[
              t.absolute,
              t.right0,
              t.top0,
              t.roundedFull,
              t.borderBackground,
              t.border2,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              {
                width: 32,
                height: 32,
                backgroundColor: '#E5E0F3',
                marginTop: -8,
                marginRight: -8,
                paddingLeft: 0.5,
                paddingTop: 0.5,
              },
            ]}
          >
            <Octicons name="plus" size={21} color={t.colors.text.brand} />
          </View>
        </View>
        <Text2 weight="semibold" size="2xl" style={[t.textCenter, t.mT4]}>
          Add {frame.name} to Farcaster
        </Text2>
      </View>
      <View
        style={[
          t.wFull,
          t.bgFaint,
          t.roundedLg,
          t.pY3,
          t.pX3,
          t.mT4,
          { gap: sizes.s3 },
        ]}
      >
        {permissions.map(({ name, icon }) => (
          <View
            key={name}
            style={[t.flexRow, t.itemsCenter, { gap: sizes.s2 }]}
          >
            <View
              style={[
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                { height: 32, width: 32 },
              ]}
            >
              {icon}
            </View>
            <Text2 weight="medium">{name}</Text2>
          </View>
        ))}
      </View>
      <View style={[t.flexRow, t.mT6, { gap: sizes.s4 }]}>
        <ButtonV2
          width="flex1"
          title="Not now"
          variant="tertiary"
          onPress={onClose}
          disabled={submitting}
        />
        <ButtonV2
          width="flex1"
          title="Add"
          onPress={onConfirmWrapped}
          disabled={submitting}
        />
      </View>
    </>
  );
};

interface ConfirmRemoveFavoriteFrameBottomSheetProps {
  frame: ApiFrame;
  // onDismiss: (removed: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmRemoveFavoriteFrameBottomSheet: FC<
  ConfirmRemoveFavoriteFrameBottomSheetProps
> = ({ frame, onClose, onConfirm }) => {
  const t = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const onConfirmWrapped = useCallback(async () => {
    setSubmitting(true);
    onConfirm();
  }, [onConfirm]);

  return (
    <>
      <View style={[t.pX4, t.flexCol, t.itemsCenter, t.justifyCenter]}>
        <View style={[t.relative]}>
          <FrameIconImage imageUrl={frame.iconUrl} size={72} />
          <View
            style={[
              t.absolute,
              t.right0,
              t.top0,
              t.roundedFull,
              t.borderBackground,
              t.border2,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              {
                width: 32,
                height: 32,
                backgroundColor: '#FBE7EB',
                marginTop: -8,
                marginRight: -8,
                paddingLeft: 0.5,
                paddingTop: 0.5,
              },
            ]}
          >
            <Octicons name="x" size={21} color={t.colors.text.danger} />
          </View>
        </View>
        <Text2 weight="semibold" size="2xl" style={[t.textCenter, t.mT4]}>
          Remove {frame.name}
        </Text2>
      </View>
      <View
        style={[
          t.wFull,
          t.bgFaint,
          t.roundedLg,
          t.pY3,
          t.pX3,
          t.mT4,
          { gap: sizes.s3 },
        ]}
      >
        {[
          {
            name: 'Remove from Farcaster',
            icon: <PhoneSlashIcon size={20} color={t.colors.text.primary} />,
          },
          {
            name: 'Disable notifications',
            icon: <BellSlashIcon size={20} color={t.colors.text.primary} />,
          },
        ].map(({ name, icon }) => (
          <View
            key={name}
            style={[t.flexRow, t.itemsCenter, { gap: sizes.s2 }]}
          >
            <View
              style={[
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                { height: 32, width: 32 },
              ]}
            >
              {icon}
            </View>
            <Text2 weight="medium">{name}</Text2>
          </View>
        ))}
      </View>
      <View style={[t.flexRow, t.mT6, { gap: sizes.s4 }]}>
        <ButtonV2
          width="flex1"
          title="Cancel"
          variant="tertiary"
          onPress={onClose}
          disabled={submitting}
        />
        <ButtonV2
          width="flex1"
          title="Remove"
          variant="destructive"
          onPress={onConfirmWrapped}
          disabled={submitting}
        />
      </View>
    </>
  );
};
