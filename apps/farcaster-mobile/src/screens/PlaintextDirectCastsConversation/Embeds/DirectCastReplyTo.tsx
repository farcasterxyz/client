import { Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ApiDirectCastMessageMetadata,
  ApiDirectCastMessageUserContext,
  ApiUser,
} from 'farcaster-client-data';
import { formatTimeAgo, resolveUsernameShort } from 'farcaster-client-hooks';
import React from 'react';
import { ImageSourcePropType, Pressable, View } from 'react-native';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text } from '~/components/Text';
import { imageRequestHeaders } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { DirectCastAvatar } from '~/screens/PlaintextDirectCastsConversation/DirectCastAvatar';

type DirectCastReplyToProps = {
  directCastMessageId: string;
  directCastMessage: string;
  directCastSender: ApiDirectCastMessageUserContext;
  directCastMetadata: ApiDirectCastMessageMetadata | undefined;
  directCastTimestamp: number;
  currentUserFid: number;
  renderingInComposer: boolean;
  renderingInSelfDirectCast: boolean;
  renderingInOverlayBubble: boolean;
  composerDismissReplyPress: (() => void) | undefined;
  onPress: (({ messageId }: { messageId: string }) => void) | undefined;
};

const DirectCastReplyTo: React.FC<DirectCastReplyToProps> = React.memo(
  ({
    directCastMessageId,
    directCastMessage,
    directCastSender,
    directCastMetadata,
    directCastTimestamp,
    currentUserFid,
    renderingInComposer,
    renderingInOverlayBubble,
    composerDismissReplyPress,
    onPress,
    renderingInSelfDirectCast,
  }) => {
    const t = useTheme();

    const replyDirectCastDisplayName =
      directCastSender.fid === currentUserFid
        ? 'You'
        : resolveUsernameShort({
            username: directCastSender.username,
            fid: directCastSender.fid,
          });

    const backgroundColor = React.useMemo(() => {
      return renderingInSelfDirectCast
        ? t.directCasts.bgSelfReply
        : t.directCasts.bgReply;
    }, [
      t.directCasts.bgSelfReply,
      t.directCasts.bgReply,
      renderingInSelfDirectCast,
    ]);

    const replyWrapperLeftBorderColor = React.useMemo(() => {
      return renderingInSelfDirectCast
        ? t.dark
          ? '#8F7BCC'
          : '#7C65C1'
        : t.dark
          ? '#8F7BCC'
          : '#7C65C1';
    }, [renderingInSelfDirectCast, t.dark]);

    const imageToRender = React.useMemo(() => {
      if (
        typeof directCastMetadata !== 'undefined' &&
        typeof directCastMetadata.medias !== 'undefined' &&
        directCastMetadata.medias.length !== 0
      ) {
        return directCastMetadata.medias[0];
      }

      return undefined;
    }, [directCastMetadata]);

    const message = React.useMemo(() => {
      if (typeof imageToRender !== 'undefined') {
        return directCastMessage.startsWith(imageToRender.staticRaster)
          ? directCastMessage.split(imageToRender.staticRaster)[1].trim()
          : 'Photo';
      }

      return directCastMessage;
    }, [directCastMessage, imageToRender]);

    const imageToRenderSource: ImageSourcePropType | undefined =
      React.useMemo(() => {
        if (typeof imageToRender === 'undefined') {
          return undefined;
        }

        return {
          uri: imageToRender.staticRaster,
          headers: imageRequestHeaders,
        } satisfies ImageSourcePropType;
      }, [imageToRender]);

    const imageEmbedToRender = React.useMemo(() => {
      if (
        typeof directCastMetadata !== 'undefined' &&
        typeof directCastMetadata.medias !== 'undefined' &&
        directCastMetadata.medias.length !== 0
      ) {
        return (
          <View
            style={[
              t.overflowHidden,
              {
                maxHeight: 64,
                width: 64,
                borderTopRightRadius: 6,
                borderBottomRightRadius: 6,
              },
            ]}
          >
            <Image
              source={imageToRenderSource}
              style={[{ height: '100%', width: '100%', objectFit: 'cover' }]}
              cachePolicy="memory-disk"
              recyclingKey={imageToRenderSource?.uri}
            />
          </View>
        );
      }

      return null;
    }, [directCastMetadata, imageToRenderSource, t.overflowHidden]);

    const timeString = React.useMemo(() => {
      return formatTimeAgo(directCastTimestamp, 'floor');
    }, [directCastTimestamp]);

    const replyWrapperStyle = React.useMemo(() => {
      return [
        renderingInComposer
          ? [t.mL2, t.mT2, { width: '94.5%' }]
          : renderingInOverlayBubble
            ? [t.flex, t.wFull]
            : [t.flex1],
        t.relative,
        renderingInComposer ? t.bgMuted : backgroundColor,
        t.flexRow,
        t.justifyBetween,
        { borderRadius: 8 },
      ];
    }, [
      backgroundColor,
      renderingInComposer,
      renderingInOverlayBubble,
      t.bgMuted,
      t.flex,
      t.flex1,
      t.flexRow,
      t.justifyBetween,
      t.mL2,
      t.mT2,
      t.relative,
      t.wFull,
    ]);

    const replyWrapperLeftBorderStyle = React.useMemo(() => {
      return [
        t.absolute,
        t.top0,
        t.wFull,
        t.flex,
        t.flexCol,
        { backgroundColor: replyWrapperLeftBorderColor },
        renderingInComposer && backgroundColor,
        t.w1,
        t.hFull,
        { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
      ];
    }, [
      backgroundColor,
      replyWrapperLeftBorderColor,
      renderingInComposer,
      t.absolute,
      t.flex,
      t.flexCol,
      t.hFull,
      t.top0,
      t.w1,
      t.wFull,
    ]);

    const replyBodyStyle = React.useMemo(() => {
      return [
        t.flex,
        t.flexCol,
        t.justifyStart,
        { padding: 6, marginLeft: 4 },
        typeof imageToRender !== 'undefined' && [{ maxWidth: '70%' }],
      ];
    }, [imageToRender, t.flex, t.flexCol, t.justifyStart]);

    const replyBodyDisplayNameStyle = React.useMemo(() => {
      return [
        t.textXs,
        renderingInSelfDirectCast
          ? t.directCasts.textSelfReplyUsername
          : t.directCasts.textReplyUsername,
        t.fontSemibold,
      ];
    }, [
      renderingInSelfDirectCast,
      t.fontSemibold,
      t.directCasts.textReplyUsername,
      t.directCasts.textSelfReplyUsername,
      t.textXs,
    ]);

    const replyBodyTextStyle = React.useMemo(() => {
      return [
        t.textXs,
        renderingInComposer ? t.texts.primary : t.texts.primary,
        { paddingTop: 2 },
      ];
    }, [renderingInComposer, t.texts.primary, t.textXs]);

    const onPressInternal = React.useCallback(() => {
      if (typeof onPress === 'function') {
        onPress({ messageId: directCastMessageId });
      }
    }, [directCastMessageId, onPress]);

    const isProUser = useUserLevel(directCastSender as ApiUser) === 'pro';

    return (
      <Pressable style={replyWrapperStyle} onPress={onPressInternal}>
        <View style={replyWrapperLeftBorderStyle} />
        <View style={replyBodyStyle}>
          <View style={[t.flexRow, { gap: 4 }]}>
            {/* @ts-expect-error FIXME: The context is not the full ApiUser prop */}
            <DirectCastAvatar user={directCastSender} diameter={14} />
            <Text style={replyBodyDisplayNameStyle}>
              {replyDirectCastDisplayName}
            </Text>
            {isProUser && <FarcasterProBadge size={14} />}
            <Text style={replyBodyDisplayNameStyle}>·</Text>
            <Text style={replyBodyDisplayNameStyle}>{timeString}</Text>
          </View>
          <Text style={replyBodyTextStyle} numberOfLines={2}>
            {message}
          </Text>
        </View>
        {imageEmbedToRender}
        {renderingInComposer &&
          typeof composerDismissReplyPress !== 'undefined' && (
            <Pressable
              style={[
                t.w4,
                t.h4,
                t.absolute,
                t.right0,
                t.directCasts.bgImagePreview,
                t.roundedFull,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.mT1,
                t.mR1,
              ]}
              onPress={composerDismissReplyPress}
            >
              <Octicons name="x" style={[{ color: '#ffffff' }]} size={14} />
            </Pressable>
          )}
      </Pressable>
    );
  },
);

DirectCastReplyTo.displayName = 'DirectCastReplyTo';

export { DirectCastReplyTo };
