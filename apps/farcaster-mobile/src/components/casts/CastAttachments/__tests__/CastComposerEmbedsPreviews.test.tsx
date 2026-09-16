import { fireEvent, render } from '@testing-library/react-native';
import { ApiCastEmbeds } from 'farcaster-client-data';
import React from 'react';

import { CastComposerEmbedsPreviews } from '../CastComposerEmbedsPreviews';

jest.mock('@expo/vector-icons', () => ({
  Octicons: () => null,
}));

jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Image: View,
  };
});

jest.mock('farcaster-client-hooks', () => ({
  buildQuoteCastUrlSet: () => new Set(),
  isQuoteCastUrl: () => false,
}));

jest.mock('../OpenGraphCastAttachmentPreview', () => ({
  OpenGraphCastAttachmentPreview: () => null,
}));

jest.mock('../QuoteCast', () => ({
  QuoteCast: () => null,
}));

jest.mock('~/constants/Pressable', () => ({
  hitSlopLg: 10,
}));

jest.mock('~/contexts/ThemeProvider', () => {
  const baseStyle = {};
  const theme = new Proxy(
    {
      colors: {
        text: {
          light: '#fff',
        },
      },
    },
    {
      get(target, prop: string) {
        if (prop in target) {
          return (target as Record<string, unknown>)[prop];
        }

        return baseStyle;
      },
    },
  );

  return {
    useTheme: () => theme,
  };
});

describe('CastComposerEmbedsPreviews', () => {
  it('renders image embeds when the processed URL bucket is missing', () => {
    const removeUrlEmbed = jest.fn();
    const removeImageEmbed = jest.fn();
    const embeds = {
      images: [
        {
          type: 'image',
          url: 'https://imagedelivery.net/image.jpg',
          sourceUrl: 'https://imagedelivery.net/image.jpg',
          alt: 'Image',
        },
      ],
      unknowns: [],
    } as unknown as ApiCastEmbeds;

    const { getByLabelText } = render(
      <CastComposerEmbedsPreviews
        processedEmbeds={embeds}
        removeUrlEmbed={removeUrlEmbed}
        removeImageEmbed={removeImageEmbed}
        refreshable={false}
        onRefreshPress={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Remove image attachment'));

    expect(removeImageEmbed).toHaveBeenCalledWith({
      url: 'https://imagedelivery.net/image.jpg',
    });
    expect(removeUrlEmbed).not.toHaveBeenCalled();
  });
});
