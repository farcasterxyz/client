import cn from 'classnames';
import { ApiChannelUserRelation } from 'farcaster-client-data';
import { ComponentType, FC, memo, useMemo } from 'react';

type BadgeColor = 'primary' | 'secondary';

export const ChannelRelationBadge: FC<{ relation: ApiChannelUserRelation }> =
  memo(({ relation }) => {
    const role = useMemo(() => {
      switch (relation) {
        case 'owner':
          return 'Owner';
        case 'moderator':
          return 'Moderator';
        case 'pending-moderator':
          return 'Pending';
      }
    }, [relation]);

    const color: BadgeColor = useMemo(
      () => (relation === 'pending-moderator' ? 'secondary' : 'primary'),
      [relation],
    );

    if (!role) {
      return null;
    }

    return <ChannelBadge label={role} color={color} />;
  });

interface ChannelBadgeProps {
  label?: string;
  color: BadgeColor;
  Icon?: ComponentType<{ size: number }>;
}

export const ChannelBadge: FC<ChannelBadgeProps> = memo(
  ({ label, color, Icon }) => {
    return (
      <div
        className={cn([
          'flex flex-row items-center gap-1 rounded-full text-[11px] leading-[16px]',
          color === 'primary'
            ? 'text-[#8A63D2] bg-light-purple dark:text-[#ffffff]'
            : 'bg-[#7C65C133] bg-[#EFEFEF] text-muted dark:bg-[#2E2835] ',
          label ? 'px-[6px] py-[2px]' : 'px-[4px] py-[4px]',
        ])}
      >
        {Icon && <Icon size={label ? 10 : 9} />}
        {label}
      </div>
    );
  },
);
