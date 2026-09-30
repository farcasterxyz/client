import { Octicons } from '@expo/vector-icons';
import { ApiChannel, ApiChannelUserInvite } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  getSpecificallySizedImageUrl,
  resolveUsernameShort,
  useChannelActions,
  useGloballyCachedChannel,
  useNonSuspenseChannelDetails,
  useUpdateChannel,
} from 'farcaster-client-hooks';
import React, { FC, memo, ReactElement, useCallback, useMemo } from 'react';
import {
  ColorValue,
  GestureResponderEvent,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  measure,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DefaultHeaderImage from '~/assets/images/DefaultHeaderImage.webp';
import { Avatar } from '~/components/Avatar';
import { ButtonV2 } from '~/components/ButtonV2';
import { ChannelHeaderAction } from '~/components/ChannelsV3/ChannelHeaderAction';
import {
  coverImageHeight,
  HeaderImage,
  ImageUploaderInterface,
} from '~/components/HeaderImage';
import { BellCheckFillIcon } from '~/components/icons/BellCheckFillIcon';
import { CheckUserIcon } from '~/components/icons/CheckUserIcon';
import { ShieldStarFillIcon } from '~/components/icons/ShieldStarFillIcon';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { Text2 } from '~/components/Text';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { hitSlop } from '~/constants/Pressable';
import { useLightbox } from '~/contexts/LightboxProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { usePush } from '~/hooks/navigation/usePush';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { useRespondToChannelInvite } from '~/hooks/useRespondToChannelInvite';
import { useShareChannel } from '~/hooks/useShareChannel';
import { useUserChannelRole } from '~/hooks/useUserChannelRole';

interface ChannelHeaderProps {
  channel: ApiChannel;
  openMenu: () => void;
  headerHeight: SharedValue<number>;
}

const ChannelHeader: FC<ChannelHeaderProps> = memo(
  ({ channel, headerHeight, openMenu }) => {
    const t = useTheme();
    const share = useShareChannel({
      channelKey: channel.key,
      location: 'channel page sticky header',
    });
    const push = usePush();

    const role = useUserChannelRole(channel);
    const { fid } = useCurrentUser_UNSAFE();
    const { following, toggleFollowing } = useChannelActions({
      channel,
      fid,
      location: 'channel header',
    });

    // we only need details to fetch the invite
    // disable suspense so that unfollowing doesn't trigger suspense
    const channelDetails = useNonSuspenseChannelDetails(
      { key: channel.key },
      {
        enabled: !channel.viewerContext.isMember,
        staleTime: 0, // ensure invite always shows up if present
      },
    );

    // ensure invite always shows up if present
    useRefreshOnFocus(channelDetails.refetch);

    const viewMembers = useCallback(() => {
      push('ChannelUsers', {
        channelKey: channel.key,
        initialTab: 'members',
      });
    }, [push, channel.key]);

    const viewFollowers = useCallback(() => {
      push('ChannelUsers', {
        channelKey: channel.key,
        initialTab: 'followers',
      });
    }, [push, channel.key]);

    const manage = useCallback(() => {
      push('ChannelManage', {
        channelKey: channel.key,
      });
    }, [push, channel.key]);

    const invite = useCallback(() => {
      push('ChannelManageInvites', {
        channelKey: channel.key,
      });
    }, [push, channel.key]);

    const viewerCanManageChannel = React.useMemo(() => {
      return role === 'owner' || role === 'moderator';
    }, [role]);

    const viewerCanInviteToChannel = React.useMemo(() => {
      return role === 'owner' || role === 'moderator';
    }, [role]);

    const button1 = useMemo(() => {
      if (viewerCanManageChannel) {
        return (
          <ButtonV2
            onPress={manage}
            height="sm"
            width="flex1"
            variant="primary"
            title="Manage"
            Icon={({ color }) => <ShieldStarFillIcon color={color} size={16} />}
          />
        );
      }

      if (role === 'member') {
        return (
          <ButtonV2
            onPress={openMenu}
            height="sm"
            width="flex1"
            variant="secondary"
            title="Member"
            Icon={({ color }) => <CheckUserIcon color={color} size={16} />}
            IconRight={({ color }) => (
              <Octicons name="chevron-down" size={16} color={color} />
            )}
          />
        );
      }

      return (
        <ButtonV2
          onPress={toggleFollowing}
          height="sm"
          width="flex1"
          variant={following ? 'secondary' : 'primary'}
          title={following ? 'Following' : 'Follow'}
        />
      );
    }, [
      following,
      manage,
      openMenu,
      role,
      toggleFollowing,
      viewerCanManageChannel,
    ]);

    const button2 = useMemo(() => {
      if (viewerCanInviteToChannel) {
        return (
          <ButtonV2
            onPress={invite}
            variant="secondary"
            height="sm"
            width="flex1"
            Icon={({ color }) => (
              <Octicons name="person-add" size={16} color={color} />
            )}
            title="Invite"
          />
        );
      }

      return (
        <ButtonV2
          onPress={share}
          variant="secondary"
          height="sm"
          width="flex1"
          Icon={({ color }) => (
            <Octicons name="share" color={color} size={16} />
          )}
          title="Share channel"
        />
      );
    }, [invite, share, viewerCanInviteToChannel]);

    const { linkifiedText: channelDescription } = useLinkifyText({
      text: channel.description?.replace(/\n/g, ' ') ?? '',
      mentions: channel.descriptionMentionedUsernames,
      // We are okay only linkifying links for channel headers at this time
      channelMentions: [],
      options: {
        applyInvertedLinkStyles: [],
        skipFarcasterLinkTruncate: true,
        treatImageUrlsAsLinks: true,
        skipURLTruncates: false,
      },
    });

    const channelInvite = channelDetails.data?.viewerContext?.invite;

    const channelImageUrl = React.useMemo(() => {
      return getSpecificallySizedImageUrl({
        staticRaster: channel.imageUrl || defaultAvatarUrl,
        h: 88,
        w: 88,
      });
    }, [channel.imageUrl]);

    const { openLightbox } = useLightbox();
    const ref = useAnimatedRef<View>();

    const onChannelImagePress = React.useCallback(() => {
      if (typeof channel.imageUrl !== 'undefined') {
        runOnUI(() => {
          'worklet';
          runOnJS(openLightbox)({
            images: [
              {
                original: channel.imageUrl!,
                thumbnail: channel.imageUrl!,
                width: 72,
                aspectRatio: 1,
                rect: measure(ref),
                type: 'circle',
              },
            ],
            index: 0,
          });
        })();
      }
    }, [channel.imageUrl, openLightbox, ref]);

    const updateChannel = useUpdateChannel();

    const onImageChange = React.useCallback(
      async ({ imageUrl }: { imageUrl: string }) => {
        await updateChannel({
          key: channel.key,
          headerImageUrl: imageUrl,
        });
      },
      [channel.key, updateChannel],
    );

    const { activeLightboxRef } = useLightbox();

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity:
          activeLightboxRef.value === channel.imageUrl
            ? withTiming(0, { duration: 100 })
            : 1,
      };
    });

    return (
      <View
        style={[t.wFull, t.borderDefault, t.borderBHairline]}
        onLayout={(e) => {
          headerHeight.value = e.nativeEvent.layout.height;
        }}
      >
        <HeaderImage
          onImageChange={onImageChange}
          currentImageUrl={channel.headerImageUrl}
          viewerCanUpdate={viewerCanManageChannel}
          disabled={false}
          imageUploaderRef={null}
          defaultImageSource={DefaultHeaderImage}
        />
        <View style={[t.relative, t.flexRow, t.justifyEnd]}>
          <View
            style={[
              t.absolute,
              t.roundedFull,
              t.bgElevated,
              { left: 12, top: -36, zIndex: 1 },
            ]}
          >
            <Animated.View style={[animatedStyle]}>
              <Pressable onPress={onChannelImagePress} ref={ref}>
                <SimplerRemoteImage
                  height={88}
                  width={88}
                  uri={channelImageUrl}
                  style={[
                    t.roundedFull,
                    t.bgElevated,
                    { borderWidth: 2, borderColor: t.colors.bgDefault },
                  ]}
                />
              </Pressable>
            </Animated.View>
          </View>
          <View style={[t.flexRow, t.p3]}>
            {channel.memberCount !== undefined && (
              <Pressable style={[t.mL10, t.itemsCenter]} onPress={viewMembers}>
                <Text2 size="lg" weight="semibold">
                  {formatShorthandNumber(channel.memberCount)}
                </Text2>
                <Text2 size="xs" color="secondary">
                  member{channel.memberCount > 1 && 's'}
                </Text2>
              </Pressable>
            )}
            {channel.followerCount !== undefined && (
              <Pressable
                style={[t.mL10, t.itemsCenter]}
                onPress={viewFollowers}
              >
                <Text2 size="lg" weight="semibold">
                  {formatShorthandNumber(channel.followerCount)}
                </Text2>
                <Text2 size="xs" color="secondary">
                  follower{channel.followerCount > 1 && 's'}
                </Text2>
              </Pressable>
            )}
          </View>
        </View>
        <View style={[t.pX3, t.pB3]}>
          <View>
            <Text2 size="2xl" weight="semibold">
              {channel.name}
            </Text2>
          </View>
          <View style={[t.pT1, t.flexRow, t.itemsCenter]}>
            <Text2 color="tertiary">/{channel.key}</Text2>
            {typeof channel.headerAction !== 'undefined' && (
              <>
                <Text2 color="tertiary"> · </Text2>
                <ChannelHeaderAction
                  headerAction={channel.headerAction}
                  headerActionMetadata={channel.headerActionMetadata}
                />
              </>
            )}
          </View>
          {channel.description && channel.description.length && (
            <View style={[t.pT2, t.flexRow]}>
              <Text2 color="secondary">{channelDescription}</Text2>
            </View>
          )}
          <View style={[t.pT3]}>
            {(() => {
              if (channelInvite) {
                return (
                  <Invite invite={channelInvite} channelKey={channel.key} />
                );
              }

              return (
                <View style={[t.flexRow, { gap: 8 }]}>
                  {button1}
                  {button2}
                </View>
              );
            })()}
          </View>
        </View>
      </View>
    );
  },
);

function Invite({
  invite,
  channelKey,
}: {
  invite: ApiChannelUserInvite;
  channelKey: string;
}) {
  const t = useTheme();
  const { accept, decline } = useRespondToChannelInvite();

  const [inviteMessage, acceptMessage] = useMemo(() => {
    const inviterName = invite.inviter
      ? resolveUsernameShort(invite.inviter)
      : 'Someone';
    switch (invite.role) {
      case 'member':
        return [
          `${inviterName} invited you to join`,
          'Accept to cast and reply in this channel.',
        ];
      case 'moderator':
        return [
          `${inviterName} invited you to moderate`,
          'Accept to manage members and content',
        ];
    }
  }, [invite.inviter, invite.role]);

  return (
    <View
      style={[
        t.bgElevated,
        t.border,
        t.borderDesignSystemDefault,
        t.roundedLg,
        t.p3,
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter, t.mB3, { gap: 8 }]}>
        <Avatar pfpUrl={invite.inviter?.pfp?.url} />
        <View style={[t.flexShrink]}>
          <Text2 weight="semibold">{inviteMessage}</Text2>
          <Text2 color="secondary" size="sm">
            {acceptMessage}
          </Text2>
        </View>
      </View>
      <View style={[t.flexRow, { gap: 8 }]}>
        <ButtonV2
          title="Decline"
          variant="tertiary"
          onPress={() =>
            decline({
              channelKey,
              role: invite.role,
              location: 'channel page',
            })
          }
          width="flex1"
          height="sm"
        />
        <ButtonV2
          title="Join channel"
          variant="primary"
          onPress={() => {
            accept({
              channelKey,
              role: invite.role,
              location: 'channel page',
            });
          }}
          width="flex1"
          height="sm"
        />
      </View>
    </View>
  );
}

export const StickyChannelHeader: FC<{
  channel: ApiChannel;
  openMenu: () => void;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
}> = memo(
  ({ channel: fallbackChannel, scrollOffset, headerHeight, openMenu }) => {
    const t = useTheme();
    const goBack = useGoBack();
    const push = usePush();
    const insets = useSafeAreaInsets();

    const channel = useGloballyCachedChannel({ fallback: fallbackChannel });
    const { fid } = useCurrentUser_UNSAFE();
    const { following, toggleFollowing, notified, toggleNotified } =
      useChannelActions({
        channel,
        fid,
        location: 'channel sticky header',
      });

    const role = useUserChannelRole(channel);

    const invite = useCallback(() => {
      push('ChannelManageInvites', {
        channelKey: channel.key,
      });
    }, [push, channel.key]);

    // estimate until measurement
    const overlayAnimStyle = useAnimatedStyle(() => {
      return {
        opacity: interpolate(
          scrollOffset.value,
          [
            coverImageHeight - headerHeight.value, // sticky header hits bottom of
            188 - (headerHeight.value + 10), // just before title animation starts
          ],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      };
    });

    const titleAnimStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(
              scrollOffset.value,
              [
                coverImageHeight + 52 - headerHeight.value, // start page offset of channel name
                256 - headerHeight.value, // end page offset of channel name
              ],
              [42, 0],
              Extrapolation.CLAMP,
            ),
          },
        ],
      };
    });

    const imageUploaderRef = React.useRef<ImageUploaderInterface>(null);

    const onChannelHeaderPress = React.useCallback(() => {
      if (scrollOffset.value === 0) {
        imageUploaderRef.current?.startHeaderImageUpload();
      }
    }, [scrollOffset]);

    const viewerCanManageChannel = React.useMemo(() => {
      return role === 'owner' || role === 'moderator';
    }, [role]);

    return (
      <Pressable
        style={[t.absolute, t.wFull, t.overflowHidden, { top: 0, zIndex: 1 }]}
        onLayout={(e) => {
          headerHeight.value = e.nativeEvent.layout.height;
        }}
        onPress={onChannelHeaderPress}
      >
        <View style={[t.relative, t.pX3, t.pB2, { paddingTop: insets.top }]}>
          <View style={[t.absolute, t.inset0]}>
            <Animated.View
              style={[t.relative, t.wFull, t.hFull, overlayAnimStyle]}
            >
              <HeaderImage
                onImageChange={undefined}
                currentImageUrl={channel.headerImageUrl}
                viewerCanUpdate={viewerCanManageChannel}
                disabled={true}
                imageUploaderRef={imageUploaderRef}
                defaultImageSource={DefaultHeaderImage}
              />
              <View
                style={[
                  {
                    backgroundColor: 'black',
                    opacity: 0.3,
                  },
                  t.absolute,
                  t.inset0,
                ]}
              />
            </Animated.View>
          </View>
          <View style={[t.flexRow, t.justifyBetween]} pointerEvents="box-none">
            <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
              <HeaderIconButton
                Icon={({ color, size }) => (
                  <Octicons name="arrow-left" size={size} color={color} />
                )}
                onPress={goBack}
              />
              <Animated.View
                style={[t.flexRow, t.itemsCenter, { gap: 4 }, titleAnimStyle]}
              >
                <SimplerRemoteImage
                  height={24}
                  width={24}
                  uri={channel.fastImageUrl}
                  style={[t.roundedFull]}
                />
                <Text2 size="lg" style={{ color: '#ffffff' }}>
                  {channel.key}
                </Text2>
              </Animated.View>
            </View>
            <Animated.View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
              {viewerCanManageChannel ? (
                <HeaderIconButton
                  Icon={({ color, size }) => (
                    <Octicons name="person-add" size={size} color={color} />
                  )}
                  onPress={invite}
                />
              ) : (
                <>
                  {!following ? (
                    <HeaderButton title="Follow" onPress={toggleFollowing} />
                  ) : (
                    <HeaderIconButton
                      onPress={toggleNotified}
                      Icon={({ color, size }) =>
                        notified ? (
                          <BellCheckFillIcon size={size} color={color} />
                        ) : (
                          <Octicons name="bell" size={size} color={color} />
                        )
                      }
                    />
                  )}
                </>
              )}
              {(role !== null || following) && (
                <HeaderIconButton
                  Icon={({ color, size }) => (
                    <Octicons
                      name="kebab-horizontal"
                      size={size}
                      color={color}
                    />
                  )}
                  onPress={openMenu}
                />
              )}
            </Animated.View>
          </View>
        </View>
      </Pressable>
    );
  },
);

StickyChannelHeader.displayName = 'SticyChannelHeader';

function HeaderIconButton({
  Icon,
  onPress,
}: {
  Icon: (props: { size: number; color: ColorValue }) => ReactElement;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        {
          height: 34,
          width: 34,
          backgroundColor: 'rgba(36, 41, 46, 0.50)',
        },
      ]}
    >
      {Icon({ color: '#FFFFFF', size: 16 })}
    </Pressable>
  );
}

function HeaderButton({
  title,
  onPress,
}: {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.roundedLg,
        t.pX3,
        {
          height: 34,
          backgroundColor: 'rgba(36, 41, 46, 0.50)',
        },
      ]}
    >
      <Text2 color="primary" weight="semibold" style={{ color: '#FFFFFF' }}>
        {title}
      </Text2>
    </Pressable>
  );
}

ChannelHeader.displayName = 'ChannelHeader';

export { ChannelHeader };
