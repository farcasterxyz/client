import { ApiUser } from 'farcaster-client-data';
import { formatAddress } from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { TokenCircleIcon } from '~/components/icons/TokenCircleIcon';
import { EditProfileModal } from '~/components/profiles/EditProfileModal';
import { TokenIcon } from '~/components/tokens/TokenIcon';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { getProfileTokenData, hasProfileToken } from '~/utils/profile';

type ProfileTokenSectionProps = {
  user: ApiUser;
};

const ProfileTokenSection: React.FC<ProfileTokenSectionProps> = ({ user }) => {
  const { fid: currentUserFid } = useCurrentUser();
  const hasToken = hasProfileToken(user.profile?.profileToken);

  if (currentUserFid === user.fid && !hasToken) {
    return (
      <React.Suspense fallback={<div className="h-[28px]" />}>
        <ProfileTokenSelf user={user} />
      </React.Suspense>
    );
  }

  if (!hasToken) {
    return null;
  }

  return (
    <React.Suspense fallback={<div className="h-[28px]" />}>
      {currentUserFid === user.fid ? (
        <ProfileTokenSelf user={user} />
      ) : (
        <ProfileToken user={user} />
      )}
    </React.Suspense>
  );
};

ProfileTokenSection.displayName = 'ProfileTokenSection';

const ProfileTokenSelf: React.FC<ProfileTokenSectionProps> = ({ user }) => {
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const onProfileTokenClick = useCallback(() => {
    setShowEditProfileModal(true);
  }, []);

  const tokenData = getProfileTokenData(user.profile?.profileToken);

  if (!tokenData) {
    return (
      <>
        <div
          className="flex w-max flex-row items-center space-x-1 rounded-full border px-[6px] py-[3px] text-sm text-muted bg-elevated border-default hover:cursor-pointer"
          onClick={onProfileTokenClick}
        >
          <TokenCircleIcon size={14} className="text-muted" />
          <div>Set a profile token</div>
        </div>
        {showEditProfileModal && (
          <EditProfileModal
            onClose={() => setShowEditProfileModal(false)}
            initialFocus="token"
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="flex w-max flex-row items-center space-x-1 rounded-full border px-[6px] py-[3px] text-sm text-muted bg-elevated border-default hover:cursor-pointer"
        onClick={onProfileTokenClick}
      >
        <TokenIcon
          iconUrl={tokenData.imageUrl}
          symbol={tokenData.symbol}
          diameter={14}
        />
        <div className="max-w-[100px] truncate">
          {tokenData.symbol
            ? `$${tokenData.symbol}`
            : formatAddress(tokenData.ca)}
        </div>
      </div>
      {showEditProfileModal && (
        <EditProfileModal
          onClose={() => setShowEditProfileModal(false)}
          initialFocus="token"
        />
      )}
    </>
  );
};

ProfileTokenSelf.displayName = 'ProfileTokenSelf';

const ProfileToken: React.FC<ProfileTokenSectionProps> = ({ user }) => {
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const isGeoRestricted = useWalletGeoRestricted();

  const tokenData = getProfileTokenData(user.profile?.profileToken);

  const onProfileTokenClick = useCallback(() => {
    if (!tokenData) {
      return;
    }

    if (!isGeoRestricted && embeddedWalletBridge?.navigate) {
      embeddedWalletBridge.navigate({
        path: 'Token',
        params: {
          chain: tokenData.chain,
          ca: tokenData.ca,
          via: 'profile_token',
        },
      });
    }
  }, [embeddedWalletBridge, isGeoRestricted, tokenData]);

  if (!tokenData) {
    return null;
  }

  return (
    <div
      className="flex w-max flex-row items-center space-x-1 py-[3px] text-sm text-muted hover:cursor-pointer"
      onClick={onProfileTokenClick}
    >
      <TokenIcon
        iconUrl={tokenData.imageUrl}
        symbol={tokenData.symbol}
        diameter={14}
      />
      <div className="max-w-[100px] truncate">
        {tokenData.symbol
          ? `$${tokenData.symbol}`
          : formatAddress(tokenData.ca)}
      </div>
    </div>
  );
};

ProfileToken.displayName = 'ProfileToken';

export { ProfileTokenSection };
