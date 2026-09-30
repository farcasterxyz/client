import { DdRum } from '@datadog/mobile-react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { AnimatedPressable, AtomsButton, useCopyText } from 'farcaster-expo';
import chunk from 'lodash/chunk';
import React, { useEffect, useMemo } from 'react';
import { InteractionManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePop } from '~/hooks/navigation/usePop';

interface WordSplit {
  idx: string;
  word: string;
}

function Word({ split }: { split: WordSplit }) {
  const t = useTheme();
  return (
    <View style={[{ marginBottom: 10 }, t.flex, t.flexRow, { columnGap: 10 }]}>
      <Text2 color="secondary">{split.idx}</Text2>
      <Text2 color="primary">{split.word}</Text2>
    </View>
  );
}

export function YourRecoveryPhraseScreen() {
  const t = useTheme();
  const pop = usePop();
  const { account } = useWallet();
  const { bottom } = useSafeAreaInsets();
  const { copy, copied } = useCopyText({
    text: account?.mnemonic || '',
  });

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      DdRum.addViewLoadingTime(true);
    });
  }, []);

  const wordSplits: WordSplit[] | undefined = useMemo(() => {
    const mnemonic = account?.mnemonic;

    if (!mnemonic) {
      return;
    }
    const allWords = mnemonic.split(' ');
    return allWords.map((word, idx) => {
      const incrementalIdx = idx + 1;
      const idxChar =
        incrementalIdx >= 10 ? incrementalIdx.toString() : `0${incrementalIdx}`;
      return {
        word,
        idx: idxChar,
      };
    });
  }, [account]);

  const wordChunks: WordSplit[][] | undefined = useMemo(() => {
    if (!wordSplits) {
      return;
    }
    if (wordSplits.length === 24) {
      return chunk(wordSplits, 8);
    }
    if (wordSplits.length === 12) {
      return chunk(wordSplits, 6);
    }
    throw new Error('Invalid number of words');
  }, [wordSplits]);

  const wordSections: React.ReactNode[] | undefined = useMemo(() => {
    if (!wordChunks) {
      return;
    }
    return wordChunks.map((chunk, sectionIdx) => {
      const items = chunk.map((wordSplit, itemIdx) => {
        return <Word key={`${sectionIdx}-${itemIdx}`} split={wordSplit} />;
      });
      return (
        <View key={sectionIdx} style={[t.flex1]}>
          {items}
        </View>
      );
    });
  }, [wordChunks, t]);

  const { trackEvent } = useAnalytics();

  const copyWithAnalytics = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ExportFarcasterCustody, {});

    copy();
  }, [copy, trackEvent]);

  const copyToClipboard = useMemo(() => {
    if (!copied) {
      return (
        <AnimatedPressable
          onPress={copyWithAnalytics}
          style={[
            t.flex,
            t.flexRow,
            { columnGap: 6 },
            t.itemsCenter,
            t.justifyCenter,
          ]}
        >
          <Feather name="copy" size={16} color={t.colors.actionPrimary} />
          <Text2 color="brand">Copy to clipboard</Text2>
        </AnimatedPressable>
      );
    }
    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          { columnGap: 6 },
          t.itemsCenter,
          t.justifyCenter,
        ]}
      >
        <AntDesign name="check" size={16} color={t.colors.text.secondary} />
        <Text2 color="secondary">Copied!</Text2>
      </View>
    );
  }, [
    copied,
    copyWithAnalytics,
    t.colors.actionPrimary,
    t.colors.text.secondary,
    t.flex,
    t.flexRow,
    t.itemsCenter,
    t.justifyCenter,
  ]);

  return (
    <View style={[t.flex, t.flexCol, t.wFull, t.hFull]}>
      <View>
        <View style={[t.wFull, t.mB5, t.mT6]}>
          <Text2
            style={[t.textCenter, t.texts.primary, t.fontSemibold, t.textLg]}
          >
            Your Recovery Phrase
          </Text2>
        </View>
        <View style={[t.wFull]}>
          <View
            style={[
              t.roundedLg,
              t.p3,
              t.flex,
              t.flexRow,
              t.wFull,
              { backgroundColor: t.colors.red200 },
            ]}
          >
            <View
              style={[
                t.w8,
                t.h8,
                { backgroundColor: t.colors.red300 },
                t.roundedFull,
                t.justifyCenter,
                t.itemsCenter,
                t.mR3,
              ]}
            >
              <AntDesign
                name="exclamation-circle"
                size={16}
                style={[t.texts.danger]}
              />
            </View>
            <View style={[t.flex, t.flexCol, t.flex1]}>
              <Text2 color="danger" weight="semibold">
                Do not share your Recovery Phrase!
              </Text2>
              <Text2 color="danger">
                If someone has your Recovery Phrase they will have full control
                of your account.
              </Text2>
            </View>
          </View>
        </View>
        <View style={[t.p4, t.flex, t.flexRow, t.bgSwap, t.roundedLg, t.mT3]}>
          {wordSections ?? (
            <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pY4]}>
              <Text2 color="secondary" style={[t.textCenter]}>
                Recovery phrase not available on this device. Use &ldquo;Recover
                account via email&rdquo; to set up a new recovery phrase.
              </Text2>
            </View>
          )}
        </View>
        {wordSections && (
          <View
            style={[t.mY3, t.itemsCenter, t.justifyCenter, t.flex, t.flexRow]}
          >
            {copyToClipboard}
          </View>
        )}
      </View>
      <View style={[t.flex, t.flex1, t.justifyEnd, { marginBottom: bottom }]}>
        <AtomsButton hierarchy="primary" size="l" style={t.wFull} onPress={pop}>
          Done
        </AtomsButton>
      </View>
    </View>
  );
}
