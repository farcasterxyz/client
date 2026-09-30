import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { Prompt } from '../Prompt';

// Shared mutable handles the mocks read at call-time so the test can inspect
// and reset them between cases.
const mockBottomSheet = {
  snapToIndex: jest.fn(),
  close: jest.fn(),
};
const mockIsPromptActiveRef = { current: false };

jest.mock('@datadog/mobile-react-native', () => ({
  DdRum: { addAction: jest.fn() },
  RumActionType: { CUSTOM: 'custom' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const ReactLib = require('react');
  const { Pressable } = require('react-native');
  return {
    __esModule: true,
    default: () => null,
    BottomSheetBackdrop: (props: { onPress?: () => void }) =>
      ReactLib.createElement(Pressable, {
        testID: 'backdrop',
        onPress: props.onPress,
      }),
  };
});

jest.mock('~/components/BottomSheet', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const BottomSheet = ReactLib.forwardRef(
    (
      props: {
        backdropComponent?: (p: object) => React.ReactNode;
        children?: React.ReactNode;
      },
      ref: React.Ref<unknown>,
    ) => {
      ReactLib.useImperativeHandle(ref, () => ({
        snapToIndex: (...args: unknown[]) =>
          mockBottomSheet.snapToIndex(...args),
        close: (...args: unknown[]) => mockBottomSheet.close(...args),
      }));
      return ReactLib.createElement(
        View,
        null,
        props.backdropComponent ? props.backdropComponent({}) : null,
        props.children,
      );
    },
  );
  BottomSheet.displayName = 'MockBottomSheet';
  return { BottomSheet };
});

jest.mock('~/contexts/ScreenBasedPromptProvider', () => ({
  useScreenBasedPrompt: () => ({ isPromptActiveRef: mockIsPromptActiveRef }),
}));

jest.mock('~/contexts/ThemeProvider', () => {
  const baseStyle = {};
  const theme = new Proxy(
    {},
    {
      get() {
        return baseStyle;
      },
    },
  );
  return { useTheme: () => theme };
});

jest.mock('~/utils/PromptUtils', () => ({
  getPromptInfo: jest.fn(() =>
    Promise.resolve({
      hasOptedOut: false,
      lastPresentedAt: 0,
      presentedCount: 0,
    }),
  ),
  setPromptInfo: jest.fn(() => Promise.resolve()),
}));

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('Prompt force-present vs backdrop safety-net timeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockBottomSheet.snapToIndex.mockClear();
    mockBottomSheet.close.mockClear();
    mockIsPromptActiveRef.current = false;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('does not close a sheet re-presented via forcePresentSignal when an earlier backdrop safety-net timeout fires', async () => {
    const onCloseCallback = jest.fn();
    const onAfterPromptCleanup = jest.fn();
    // Stable reference so the main open effect does NOT re-run on the
    // forcePresentSignal bump — mirroring the real host where `shouldPresent`
    // is memoized and `activePromptKey` is unchanged across a re-present.
    const shouldPresent = () => true;

    const renderPrompt = (forcePresentSignal: number) => (
      <Prompt
        shouldPresent={shouldPresent}
        height="30%"
        storageKey="draft-save"
        enableTouchThrough={false}
        keepMounted
        onCloseCallback={onCloseCallback}
        onAfterPromptCleanup={onAfterPromptCleanup}
        forcePresentSignal={forcePresentSignal}
      >
        <Text>content</Text>
      </Prompt>
    );

    const { rerender, getByTestId } = render(renderPrompt(1));

    // Main open effect resolves and opens the sheet (epoch 1).
    await flushMicrotasks();
    expect(mockIsPromptActiveRef.current).toBe(true);

    // User taps the backdrop: schedules a 500ms safety-net timeout capturing
    // the current epoch and clears the active-prompt mutex.
    act(() => {
      fireEvent.press(getByTestId('backdrop'));
    });
    expect(mockIsPromptActiveRef.current).toBe(false);
    expect(mockBottomSheet.close).toHaveBeenCalledTimes(1);

    // Host re-requests the prompt before the safety-net timeout fires.
    act(() => {
      rerender(renderPrompt(2));
    });
    await flushMicrotasks();

    // The force-present handler re-presented the sheet and re-acquired the
    // mutex.
    expect(mockIsPromptActiveRef.current).toBe(true);

    // The earlier safety-net timeout now fires. With the epoch bumped on
    // re-present it must NOT close the freshly re-presented sheet.
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onCloseCallback).not.toHaveBeenCalled();
    expect(onAfterPromptCleanup).not.toHaveBeenCalled();
    expect(mockIsPromptActiveRef.current).toBe(true);
  });
});
