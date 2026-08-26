import { FlashList } from '@shopify/flash-list';
import { ApiTokenLink } from 'farcaster-client-data';
import { useNonSuspenseTokenLinks } from 'farcaster-client-hooks';
import {
  TokenListItem,
  TokenListItemPlaceholder,
  Typography,
  useHaptics,
} from 'farcaster-expo';
import uniqBy from 'lodash/uniqBy';
import React, { FC, memo, Suspense, useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type TokenMentionAutocompleteProps = {
  mentionText: string | undefined;
  onAutocompleteMention: ({ token }: { token: ApiTokenLink }) => void;
};

const rowHeight = 76;
const numVisibleRows = 4;
const height = rowHeight * numVisibleRows;
const animationDuration = 100;
const autocompleteHeightBlock = height - rowHeight;

const HeightCtx = React.createContext<{
  setHeight: (h: number) => void;
} | null>(null);

const TokenMentionAutocomplete: FC<TokenMentionAutocompleteProps> = memo(
  ({ mentionText, onAutocompleteMention }) => {
    const t = useTheme();

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(height)).current;

    const prevIsVisibleRef = useRef(false);

    const [measuredHeight, setMeasuredHeight] = React.useState(0);

    const isVisible = !!mentionText;

    useEffect(() => {
      if (isVisible !== prevIsVisibleRef.current) {
        const [translateYToValue, opacityToValue] = isVisible
          ? [0, 1]
          : [measuredHeight, 0];

        Animated.timing(translateY, {
          toValue: translateYToValue,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();

        Animated.timing(opacity, {
          toValue: opacityToValue,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();

        prevIsVisibleRef.current = isVisible;
      }
    }, [isVisible, measuredHeight, opacity, translateY]);

    const heightCtxValue = React.useMemo(
      () => ({ setHeight: setMeasuredHeight }),
      [],
    );

    return (
      <Animated.View
        pointerEvents={isVisible ? 'auto' : 'none'}
        style={[
          isVisible
            ? [
                t.borderDesignSystemDefault,
                t.borderT,
                { height: measuredHeight },
              ]
            : { height: 0 },
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <HeightCtx.Provider value={heightCtxValue}>
          <TokenMentionAutocompleteContent
            mentionText={mentionText}
            onAutocompleteMention={onAutocompleteMention}
          />
        </HeightCtx.Provider>
      </Animated.View>
    );
  },
);

TokenMentionAutocomplete.displayName = 'TokenMentionAutocomplete';

const TokenMentionAutocompleteContent: FC<TokenMentionAutocompleteProps> = ({
  mentionText,
  onAutocompleteMention,
}) => {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();
  const viewerFid = useCurrentUser_UNSAFE().fid;

  const { data, isLoading } = useNonSuspenseTokenLinks({
    ticker: mentionText || '',
    intent: 'typeahead',
    contextFid: viewerFid,
  });

  const tokens = React.useMemo(() => {
    return uniqBy(data?.tokens || [], ({ chain, ca }) => `${chain}:${ca}`);
  }, [data?.tokens]);

  const extraData = useCommonFlatListExtraData();

  const heightCtx = React.useContext(HeightCtx);

  const targetRows = Math.min(4, numVisibleRows);
  const targetHeight = targetRows * rowHeight;

  React.useEffect(() => {
    heightCtx?.setHeight(targetHeight);
  }, [targetHeight, heightCtx]);

  const renderItem = React.useCallback(
    ({ item }: { item: ApiTokenLink }) => {
      return (
        <TokenListItem
          token={item}
          onPress={() => {
            triggerImpactAsync();

            onAutocompleteMention({ token: item });
          }}
        />
      );
    },
    [onAutocompleteMention, triggerImpactAsync],
  );

  const keyExtractor = React.useCallback((item: ApiTokenLink) => {
    return `${item.chain}:${item.ca}`;
  }, []);

  if (tokens.length === 0 && isLoading) {
    return (
      <View style={[]}>
        <TokenListItemPlaceholder avatarSize={48} />
        <TokenListItemPlaceholder avatarSize={48} />
        <TokenListItemPlaceholder avatarSize={48} />
        <TokenListItemPlaceholder avatarSize={48} />
      </View>
    );
  }

  if (tokens.length === 0 && !isLoading) {
    return (
      <View style={[t.justifyCenter, t.itemsCenter, { height }]}>
        <Typography label="Body/Medium/Strong" color="tertiary">
          No tokens found for "{mentionText}"
        </Typography>
      </View>
    );
  }

  return (
    <FlashList
      data={tokens}
      extraData={extraData}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      {...STANDARD_FLASHLIST_PERF_PROPS}
      renderItem={renderItem}
    />
  );
};

TokenMentionAutocompleteContent.displayName = 'AutocompleteMentionContent';

const TokenMentionAutoCompleteWithSuspense: FC<
  TokenMentionAutocompleteProps
> = (props) => (
  <Suspense fallback={null}>
    <TokenMentionAutocomplete {...props} />
  </Suspense>
);

TokenMentionAutoCompleteWithSuspense.displayName =
  'TokenMentionAutoCompleteWithSuspense';

export {
  autocompleteHeightBlock,
  TokenMentionAutoCompleteWithSuspense as TokenMentionAutocomplete,
};
