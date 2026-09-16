import { ApiUser } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

type ProfileHeaderProps = {
  user: ApiUser;
};

const ProfileHeader: FC<ProfileHeaderProps> = ({ user }) => {
  const xProfileUrl = useMemo(() => {
    const xAccount = user.connectedAccounts?.find(
      (account) => account.platform === 'x' && !account.expired,
    );
    if (xAccount) {
      return `https://x.com/${xAccount.username}`;
    }
    return null;
  }, [user.connectedAccounts]);

  return (
    <header>
      <h1>
        {user.displayName}{' '}
        {user.username && <span className="username">({user.username})</span>}
      </h1>
      {user.pfp && (
        <img
          src={user.pfp.url}
          alt={user.displayName}
          width="200"
          height="200"
        />
      )}
      {user.profile.bio.text && <p>{user.profile.bio.text}</p>}
      {xProfileUrl && (
        <a href={xProfileUrl} rel="me">
          X (Twitter) Profile
        </a>
      )}
      <p>
        <strong>{user.followerCount}</strong> Followers
      </p>
    </header>
  );
};

ProfileHeader.displayName = 'ProfileHeader';

export { ProfileHeader };
