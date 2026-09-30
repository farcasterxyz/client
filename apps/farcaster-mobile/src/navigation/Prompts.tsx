import React from 'react';

import { AboutChannelStreakPrompt } from '~/components/prompts/AboutChannelStreakPrompt';
import { BackupMnemonicPrompt } from '~/components/prompts/BackupMnemonicPrompt';
import { CastInfoPrompt } from '~/components/prompts/CastInfoPrompt';
import { ChannelStreaksPrompt } from '~/components/prompts/ChannelStreaksPrompt';
import { CreatorRewardPrompt } from '~/components/prompts/CreatorRewardPrompt';
import { DirectCastInvitePrompt } from '~/components/prompts/DirectCastInvitePrompt';
import { EnablePushNotificationsPrompt } from '~/components/prompts/EnablePushNotificationsPrompt';
import { InstallCoinbaseWalletPrompt } from '~/components/prompts/InstallCoinbaseWalletPrompt';
import { JoinChannelViaInviteCodePrompt } from '~/components/prompts/JoinChannelViaInviteCodePrompt';
import { JoinChannelViaInviteCodeRestrictedPrompt } from '~/components/prompts/JoinChannelViaInviteCodeRestrictedPrompt';
import { LocationChangePrompt } from '~/components/prompts/LocationChangePrompt';
import { QuoteCastPrompt } from '~/components/prompts/QuoteCastPrompt';
import { RelaunchWarpcastPrompt } from '~/components/prompts/RelaunchWarpcastPrompt';
import { RemoteSiwfRequestPrompt } from '~/components/prompts/RemoteSiwfRequestPrompt';
import { ShareCastPrompt } from '~/components/prompts/ShareCastPrompt';
import { ShowDirectCastMessageReactionsPrompt } from '~/components/prompts/ShowDirectCastMessageReactionsPrompt';
import { UserBoostInfoPrompt } from '~/components/prompts/UserBoostInfoPrompt';
import { UserProfileQRCodePrompt } from '~/components/prompts/UserProfileQRCodePrompt';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

const Prompts: React.FC = React.memo(() => {
  const isSignedIn = useIsSignedIn();

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <RelaunchWarpcastPrompt />
      <ShareCastPrompt />
      <QuoteCastPrompt />
      <InstallCoinbaseWalletPrompt />
      <ShowDirectCastMessageReactionsPrompt />
      <UserProfileQRCodePrompt />
      <CastInfoPrompt />
      <DirectCastInvitePrompt />
      <JoinChannelViaInviteCodePrompt />
      <JoinChannelViaInviteCodeRestrictedPrompt />
      <EnablePushNotificationsPrompt />
      <ChannelStreaksPrompt />
      <AboutChannelStreakPrompt />
      <UserBoostInfoPrompt />
      <CreatorRewardPrompt />
      <RemoteSiwfRequestPrompt />
      <LocationChangePrompt />
      <BackupMnemonicPrompt />
    </>
  );
});

Prompts.displayName = 'Prompts';

export { Prompts };
