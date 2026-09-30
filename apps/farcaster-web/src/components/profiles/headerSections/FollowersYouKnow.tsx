import classNames from 'classnames';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';

type FollowersYouKnowContentProps = {
  users: ApiUser[];
  totalCount: number;
  prefix?: string;
  suffix?: string;
  variant?: 'default' | 'lite' | 'condensed';
};

const FollowersYouKnowContent: React.FC<FollowersYouKnowContentProps> = ({
  users,
  totalCount,
  prefix,
  suffix,
  variant = 'default',
}) => {
  const avatars = React.useMemo(() => {
    return (
      <div
        className={classNames(
          'flex flex-row -space-x-2',
          variant !== 'default' ? `h-[20px]` : `h-[36px]`,
        )}
      >
        {users.map((avatarUser, index) => {
          return (
            <div
              key={avatarUser.fid}
              className={classNames(
                variant !== 'default' ? 'h-[20px]' : 'h-[36px]',
              )}
              style={{
                zIndex: users.length - index,
              }}
            >
              <Avatar
                user={avatarUser}
                size={variant !== 'default' ? 'xs' : 'sm'}
                disabled={true}
              />
            </div>
          );
        })}
      </div>
    );
  }, [variant, users]);

  const details = React.useMemo(() => {
    if (variant === 'condensed') {
      return (
        <span
          className={classNames(
            'ml-0.5 flex flex-row flex-wrap self-center pl-2 lg:pl-0',
          )}
        >
          <span className={classNames('text-muted', 'text-sm')}>
            <span className="font-semibold">{totalCount}</span> mutual{' '}
            {totalCount === 1 ? 'follower' : 'followers'}
          </span>
        </span>
      );
    }

    return (
      <span
        className={classNames(
          'flex flex-row flex-wrap self-center pl-2 lg:pl-0',
          variant !== 'default' ? 'ml-0.5' : '',
        )}
      >
        <span className={classNames('text-muted', 'text-sm')}>
          {prefix !== null && (prefix ?? 'Followed by' + ' ')}
          {users.map(({ username, fid }, index) => {
            return (
              <span key={fid} className={'shrink-0 text-muted'}>
                {resolveUsername({ username, fid })}
                {users.length - 1 === index ? '' : ', '}
              </span>
            );
          })}{' '}
          {totalCount - users.length !== 0 && (
            <>
              and{' '}
              <span className={'shrink-0 text-muted'}>
                {totalCount - users.length}
              </span>{' '}
              {suffix || 'others you know'}
            </>
          )}
        </span>
      </span>
    );
  }, [prefix, suffix, totalCount, users, variant]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-row space-x-2">
      {avatars}
      {details}
    </div>
  );
};

FollowersYouKnowContent.displayName = 'FollowersYouKnowContent';

export { FollowersYouKnowContent };

type FollowersYouKnowProps = {
  users: ApiUser[];
  totalCount: number;
  prefix?: string;
  suffix?: string;
  variant?: 'default' | 'lite' | 'condensed';
};

const FollowersYouKnow: React.FC<FollowersYouKnowProps> = ({
  users,
  totalCount,
  prefix,
  suffix,
  variant = 'default',
}) => {
  const avatars = React.useMemo(() => {
    return (
      <div
        className={classNames(
          'flex flex-row -space-x-2',
          variant !== 'default' ? `h-[20px]` : `h-[36px]`,
        )}
      >
        {users.map((avatarUser, index) => {
          return (
            <div
              key={avatarUser.fid}
              className={classNames(
                variant !== 'default' ? 'h-[20px]' : 'h-[36px]',
              )}
              style={{
                zIndex: users.length - index,
              }}
            >
              <Avatar
                user={avatarUser}
                size={variant !== 'default' ? 'xs' : 'sm'}
                disabled={true}
              />
            </div>
          );
        })}
      </div>
    );
  }, [variant, users]);

  const details = React.useMemo(() => {
    if (variant === 'condensed') {
      return (
        <span
          className={classNames(
            'ml-0.5 flex flex-row flex-wrap self-center pl-2 lg:pl-0',
          )}
        >
          <span className={classNames('text-muted', 'text-sm')}>
            <span className="font-semibold">{totalCount}</span> mutual{' '}
            {totalCount === 1 ? 'follower' : 'followers'}
          </span>
        </span>
      );
    }

    return (
      <span
        className={classNames(
          'flex flex-row flex-wrap self-center pl-2 lg:pl-0',
          variant !== 'default' ? 'ml-0.5' : '',
        )}
      >
        <span className={classNames('text-muted', 'text-sm')}>
          {prefix !== null && (prefix ?? 'Followed by' + ' ')}
          {users.map(({ username, fid }, index) => {
            return (
              <span key={fid} className={'shrink-0 text-muted'}>
                {resolveUsername({ username, fid })}
                {users.length - 1 === index ? '' : ', '}
              </span>
            );
          })}{' '}
          {totalCount - users.length !== 0 && (
            <>
              and{' '}
              <span className={'shrink-0 text-muted'}>
                {totalCount - users.length}
              </span>{' '}
              {suffix || 'others you know'}
            </>
          )}
        </span>
      </span>
    );
  }, [prefix, suffix, totalCount, users, variant]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-row space-x-2">
      {avatars}
      {details}
    </div>
  );
};

FollowersYouKnow.displayName = 'FollowersYouKnow';

export { FollowersYouKnow };
