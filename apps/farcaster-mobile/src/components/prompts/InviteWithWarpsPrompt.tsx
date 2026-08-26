import { useBottomSheet } from '@gorhom/bottom-sheet';
import {
  formatNumber,
  useInviteWithWarpsOfferingWithRefreshOnMount,
} from 'farcaster-client-hooks';
import React, { FC, memo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { Prompt } from '~/components/prompts/Prompt';
import { Text } from '~/components/Text';
import { Warp } from '~/components/Warp';
import { inviteWithWarpsPrompt } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type InviteWithWarpsPromptProps = {
  email: string;
  submitEmail: ({ isPaidInvite }: { isPaidInvite: boolean }) => void;
};

const InviteWithWarpsPrompt: FC<InviteWithWarpsPromptProps> = memo(
  ({ email, submitEmail }) => {
    const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();
    const shouldPresent = React.useCallback(
      () => activePromptKey === inviteWithWarpsPrompt,
      [activePromptKey],
    );
    return (
      <Prompt
        shouldPresent={shouldPresent}
        height={'50%'}
        storageKey={inviteWithWarpsPrompt}
        enableTouchThrough={false}
        onBackdropPress={hideGlobalPrompt}
        onCloseCallback={hideGlobalPrompt}
      >
        <InviteWithWarpsPromptContent email={email} submitEmail={submitEmail} />
      </Prompt>
    );
  },
);

type InviteWithWarpsPromptContentProps = {
  email: string;
  submitEmail: ({ isPaidInvite }: { isPaidInvite: boolean }) => void;
};

const InviteWithWarpsPromptContent: React.FC<
  InviteWithWarpsPromptContentProps
> = ({ email, submitEmail }) => {
  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const [unpaidInvitePending, setUnpaidInvitePending] = useState(false);
  const [paidInvitePending, setPaidInvitePending] = useState(false);
  const { data } = useInviteWithWarpsOfferingWithRefreshOnMount();

  return (
    <View style={[t.flex, t.flexCol, t.itemsCenter, t.pY4, t.hFull]}>
      <Text
        style={[t.text2xl, t.texts.primary, t.textLg, t.texts.secondary, t.mB6]}
      >
        Cover their onchain fees with your warps
      </Text>
      <View style={[t.flexCol, t.itemsCenter, t.w4_5, t.pB2]}>
        <View
          style={[t.flex, t.flexCol, t.justifyBetween, t.itemsCenter, t.wFull]}
        >
          <Text style={[t.textXl, t.texts.primary, t.pT2, t.pB8]}>{email}</Text>
          <View
            style={[
              t.flex,
              t.flexRow,
              t.justifyBetween,
              t.itemsCenter,
              t.rounded,
              t.border,
              t.borderDefault,
              t.p4,
              t.wFull,
            ]}
          >
            <Text
              style={[
                t.text2xl,
                t.fontNormal,
                t.texts.primary,
                t.textLg,
                t.texts.secondary,
                t.mL1,
              ]}
            >
              Cost
            </Text>
            <View style={[t.flex, t.flexRow, t.justifyEnd, t.itemsCenter]}>
              <Warp fill={t.colors.text.primary} />
              <Text
                style={[
                  t.text2xl,
                  t.texts.primary,
                  t.textLg,
                  t.fontNormal,
                  t.texts.secondary,
                  t.mL1,
                ]}
              >
                {data ? formatNumber(data.offering.amount) : 'unknown'} warps
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={[t.flex, t.flexRow, t.w4_5, t.justifyBetween]}>
        <View style={[t.w1_2, t.pR1]}>
          <Button
            title="Use warps"
            onPress={() => {
              setPaidInvitePending(true);
              submitEmail({ isPaidInvite: true });
              setPaidInvitePending(false);
              forceClose();
            }}
            size="sm"
            disabled={!data || !data.offering.canPurchaseUsingWarps}
            style={[t.h12]}
            loading={paidInvitePending}
            bordered={true}
          />
        </View>
        <View style={[t.w1_2, t.pL1]}>
          <Button
            title="Don't Use"
            onPress={() => {
              setUnpaidInvitePending(true);
              submitEmail({ isPaidInvite: false });
              setUnpaidInvitePending(false);
              forceClose();
            }}
            size="sm"
            style={[t.h12, t.border, t.borderMuted, t.borderHairline]}
            variant={'inverted'}
            bordered={true}
            loading={unpaidInvitePending}
            fullWidth={true}
          />
        </View>
      </View>
      <View
        style={[
          t.mT6,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.pB2,
        ]}
      >
        <Text style={[t.texts.tertiary, t.textBase]}>
          You have {formatNumber(data?.offering.warpsBalance ?? 0)} warps
        </Text>
      </View>
    </View>
  );
};

InviteWithWarpsPrompt.displayName = 'InviteWithWarpsPrompt';
export { InviteWithWarpsPrompt };
