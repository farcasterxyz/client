import { ApiInterest } from 'farcaster-client-data';
import React from 'react';

import { ChannelInterest } from './ChannelInterest';
import { WrappedInterest } from './WrappedInterest';

type InterestProps = {
  interest: ApiInterest;
};

const Interest: React.FC<InterestProps> = React.memo(({ interest }) => {
  switch (interest.type) {
    case 'wrapped':
      return <WrappedInterest interest={interest} />;
    case 'channel':
      return <ChannelInterest interest={interest} />;
    case 'collection':
    default:
      return null;
  }
});

export { Interest };
