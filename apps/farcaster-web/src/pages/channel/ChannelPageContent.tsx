import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useChannelFromGlobalCache,
  useTrackEvent,
  useUnseen,
} from 'farcaster-client-hooks';
import React, { FC, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ChannelHeaderChannelMetadata } from '~/components/channelsV3/ChannelHeaderChannelMetadata';
import { FullScreenErrorBoundary } from '~/components/errors/FullScreenErrorBoundary';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { ChannelInfoModal } from '~/components/modals/ChannelInfoModal';
import { EditChannelModal } from '~/components/modals/EditChannelModal';
import { Page } from '~/components/page/Page';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { ChannelEditSection } from '~/types';

import { ChannelFeedTabs } from './ChannelFeedTabs';
import { ChannelPageHeaderChannelsV3 } from './ChannelPageHeaderChannelsV3';
import { Feed } from './Feed';

interface ChannelPageContentProps {
  channelKey: string;
  feedType: string;
  settingsModalState?: {
    isOpen: boolean;
    section?: ChannelEditSection;
  };
}

const ChannelPageContent: FC<ChannelPageContentProps> = React.memo(
  ({ channelKey, feedType, settingsModalState }) => {
    const { trackEvent } = useTrackEvent();
    const navigate = useNavigate();
    const isSignedIn = useIsSignedIn();

    const { resetFeedUnseenStatus } = useUnseen();

    const { data: channelData } = useChannelFromGlobalCache({
      key: channelKey,
    });

    const channel = React.useMemo(() => channelData!, [channelData]);

    const pageTitle = React.useMemo(() => {
      return `${channel.name} Channel on Farcaster`;
    }, [channel]);

    // Build SEO metadata for channel (consistent with SSR ChannelHead)
    const description = React.useMemo(() => {
      const followerText =
        typeof channel.followerCount !== 'undefined'
          ? `Join ${channel.followerCount.toLocaleString()} followers in the ${channel.name} channel on Farcaster.`
          : `Join the ${channel.name} channel on Farcaster.`;
      if (channel.description) {
        const fullDesc = `${channel.description} — ${followerText}`;
        return fullDesc.length > 160
          ? `${fullDesc.substring(0, 157)}...`
          : fullDesc;
      }
      return followerText;
    }, [channel.name, channel.description, channel.followerCount]);

    const canonical = React.useMemo(() => {
      return `https://farcaster.xyz/~/channel/${channel.key}`;
    }, [channel.key]);

    const ogImage = React.useMemo(() => {
      return channel.imageUrl;
    }, [channel.imageUrl]);

    const [infoModalVisible, setInfoModalVisible] = useState<boolean>();

    React.useEffect(() => {
      trackEvent(AnalyticsEvent.ViewChannel, {
        channel: channelKey,
        feed: feedType === 'curated' ? 'trending' : 'recent',
      });
      if (feedType === 'default' && isSignedIn) {
        resetFeedUnseenStatus(channelKey);
      }
    }, [channelKey, feedType, resetFeedUnseenStatus, trackEvent, isSignedIn]);

    return (
      <>
        <Page
          meta={{
            title: pageTitle,
            description,
            canonical,
            ogImage,
            twitterCard: 'summary',
          }}
        >
          <BorderedMainContent>
            <ChannelPageHeaderChannelsV3 key={channel.key} channel={channel} />
            <ChannelHeaderChannelMetadata
              channel={channel}
              conversationView={false}
            />
            {channel.feeds && channel.feeds.length > 1 && (
              <ChannelFeedTabs
                channelKey={channel.key}
                feeds={channel.feeds}
                focusedFeedType={feedType}
              />
            )}
            <React.Suspense fallback={<FullScreenLoadingIndicator />}>
              <FullScreenErrorBoundary>
                <Feed feed={channel} feedType={feedType} />
              </FullScreenErrorBoundary>
            </React.Suspense>
          </BorderedMainContent>
        </Page>
        {settingsModalState?.isOpen && (
          <EditChannelModal
            onClose={() => navigate({ to: 'channel', params: { channelKey } })}
            channel={channel}
            section={settingsModalState.section}
          />
        )}
        {infoModalVisible && (
          <ChannelInfoModal
            channelKey={channelKey}
            onCancel={() => {
              setInfoModalVisible(false);
            }}
          />
        )}
      </>
    );
  },
);

ChannelPageContent.displayName = 'ChannelPageContent';

export { ChannelPageContent };
