import { resolveUsername } from 'farcaster-client-hooks';
import React from 'react';
import { Platform } from 'react-native';

import { headerLeftAligned } from '~/components/HeaderLeftAligned';
import { SWIPE_EDGE_WIDTH } from '~/contexts/DrawerProvider';
import { CommonStackParamList } from '~/types';

import { DebugScreens } from './DebugScreens';

// FIXME: Why is this acting up on the typechecker so weirdly. We should figure it out.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CommonScreens = (Stack: any) => [
  <Stack.Screen
    key="OldExplore"
    name="OldExplore"
    getComponent={() => require('~/screens/Explore').OldExploreFallbackScreen}
    options={{ headerShown: false }}
  />,
  <Stack.Screen
    key="Article"
    name="Article"
    getComponent={() => require('~/screens/Article').ArticleScreen}
    options={{ headerShown: false }}
  />,
  <Stack.Screen
    key="News"
    name="News"
    getComponent={() => require('~/screens/News').NewsScreen}
    options={{ headerShown: false }}
  />,
  <Stack.Screen
    key="Advanced"
    name="Advanced"
    getComponent={() => require('~/screens/Advanced').AdvancedScreen}
    options={{ headerTitle: 'Advanced' }}
  />,
  <Stack.Screen
    key="BroadcastingChangeRecoveryAddress"
    name="BroadcastingChangeRecoveryAddress"
    getComponent={() =>
      require('~/screens/BroadcastingChangeRecoveryAddress')
        .BroadcastingChangeRecoveryAddressScreen
    }
    options={{ headerShown: false }}
  />,
  <Stack.Screen
    key="Cast"
    name="Cast"
    getComponent={() => require('~/screens/Cast').CastScreen}
    options={{
      headerTitle: 'Conversation',
      gestureEnabled: true,
      fullScreenGestureEnabled: false,
      gestureResponseDistance: SWIPE_EDGE_WIDTH,
    }}
  />,
  <Stack.Screen
    key="PlaintextDirectCastsConversation"
    name="PlaintextDirectCastsConversation"
    getComponent={() =>
      require('~/screens/PlaintextDirectCastsConversation/PlaintextDirectCastsConversationScreen')
        .PlaintextDirectCastsConversationScreen
    }
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="CastReactionUsers"
    name="CastReactionUsers"
    getComponent={() =>
      require('~/screens/CastReactionUsers').CastReactionUsersScreen
    }
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['CastReactionUsers'] };
    }) => {
      return {
        headerTitle: params.headerTitle,
      };
    }}
  />,
  <Stack.Screen
    key="CastWatchUsers"
    name="CastWatchUsers"
    getComponent={() =>
      require('~/screens/CastWatchUsers').CastWatchUsersScreen
    }
    options={{ headerTitle: 'Bookmarks' }}
  />,
  <Stack.Screen
    key="CastRecastUsers"
    name="CastRecastUsers"
    getComponent={() =>
      require('~/screens/CastRecastUsers').CastRecastUsersScreen
    }
    options={{ headerTitle: 'Recasted by' }}
  />,
  <Stack.Screen
    key="CastQuotes"
    name="CastQuotes"
    getComponent={() => require('~/screens/CastQuotes').CastQuotesScreen}
    options={{ headerTitle: 'Quotes' }}
  />,
  <Stack.Screen
    key="ConnectAddress"
    name="ConnectAddress"
    getComponent={() =>
      require('~/screens/ConnectAddress').ConnectAddressScreen
    }
    options={{ headerTitle: 'Verify an address' }}
  />,
  <Stack.Screen
    key="ConnectedAccounts"
    name="ConnectedAccounts"
    getComponent={() =>
      require('~/screens/ConnectedAccounts').ConnectedAccountsScreen
    }
    options={{ headerTitle: 'X account' }}
  />,
  <Stack.Screen
    key="ConnectedAddresses"
    name="ConnectedAddresses"
    getComponent={() =>
      require('~/screens/ConnectedAddresses').ConnectedAddressesScreen
    }
    options={{ headerTitle: 'Verified addresses' }}
  />,
  <Stack.Screen
    key="DataUsage"
    name="DataUsage"
    getComponent={() => require('~/screens/DataUsage').DataUsageScreen}
    options={{ headerTitle: 'Data usage' }}
  />,
  <Stack.Screen
    key="PreferredWallet"
    name="PreferredWallet"
    getComponent={() =>
      require('~/screens/PreferredWallet').PreferredWalletScreen
    }
    options={{ headerTitle: 'Preferred mobile wallet' }}
  />,
  <Stack.Screen
    key="EditBio"
    name="EditBio"
    getComponent={() => require('~/screens/EditBio').EditBioScreen}
    options={{ headerTitle: 'Edit bio' }}
  />,
  <Stack.Screen
    key="EditDisplayName"
    name="EditDisplayName"
    getComponent={() =>
      require('~/screens/EditDisplayName').EditDisplayNameScreen
    }
    options={{ headerTitle: 'Edit display name' }}
  />,
  <Stack.Screen
    key="EditUsername"
    name="EditUsername"
    component={require('~/screens/EditUsername').EditUsernameScreen}
    options={{ headerTitle: 'Change username' }}
  />,
  <Stack.Screen
    key="AddENSUsername"
    name="AddENSUsername"
    component={require('~/screens/EditUsername').AddENSUsernameScreen}
    options={{ headerTitle: 'Add ENS' }}
  />,
  <Stack.Screen
    key="EditEmail"
    name="EditEmail"
    getComponent={() => require('~/screens/EditEmail').EditEmailScreen}
    options={{ headerTitle: 'Edit email address' }}
  />,
  <Stack.Screen
    key="ListRecoveryOptions"
    name="ListRecoveryOptions"
    getComponent={() =>
      require('~/screens/Advanced/ListRecoveryOptionsScreen')
        .ListRecoveryOptionsScreen
    }
    options={{ headerTitle: 'Recovery options' }}
  />,
  <Stack.Screen
    key="RecoverFarcasterAccount"
    name="RecoverFarcasterAccount"
    getComponent={() =>
      require('~/screens/ExportRecovery').RecoverFarcasterAccountScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="RecoverWalletAccount"
    name="RecoverWalletAccount"
    getComponent={() =>
      require('~/screens/ExportRecovery').RecoverWalletAccountScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="EditProfile"
    name="EditProfile"
    component={require('~/screens/EditProfile').EditProfileScreen}
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="EditProfileToken"
    name="EditProfileToken"
    component={require('~/screens/EditProfileToken').EditProfileTokenScreen}
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="EditLocation"
    name="EditLocation"
    getComponent={() => require('~/screens/EditLocation').EditLocationScreen}
    options={{ headerTitle: 'Location' }}
  />,
  <Stack.Screen
    key="EditRecoveryAddress"
    name="EditRecoveryAddress"
    getComponent={() =>
      require('~/screens/EditRecoveryAddress').EditRecoveryAddressScreen
    }
    options={{ headerTitle: 'Recovery Address' }}
  />,
  <Stack.Screen
    key="Follows"
    name="Follows"
    getComponent={() => require('~/screens/Follows').FollowsScreen}
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['Follows'] };
    }) => {
      return {
        headerTitle: params.displayName || 'Follows',
        gestureEnabled: true,
        fullScreenGestureEnabled: false,
        gestureResponseDistance: SWIPE_EDGE_WIDTH,
      };
    }}
  />,
  <Stack.Screen
    key="LeastInteractedWithFollowing"
    name="LeastInteractedWithFollowing"
    getComponent={() =>
      require('~/screens/Follows').LeastInteractedWithFollowingScreen
    }
    options={{ headerTitle: 'Least Interacted With' }}
  />,
  <Stack.Screen
    key="LocationUsers"
    name="LocationUsers"
    getComponent={() => require('~/screens/LocationUsers').LocationUsersScreen}
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['LocationUsers'] };
    }) => {
      return {
        headerTitle: params.description,
      };
    }}
  />,
  <Stack.Screen
    key="MyDevices"
    name="MyDevices"
    component={require('~/screens/MyDevices').MyDevicesScreen}
    options={{
      headerTitle: 'My devices',
    }}
  />,
  <Stack.Screen
    key="ContactsUsers"
    name="ContactsUsers"
    component={require('~/screens/ContactsUsers').ContactsUsersScreen}
    options={{
      headerTitle: 'Contacts',
    }}
  />,
  <Stack.Screen
    key="MyDevicesAddADesktopDevice"
    name="MyDevicesAddADesktopDevice"
    component={
      require('~/screens/MyDevicesAddADesktopDevice')
        .MyDevicesAddADesktopDeviceScreen
    }
    options={{
      headerTitle: 'My Devices',
    }}
  />,
  <Stack.Screen
    key="MyDevicesAddAMobileDevice"
    name="MyDevicesAddAMobileDevice"
    component={
      require('~/screens/MyDevicesAddAMobileDevice')
        .MyDevicesAddAMobileDeviceScreen
    }
    options={{
      headerTitle: 'My Devices',
    }}
  />,
  <Stack.Screen
    key="DirectCastSettings"
    name="DirectCastSettings"
    getComponent={() =>
      require('~/screens/DirectCastSettings').DirectCastSettingsScreen
    }
    options={{ headerTitle: 'Direct Casts settings' }}
  />,
  <Stack.Screen
    key="DirectCastSettingsRecommended"
    name="DirectCastSettingsRecommended"
    getComponent={() =>
      require('~/screens/DirectCastSettings')
        .DirectCastSettingsRecommendedScreen
    }
    options={{ headerTitle: 'Suggested users' }}
  />,
  <Stack.Screen
    key="DirectCastSettingsOthers"
    name="DirectCastSettingsOthers"
    getComponent={() =>
      require('~/screens/DirectCastSettings').DirectCastSettingsOthersScreen
    }
    options={{ headerTitle: 'Other users' }}
  />,
  <Stack.Screen
    key="NotificationSettings"
    name="NotificationSettings"
    getComponent={() =>
      require('~/screens/NotificationSettings').NotificationSettingsScreen
    }
    options={{ headerTitle: 'Notifications settings' }}
  />,
  <Stack.Screen
    key="PasskeysBackupExistingUser"
    name="PasskeysBackupExistingUser"
    getComponent={() =>
      require('~/screens/PasskeysBackupExistingUser')
        .PasskeysBackupExistingUserScreen
    }
    options={{
      headerTitle: Platform.OS === 'ios' ? 'iCloud Backup' : 'Passkey Backup',
    }}
  />,
  <Stack.Screen
    key="OnboardingSignInAnotherDevice"
    // This specific one is kinda odd screen as it seems like we need it in both common and unauthed stack
    // so typedefs throwing is pointless here. We rather keep rest fo the stack naming types to work instead
    // of falling back to `any` above.

    // @ts-ignore-next-line
    name="OnboardingSignInAnotherDevice"
    component={
      require('~/screens/OnboardingSignInAnotherDevice')
        .OnboardingSignInAnotherDeviceScreen
    }
    options={{
      headerTitle: 'Log in on another device',
    }}
  />,
  <Stack.Screen
    key="WalletSignInAnotherDevice"
    name="WalletSignInAnotherDevice"
    component={
      require('~/screens/WalletSignInAnotherDevice')
        .WalletSignInAnotherDeviceScreen
    }
    options={{
      headerTitle: 'Connect wallet',
    }}
  />,
  <Stack.Screen
    key="SignedKeyRequest"
    name="SignedKeyRequest"
    component={require('~/screens/SignedKeyRequest').SignedKeyRequestScreen}
    options={{
      headerTitle: 'Connect App',
    }}
  />,
  // Actions/Discover/AddCastAction removed
  <Stack.Screen
    key="Settings"
    name="Settings"
    getComponent={() => require('~/screens/Settings').SettingsScreen}
    options={{ headerTitle: 'Settings' }}
  />,
  <Stack.Screen
    key="Sessions"
    name="Sessions"
    getComponent={() => require('~/screens/Sessions').SessionsScreen}
    options={{ headerTitle: 'Sessions' }}
  />,
  <Stack.Screen
    key="Feeds"
    name="Feeds"
    getComponent={() => require('~/screens/Feeds').FeedsScreen}
    options={{ headerTitle: 'Feeds' }}
  />,
  <Stack.Screen
    key="ConnectedApps"
    name="ConnectedApps"
    component={require('~/screens/ConnectedApps').ConnectedAppsScreen}
    options={{
      headerTitle: 'Connected Apps',
    }}
  />,
  <Stack.Screen
    key="ConnectedApp"
    name="ConnectedApp"
    component={require('~/screens/ConnectedApp').ConnectedAppScreen}
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['ConnectedApp'] };
    }) => ({
      headerTitle: params.appName ?? 'Connected Appoo',
    })}
  />,
  <Stack.Screen
    key="ConnectedAppRevokeWrite"
    name="ConnectedAppRevokeWrite"
    component={
      require('~/screens/ConnectedAppRevokeWrite').ConnectedAppRevokeWriteScreen
    }
    options={{
      headerTitle: 'Revoke access',
      presentation: 'modal',
    }}
  />,
  <Stack.Screen
    key="ConnectedAppRevokeAuth"
    name="ConnectedAppRevokeAuth"
    component={
      require('~/screens/ConnectedAppRevokeAuth').ConnectedAppRevokeAuthScreen
    }
    options={{
      headerTitle: 'Revoke access',
      presentation: 'modal',
    }}
  />,
  <Stack.Screen
    key="AdvancedSigners"
    name="AdvancedSigners"
    component={require('~/screens/AdvancedSigners').AdvancedSignersScreen}
    options={{
      headerTitle: 'Advanced Signers',
    }}
  />,
  <Stack.Screen
    key="Storage"
    name="Storage"
    getComponent={() => require('~/screens/Storage').StorageScreen}
    options={{ headerTitle: 'Storage' }}
  />,
  <Stack.Screen
    key="BuyStorage"
    name="BuyStorage"
    getComponent={() => require('~/screens/Storage').BuyStorageScreen}
    options={{ headerTitle: 'Buy storage' }}
  />,
  <Stack.Screen
    key="StorageTransaction"
    name="StorageTransaction"
    getComponent={() => require('~/screens/Storage').StorageTransactionScreen}
    options={{ headerTitle: 'Purchase storage' }}
  />,
  <Stack.Screen
    key="UserV2"
    name="UserV2"
    getComponent={() => require('~/screens/UserV2').UserScreen}
    options={{
      headerShown: false,
      fullScreenGestureEnabled: false,
    }}
  />,
  <Stack.Screen
    key="DeeplinkOnlyUserV2"
    name="DeeplinkOnlyUserV2"
    getComponent={() => require('~/screens/UserV2').DeeplinkedUserScreen}
    options={{
      headerShown: false,
      fullScreenGestureEnabled: false,
    }}
  />,
  <Stack.Screen
    key="UserProfileNotificationsSettings"
    name="UserProfileNotificationsSettings"
    getComponent={() =>
      require('~/screens/UserV2/UserProfileNotificationsSettings')
        .UserProfileNotificationsSettingsScreen
    }
    options={{ headerShown: false, presentation: 'modal' }}
  />,
  <Stack.Screen
    key="Channel"
    name="Channel"
    getComponent={() =>
      require('~/screens/Channel/ChannelScreen').ChannelScreen
    }
    options={{ headerShown: false }}
  />,
  <Stack.Screen
    key="ChannelUsers"
    name="ChannelUsers"
    getComponent={() =>
      require('~/screens/ChannelUsers/ChannelUsersScreen').ChannelUsersScreen
    }
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['ChannelUsers'] };
    }) => {
      return {
        headerTitle: `/${params.channelKey}`,
      };
    }}
  />,
  <Stack.Screen
    key="ChannelManage"
    name="ChannelManage"
    getComponent={() =>
      require('~/screens/ChannelManage/ChannelManageScreen').ChannelManageScreen
    }
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['ChannelUsers'] };
    }) => {
      return {
        headerTitle: `Manage /${params.channelKey}`,
      };
    }}
  />,
  <Stack.Screen
    key="ChannelManageDetails"
    name="ChannelManageDetails"
    getComponent={() =>
      require('~/screens/ChannelManage/ChannelManageDetailsScreen')
        .ChannelManageDetailsScreen
    }
    options={{
      headerTitle: 'Edit details',
      headerTitleAlign: 'center',
    }}
  />,
  <Stack.Screen
    key="ChannelManageInvites"
    name="ChannelManageInvites"
    getComponent={() =>
      require('~/screens/ChannelManage/ChannelManageInvitesScreen')
        .ChannelManageInvitesScreen
    }
    options={{
      headerTitle: 'Add member',
      headerTitleAlign: 'center',
    }}
  />,
  <Stack.Screen
    key="ChannelManageInviteLink"
    name="ChannelManageInviteLink"
    getComponent={() =>
      require('~/screens/ChannelManage/ChannelManageInviteLinkScreen')
        .ChannelManageInviteLinkScreen
    }
    options={{
      headerTitle: 'Invite Link',
      headerTitleAlign: 'center',
    }}
  />,
  <Stack.Screen
    key="ChannelManageWhoCanCast"
    name="ChannelManageWhoCanCast"
    getComponent={() =>
      require('~/screens/ChannelManage/ChannelManageWhoCanCastScreen')
        .ChannelManageWhoCanCastScreen
    }
    options={{
      headerTitle: 'Who can cast',
      headerTitleAlign: 'center',
    }}
  />,
  <Stack.Screen
    key="ChannelManageMembers"
    name="ChannelManageMembers"
    getComponent={() =>
      require('~/screens/ChannelManage/ChannelManageMembersScreen')
        .ChannelManageMembersScreen
    }
    options={{
      headerTitle: 'Members',
      headerTitleAlign: 'center',
    }}
  />,
  <Stack.Screen
    key="ChannelManageBannedUsers"
    name="ChannelManageBannedUsers"
    getComponent={() =>
      require('~/screens/ChannelManage/ChannelManageBannedUsersScreen')
        .ChannelManageBannedUsersScreen
    }
    options={{
      headerTitle: 'Banned from channel',
      headerTitleAlign: 'center',
    }}
  />,
  <Stack.Screen
    key="RedeemWarpsForUSDC"
    name="RedeemWarpsForUSDC"
    getComponent={() =>
      require('~/screens/Warps/RedeemWarpsForUSDCScreen')
        .RedeemWarpsForUSDCScreen
    }
    options={{ headerTitle: 'Convert to USDC' }}
  />,
  <Stack.Screen
    key="CreateChannel"
    name="CreateChannel"
    getComponent={() =>
      require('~/screens/ManageOwnedChannels').CreateChannelScreen
    }
    options={{ headerTitle: 'Create a channel' }}
  />,
  <Stack.Screen
    key="ManageChannels"
    name="ManageChannels"
    getComponent={() =>
      require('~/screens/ManageOwnedChannels').ManageChannelsScreen
    }
    options={{ headerTitle: 'Manage channels' }}
  />,
  <Stack.Screen
    key="EditChannel"
    name="EditChannel"
    getComponent={() =>
      require('~/screens/ManageOwnedChannels').EditChannelScreen
    }
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['EditChannel'] };
    }) => {
      return {
        headerTitle: `Edit /${params.channelKey}`,
      };
    }}
  />,
  <Stack.Screen
    key="EditChannelName"
    name="EditChannelName"
    getComponent={() =>
      require('~/screens/ManageOwnedChannels').EditChannelNameScreen
    }
    options={{
      headerTitle: 'Display name',
    }}
  />,
  <Stack.Screen
    key="EditChannelDescription"
    name="EditChannelDescription"
    getComponent={() =>
      require('~/screens/ManageOwnedChannels').EditChannelDescriptionScreen
    }
    options={{
      headerTitle: 'Description',
    }}
  />,
  <Stack.Screen
    key="ReferralsJoin"
    name="ReferralsJoin"
    getComponent={() => require('~/screens/Referrals').ReferralsJoinScreen}
    options={{
      presentation: 'containedTransparentModal',
      headerShown: false,
      animation: 'slide_from_bottom',
    }}
  />,
  <Stack.Screen
    key="VanityReferralsJoin"
    name="VanityReferralsJoin"
    getComponent={() =>
      require('~/screens/Referrals').VanityReferralsJoinScreen
    }
    options={{
      presentation: 'containedTransparentModal',
      headerShown: false,
      animation: 'slide_from_bottom',
    }}
  />,
  <Stack.Screen
    key="ReferralsOverview"
    name="ReferralsOverview"
    getComponent={() => require('~/screens/Referrals').ReferralsOverviewScreen}
    options={{ headerTitle: 'Referrals', headerShown: true }}
  />,
  <Stack.Screen
    key="ReferralsIntro"
    name="ReferralsIntro"
    getComponent={() => require('~/screens/Referrals').ReferralsIntroScreen}
    options={{
      headerShown: false,
      presentation: 'modal',
      animation: 'slide_from_bottom',
      gestureEnabled: true,
      gestureDirection: 'vertical',
    }}
  />,
  <Stack.Screen
    key="DepositBonusesIntro"
    name="DepositBonusesIntro"
    getComponent={() =>
      require('~/screens/DepositBonuses').DepositBonusesIntroScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      animation: 'slide_from_bottom',
      gestureEnabled: true,
      gestureDirection: 'vertical',
    }}
  />,
  <Stack.Screen
    key="ReferralsList"
    name="ReferralsList"
    getComponent={() => require('~/screens/Referrals').ReferralsListScreen}
    options={{ headerTitle: 'Users you referred', headerShown: true }}
  />,
  <Stack.Screen
    key="UserQuality"
    name="UserQuality"
    getComponent={() => require('~/screens/UserQuality').UserQualityScreen}
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['UserQuality'] };
    }) => {
      return {
        headerTitle: `${resolveUsername({
          username: params.user.username,
          fid: params.user.fid,
        })} quality`,
      };
    }}
  />,
  <Stack.Screen
    key="UserNeynarScoreOverride"
    name="UserNeynarScoreOverride"
    getComponent={() =>
      require('~/screens/UserNeynarScoreOverride').UserNeynarScoreOverrideScreen
    }
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['UserNeynarScoreOverride'] };
    }) => {
      return {
        headerTitle: `${resolveUsername({
          username: params.user.username,
          fid: params.user.fid,
        })} Neynar score`,
      };
    }}
  />,
  <Stack.Screen
    key="SignInWithFarcaster"
    name="SignInWithFarcaster"
    getComponent={() =>
      require('~/screens/SignInWithFarcaster').SignInWithFarcasterScreen
    }
    options={{ headerTitle: 'Sign in with Farcaster' }}
  />,
  <Stack.Screen
    key="Bookmarks"
    name="Bookmarks"
    getComponent={() => require('~/screens/Bookmarks').BookmarksScreen}
    options={{ headerTitle: 'Bookmarks' }}
  />,
  <Stack.Screen
    key="CastsAndUsersSettings"
    name="CastsAndUsersSettings"
    getComponent={() =>
      require('~/screens/CastsAndUsersSettings').CastsAndUsersSettingsScreen
    }
    options={{ headerTitle: 'Casts & Users' }}
  />,
  <Stack.Screen
    key="MutedKeyword"
    name="MutedKeyword"
    getComponent={() => require('~/screens/MutedKeywords').MutedKeywordScreen}
    options={{
      headerTitle: 'Muted word',
      presentation: 'modal',
      gestureEnabled: true,
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="MutedKeywords"
    name="MutedKeywords"
    getComponent={() => require('~/screens/MutedKeywords').MutedKeywordsScreen}
    options={{ headerTitle: 'Muted words' }}
  />,
  <Stack.Screen
    key="BlockedUsers"
    name="BlockedUsers"
    getComponent={() => require('~/screens/MutesAndBlocks').BlockedUsersScreen}
    options={{ headerTitle: 'Blocked users' }}
  />,
  <Stack.Screen
    key="MutedUsers"
    name="MutedUsers"
    getComponent={() => require('~/screens/MutesAndBlocks').MutedUsersScreen}
    options={{ headerTitle: 'Muted users' }}
  />,
  <Stack.Screen
    key="MutesAndBlocks"
    name="MutesAndBlocks"
    getComponent={() =>
      require('~/screens/MutesAndBlocks').MutesAndBlocksScreen
    }
    options={{ headerTitle: 'Mute and block' }}
  />,
  <Stack.Screen
    key="ProfilesFromX"
    name="ProfilesFromX"
    getComponent={() => require('~/screens/ProfilesFromX').ProfilesFromXScreen}
    options={{ headerTitle: '' }}
  />,
  <Stack.Screen
    key="CreateStarterPack"
    name="CreateStarterPack"
    getComponent={() =>
      require('~/screens/StarterPacks').CreateStarterPackScreen
    }
    options={{
      headerTitle: '',
      header: headerLeftAligned({
        hideCancel: true,
        options: {
          headerTitle: 'Create a new starter pack',
          headerBackVisible: true,
        },
      }),
    }}
  />,
  <Stack.Screen
    key="StarterPacks"
    name="StarterPacks"
    getComponent={() => require('~/screens/StarterPacks').StarterPacksScreen}
    options={{ headerTitle: 'Starter Packs' }}
  />,
  <Stack.Screen
    key="SuggestedStarterPacks"
    name="SuggestedStarterPacks"
    getComponent={() =>
      require('~/screens/StarterPacks').SuggestedStarterPacksScreen
    }
    options={{ headerTitle: 'Starter Packs' }}
  />,
  <Stack.Screen
    key="StarterPack"
    name="StarterPack"
    getComponent={() => require('~/screens/StarterPacks').StarterPackScreen}
    options={{
      headerTitle: '',
    }}
  />,
  <Stack.Screen
    key="TokenSearch"
    name="TokenSearch"
    getComponent={() => require('~/screens/Tokens').TokenSearchScreen}
    options={{
      headerTitle: '',
    }}
  />,
  <Stack.Screen
    key="Token"
    name="Token"
    getComponent={() => require('~/screens/Tokens').TokenScreen}
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="TokenCA"
    name="TokenCA"
    getComponent={() => require('~/screens/Tokens').TokenCAScreen}
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="TokenReportsSummary"
    name="TokenReportsSummary"
    getComponent={() => require('~/screens/Tokens').TokenReportsSummaryScreen}
    options={{
      headerTitle: 'Token Reports',
    }}
  />,
  <Stack.Screen
    key="AllReportedTokens"
    name="AllReportedTokens"
    getComponent={() => require('~/screens/Tokens').AllReportedTokensScreen}
    options={{
      headerTitle: 'Reported Tokens',
    }}
  />,
  <Stack.Screen
    key="TokenActivity"
    name="TokenActivity"
    getComponent={() => require('~/screens/Tokens').TokenActivityScreen}
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="TrendingTokens"
    name="TrendingTokens"
    getComponent={() => require('~/screens/Tokens').TrendingTokensScreen}
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="RecentTrades"
    name="RecentTrades"
    getComponent={() => require('~/screens/Tokens').RecentTradesScreen}
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="TokenNews"
    name="TokenNews"
    getComponent={() => require('~/screens/Tokens').TokenNewsScreen}
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['TokenNews'] };
    }) => {
      return {
        headerTitle: `Top $${params.symbol} news`,
      };
    }}
  />,
  <Stack.Screen
    key="TokenNewsCasts"
    name="TokenNewsCasts"
    getComponent={() => require('~/screens/Tokens').TokenNewsCastsScreen}
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['TokenNewsCasts'] };
    }) => {
      return {
        headerTitle: `$${params.symbol} feed`,
      };
    }}
  />,
  <Stack.Screen
    key="ExploreScreen"
    name="ExploreScreen"
    getComponent={() => require('~/screens/Explore').ExploreScreen}
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="Collectible"
    name="Collectible"
    getComponent={() => require('~/screens/Collectible').CollectibleScreen}
    options={{
      headerTitle: '',
    }}
  />,
  <Stack.Screen
    key="CollectibleCast"
    name="CollectibleCast"
    component={
      require('~/navigation/CollectibleCastStack').CollectibleCastStack
    }
    options={{
      presentation: 'transparentModal',
      animation: 'slide_from_bottom',
      gestureEnabled: true,
      gestureDirection: 'vertical',
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="CollectibleCastIntro"
    name="CollectibleCastIntro"
    component={
      require('~/screens/CollectibleCast/CollectibleCastIntroScreen')
        .CollectibleCastIntroScreen
    }
    options={{
      presentation: 'fullScreenModal',
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="CoinbaseCommerceCallback"
    name="CoinbaseCommerceCallback"
    getComponent={() =>
      require('~/screens/CoinbaseCommerceCallback')
        .CoinbaseCommerceCallbackScreen
    }
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="ExploreCollectibleCastsScreen"
    name="ExploreCollectibleCastsScreen"
    getComponent={() =>
      require('~/screens/ExploreCollectibleCastsScreen')
        .ExploreCollectibleCastsScreen
    }
    options={{
      headerTitle: 'Collectibles',
    }}
  />,
  <Stack.Screen
    key="ContractAddressTransition"
    name="ContractAddressTransition"
    getComponent={() =>
      require('~/screens/Tokens').ContractAddressTransitionScreen
    }
    options={{
      headerTitle: '',
    }}
  />,
  <Stack.Screen
    key="NotFound"
    name="NotFound"
    component={require('~/screens/NotFound').NotFoundScreen}
    options={{
      headerTitle: '',
    }}
  />,
  <Stack.Screen
    key="DevTools"
    name="DevTools"
    component={require('~/screens/DevTools').DevToolsScreen}
    options={{
      headerTitle: 'Developer Tools',
    }}
  />,
  <Stack.Screen
    key="DevToolsDomains"
    name="DevToolsDomains"
    component={
      require('~/screens/DevTools/DevToolsDomains').DevToolsDomainsScreen
    }
    options={{
      headerTitle: 'Domains',
    }}
  />,
  <Stack.Screen
    key="DevToolsRegister"
    name="DevToolsRegister"
    component={
      require('~/screens/DevTools/DevToolsRegister').DevToolsRegisterScreen
    }
    options={{
      headerTitle: 'Account Association',
    }}
  />,
  <Stack.Screen
    key="DevToolsPreviewMiniAppUrl"
    name="DevToolsPreviewMiniAppUrl"
    getComponent={() =>
      require('~/screens/DevTools/DevToolsPreviewMiniAppUrlScreen')
        .DevToolsPreviewMiniAppUrlScreen
    }
    options={{ headerTitle: 'Preview App Embed' }}
  />,
  <Stack.Screen
    key="DevToolsSnapEmulator"
    name="DevToolsSnapEmulator"
    getComponent={() =>
      require('~/screens/DevTools/DevToolsSnapEmulatorScreen')
        .DevToolsSnapEmulatorScreen
    }
    options={{ headerTitle: 'Snap Emulator' }}
  />,
  <Stack.Screen
    key="InAppBrowser"
    name="InAppBrowser"
    getComponent={() =>
      require('~/screens/InAppBrowser/InAppBrowserScreen').InAppBrowserScreen
    }
    options={{ headerShown: false }}
  />,
  <Stack.Screen
    name="WalletSend"
    key="WalletSend"
    component={
      require('~/screens/WalletSend/WalletSendScreen').WalletSendScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletReceive"
    name="WalletReceive"
    component={require('~/navigation/WalletReceiveStack').WalletReceiveStack}
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletReceiveOnChain"
    name="WalletReceiveOnChain"
    component={
      require('~/screens/WalletReceive/WalletReceiveOnChainScreen')
        .WalletReceiveOnChainScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletOnRamp"
    name="WalletOnRamp"
    component={
      require('~/screens/WalletOnRamp/WalletOnRampScreen').WalletOnRampScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletSwap"
    name="WalletSwap"
    component={require('~/navigation/WalletSwapStack').WalletSwapStack}
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletLimitOrder"
    name="WalletLimitOrder"
    component={
      require('~/navigation/WalletLimitOrderStack').WalletLimitOrderStack
    }
    options={{
      headerShown: false,
      presentation: 'transparentModal',
      animation: 'slide_from_bottom',
      gestureEnabled: false,
      contentStyle: { backgroundColor: 'transparent' },
    }}
  />,
  <Stack.Screen
    key="WalletLimitOrderFills"
    name="WalletLimitOrderFills"
    component={
      require('~/screens/WalletLimitOrder/WalletLimitOrderFillsScreen')
        .WalletLimitOrderFillsScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    name="WalletActivity"
    key="WalletActivity"
    component={
      require('~/screens/WalletActivity/WalletActivityScreen')
        .WalletActivityScreen
    }
    options={{
      headerShown: false,
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    name="WalletCash"
    key="WalletCash"
    component={
      require('~/screens/WalletCash/WalletCashScreen').WalletCashScreen
    }
    options={{
      headerShown: false,
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    name="WalletExplore"
    key="WalletExplore"
    component={
      require('~/screens/WalletExplore/WalletExploreScreen').WalletExploreScreen
    }
    options={{
      headerShown: false,
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletAlertsIntro"
    name="WalletAlertsIntro"
    component={
      require('~/screens/WalletAlerts/WalletAlertsIntroScreen')
        .WalletAlertsIntroScreen
    }
    options={{
      headerShown: false,
      presentation: 'modal',
      gestureDirection: 'vertical',
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletAlertsSettings"
    name="WalletAlertsSettings"
    component={
      require('~/screens/WalletAlerts/WalletAlertsSettingsScreen')
        .WalletAlertsSettingsScreen
    }
    options={{
      headerShown: false,
      animationDuration: 150,
    }}
  />,
  <Stack.Screen
    key="WalletAlertsToken"
    name="WalletAlertsToken"
    getComponent={() =>
      require('~/screens/WalletAlerts/WalletAlertsTokenScreen')
        .WalletAlertsTokenScreen
    }
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="WalletSettings"
    name="WalletSettings"
    getComponent={() =>
      require('~/screens/WalletSettings/WalletSettingsScreen')
        .WalletSettingsScreen
    }
    options={{
      headerShown: false,
    }}
  />,
  <Stack.Screen
    key="CollectibleCastsSettings"
    name="CollectibleCastsSettings"
    getComponent={() =>
      require('~/screens/Settings/CollectibleCastsSettingsScreen')
        .CollectibleCastsSettingsScreen
    }
    options={{ headerTitle: 'Collectibles' }}
  />,
  <Stack.Screen
    key="TradeIdeasSettings"
    name="TradeIdeasSettings"
    getComponent={() =>
      require('~/screens/Settings/TradeIdeasSettingsScreen')
        .TradeIdeasSettingsScreen
    }
    options={{ headerTitle: 'Trade Ideas' }}
  />,
  <Stack.Screen
    key="TrendingTopic"
    name="TrendingTopic"
    getComponent={() =>
      require('~/screens/TrendingTopic/TrendingTopicScreen').TrendingTopicScreen
    }
    options={({
      route: { params },
    }: {
      route: { params: CommonStackParamList['TrendingTopic'] };
    }) => {
      return {
        headerTitle: params.displayName,
      };
    }}
  />,
  <Stack.Screen
    key="NuxRecommendedFollows"
    name="NuxRecommendedFollows"
    getComponent={() =>
      require('~/screens/NuxRecommendedFollows').NuxRecommendedFollowsScreen
    }
    options={{
      headerTitle: '',
    }}
  />,
  <Stack.Screen
    key="SpaceRoom"
    name="SpaceRoom"
    getComponent={() =>
      require('~/screens/Spaces/SpaceRoomScreen').SpaceRoomScreen
    }
    options={{ headerShown: false }}
  />,
  <Stack.Screen
    key="Spaces"
    name="Spaces"
    getComponent={() => require('~/screens/Spaces/SpacesScreen').SpacesScreen}
    options={{ headerTitle: 'Spaces' }}
  />,
  <Stack.Screen
    key="AdvancedPasskeys"
    name="AdvancedPasskeys"
    getComponent={() =>
      require('~/screens/Advanced/AdvancedPasskeysScreen')
        .AdvancedPasskeysScreen
    }
    options={{ headerTitle: 'Passkeys' }}
  />,
  ...DebugScreens(Stack),
];

export { CommonScreens };
