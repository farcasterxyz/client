import { FlashList, ListRenderItem } from '@shopify/flash-list';
import {
  ApiVerificationProtocol,
  ApiWalletSendAddressTarget,
  ApiWalletSendTarget,
} from 'farcaster-client-data';
import {
  useSearchWalletSendTargets,
  useWalletSendSuggestionsQuery,
} from 'farcaster-client-hooks';
import { BookOpen, History } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { isAddress as isAddressViem } from 'viem';

import { useSharedTelemetry, useTheme } from '../../../../contexts';
import { useCurrentUser } from '../../../../hooks';
import { useOptionalSafeAreaInsets } from '../../../../hooks/useOptionalSafeAreaInsets';
import { SendTargetWithAddress } from '../../../../types';
import { isSolanaAddress } from '../../../../utils';
import { HeaderListItem } from '../../../design-system';
import { SendTokensTarget } from './SendTokensTarget';

type SectionHeaderType = 'verified' | 'recent';

export function SendTokensSelectTarget({
  selectTarget,
  query,
  protocol,
}: {
  selectTarget: (target: SendTargetWithAddress) => void;
  query: string;
  protocol: ApiVerificationProtocol;
}) {
  const t = useTheme();
  const user = useCurrentUser();
  const insets = useOptionalSafeAreaInsets();

  const { data: suggestionsData } = useWalletSendSuggestionsQuery({
    protocol,
  });

  const { trackError } = useSharedTelemetry();
  const wrappedSelectTarget = useCallback(
    (sendTarget: ApiWalletSendTarget) => {
      const { address } = sendTarget;

      if (address) {
        selectTarget({
          ...sendTarget,
          address,
        });
      } else {
        trackError(
          new Error(
            'WalletSendSelectTarget: target with no address was selected',
          ),
        );
      }
    },
    [selectTarget, trackError],
  );

  const renderSendTargetListItem = useCallback<
    ListRenderItem<ApiWalletSendTarget | SectionHeaderType>
  >(
    ({ item: sendTarget }) => {
      if (sendTarget === 'recent') {
        return (
          <HeaderListItem
            Icon={(props) => <History {...props} />}
            title="Recents"
          />
        );
      }

      if (sendTarget === 'verified') {
        return (
          <HeaderListItem
            Icon={(props) => <BookOpen {...props} />}
            title="My verified addresses"
          />
        );
      }

      return (
        <SendTokensTarget
          target={sendTarget}
          onPress={wrappedSelectTarget}
          style={[t.p3]}
        />
      );
    },
    [t.p3, wrappedSelectTarget],
  );

  const { flatData } = useSearchWalletSendTargets({
    params: {
      query,
      limit: 15,
      protocol,
    },
  });

  const data = useMemo(() => {
    if (isAddressViem(query)) {
      return [
        {
          type: 'address',
          address: query,
        } satisfies ApiWalletSendAddressTarget,
      ];
    } else if (isSolanaAddress(query)) {
      return [
        {
          type: 'address',
          address: query,
        } satisfies ApiWalletSendAddressTarget,
      ];
    }
    if (query.length === 0) {
      const suggestions: Array<ApiWalletSendTarget | SectionHeaderType> = [];

      if (user && suggestionsData?.verifiedAddresses.length) {
        suggestions.push('verified');
        suggestions.push(
          ...suggestionsData.verifiedAddresses.map((address) => ({
            type: 'user' as const,
            address: address.address,
            user,
          })),
        );
      }

      if (suggestionsData?.recents.length) {
        suggestions.push('recent');
        suggestions.push(...suggestionsData.recents);
      }

      return suggestions;
    }

    return flatData;
  }, [flatData, query, suggestionsData, user]);

  return (
    <FlashList
      data={data}
      renderItem={renderSendTargetListItem}
      keyboardShouldPersistTaps="handled"
      getItemType={(item) => {
        if (typeof item === 'string') {
          return 'header';
        }
        return item.type;
      }}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
    />
  );
}
