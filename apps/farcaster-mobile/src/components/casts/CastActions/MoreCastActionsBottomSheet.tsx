import { Ionicons, Octicons } from '@expo/vector-icons';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastFeedIncludeReason,
  getCastURL,
  NEYNAR_MINIAPP_URL,
} from 'farcaster-client-data';
import {
  BookmarkError,
  CastClickType,
  CastReactionType,
  convertCastToCastShareContext,
  DeleteCastError,
  resolveUsername,
  useBookmarkCast,
  useChannelCastAbilities,
  useDeleteCast,
  useDevToolsDomainsOwned,
  useDevToolsForceRefreshCastAttachments,
  useDownvoteCast,
  useMarkVisibleFromCast,
  useMergeIntoGloballyCachedCast,
  usePinCastOnUserProfile,
  useRecordCastFeedback,
  useRemoveCastBookmark,
  useRemoveChannelMember,
  useRemoveUserFromAllFeeds,
  useTrackCastClick,
  useTrackCastReaction,
  useUnpinCast,
  useUnpinCastOnUserProfile,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import { RotateCwIcon } from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  BottomSheetContentContainer,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { useConfirmBanUserBottomSheetModal } from '~/components/ChannelsV3/ConfirmBanUserBottomSheet';
import { useConfirmInviteRestrictedBottomSheetModal } from '~/components/ChannelsV3/ConfirmInviteRestrictedBottomSheet';
import { NeynarIconThick } from '~/components/icons/NeynarIconThick';
import { castInfoPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastToTakeAction } from '~/contexts/CastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { ConfirmRemoveMemberBottomSheet } from '~/contexts/ManageChannelUserProvider';
import { useMuteUser } from '~/contexts/MuteUserProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';
import { trackError } from '~/utils/ErrorUtils';
import { getUserMarkVisibleDisclaimer } from '~/utils/UserVisibilityUtils';

import { PinCastBottomSheet } from './PinCastBottomSheet';
import { ReportCast } from './ReportCast';

type MoreCastActionsBottomSheetProps = {
  cast: ApiCast;
  isFocused?: boolean;
  isPinned?: boolean;
  includeReason?: ApiCastFeedIncludeReason;
  onDismiss: () => void;
  additionalModerationOptions?: ButtonGroupOption[];
};

const PinIcon: React.FC<{ size: number }> = React.memo(({ size }) => {
  const t = useTheme();

  return <Octicons name="pin" size={size} color={t.colors.text.primary} />;
});

const UnpinIcon: React.FC<{ size: number }> = React.memo(({ size }) => {
  const t = useTheme();

  return (
    <View>
      <PinIcon size={size} />
      <Svg
        width="100%"
        height={2}
        style={{
          position: 'absolute',
          top: '40%',
          left: '-15%',
          transform: [{ rotate: '-45deg' }],
        }}
      >
        <Path d="M0 0 L100 0" stroke={t.colors.text.primary} strokeWidth={5} />
      </Svg>
    </View>
  );
});

const MoreCastActionsBottomSheet = ({
  onDismiss,
  isPinned,
  includeReason,
  cast,
  additionalModerationOptions,
}: MoreCastActionsBottomSheetProps) => {
  const t = useTheme();
  const route = useRoute();
  const toast = useRootToast();
  const deleteCast = useDeleteCast();
  const unpinCast = useUnpinCast();
  const trackCastReaction = useTrackCastReaction();
  const pinCastToUserProfile = usePinCastOnUserProfile();
  const unpinCastFromUserProfile = useUnpinCastOnUserProfile();
  const { trackEvent } = useAnalytics();
  const channelKey = cast.channel?.key ?? '';
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const isAdmin = useIsAdmin();
  const { developerModeEnabled } = useUserAppContext();
  const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();
  const viewerRole = useChannelModOrOwner(channelKey);
  const channelAbilities = useChannelCastAbilities({
    viewerFid: currentUserFid,
    viewerRole,
    cast,
  });
  const bottomSheetRef = useBottomSheetModalRef();
  const { dismissAll } = useBottomSheetModal();
  const recordCastFeedback = useRecordCastFeedback();
  const bookmark = useBookmarkCast();
  const downvoteCast = useDownvoteCast();
  const { muteUser } = useMuteUser();
  const markVisible = useMarkVisibleFromCast();
  const removeBookmark = useRemoveCastBookmark();
  const { showGlobalPrompt } = useGlobalPrompts();
  const { setCastToTakeAction } = useCastToTakeAction();
  const removeUserFromAllFeeds = useRemoveUserFromAllFeeds();
  const removeChannelMember = useRemoveChannelMember();
  const confirmBanUserBottomSheetModal = useConfirmBanUserBottomSheetModal({
    channelKey: channelKey ?? '',
    user: cast.author,
  });
  const confirmInviteRestrictedBottomSheetModal =
    useConfirmInviteRestrictedBottomSheetModal({
      restricted: cast.channel?.authorContext?.restricted,
      user: cast.author,
      channelKey: cast.channel?.key ?? '',
    });
  const forceRefreshCastAttachments = useDevToolsForceRefreshCastAttachments();
  const { data: domainsOwned } = useDevToolsDomainsOwned({
    enabled: developerModeEnabled,
  });
  const launchFrame = useLaunchFrame();
  const trackCastClick = useTrackCastClick();

  const bookmarked = cast?.viewerContext?.bookmarked ?? false;
  const targetUserInvisible = !!cast.author.viewerContext?.invisible;
  const targetUserBlocked = !!cast.author.viewerContext?.blocking;
  const shouldShowPinToProfileOption =
    (route.name === 'UserV2' || route.name === 'DeeplinkOnlyUserV2') &&
    cast.author.fid === currentUserFid;
  const shouldHaveHomeFeedRelatedActions = route.name === 'Feed';
  const shouldHaveChannelManagementOptions =
    route.name !== 'UserV2' && route.name !== 'DeeplinkOnlyUserV2';

  const [showingChildBottomSheet, setShowingChildBottomSheet] = useState(false);
  const showingChildBottomSheetRef = useRef(false);
  showingChildBottomSheetRef.current = showingChildBottomSheet;
  const [showConfirmRemoveMemberSheet, setShowConfirmRemoveMemberSheet] =
    useState(false);
  const [showPinCastSheet, setShowPinCastSheet] = useState(false);
  const [showReportCastSheet, setShowReportCastSheet] = useState(false);

  // Derived from props/hooks — never user-toggled, so compute synchronously
  // to avoid stale `true` after deps change to an ineligible state.
  const showForceRefreshCastAttachmentsAction = useMemo(() => {
    // Admins can always trigger a refresh — useful when processing dropped
    // a URL embed entirely (e.g. transient OG fetch failure for a frame),
    // because in that state `cast.embeds.urls` is empty.
    if (isAdmin) return true;
    if (!cast.embeds?.urls.length) return false;
    if (currentUserFid === cast.author.fid) return true;
    return cast.embeds.urls.some(
      (url) =>
        url.openGraph.domain && domainsOwned?.includes(url.openGraph.domain),
    );
  }, [cast.embeds, domainsOwned, currentUserFid, cast.author.fid, isAdmin]);

  useEffect(() => {
    dismissAll();
    const bottomSheet = bottomSheetRef.current;
    bottomSheet?.present();

    return () => {
      bottomSheet?.dismiss();
    };
  }, [bottomSheetRef, dismissAll]);
  const isSubmittingBookmark = useRef(false);

  const handleDismiss = useCallback(() => {
    if (!showingChildBottomSheetRef.current) {
      onDismiss();
    }
  }, [onDismiss]);

  const handleChildDismiss = useCallback(
    (cleanup: () => void) => {
      setShowingChildBottomSheet(false);
      cleanup();
      onDismiss();
    },
    [setShowingChildBottomSheet, onDismiss],
  );

  const showUserUnmuteAlert = useCallback(() => {
    const userVisibilityTitle = getUserMarkVisibleDisclaimer({
      user: cast.author,
    });

    return Alert.alert(
      userVisibilityTitle,
      'Changes may take a few minutes to be reflected.',
      [
        {
          text: 'OK',
        },
      ],
    );
  }, [cast.author]);

  const trackCastAction = useCallback(
    (event: AnalyticsEvent) => {
      trackEvent(event, {
        castHash: cast.hash,
        castFid: cast.author.fid,
        castUsername: cast.author.username || cast.author.displayName,
        castChannelKey: cast?.channel?.key,
      });
    },
    [
      cast.author.displayName,
      cast.author.fid,
      cast.author.username,
      cast?.channel?.key,
      cast.hash,
      trackEvent,
    ],
  );

  const onAskNeynarPress = useCallback(() => {
    const url = new URL(NEYNAR_MINIAPP_URL);
    url.searchParams.set('source', 'cast_button');
    url.searchParams.set(
      'cast_url',
      getCastURL({
        castUsername: cast.author?.username,
        castHash: cast.hash,
      }),
    );
    trackCastClick({
      type: CastClickType.NeynarMiniappCastButton,
      castHash: cast.hash,
    });
    trackEvent(AnalyticsEvent.ClickNeynarMiniappCastButton, {
      castHash: cast.hash,
    });
    launchFrame({
      context: convertCastToCastShareContext(cast),
      config: {
        url: url.toString(),
        name: 'Neynar',
      },
    });
    onDismiss();
  }, [cast, launchFrame, onDismiss, trackCastClick, trackEvent]);

  const askNeynarOptions = useMemo<ButtonGroupOption[]>(
    () => [
      {
        label: 'Ask Neynar',
        onPress: onAskNeynarPress,
        enableHaptics: true,
        icon: ({ size }) => (
          <NeynarIconThick size={size} color={t.colors.text.primary} />
        ),
      },
    ],
    [onAskNeynarPress, t.colors.text.primary],
  );

  const toggleBookmarked = useCallback(async () => {
    if (isSubmittingBookmark.current) {
      return;
    }
    isSubmittingBookmark.current = true;

    trackCastReaction({
      castHash: cast.hash,
      type: CastReactionType.Bookmark,
      undo: bookmarked,
      castFid: cast.author.fid,
      ...(includeReason?.type ? { includeReason: includeReason.type } : {}),
    });

    try {
      if (bookmarked) {
        try {
          removeBookmark({ cast });

          toast.hideAll();
          toast.show('Removed from bookmarks', {
            type: 'castBookmarkRemoved',
            duration: 3000,
            placement: 'bottom',
          });
        } catch (error) {
          toast.show('Failed to remove bookmark from cast', {
            type: 'danger',
          });
          const bookmarkError = new BookmarkError({
            error,
            hash: cast.hash,
          });
          trackError(bookmarkError);
          throw bookmarkError;
        }
      } else {
        try {
          bookmark({ cast });

          toast.hideAll();
          toast.show('Added to bookmarks', {
            type: 'castBookmarked',
            duration: 5000,
            placement: 'bottom',
          });
        } catch (error) {
          toast.show('Failed to bookmark cast', { type: 'danger' });
          const bookmarkError = new BookmarkError({
            error,
            hash: cast.hash,
          });
          trackError(bookmarkError);
          throw bookmarkError;
        }
      }
    } finally {
      isSubmittingBookmark.current = false;
    }
  }, [
    bookmark,
    bookmarked,
    cast,
    includeReason?.type,
    removeBookmark,
    toast,
    trackCastReaction,
  ]);

  const hideCast = useCallback(() => {
    Alert.alert('Are you sure you want to hide this cast?', '', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Hide',
        style: 'destructive',
        onPress: async () => {
          try {
            trackCastAction(AnalyticsEvent.ClickHideCast);
            await downvoteCast({
              castHash: cast.hash,
              channelKey,
              downvote: true,
            });
            toast.show('Cast hidden', {
              type: 'normal',
              placement: 'top',
            });
          } catch (error) {
            trackError(error);
            toast.show('Failed to hide cast', {
              type: 'danger',
              placement: 'top',
            });
          }
        },
      },
    ]);
  }, [cast.hash, channelKey, downvoteCast, toast, trackCastAction]);

  const onForceRefreshCastAttachmentsClick = useCallback(async () => {
    try {
      onDismiss();
      const refreshedCast = await forceRefreshCastAttachments({
        hash: cast.hash,
      });
      mergeIntoGloballyCachedCast({ updates: refreshedCast });

      toast.show('Cast embeds refreshed', {
        type: 'success',
      });
      trackEvent(AnalyticsEvent.ClickRefreshCastEmbeds, {});
    } catch (error) {
      trackError(error);
      toast.show('Error refreshing cast embeds, please try again later', {
        type: 'danger',
      });
    }
  }, [
    forceRefreshCastAttachments,
    mergeIntoGloballyCachedCast,
    toast,
    onDismiss,
    trackEvent,
    cast,
  ]);

  const channelManagementOptions = useMemo(() => {
    if (!shouldHaveChannelManagementOptions) {
      return [];
    }

    const opts: ButtonGroupOption[] = [];

    if (channelAbilities.canAddAsMember) {
      opts.push({
        label: 'Invite to channel',
        onPress: async () => {
          await confirmInviteRestrictedBottomSheetModal.inviteOrOpen();
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Octicons
            name="person-add"
            size={size}
            color={t.colors.text.primary}
          />
        ),
      });
    }

    if (channelAbilities.canPinCast) {
      if (isPinned) {
        opts.push({
          label: 'Unpin from channel',
          enableHaptics: true,
          icon: ({ size }) => <UnpinIcon size={size} />,
          onPress: async () => {
            try {
              onDismiss();
              await unpinCast({ castHash: cast.hash, channelKey });
              toast.show('Cast unpinned', {
                type: 'success',
              });
              trackEvent(AnalyticsEvent.ClickUnpinCast, {});
            } catch (error) {
              trackError(error);
              toast.show('Failed, please try again', {
                type: 'danger',
                placement: 'top',
              });
            }
          },
        });
      } else {
        opts.push({
          label: 'Pin to channel',
          enableHaptics: true,
          icon: ({ size }) => <PinIcon size={size} />,
          onPress: () => {
            setShowingChildBottomSheet(true);
            setShowPinCastSheet(true);
          },
        });
      }
    }

    if (channelAbilities.canHideCast) {
      opts.push({
        label: 'Hide from channel',
        onPress: () => {
          onDismiss();
          hideCast();
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Octicons
            name="eye-closed"
            size={size}
            color={t.colors.text.danger}
          />
        ),
        destructive: true,
      });
    }

    if (channelAbilities.canRemoveAsMember) {
      opts.push({
        label: 'Remove from channel',
        enableHaptics: true,
        onPress: () => {
          setShowConfirmRemoveMemberSheet(true);
          setShowingChildBottomSheet(true);
        },
        destructive: true,
        icon: ({ size }) => (
          <Ionicons
            name="person-remove"
            size={size}
            color={t.colors.text.danger}
          />
        ),
      });
    }

    if (channelAbilities.canBanFromChannel) {
      opts.push({
        label: 'Ban from channel',
        enableHaptics: true,
        destructive: true,
        onPress: () => {
          setShowingChildBottomSheet(true);

          confirmBanUserBottomSheetModal.open({
            onDismiss: () => {
              // TODO: For some reason the more cast actions bottom sheet is
              // temporarily shown after the confirm ban user bottom sheet is
              // dismissed. A minor annoyance.
              handleChildDismiss(() => undefined);
            },
          });
        },
        icon: ({ size }) => (
          <Ionicons name="ban" size={size} color={t.colors.text.danger} />
        ),
      });
    }

    return opts;
  }, [
    shouldHaveChannelManagementOptions,
    channelAbilities.canAddAsMember,
    channelAbilities.canPinCast,
    channelAbilities.canHideCast,
    channelAbilities.canRemoveAsMember,
    channelAbilities.canBanFromChannel,
    confirmInviteRestrictedBottomSheetModal,
    t.colors.text.primary,
    t.colors.text.danger,
    isPinned,
    onDismiss,
    unpinCast,
    cast.hash,
    channelKey,
    toast,
    trackEvent,
    hideCast,
    confirmBanUserBottomSheetModal,
    handleChildDismiss,
  ]);

  const options: ButtonGroupOption[] = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    if (shouldShowPinToProfileOption) {
      if (cast.pinned) {
        opts.push({
          label: 'Unpin from profile',
          enableHaptics: true,
          icon: ({ size }) => <UnpinIcon size={size} />,
          onPress: () => {
            Alert.alert('Unpin from your profile', 'Are you sure?', [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Unpin',
                style: 'destructive',
                onPress: async () => {
                  try {
                    trackEvent(AnalyticsEvent.ClickUnpinCastFromProfile, {});

                    onDismiss();
                    unpinCastFromUserProfile({ cast });
                  } catch (error) {
                    trackError(error);
                    toast.show('Failed, please try again', {
                      type: 'danger',
                      placement: 'top',
                    });
                  }
                },
              },
            ]);
          },
        });
      } else {
        opts.push({
          label: 'Pin to profile',
          enableHaptics: true,
          icon: ({ size }) => <PinIcon size={size} />,
          onPress: () => {
            Alert.alert(
              'Pin this cast',
              'This will appear at the top of your profile and replace any previously pinned cast. Are you sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Pin',
                  onPress: async () => {
                    try {
                      trackEvent(AnalyticsEvent.ClickPinCastToProfile, {});

                      onDismiss();
                      pinCastToUserProfile({ cast });
                    } catch (error) {
                      trackError(error);
                      toast.show('Failed, please try again', {
                        type: 'danger',
                        placement: 'top',
                      });
                    }
                  },
                },
              ],
            );
          },
        });
      }
    }

    if (bookmarked) {
      opts.push({
        label: 'Unbookmark',
        onPress: () => {
          onDismiss();
          toggleBookmarked();
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Octicons
            name="bookmark-slash"
            size={size}
            color={t.colors.text.primary}
          />
        ),
      });
    } else {
      opts.push({
        label: 'Bookmark',
        onPress: () => {
          onDismiss();
          toggleBookmarked();
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Octicons name="bookmark" size={size} color={t.colors.text.primary} />
        ),
      });
    }

    opts.push({
      label: 'Copy cast hash',
      onPress: async () => {
        await Clipboard.setStringAsync(cast.hash);
        toast.show('Cast hash copied to clipboard', {
          type: 'success',
          placement: 'bottom',
        });
        onDismiss();
      },
      enableHaptics: true,
      icon: ({ size }) => (
        <Octicons name="copy" size={size} color={t.colors.text.primary} />
      ),
    });

    if (
      currentUserFid !== cast.author.fid &&
      shouldHaveHomeFeedRelatedActions
    ) {
      opts.push({
        label: 'Why is this cast here?',
        onPress: () => {
          trackEvent(AnalyticsEvent.ShowCastInfo, {});
          setCastToTakeAction({
            cast: {
              ...cast,
              reason: includeReason,
            },
          });

          onDismiss();
          showGlobalPrompt({ key: castInfoPromptKey });
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Octicons name="info" size={size} color={t.colors.text.primary} />
        ),
      });
      opts.push({
        label: 'Show fewer like this',
        onPress: async () => {
          toast.show('Casts like this will appear less often', {
            placement: 'top',
            type: 'normal',
          });

          onDismiss();
          await recordCastFeedback({ castHash: cast.hash });

          trackEvent(AnalyticsEvent.ClickShowFewerLikeThis, undefined);
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Octicons
            name="thumbsdown"
            size={size}
            color={t.colors.text.primary}
          />
        ),
      });
    }
    if (showForceRefreshCastAttachmentsAction) {
      opts.push({
        label: 'Refresh embeds',
        enableHaptics: true,
        icon: ({ size }) => (
          <RotateCwIcon size={size} color={t.colors.text.primary} />
        ),
        onPress: onForceRefreshCastAttachmentsClick,
      });
    }

    return opts;
  }, [
    bookmarked,
    cast,
    currentUserFid,
    includeReason,
    onDismiss,
    onForceRefreshCastAttachmentsClick,
    pinCastToUserProfile,
    recordCastFeedback,
    setCastToTakeAction,
    shouldHaveHomeFeedRelatedActions,
    shouldShowPinToProfileOption,
    showForceRefreshCastAttachmentsAction,
    showGlobalPrompt,
    t.colors.text.primary,
    toast,
    toggleBookmarked,
    trackEvent,
    unpinCastFromUserProfile,
  ]);

  const moderationOptions = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    if (!channelAbilities.canHideCast && !channelKey && isAdmin) {
      opts.push({
        label: 'Hide cast',
        onPress: () => {
          onDismiss();
          hideCast();
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Octicons
            name="eye-closed"
            size={size}
            color={t.colors.text.primary}
          />
        ),
      });
    }

    if (currentUserFid !== cast.author.fid) {
      opts.push({
        label: 'Report cast',
        onPress: () => {
          setShowingChildBottomSheet(true);
          setShowReportCastSheet(true);
        },
        enableHaptics: true,
        icon: ({ size }) => (
          <Ionicons name="flag" size={size} color={t.colors.text.primary} />
        ),
      });
      if (cast.castType !== 'root-embed') {
        if (targetUserInvisible) {
          opts.push({
            label: targetUserBlocked ? 'Unblock user' : 'Unmute user',
            onPress: async () => {
              try {
                onDismiss();
                await markVisible({
                  targetFid: cast.author.fid,
                  castHash: cast.hash,
                });

                if (cast.author.viewerContext?.blocking) {
                  trackEvent(AnalyticsEvent.ClickUnblock, undefined);
                } else {
                  trackEvent(AnalyticsEvent.ClickUnmute, undefined);
                }

                showUserUnmuteAlert();
              } catch (error) {
                trackError(error);
                toast.show('Failed, please try again', {
                  type: 'danger',
                  placement: 'top',
                });
              }
            },
            enableHaptics: true,
            icon: ({ size }) => (
              <Ionicons
                name="volume-mute"
                size={size}
                color={t.colors.text.primary}
              />
            ),
          });
        } else {
          opts.push({
            label: 'Mute user',
            onPress: () => {
              onDismiss();
              muteUser({
                targetFid: cast.author.fid,
                username: resolveUsername({
                  username: cast.author.username,
                  fid: cast.author.fid,
                }),
                source: 'cast',
                block: false,
              });
            },
            enableHaptics: true,
            icon: ({ size }) => (
              <Ionicons
                name="volume-mute"
                size={size}
                color={t.colors.text.danger}
              />
            ),
            destructive: true,
          });
          opts.push({
            label: 'Block user',
            onPress: () => {
              onDismiss();
              muteUser({
                targetFid: cast.author.fid,
                username: resolveUsername({
                  username: cast.author.username,
                  fid: cast.author.fid,
                }),
                source: 'cast',
                block: true,
              });
            },
            enableHaptics: true,
            destructive: true,
            icon: ({ size }) => (
              <Octicons
                name="blocked"
                size={size}
                color={t.colors.text.danger}
              />
            ),
          });
        }
        if (
          additionalModerationOptions &&
          additionalModerationOptions.length > 0 &&
          isAdmin
        ) {
          opts.push(
            ...additionalModerationOptions.map((x) => ({
              ...x,
              onPress: async () => {
                await x.onPress();
                onDismiss();
              },
            })),
          );
        }
      }
    }

    return opts;
  }, [
    cast.author.fid,
    cast.author.username,
    cast.author.viewerContext?.blocking,
    cast.castType,
    cast.hash,
    channelAbilities.canHideCast,
    channelKey,
    currentUserFid,
    hideCast,
    isAdmin,
    markVisible,
    muteUser,
    onDismiss,
    additionalModerationOptions,
    showUserUnmuteAlert,
    t.colors.text.danger,
    t.colors.text.primary,
    targetUserBlocked,
    targetUserInvisible,
    toast,
    trackEvent,
  ]);

  const destructiveOptions = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    if (currentUserFid === cast.author.fid) {
      opts.push({
        label: 'Delete',
        enableHaptics: true,
        icon: ({ size }) => (
          <Ionicons name="trash" size={size} color={t.colors.text.danger} />
        ),
        destructive: true,
        onPress: () => {
          Alert.alert('Are you sure you want to delete this cast?', '', [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  onDismiss();

                  trackEvent(AnalyticsEvent.CastDelete, {
                    castHash: cast.hash,
                    castFid: cast.author.fid,
                  });

                  await deleteCast({ cast });
                } catch (error) {
                  trackError(new DeleteCastError({ error, hash: cast.hash }));
                  toast.show('Failed to delete cast.', {
                    type: 'danger',
                    placement: 'top',
                  });
                }
              },
            },
          ]);
        },
      });
    }

    return opts;
  }, [
    cast,
    currentUserFid,
    deleteCast,
    onDismiss,
    t.colors.text.danger,
    toast,
    trackEvent,
  ]);

  const confirmRemoveMemberModalRef = useRef<{
    dismiss: () => void;
  }>(null);

  const [handleDismissRemoveMember, setHandleDismissRemoveMember] = useState<
    () => void
  >(() => undefined);

  useEffect(() => {
    if (showConfirmRemoveMemberSheet) {
      // Capture modalRef value when sheet is shown, if we don't do this, the modalRef will be null
      // so we won't be able to dismiss the sheet.
      const modalRef = confirmRemoveMemberModalRef.current;
      setHandleDismissRemoveMember(() => () => {
        if (modalRef) {
          modalRef.dismiss();
        }
        setShowConfirmRemoveMemberSheet(false);
      });
    }
  }, [showConfirmRemoveMemberSheet]);

  const removeMember = useCallback(async () => {
    try {
      await removeChannelMember({
        removeFid: cast.author.fid,
        channelKey: channelKey!,
        actorFid: currentUserFid,
      });

      removeUserFromAllFeeds({
        fid: cast.author.fid,
      });

      toast.show('User removed', {
        type: 'normal',
        placement: 'top',
      });
    } catch (error) {
      toast.show('Failed to remove user', {
        type: 'danger',
        placement: 'top',
      });
    } finally {
      handleDismissRemoveMember();
    }
  }, [
    cast.author.fid,
    channelKey,
    currentUserFid,
    removeChannelMember,
    removeUserFromAllFeeds,
    toast,
    handleDismissRemoveMember,
  ]);

  return (
    <>
      <BottomSheetModal
        name="castMoreActions"
        ref={bottomSheetRef}
        onDismiss={handleDismiss}
        enableDynamicSizing
      >
        <BottomSheetContentContainer>
          <View style={[{ gap: 16 }]}>
            <ButtonGroup options={askNeynarOptions} />
            {channelManagementOptions.length > 0 && (
              <ButtonGroup options={channelManagementOptions} />
            )}
            <ButtonGroup options={options} />
            {moderationOptions.length > 0 && (
              <ButtonGroup options={moderationOptions} />
            )}
            <ButtonGroup options={destructiveOptions} />
          </View>
        </BottomSheetContentContainer>
      </BottomSheetModal>
      {showReportCastSheet && (
        <ReportCast
          castHash={cast.hash}
          targetUser={cast.author}
          currentUserFid={currentUserFid}
          onDismiss={() =>
            handleChildDismiss(() => setShowReportCastSheet(false))
          }
        />
      )}
      {showPinCastSheet && channelKey && (
        <PinCastBottomSheet
          castHash={cast.hash}
          channelKey={channelKey}
          onDismiss={() => handleChildDismiss(() => setShowPinCastSheet(false))}
        />
      )}
      {showConfirmRemoveMemberSheet && (
        <AutoDisplayingBottomSheetModal
          ref={confirmRemoveMemberModalRef}
          name="confirmRemoveMember"
          onDismiss={() => {
            handleChildDismiss(() => setShowConfirmRemoveMemberSheet(false));
          }}
        >
          <ConfirmRemoveMemberBottomSheet
            username={resolveUsername(cast.author)}
            onCancel={handleDismissRemoveMember}
            onConfirm={removeMember}
          />
        </AutoDisplayingBottomSheetModal>
      )}
      {confirmInviteRestrictedBottomSheetModal.Component}
      {confirmBanUserBottomSheetModal.Component}
    </>
  );
};

export { MoreCastActionsBottomSheet };
