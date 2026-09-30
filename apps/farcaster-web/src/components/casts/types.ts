import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { CastComposerEmbeds } from 'farcaster-client-hooks';

import { ApiCastWithContext } from '~/types';

export type CastProps = {
  castWithContext: ApiCastWithContext;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  isAdminGatedFeedCast?: boolean;
};

export type CastDraftKeyParams = {
  parentHash: string | undefined;
};

export type CastDraft = {
  savedAt: number;
  text: string;
  embeds: CastComposerEmbeds;
  channelKey?: string;
};

export type CastDrafts = Record<string, CastDraft | undefined>;
