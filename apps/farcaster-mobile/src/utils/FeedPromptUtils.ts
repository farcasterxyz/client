import { HomeScreenParams, MintWithWarpsDeepLinkedPrompt } from '~/types';

type FeedParamsWithMintPrompt = Pick<HomeScreenParams, 'prompt'>;

const createFeedParamsWithMintPrompt = ({
  url,
}: {
  url?: string;
}): FeedParamsWithMintPrompt => {
  if (typeof url === 'undefined' || url === null) {
    return { prompt: undefined };
  }

  const prompt: MintWithWarpsDeepLinkedPrompt = {
    type: 'mint-with-warps',
    params: { url },
  };

  return { prompt };
};

export { createFeedParamsWithMintPrompt };
