import { ApiCastImageEmbed } from 'farcaster-client-data';
import React, { useState } from 'react';

import { ImageAttachment } from '~/components/attachments/ImageAttachment';
import { ImageLightboxModal } from '~/components/modals/ImageLightboxModal';

type DeprecatedImageAttachmentGroupProps = {
  images: ApiCastImageEmbed[];
  quotedCastImageMode?: boolean;
};

const DeprecatedImageAttachmentGroup: React.FC<DeprecatedImageAttachmentGroupProps> =
  React.memo(({ images, quotedCastImageMode }) => {
    const [isModalVisible, setIsModalVisible] = React.useState(false);
    const [groupIndex, setGroupIndex] = useState<number>(0);

    return (
      <div className="flex flex-row">
        {images.map((image, imageIndex) => {
          return (
            <ImageAttachment
              key={image.url}
              title={image.alt}
              imageUrl={image.url}
              width={526 / images.length}
              onClick={() => {
                setGroupIndex(imageIndex);
                setIsModalVisible(true);
              }}
              quotedCastImageMode={quotedCastImageMode}
            />
          );
        })}
        {isModalVisible && (
          <ImageLightboxModal
            title={'Image embeds on cast'}
            imageUrls={images.map((i) => i.url)}
            initialIndex={groupIndex}
            onClose={() => {
              setIsModalVisible(false);
            }}
          />
        )}
      </div>
    );
  });

DeprecatedImageAttachmentGroup.displayName = 'DeprecatedImageAttachmentGroup';

export { DeprecatedImageAttachmentGroup };
