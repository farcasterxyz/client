import {
  getComposerInstance,
  getDefaultLinkifyInstance,
} from '~/utils/linkify/linkifyUtils';

const ADDRESS = '0x4ed4e862860bed51a9570b96d89af5e1b0efefed';
const OTHER_ADDRESS = '0xabc0000000000000000000000000000000000123';

describe.each([
  ['default', getDefaultLinkifyInstance],
  ['composer', getComposerInstance],
])('0x contract address matching (%s instance)', (_, getInstance) => {
  const matchTexts = (text: string) =>
    (getInstance().match(text) ?? []).map((match) => ({
      text: match.text,
      withinText: match.lastIndex <= text.length,
    }));

  it('links a standalone contract address', () => {
    expect(matchTexts(`CA: ${ADDRESS}`)).toEqual([
      { text: ADDRESS, withinText: true },
    ]);
  });

  it('links each of several addresses', () => {
    expect(matchTexts(`${ADDRESS} and ${OTHER_ADDRESS}`)).toEqual([
      { text: ADDRESS, withinText: true },
      { text: OTHER_ADDRESS, withinText: true },
    ]);
  });

  it('does not link a short 0x token that follows an address', () => {
    const text = `${ADDRESS}, tx 0x5f3a2b hash. gm @dwr`;
    const matches = matchTexts(text);

    expect(matches.every((match) => match.withinText)).toBe(true);
    expect(matches.map((match) => match.text)).not.toContain(
      '0x5f3a2b hash. gm @dwr',
    );
    expect(matches[0]).toEqual({ text: ADDRESS, withinText: true });
  });

  it('does not link an uppercase 0X prefix', () => {
    expect(matchTexts(`0X${ADDRESS.slice(2)}`)).toEqual([]);
  });

  it('does not link a bare "0x" word elsewhere in the text', () => {
    const text = `https://basescan.org/token/${ADDRESS} and the 0x protocol is great`;
    const matches = matchTexts(text);

    expect(matches.every((match) => match.withinText)).toBe(true);
    expect(matches.some((match) => match.text.startsWith('0x protocol'))).toBe(
      false,
    );
  });
});
