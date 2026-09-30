import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiCaststormCast,
} from 'farcaster-client-data';

import { Routes } from '~/types/routing';

export type ComposeSearchParams = Partial<Routes['compose']['search']>;

export type CastComposerIntent = ComposeSearchParams & {
  activeDraftId?: string;
  addressedToUsername?: string;
  draftCasts?: ApiCaststormCast[];
  parentCast?: ApiCast;
  includeReason?: ApiCastFeedIncludeReason['type'];
  scheduledAt?: Date;
};
