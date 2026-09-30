import { ApiChain } from 'farcaster-client-data';
import React, { useState } from 'react';

import { ChainImage } from '~/components/chain/ChainImage';
import { Image } from '~/components/images/Image';
import { applyCloudflarePath } from '~/utils/images';

interface TokenIconProps {
  iconUrl?: string;
  symbol?: string;
  diameter: number;
  chain?: ApiChain;
  chainImageSize?: number;
  imageBordered?: boolean;
  className?: string;
}

const TokenIcon: React.FC<TokenIconProps> = ({
  iconUrl,
  symbol,
  diameter,
  chain,
  chainImageSize,
  imageBordered,
  className,
}) => {
  const getTextSize = () => {
    if (diameter <= 16) {
      return 'text-[10px]';
    }
    if (diameter <= 24) {
      return 'text-xs';
    }
    if (diameter <= 32) {
      return 'text-sm';
    }
    if (diameter <= 40) {
      return 'text-base';
    }
    return 'text-lg';
  };

  const [imageError, setImageError] = useState(false);

  const renderIcon = () => {
    if (!iconUrl || imageError) {
      return (
        <div
          className={`flex items-center justify-center rounded-full bg-[#f2f2f2] dark:bg-[#383838] ${className || ''}`}
          style={{ width: diameter, height: diameter }}
        >
          {symbol && symbol !== '[invalid]' ? (
            <span
              className={`font-semibold text-[#7959ff] dark:text-[#866aff] ${getTextSize()}`}
            >
              {symbol[0]?.toUpperCase()}
            </span>
          ) : (
            <span
              className={`text-[#7959ff] dark:text-[#866aff] ${getTextSize()}`}
            >
              ?
            </span>
          )}
        </div>
      );
    }

    return (
      <Image
        src={applyCloudflarePath(iconUrl, diameter)}
        className={`aspect-square rounded-full object-cover ${
          imageBordered ? 'border border-default' : ''
        } ${className || ''}`}
        style={{
          width: diameter,
          height: diameter,
          minWidth: diameter,
          minHeight: diameter,
        }}
        alt={`${symbol || 'Token'} icon`}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <div className="relative" style={{ width: diameter, height: diameter }}>
      {renderIcon()}
      {chain && (
        <ChainImage
          chain={chain}
          size={chainImageSize || 24}
          bordered
          className="absolute bottom-0 right-0"
        />
      )}
    </div>
  );
};

export { TokenIcon };
