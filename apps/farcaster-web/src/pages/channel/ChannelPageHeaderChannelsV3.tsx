import classNames from 'classnames';
import { ApiChannel } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  getSpecificallySizedImageUrl,
} from 'farcaster-client-hooks';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import React from 'react';

import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { Image } from '~/components/images/Image';
import { ImageLightboxModal } from '~/components/modals/ImageLightboxModal';
import { appPathPrefix } from '~/constants/routePrefixes';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

import { ChannelPageHeaderChannelsV3Actions } from './ChannelPageHeaderChannelsV3Actions';

const SCROLL_THRESHOLD = 340;

type ChannelHeaderProps = {
  channel: ApiChannel;
};

const ChannelPageHeaderChannelsV3: React.FC<ChannelHeaderProps> = React.memo(
  ({ channel }) => {
    const isSignedIn = useIsSignedIn();

    const [isScrolled, setIsScrolled] = React.useState<boolean>(false);

    const { scrollY } = useScroll();

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(scrollY.get() > SCROLL_THRESHOLD);
      };

      const unsubscribe = scrollY.on('change', handleScroll);
      return () => unsubscribe();
    }, [scrollY]);

    const [isModalVisible, setIsModalVisible] = React.useState(false);

    const channelHeaderImageSrc = React.useMemo(() => {
      if (typeof channel.headerImageUrl !== 'undefined') {
        return getSpecificallySizedImageUrl({
          staticRaster: channel.headerImageUrl,
          h: 200,
          w: 600,
          increasedWidth: true,
        });
      }

      return `${appPathPrefix}/images/DefaultChannelCoverImage.png`;
    }, [channel.headerImageUrl]);

    return (
      <>
        <div className="sticky top-0 z-10">
          <motion.div className="relative size-full bg-cover bg-bottom">
            <div
              className={classNames(
                'flex h-[52px] w-full flex-row items-center justify-between px-4 bg-app',
                isScrolled && 'border-b border-default',
              )}
            >
              <div className="flex h-[34px] flex-row items-center space-x-3">
                <BackButton className="!mr-0" />
                <AnimatePresence>
                  <div>
                    <div
                      className={classNames(
                        'flex min-w-0 shrink-0 cursor-pointer flex-row items-center space-x-1 rounded-full',
                      )}
                    >
                      {isScrolled && (
                        <motion.div
                          key="header"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.05 }}
                          className="flex flex-col"
                        >
                          {typeof channel.imageUrl !== 'undefined' && (
                            <ChannelImage
                              channelImageUrl={channel.imageUrl}
                              size={'conversation-header'}
                            />
                          )}
                        </motion.div>
                      )}
                      <div
                        className={classNames(
                          // Not using truncate because that implies overflow:hidden which chops off hanging characters a little
                          'text-ellipsis text-nowrap leading-[18px]',
                          'font-semibold text-default',
                        )}
                      >
                        {channel.key}
                      </div>
                    </div>
                    {isScrolled && (
                      <motion.div
                        key="header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.05 }}
                        className="flex flex-col"
                      >
                        <div className="text-xs font-semibold text-faint">
                          {`${formatShorthandNumber(channel.memberCount || 0)} ${channel.memberCount === 1 ? 'member' : 'members'}`}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </AnimatePresence>
              </div>
              {isSignedIn && (
                <div className="flex h-full flex-row items-center space-x-3">
                  <ChannelPageHeaderChannelsV3Actions channel={channel} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
        <div
          className={classNames(
            'relative overflow-hidden bg-elevated',
            typeof channel.headerImageUrl !== 'undefined' && 'cursor-pointer',
          )}
          onClick={() => setIsModalVisible(true)}
        >
          <Image
            key={channel.key}
            alt={channel.key}
            src={channelHeaderImageSrc}
            className="aspect-[3/1] size-full object-cover object-center"
          />
        </div>
        {isModalVisible && typeof channel.headerImageUrl !== 'undefined' && (
          <ImageLightboxModal
            title={'Channel iamge'}
            imageUrls={[channel.headerImageUrl]}
            initialIndex={0}
            onClose={() => {
              setIsModalVisible(false);
            }}
          />
        )}
      </>
    );
  },
);

ChannelPageHeaderChannelsV3.displayName = 'ChannelPageHeaderChannelsV3';

export { ChannelPageHeaderChannelsV3 };
