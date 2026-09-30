import React, { useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { ConnectionContext } from '../../../types';
import { Text2 } from '../../design-system/Text';
import { RemoteImage } from '../../RemoteImage';

export function WalletActionPreviewHeader({
  connectionContext,
  title,
}: {
  connectionContext: ConnectionContext;
  title: string;
}) {
  const t = useTheme();
  const domainLabel = connectionContext.origin ?? connectionContext.domain;
  const truncatedDomain = useMemo(() => {
    const domain = domainLabel;
    const maxLength = 32;
    const domainParts = domain.split('.');
    const topDomain = domainParts.slice(-2).join('.');
    const restOfDomain = domainParts.slice(0, -2).join('.');
    const truncatedDomainPart =
      domain.length > maxLength
        ? restOfDomain.slice(0, (maxLength - topDomain.length) / 2) +
          '...' +
          restOfDomain.slice(-(maxLength - topDomain.length) / 2)
        : restOfDomain;
    return truncatedDomainPart + (restOfDomain ? '.' : '') + topDomain;
  }, [domainLabel]);

  return (
    <View style={[t.mY3, t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
      {/* // Radius is 24 */}
      <RemoteImage
        uri={connectionContext.iconUrl}
        contentFit="contain"
        style={[
          t.w12,
          t.h12,
          {
            borderRadius: 14,
          },
          t.borderHairline,
          t.borderDefault,
        ]}
      />
      <View style={[t.flex, t.flexCol]}>
        <Text2 weight="semibold" size="lg">
          {title}
        </Text2>
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
          {connectionContext.source === 'browser' ? (
            <Text2 color="secondary" size="sm">
              Website:
            </Text2>
          ) : null}
          <Text2 color="brand" size="sm">
            {truncatedDomain}
          </Text2>
        </View>
      </View>
    </View>
  );
}
