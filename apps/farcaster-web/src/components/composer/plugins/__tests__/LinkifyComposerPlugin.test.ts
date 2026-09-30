import { isOpenGraphLinkMatch } from '~/components/composer/plugins/LinkifyComposerPlugin';
import {
  ETH_CHAIN_URI_PREFIX,
  getComposerInstance,
} from '~/utils/linkify/linkifyUtils';

describe('isOpenGraphLinkMatch', () => {
  const linkify = getComposerInstance();

  it('excludes user mentions from OpenGraph attachment candidates', () => {
    const matches =
      linkify.match(
        'Built with fragments by @nikolaii.eth, @livmore, @bertwurst.eth, @grin, and @bigeon',
      ) ?? [];

    expect(matches).toHaveLength(5);
    expect(matches.filter(isOpenGraphLinkMatch)).toEqual([]);
  });

  it('keeps real links as OpenGraph attachment candidates', () => {
    const matches = linkify.match('check out farcaster.xyz') ?? [];

    expect(
      matches.filter(isOpenGraphLinkMatch).map((match) => match.url),
    ).toEqual(['https://farcaster.xyz']);
  });

  it('keeps real links while excluding mentions in the same text', () => {
    const matches =
      linkify.match('Built with @grin and @livmore on farcaster.xyz') ?? [];

    expect(
      matches.filter(isOpenGraphLinkMatch).map((match) => match.url),
    ).toEqual(['https://farcaster.xyz']);
  });

  it('excludes non-URL clickable objects from OpenGraph attachment candidates', () => {
    const contractAddress = '0x0000000000000000000000000000000000000000';
    const solanaAddress = '11111111111111111111111111111111';
    const chainUrl = `${ETH_CHAIN_URI_PREFIX}erc20:${contractAddress}`;
    const matches =
      linkify.match(`$degen ${contractAddress} ${solanaAddress} ${chainUrl}`) ??
      [];

    expect(matches).toHaveLength(4);
    expect(matches.filter(isOpenGraphLinkMatch)).toEqual([]);
  });
});
