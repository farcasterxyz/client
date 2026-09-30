import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { ApiCast } from 'farcaster-client-data';
import {
  buildApiCastUrlEmbedFromMetadata,
  castIsParentUrlHeader,
  extractCastKey,
} from 'farcaster-client-hooks';

import {
  cashtagMentionRegexForAutocomplete,
  channelMentionRegexForAutocomplete,
  mentionRegexForAutocomplete,
  preMentionAutocompleteRegEx,
} from '~/constants/Regex';
import { sizes } from '~/contexts/ThemeProvider';

const openGraphAttachmentNormalHeight = sizes.s26;
const openGraphAttachmentLargeHeight = sizes.s38;

const MAX_DIRECT_CAST_TEXT_LENGTH = 1024;

const shouldShowCastReplyingTo = ({
  cast,
  isFocusedCast,
  omitReplyingTo,
}: {
  cast: ApiCast;
  isFocusedCast: boolean;
  omitReplyingTo: boolean;
}) => {
  if (omitReplyingTo) {
    return false;
  }

  if (isFocusedCast) {
    return false;
  }

  if (!cast.parentAuthor && !cast.parentSource) {
    return false;
  }

  // Do not show "Replying to external content" if the cast
  // has a channel tag (whether displayed in the cast or at the top of the
  // thread)
  if (cast.parentSource && !!cast.channel) {
    return false;
  }

  return true;
};

// We want to show the label for recasts in general,
// except; we don't want to show the label for self casts the profile user viewing recasted.
// The recast still will have the label however, the original cast won't. (goksu)
// See: https://github.com/merkle-manufactory/desktop/issues/1649
const shouldShowRecastLabel = ({
  cast,
  isFocusedCast,
  omitRecastLabel,
  isPinned,
}: {
  cast: ApiCast;
  isFocusedCast: boolean;
  omitRecastLabel: boolean;
  isPinned?: boolean;
}) => {
  if (isPinned) {
    return false;
  }

  if (isFocusedCast) {
    return false;
  }

  if (omitRecastLabel) {
    return false;
  }

  if (!cast.recasts.recasters || cast.recasts.recasters.length === 0) {
    return false;
  }

  return true;
};

const getGenericAutocompleteMentionInfo = (
  text: string,
  selection:
    | undefined
    | {
        start: number;
        end: number;
      },
  mentionToken: string,
  mentionRegExp: RegExp,
) => {
  if (!selection) {
    return;
  }

  const nearestTokenIndex = text
    .slice(0, selection.end)
    .lastIndexOf(mentionToken);

  if (nearestTokenIndex === -1) {
    return;
  }

  // Ensure the character before the token matches what Linkify expects
  if (
    nearestTokenIndex > 0 &&
    !preMentionAutocompleteRegEx.test(text.charAt(nearestTokenIndex - 1))
  ) {
    return;
  }

  const possibleMentionText = text.slice(nearestTokenIndex, selection.end);
  const mentionMatch = possibleMentionText.match(mentionRegExp);

  if (!mentionMatch && text[text.length - 1] === mentionToken) {
    return {
      replace: {
        start: nearestTokenIndex + 1,
        end: nearestTokenIndex + 1,
      },
      text: '',
    };
  } else if (!mentionMatch) {
    return;
  }

  const mentionText = mentionMatch[0].slice(1);

  return {
    replace: {
      start: nearestTokenIndex + 1,
      end: nearestTokenIndex + 1 + mentionText.length,
    },
    text: mentionText,
  };
};

type MatchedAutocompleteMentionInfo = {
  text: string;
  replace: {
    start: number;
    end: number;
  };
  type: 'user' | 'channel' | 'token';
};

const getAutocompleteMentionInfo = (
  text: string,
  selection:
    | undefined
    | {
        start: number;
        end: number;
      },
): MatchedAutocompleteMentionInfo | undefined => {
  const userMentionInfo = getGenericAutocompleteMentionInfo(
    text,
    selection,
    '@',
    mentionRegexForAutocomplete,
  );
  if (userMentionInfo) {
    return { ...userMentionInfo, type: 'user' };
  }

  const channelMentionInfo = getGenericAutocompleteMentionInfo(
    text,
    selection,
    '/',
    channelMentionRegexForAutocomplete,
  );
  if (channelMentionInfo) {
    return { ...channelMentionInfo, type: 'channel' };
  }

  const tokenMentionInfo = getGenericAutocompleteMentionInfo(
    text,
    selection,
    '$',
    cashtagMentionRegexForAutocomplete,
  );
  if (tokenMentionInfo) {
    return { ...tokenMentionInfo, type: 'token' };
  }
};

const getOpenGraphImageTypeAndHeight = (
  ogDomain: string | undefined,
  ogUseLargeImage: boolean | undefined,
) => {
  const forceFallbackAsset = false;

  const useLargeImage = !forceFallbackAsset && ogUseLargeImage;

  let imageHeight = openGraphAttachmentNormalHeight;
  if (!forceFallbackAsset) {
    imageHeight = useLargeImage
      ? openGraphAttachmentLargeHeight
      : openGraphAttachmentNormalHeight;
  }
  return { forceFallbackAsset, useLargeImage, imageHeight };
};

const logCreateCastRumAction = (
  eventName: string,
  context?: Record<string, unknown>,
) => {
  DdRum.addAction(RumActionType.CUSTOM, eventName, context);
};

export {
  buildApiCastUrlEmbedFromMetadata,
  castIsParentUrlHeader,
  // Re-export while we transition to using it directly
  extractCastKey,
  getAutocompleteMentionInfo,
  getGenericAutocompleteMentionInfo,
  getOpenGraphImageTypeAndHeight,
  logCreateCastRumAction,
  MAX_DIRECT_CAST_TEXT_LENGTH,
  shouldShowCastReplyingTo,
  shouldShowRecastLabel,
};
