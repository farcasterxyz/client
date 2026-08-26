import { AlertIcon, ShieldCheckIcon, StarIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiGenericCta,
  ApiGenericNotificationGroup,
  ApiNotificationIcon,
  ApiNotificationType,
} from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { XTopHatIcon } from '~/components/casts/actions/icons/XTopHatIcon';
import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { AirdropIcon } from '~/components/icons/AirdropIcon';
import { WalletIcon } from '~/components/icons/WalletIcon';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { NotificationGraphic } from '~/components/notifications/shared/NotificationGraphic';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type GenericNotificationGroupProps = {
  notificationGroup: ApiGenericNotificationGroup;
};

type SingleCtaGenericNotificationGroupProps = {
  notificationGroup: ApiGenericNotificationGroup;
  title?: string;
  description: string;
  type: string;
  ctaText?: string;
  ctaTarget?: string;
};

const GenericNotificationGroupWithoutCustomLogo: FC<
  SingleCtaGenericNotificationGroupProps
> = ({ notificationGroup, title, description, type, ctaText, ctaTarget }) => {
  const { trackEvent } = useTrackEvent();

  return (
    <NotificationGroupContainer
      notificationGroup={notificationGroup}
      clickable={false}
    >
      <NotificationIcon variant="blue">
        <StarIcon size={NOTIFICATION_ICON_SIZE} />
      </NotificationIcon>
      <div className="flex grow flex-row justify-between self-center">
        <div className="flex flex-col">
          {title && (
            <div className="mb-1 text-base font-semibold text-default">
              {title}
            </div>
          )}
          <div className="text-default">{description}</div>
        </div>
        {ctaText && ctaTarget && (
          <ExternalLink
            href={ctaTarget}
            title={ctaText}
            className="align-right self-center text-inherit"
            onClick={() => {
              trackEvent(AnalyticsEvent.ClickNotification, {
                type,
              });
            }}
          >
            <DefaultButton className="min-w-[100px]" size="sm" variant="muted">
              {ctaText}
            </DefaultButton>
          </ExternalLink>
        )}
      </div>
    </NotificationGroupContainer>
  );
};

type MultiCtaGenericNotificationGroupProps = {
  notificationGroup: ApiGenericNotificationGroup;
  type: ApiNotificationType;
  title?: string;
  description: string;
  icon: ApiNotificationIcon;
  primaryCta: ApiGenericCta;
  secondaryCta?: ApiGenericCta;
};

const GenericNotificationGroupWithCustomLogo: FC<
  MultiCtaGenericNotificationGroupProps
> = ({
  notificationGroup,
  type,
  title,
  description,
  icon,
  primaryCta,
  secondaryCta,
}) => {
  const { trackEvent } = useTrackEvent();

  const bottomRightIcon = useMemo(() => {
    if (icon.bottomRightIcon === 'airdrop') {
      return (
        <div className="absolute -bottom-0.5 -right-0.5">
          <AirdropIcon size={20} />
        </div>
      );
    }
    return null;
  }, [icon]);

  return (
    <NotificationGroupContainer
      notificationGroup={notificationGroup}
      clickable={false}
    >
      <NotificationGraphic>
        <div className="relative flex h-12 w-12 items-center justify-center rounded-[14px] bg-black">
          <Image
            src={icon.assetImageUrl}
            alt={title || 'Notification'}
            width={icon.width ?? 29}
            height={icon.height ?? 29}
            fallback={NFT_IMAGE_UNAVAILABLE_URL}
          />
          {bottomRightIcon}
        </div>
      </NotificationGraphic>
      <div className="flex grow flex-col">
        <div className="flex flex-1 flex-col justify-center">
          {title && (
            <div className="mr-1 text-base font-semibold text-default">
              {title}
            </div>
          )}
          <div
            className={
              title
                ? 'mr-1 mt-1 text-default'
                : 'mr-1 mt-1 font-medium text-default'
            }
          >
            {description}
          </div>
        </div>

        <div className="mt-2 flex w-full flex-row gap-2.5">
          <div className="flex-1">
            <ExternalLink
              href={primaryCta.target}
              title={primaryCta.text}
              className="text-inherit"
              onClick={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type,
                  cta: 'primary',
                });
              }}
            >
              <DefaultButton className="w-full" size="sm" variant="normal">
                {primaryCta.text}
              </DefaultButton>
            </ExternalLink>
          </div>
          {secondaryCta && (
            <div className="flex-1">
              <ExternalLink
                href={secondaryCta.target}
                title={secondaryCta.text}
                className="text-inherit"
                onClick={() => {
                  trackEvent(AnalyticsEvent.ClickNotification, {
                    type,
                    cta: 'secondary',
                  });
                }}
              >
                <DefaultButton className="w-full" size="sm" variant="secondary">
                  {secondaryCta.text}
                </DefaultButton>
              </ExternalLink>
            </div>
          )}
        </div>
      </div>
    </NotificationGroupContainer>
  );
};

const GenericNotificationGroup: FC<GenericNotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    const navigate = useNavigate();

    const { navigate: navigateInWallet } = useEmbeddedWalletBridge();

    const notificationItem = useMemo(
      () => notificationGroup.previewItems[0],
      [notificationGroup.previewItems],
    );

    const { type, title, description, ctaText, ctaTarget } = useMemo(() => {
      const item = notificationItem;
      const content = item.content;
      const targetCta =
        content.webOverride?.cta || content.secondaryCta || content.cta;
      return {
        id: item.id,
        type: item.type,
        title: content.webOverride?.title || content.title,
        description: content.webOverride?.description || content.description,
        ctaText:
          content.webOverride?.hideCta === true
            ? undefined
            : // HACK: remove this once Monad airship is updated
              // https://slack.com
              targetCta?.text,
        ctaTarget:
          content.webOverride?.hideCta === true
            ? undefined
            : // HACK: remove this once Monad airship is updated
              // https://slack.com
              targetCta?.target,
      };
    }, [notificationItem]);

    if (notificationItem.id === 'warpcast-wallet') {
      return (
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            navigate({ to: 'wallet', params: {} });
          }}
        >
          <NotificationIcon variant="purple">
            <WalletIcon />
          </NotificationIcon>
          <div className="flex grow flex-row justify-between self-center">
            <div className="flex flex-col">
              <div className="mb-1 text-base font-semibold text-default">
                {title}
              </div>
              <div className="text-default">{description}</div>
            </div>
          </div>
        </NotificationGroupContainer>
      );
    }

    if (notificationItem.id === 'verify-account') {
      return (
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          clickable={false}
        >
          <NotificationIcon variant="purple">
            <ShieldCheckIcon size={NOTIFICATION_ICON_SIZE} />
          </NotificationIcon>
          <div className="flex grow flex-row justify-between self-center">
            <div className="flex flex-col">
              <div className="mb-1 text-base font-semibold text-default">
                {title}
              </div>
              <div className="text-default">{description}</div>
            </div>
          </div>
        </NotificationGroupContainer>
      );
    }

    if (notificationItem.id === 'import-x') {
      return (
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            navigate({ to: 'settingsImport', params: {} });
          }}
        >
          <NotificationIcon variant="gray">
            <XTopHatIcon size={16} />
          </NotificationIcon>
          <div className="flex grow flex-row justify-between self-center">
            <div className="flex flex-col">
              <div className="mb-1 text-base font-semibold text-default">
                {title}
              </div>
              <div className="text-default">{description}</div>
            </div>
          </div>
        </NotificationGroupContainer>
      );
    }

    if (
      notificationItem.id === 'storage-warning-casts' ||
      notificationItem.id === 'storage-warning-reactions' ||
      notificationItem.id === 'storage-warning-links'
    ) {
      return (
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            navigate({ to: 'settingsStorage', params: {} });
          }}
        >
          <NotificationIcon variant="blue">
            <AlertIcon size={NOTIFICATION_ICON_SIZE} />
          </NotificationIcon>
          <div className="flex grow flex-row justify-between self-center">
            <div className="flex flex-col">
              <div className="mb-1 text-base font-semibold text-default">
                {title}
              </div>
              <div className="text-default">{description}</div>
            </div>
          </div>
        </NotificationGroupContainer>
      );
    }

    if (notificationItem.id === 'farcaster-pro-fees-upsell') {
      return (
        <NotificationGroupContainer
          notificationGroup={notificationGroup}
          onClick={() => {
            navigateInWallet({
              path: 'FarcasterProFullScreenUpsell',
              params: {},
            });
          }}
        >
          <NotificationIcon variant="purple">
            <FarcasterProBadge size={24} />
          </NotificationIcon>
          <div className="flex grow flex-row justify-between self-center">
            <div className="flex flex-col">
              <div className="mb-1 text-base font-semibold text-default">
                {title}
              </div>
              <div className="text-default">{description}</div>
            </div>
          </div>
        </NotificationGroupContainer>
      );
    }

    // NOTE: We extended generic 1-off notifications to support custom logos
    // and more than 1 CTA.
    const icon = notificationGroup.previewItems[0].content.icon;
    const primaryCta = notificationGroup.previewItems[0].content.cta;
    const secondaryCta = notificationGroup.previewItems[0].content.secondaryCta;

    if (icon) {
      return (
        <GenericNotificationGroupWithCustomLogo
          notificationGroup={notificationGroup}
          type={type}
          title={title}
          description={description}
          icon={icon}
          primaryCta={primaryCta}
          secondaryCta={secondaryCta}
        />
      );
    }

    return (
      <GenericNotificationGroupWithoutCustomLogo
        notificationGroup={notificationGroup}
        title={title}
        description={description}
        type={type}
        ctaText={ctaText}
        ctaTarget={ctaTarget}
      />
    );
  },
);

GenericNotificationGroup.displayName = 'GenericNotificationGroup';

export { GenericNotificationGroup };
