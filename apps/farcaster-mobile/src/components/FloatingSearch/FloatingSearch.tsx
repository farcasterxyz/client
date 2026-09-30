import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useDebouncedState } from 'farcaster-client-hooks';
import { isAddress } from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Keyboard } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { FloatingSearchPressable } from './FloatingSearchPressable';
import { FloatingSearchResults } from './FloatingSearchResults';

type FloatingSearchProps = {
  source: 'pulse' | 'home' | 'home-stacked' | 'notifications';
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
  showPressable?: boolean;
};

const SEARCH_TYPEAHEAD_DEBOUNCE_MS = 300;

const FloatingSearch: React.FC<FloatingSearchProps> = React.memo(
  ({ source, autoOpen, onAutoOpenHandled, showPressable = true }) => {
    const { trackEvent } = useAnalytics();
    const push = usePush();
    const navigation = useNavigation();

    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState<'preview' | 'results'>(
      'preview',
    );
    const [initialSearchIndex, setInitialSearchIndex] = useState<number | null>(
      null,
    );
    const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
    const [debouncedQ, setQ, forceSetQ, rawQ] = useDebouncedState('', {
      debounceDuration: SEARCH_TYPEAHEAD_DEBOUNCE_MS,
    });

    useEffect(() => {
      if (searchQuery === null) {
        setSearchMode('preview');
        setInitialSearchIndex(null);
        forceSetQ('');
      }
    }, [forceSetQ, searchQuery]);

    useEffect(() => {
      if (!autoOpen) {
        return;
      }

      if (!showPressable) {
        handleOpen();
        onAutoOpenHandled?.();
      } else {
        setShouldAutoOpen(true);
      }
      // We intentionally react only to autoOpen changes; handleOpen is stable via useCallback
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoOpen, showPressable]);

    const handleOpen = useCallback(() => {
      trackEvent(AnalyticsEvent.StartSearch, { source });

      setSearchMode('preview');
      setInitialSearchIndex(null);
      forceSetQ('');
      setSearchQuery('');
    }, [forceSetQ, source, trackEvent]);

    const handleClose = useCallback(() => {
      forceSetQ('');
      setSearchQuery(null);
      setSearchMode('preview');
      setInitialSearchIndex(null);
    }, [forceSetQ]);

    const handleSubmit = useCallback(() => {
      if (!rawQ) {
        return;
      }

      if (isAddress(rawQ)) {
        push('TokenCA', {
          ca: rawQ,
          via: 'search_query',
        });
        handleClose();
        return;
      }

      setSearchMode('results');
      setInitialSearchIndex(0);
    }, [handleClose, push, rawQ]);

    const handleChangeText = useCallback(
      (text: string) => {
        if (text === '') {
          setSearchQuery('');
          setSearchMode('preview');
          setInitialSearchIndex(null);
          forceSetQ('');
          return;
        }

        if (isAddress(text)) {
          push('TokenCA', { ca: text, via: 'search_query' });
          handleClose();
          return;
        }

        setSearchQuery(text);
        setQ(text);
        setSearchMode('preview');
        setInitialSearchIndex(null);
      },
      [forceSetQ, handleClose, push, setQ],
    );

    useFocusEffect(
      React.useCallback(() => {
        if (searchQuery === null) {
          return;
        }
        const subscription = BackHandler.addEventListener(
          'hardwareBackPress',
          () => {
            handleClose();
            return true;
          },
        );
        return () => {
          subscription.remove();
        };
      }, [handleClose, searchQuery]),
    );

    useFocusEffect(
      React.useCallback(() => {
        const parentNavigator = navigation.getParent();
        const tabNavigator = parentNavigator?.getParent?.() ?? parentNavigator;

        const unsubscribeTabPress = tabNavigator?.addListener(
          // @ts-expect-error-next-line This exists but types are off.
          'tabPress',
          (event) => {
            const tabState = tabNavigator.getState?.();
            const activeKey = tabState?.routes?.[tabState.index]?.key;
            const isPressingActiveTab =
              event?.target === undefined ||
              !activeKey ||
              activeKey === event.target;

            // Only handle presses for the currently focused screen/tab.
            if (!isPressingActiveTab || !navigation.isFocused()) {
              return;
            }

            Keyboard.dismiss();

            handleClose();
          },
        );

        const unsubscribeBlur = navigation.addListener('blur', () => {
          // Only close if the parent stack navigator is also losing focus,
          // meaning the user switched tabs. If the parent is still focused,
          // a new screen was pushed on top — keep search open so the user
          // returns to it when pressing back.
          if (navigation.getParent()?.isFocused()) {
            return;
          }
          handleClose();
        });

        return () => {
          unsubscribeTabPress?.();
          unsubscribeBlur();
        };
      }, [handleClose, navigation]),
    );

    // This focus effect is separate from the above as that one focuses on the parent of parents
    useFocusEffect(
      React.useCallback(() => {
        const unsubscribe = navigation
          .getParent()
          // @ts-expect-error-next-line This exists but types are off.
          ?.addListener('tabPress', () => {
            Keyboard.dismiss();

            handleClose();
          });

        return unsubscribe;
      }, [handleClose, navigation]),
    );

    return (
      <>
        <FloatingSearchResults
          searchQuery={searchQuery}
          rawQuery={rawQ}
          debouncedQuery={debouncedQ}
          searchMode={searchMode}
          initialSearchIndex={initialSearchIndex}
          setInitialSearchIndex={setInitialSearchIndex}
          setSearchMode={setSearchMode}
          setSearchQuery={setSearchQuery}
          forceSetQuery={forceSetQ}
          onSubmit={handleSubmit}
          onClose={handleClose}
          onChangeText={handleChangeText}
          searchPlaceholder="Search..."
          source={source}
        />
        {showPressable && (
          <FloatingSearchPressable
            searchQuery={searchQuery}
            onOpen={handleOpen}
            shouldAutoOpen={shouldAutoOpen}
            onAutoOpenHandled={() => {
              setShouldAutoOpen(false);
              onAutoOpenHandled?.();
            }}
          />
        )}
      </>
    );
  },
);

export { FloatingSearch };
