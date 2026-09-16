import { ApiCastUrlEmbed, ApiOpenGraphMetadata } from 'farcaster-client-data';
import { useMemo } from 'react';

import {
  shouldRenderAppAttachment,
  shouldRenderChannelAttachment,
  shouldRenderCoinAttachment,
  shouldRenderContractAddressAttachment,
  shouldRenderExploreChannels,
  shouldRenderNewsArticleAttachment,
  shouldRenderQuoteTweet,
  shouldRenderRichWarpcastAttachment,
  shouldRenderStarterPackAttachment,
  shouldRenderWarpcastSettingsAttachment,
} from '~/utils/openGraphUtils';

export type OpenGraphRenderType =
  | 'url'
  | 'quote-tweet'
  | 'faux-quote-cast'
  | 'channel-attachment'
  | 'explore-channels'
  | 'app-attachment'
  | 'warpcast-settings'
  | 'starter-pack'
  | 'contract-address'
  | 'rich-warpcast-attachment'
  | 'token'
  | 'news';

function getOpenGraphType({
  urlEmbed: attachment,
}: {
  urlEmbed: ApiOpenGraphMetadata;
}): OpenGraphRenderType {
  if (shouldRenderExploreChannels({ attachment })) {
    return 'explore-channels';
  }

  if (shouldRenderChannelAttachment({ attachment })) {
    return 'channel-attachment';
  }

  if (shouldRenderAppAttachment({ attachment })) {
    return 'app-attachment';
  }

  if (shouldRenderQuoteTweet({ attachment })) {
    return 'quote-tweet';
  }

  if (shouldRenderWarpcastSettingsAttachment({ attachment })) {
    return 'warpcast-settings';
  }

  if (shouldRenderStarterPackAttachment({ attachment })) {
    return 'starter-pack';
  }

  if (shouldRenderRichWarpcastAttachment({ attachment })) {
    return 'rich-warpcast-attachment';
  }

  if (shouldRenderContractAddressAttachment({ urlEmbed: attachment })) {
    return 'contract-address';
  }

  if (shouldRenderCoinAttachment({ urlEmbed: attachment })) {
    return 'token';
  }

  if (shouldRenderNewsArticleAttachment({ attachment })) {
    return 'news';
  }

  return 'url';
}

const useOpenGraphType = ({ urlEmbed }: { urlEmbed: ApiCastUrlEmbed }) => {
  return useMemo(
    () => getOpenGraphType({ urlEmbed: urlEmbed.openGraph }),
    [urlEmbed],
  );
};

export { getOpenGraphType, useOpenGraphType };
