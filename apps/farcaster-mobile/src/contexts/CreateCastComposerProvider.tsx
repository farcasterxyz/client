import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useDefaultToastProviderProps } from 'farcaster-expo';
import React, {
  createContext,
  memo,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-toast-notifications';

import { SnapLiftPortal } from '~/components/Snap/SnapLiftPortal';
import { CreateCastScreenContent } from '~/screens/CreateCast/CreateCastScreen';
import { CreateCastScreenParams, FullParamList } from '~/types';

import { registerOnCastQueue } from './CastQueueProvider';
import { ComposerParentCastProvider } from './ComposerParentCastProvider';
import { NavigationMethodsProvider } from './NavigationMethodsProvider';
import { ScreenBasedPromptProvider } from './ScreenBasedPromptProvider';
import { useTheme } from './ThemeProvider';

type ComposerState = {
  isVisible: boolean;
  isBackgrounded: boolean;
  params?: CreateCastScreenParams;
  castQueueId?: string;
};

type CreateCastComposerContextValue = {
  openComposer: (params?: CreateCastScreenParams) => void;
  closeComposer: () => void;
  backgroundComposer: () => void;
  resumeComposer: () => void;
  isComposerOpen: boolean;
  hasBackgroundedComposer: boolean;
};

const CreateCastComposerContext = createContext<
  CreateCastComposerContextValue | undefined
>(undefined);

const initialState: ComposerState = {
  isVisible: false,
  isBackgrounded: false,
  params: undefined,
  castQueueId: undefined,
};

const CreateCastComposerProviderComponent: React.FC<
  PropsWithChildren<{
    navigationRef: NavigationContainerRefWithCurrent<FullParamList>;
  }>
> = ({ navigationRef, children }) => {
  const [state, setState] = useState<ComposerState>(initialState);

  const closeComposer = useCallback(() => {
    setState(initialState);
  }, []);

  const backgroundComposer = useCallback(() => {
    setState((current) =>
      current.isVisible
        ? {
            ...current,
            isBackgrounded: true,
          }
        : current,
    );
  }, []);

  const resumeComposer = useCallback(() => {
    setState((current) =>
      current.isVisible && current.isBackgrounded
        ? {
            ...current,
            isBackgrounded: false,
          }
        : current,
    );
  }, []);

  const openComposer = useCallback(
    (params?: CreateCastScreenParams) => {
      if (state.isVisible && state.isBackgrounded) {
        setState((current) => ({
          ...current,
          isBackgrounded: false,
        }));
        return;
      }

      const { queueId } = registerOnCastQueue();
      setState({
        isVisible: true,
        isBackgrounded: false,
        params,
        castQueueId: queueId,
      });
    },
    [state.isBackgrounded, state.isVisible],
  );

  const onDismiss = state.params?.onDismiss;
  const onSuccess = state.params?.onSuccess;

  const handleDismiss = useCallback(() => {
    onDismiss?.();

    closeComposer();
  }, [closeComposer, onDismiss]);

  const handleSuccess = useCallback<
    NonNullable<CreateCastScreenParams['onSuccess']>
  >(
    (cast) => {
      onSuccess?.(cast);
    },
    [onSuccess],
  );

  const contextValue = useMemo(
    () => ({
      openComposer,
      closeComposer,
      backgroundComposer,
      resumeComposer,
      isComposerOpen: state.isVisible && !state.isBackgrounded,
      hasBackgroundedComposer: state.isVisible && state.isBackgrounded,
    }),
    [
      backgroundComposer,
      closeComposer,
      openComposer,
      resumeComposer,
      state.isBackgrounded,
      state.isVisible,
    ],
  );

  const shouldRenderComposer =
    state.isVisible && typeof state.castQueueId === 'string';

  return (
    <CreateCastComposerContext.Provider value={contextValue}>
      {children}
      {shouldRenderComposer ? (
        <ComposerModal
          navigationRef={navigationRef}
          isVisible={!state.isBackgrounded}
          composerParams={state.params ?? {}}
          castQueueId={state.castQueueId!}
          handleDismiss={handleDismiss}
          handleSuccess={handleSuccess}
          closeComposer={closeComposer}
        />
      ) : null}
    </CreateCastComposerContext.Provider>
  );
};

type ComposerModalProps = {
  navigationRef: NavigationContainerRefWithCurrent<FullParamList>;
  isVisible: boolean;
  composerParams: CreateCastScreenParams;
  castQueueId: string;
  handleDismiss: () => void;
  handleSuccess: NonNullable<CreateCastScreenParams['onSuccess']>;
  closeComposer: () => void;
};

const ComposerModal: React.FC<ComposerModalProps> = ({
  navigationRef,
  isVisible,
  composerParams,
  castQueueId,
  handleDismiss,
  handleSuccess,
  closeComposer,
}) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toastProviderProps = useDefaultToastProviderProps();

  useEffect(() => {
    if (!isVisible || Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleDismiss();
        return true;
      },
    );

    return () => subscription.remove();
  }, [handleDismiss, isVisible]);

  return (
    <View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: isVisible ? 1 : 0,
          zIndex: isVisible ? 1000 : -1,
        },
      ]}
      accessibilityElementsHidden={!isVisible}
      importantForAccessibility={isVisible ? 'auto' : 'no-hide-descendants'}
    >
      <View
        style={[
          t.flex1,
          t.bgDefault,
          {
            // The composer renders as an absolute-fill overlay outside the
            // navigator, so it must apply the safe-area insets itself. With
            // edge-to-edge enabled (react-native-edge-to-edge), Android draws
            // content behind the status/navigation bars too, so both platforms
            // need the insets — otherwise the header/cast controls render under
            // the Android status bar.
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <BottomSheetModalProvider>
          <ScreenBasedPromptProvider>
            <NavigationMethodsProvider navigationRef={navigationRef}>
              <ToastProvider {...toastProviderProps}>
                <ComposerParentCastProvider>
                  <CreateCastScreenContent
                    {...composerParams}
                    modal={true}
                    castQueueId={castQueueId}
                    onDismiss={handleDismiss}
                    onSuccess={handleSuccess}
                    onClose={closeComposer}
                  />
                  <SnapLiftPortal.Outlet />
                </ComposerParentCastProvider>
              </ToastProvider>
            </NavigationMethodsProvider>
          </ScreenBasedPromptProvider>
        </BottomSheetModalProvider>
      </View>
    </View>
  );
};

export const CreateCastComposerProvider = memo(
  CreateCastComposerProviderComponent,
);

const useCreateCastComposerContext = () => {
  const context = useContext(CreateCastComposerContext);
  if (!context) {
    throw new Error(
      'useCreateCastComposerContext must be used within CreateCastComposerProvider',
    );
  }
  return context;
};

export const useOpenComposer = () =>
  useCreateCastComposerContext().openComposer;
export const useCloseComposer = () =>
  useCreateCastComposerContext().closeComposer;
export const useBackgroundComposer = () =>
  useCreateCastComposerContext().backgroundComposer;
export const useResumeComposer = () =>
  useCreateCastComposerContext().resumeComposer;
export const useIsComposerOpen = () =>
  useCreateCastComposerContext().isComposerOpen;
export const useHasBackgroundedComposer = () =>
  useCreateCastComposerContext().hasBackgroundedComposer;
