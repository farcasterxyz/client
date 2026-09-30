import {
  ApiCastFeedIncludeReason,
  ApiCaststormCast,
  ApiUser,
} from 'farcaster-client-data';

import { CreateCastScreenParams, HomeScreenParams } from '~/types';

type CreateCastParamsOfInterest = Pick<CreateCastScreenParams, 'intent'>;

type FeedParamsOfInterest = Pick<HomeScreenParams, 'castComposerIntent'>;

const createCastParamsWithIntent = ({
  text,
  embeds,
  mentions,
  channelKey,
  activeDraftId,
  feed,
  includeReason,
  tokenKey,
  parentCastHash,
  draftCasts,
  scheduledAt,
}: {
  text?: string;
  embeds?: string[];
  mentions?: ApiUser[];
  channelKey?: string;
  activeDraftId?: string;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  tokenKey?: string;
  parentCastHash?: string;
  draftCasts?: ApiCaststormCast[];
  scheduledAt?: Date;
}): CreateCastParamsOfInterest => {
  const paramsText = text || '';
  const paramsEmbeds = embeds || [];
  const paramsMentions = mentions || [];

  return {
    intent: {
      text: paramsText,
      embeds: paramsEmbeds,
      mentions: paramsMentions,
      channelKey,
      activeDraftId,
      feed,
      includeReason,
      tokenKey,
      parentCastHash,
      draftCasts,
      scheduledAt,
    },
  };
};

const createFeedParamsWithIntent = ({
  text,
  embeds,
  mentions,
  channelKey,
  feed,
  includeReason,
  parentCastHash,
}: {
  text?: string | null;
  embeds?: string[];
  mentions?: ApiUser[];
  channelKey?: string;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  parentCastHash?: string;
}): FeedParamsOfInterest => {
  const paramsText = text || '';
  const paramsEmbeds = embeds || [];
  const paramsMentions = mentions || [];

  return {
    castComposerIntent: {
      text: paramsText,
      embeds: paramsEmbeds,
      mentions: paramsMentions,
      channelKey,
      feed,
      includeReason,
      parentCastHash,
    },
  };
};

export { createCastParamsWithIntent, createFeedParamsWithIntent };
