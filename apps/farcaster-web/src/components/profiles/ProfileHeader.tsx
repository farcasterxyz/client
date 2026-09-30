import classNames from 'classnames';
import { ApiUserProfile } from 'farcaster-client-data';
import {
  getSpecificallySizedImageUrl,
  resolveUsername,
  useGloballyCachedUser,
} from 'farcaster-client-hooks';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import React from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { Image } from '~/components/images/Image';
import { ImageLightboxModal } from '~/components/modals/ImageLightboxModal';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useUserLevel } from '~/hooks/data/useUserLevel';

import { ProfilePageHeaderActions } from './ProfilePageHeaderActions';

const SCROLL_THRESHOLD = 200;

type ProfileHeaderProps = {
  userProfile: ApiUserProfile;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = React.memo(
  ({ userProfile }) => {
    const [isScrolled, setIsScrolled] = React.useState<boolean>(false);
    const isSignedIn = useIsSignedIn();
    const user = useGloballyCachedUser({ fallback: userProfile.user });
    const userIsPro = useUserLevel(user) === 'pro';

    const { scrollY } = useScroll();

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(scrollY.get() > SCROLL_THRESHOLD);
      };

      const unsubscribe = scrollY.on('change', handleScroll);
      return () => unsubscribe();
    }, [scrollY]);

    const [isModalVisible, setIsModalVisible] = React.useState(false);

    const bannerImageSrc = React.useMemo(() => {
      if (typeof user.profile.bannerImageUrl !== 'undefined') {
        return getSpecificallySizedImageUrl({
          staticRaster: user.profile.bannerImageUrl,
          h: 200,
          w: 600,
          increasedWidth: true,
        });
      }

      return undefined;
    }, [user.profile.bannerImageUrl]);

    return (
      <>
        <div className="sticky top-0 z-10">
          <motion.div className="relative size-full bg-cover bg-bottom">
            <div
              className={classNames(
                'flex h-[52px] w-full flex-row items-center justify-between border-b px-4 bg-app border-default',
              )}
            >
              <div className="flex h-[34px] flex-row items-center space-x-3">
                <BackButton className="!mr-0" />
                <AnimatePresence>
                  {isScrolled && (
                    <motion.div
                      key="header"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.05 }}
                      className="flex flex-row items-center"
                    >
                      <div className="flex flex-row items-center gap-1">
                        <div className="max-w-[300px] truncate text-base font-semibold text-default">
                          {resolveUsername({
                            username: user.username,
                            fid: user.fid,
                          })}
                        </div>
                        {userIsPro && (
                          <FarcasterProBadge size={18} className="mb-0.5" />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {isSignedIn && (
                <div className="flex h-full flex-row items-center space-x-3">
                  <ProfilePageHeaderActions userProfile={userProfile} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
        <div
          className={classNames(
            'relative h-[200px] overflow-hidden bg-light-purple',
            typeof user.profile.bannerImageUrl !== 'undefined' &&
              'cursor-pointer',
          )}
          onClick={() => bannerImageSrc && setIsModalVisible(true)}
        >
          {bannerImageSrc && (
            <Image
              key={user.fid}
              alt={user.displayName}
              src={bannerImageSrc}
              className="aspect-[3/1] size-full object-cover object-center"
              priority
            />
          )}
        </div>
        {isModalVisible && bannerImageSrc && (
          <ImageLightboxModal
            title={'User banner image'}
            imageUrls={[user.profile.bannerImageUrl!]}
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

ProfileHeader.displayName = 'ProfileHeader';

export { ProfileHeader };
