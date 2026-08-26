import { ApiChannel } from 'farcaster-client-data';
import React, { useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';

type EmptyChannelPageContentProps = {
  channel: ApiChannel;
  feedType: string;
};

const EmptyChannelPageContent: React.FC<EmptyChannelPageContentProps> = ({
  channel,
  feedType,
}) => {
  const [isComposingCast, setIsComposingCast] = useState(false);
  return (
    <div className="mt-20 flex w-full flex-col items-center justify-center">
      <div
        className="relative flex max-w-2xl flex-col justify-between rounded-lg bg-app border-default"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Image
          src={'/~/images/EmptyChannelPlaceholder.png'}
          style={{
            width: 150,
            minWidth: 150,
          }}
          alt={'Empty Channel Placeholder'}
          className="z-0 rounded-lg border px-4 py-2 border-default"
        />
      </div>
      {feedType === 'default' ? (
        <>
          <span className="my-2 text-sm text-faint">
            This channel has no casts yet
          </span>
          <DefaultButton
            size={'lg'}
            className="mt-2"
            onClick={() => setIsComposingCast(true)}
          >
            <span className="px-4">Say something</span>
          </DefaultButton>
          {isComposingCast && (
            <ComposeCastModal
              onClose={() => {
                setIsComposingCast(false);
              }}
              intent={{
                channelKey: channel.key,
              }}
            />
          )}
        </>
      ) : (
        <>
          <span className="my-2 text-sm text-faint">
            This channel has no casts yet
          </span>
        </>
      )}
    </div>
  );
};

EmptyChannelPageContent.displayName = 'EmptyChannelPageContent';

export { EmptyChannelPageContent };
