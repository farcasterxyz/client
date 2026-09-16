import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { FC, memo } from 'react';

import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type ShareLinkMenuProps = {
  url: string;
  onClickShowQR: () => void;
  onClickEmail: () => void;
  showTwitter: boolean;
  showEmail: boolean;
  singleRow: boolean;
};

const ShareLinkMenu: FC<ShareLinkMenuProps> = memo(
  ({ url, onClickEmail, onClickShowQR, showTwitter, showEmail, singleRow }) => {
    const [linkCopied, setLinkCopied] = React.useState(false);
    const buttons = React.useMemo(() => {
      const icons = [
        {
          title: 'X (Twitter)',
          icon: 'TwitterIcon',
          link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            url,
          )}`,
        },
        {
          title: 'Messages',
          icon: 'MessagesIcon',
          link: `sms://?&body=${encodeURIComponent(url)}`,
          onClick: () => {},
        },
        {
          title: 'Telegram',
          icon: 'TelegramIcon',
          link: `https://t.me/share/url?url=${encodeURIComponent(url)}`,
          onClick: () => {},
        },
        {
          title: 'Email',
          icon: 'EmailIcon',
          link: undefined,
          onClick: onClickEmail,
        },
        {
          title: linkCopied ? 'Copied!' : 'Copy link',
          icon: 'CopyLinkIcon',
          link: undefined,
          onClick: () => {
            navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 3000);
          },
        },
        {
          title: 'Show QR',
          icon: 'ShowQRIcon',
          link: undefined,
          onClick: onClickShowQR,
        },
      ];
      return icons.flatMap((x) => {
        if (!showTwitter && x.title === 'X (Twitter)') {
          return [];
        } else if (!showEmail && x.title === 'Email') {
          return [];
        }
        return x;
      });
    }, [linkCopied, onClickEmail, onClickShowQR, showEmail, showTwitter, url]);
    return (
      <>
        <div
          className={cn(
            'grid w-full items-start gap-y-0 justify-self-start',
            singleRow ? 'grid-cols-5' : 'grid-cols-3',
          )}
        >
          {buttons.map((item, index) => (
            <ShareLinkGridItem
              title={item.title}
              onClick={item.onClick}
              link={item.link}
              icon={item.icon}
              index={index}
              mutedTitle={item.title === 'Copied!' && linkCopied}
              singleRow={singleRow}
            />
          ))}
        </div>
      </>
    );
  },
);

type ShareLinkGridItemProps = {
  title: string;
  link?: string;
  icon: string;
  onClick?: () => void;
  index: number;
  mutedTitle: boolean;
  singleRow: boolean;
};

const ShareLinkGridItem: FC<ShareLinkGridItemProps> = memo(
  ({ title, link, icon, onClick, index, mutedTitle, singleRow }) => {
    const { trackEvent } = useAnalytics();
    return (
      <div
        className={cn(
          'flex w-full flex-col items-center',
          !singleRow && index >= 3 ? 'pt-4' : 'pb-4',
          !singleRow && index !== 2 && 'border-r border-faint',
          !singleRow && index <= 2 && 'border-b border-faint',
          singleRow && index < 4 && 'border-r border-faint',
        )}
      >
        {link ? (
          <ExternalLink
            href={link}
            title={title}
            className="cursor-pointer"
            onClick={() =>
              trackEvent(AnalyticsEvent.ClickShareGiftInvite, {
                shareVia: title,
              })
            }
          >
            <Image
              src={`/~/images/${icon}.png`}
              alt={title}
              style={{
                height: 50,
                width: 50,
              }}
            />
          </ExternalLink>
        ) : (
          <Image
            src={`/~/images/${icon}.png`}
            alt={title}
            style={{
              height: 50,
              width: 50,
            }}
            onClick={() => {
              onClick?.();
              trackEvent(AnalyticsEvent.ClickShareGiftInvite, {
                shareVia: title,
              });
            }}
            className="cursor-pointer"
          />
        )}
        {title === 'X (Twitter)' ? (
          <span className="flex flex-row items-center space-x-1 pt-2 text-sm">
            <span>X</span>
            <span className="text-muted">(Twitter)</span>
          </span>
        ) : (
          <span className={cn('pt-2 text-sm', mutedTitle && 'text-muted')}>
            {title}
          </span>
        )}
      </div>
    );
  },
);

export { ShareLinkMenu };
