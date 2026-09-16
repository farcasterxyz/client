import { ApiNewArticleNotificationGroup } from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import React from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { Image } from '~/components/images/Image';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useNavigateToNewsArticle } from '~/hooks/navigation/useNavigateToNewsArticle';
import { applyCloudflarePath } from '~/utils/images';

import { NotificationGraphic } from './shared/NotificationGraphic';

type NewArticleNotificationGroupProps = {
  notificationGroup: ApiNewArticleNotificationGroup;
};

const NewArticleNotificationGroup: React.FC<NewArticleNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const navigateToArticle = useNavigateToNewsArticle();

    const notification = notificationGroup.previewItems[0];

    const article = notificationGroup.previewItems[0].content.article;

    const isGeoRestricted = useWalletGeoRestricted();
    const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
    const navigateInWallet = embeddedWalletBridge?.navigate;

    const onNotificationClick = React.useCallback(() => {
      navigateToArticle({ articlePublicId: article.publicId });
    }, [article.publicId, navigateToArticle]);

    const onTokenImageClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        if (
          !isGeoRestricted &&
          navigateInWallet &&
          typeof article.token !== 'undefined'
        ) {
          navigateInWallet({
            path: 'Token',
            params: {
              chain: article.token.chain,
              ca: article.token.ca,
              via: 'notification_new_article_inapp',
            },
          });
        }
      },
      [article.token, isGeoRestricted, navigateInWallet],
    );

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={onNotificationClick}
      >
        <NotificationGraphic>
          <div className="relative">
            <Image
              src={
                applyCloudflarePath(article.token?.imageUrl, 48) ||
                NFT_IMAGE_UNAVAILABLE_URL
              }
              className={
                'aspect-cover shrink-0 rounded-full border bg-app border-default'
              }
              style={{
                width: 48,
                height: 48,
                minWidth: 48,
                minHeight: 48,
              }}
              alt={`Image`}
              fallback={NFT_IMAGE_UNAVAILABLE_URL}
              onClick={onTokenImageClick}
            />
          </div>
        </NotificationGraphic>
        <div className="w-full min-w-0">
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex w-full flex-row items-start justify-between gap-x-1">
              <div className="text-base font-semibold text-default">
                {article.title}
              </div>
              <div className="text-faint">
                {formatTimeAgo(notification.timestamp, 'floor')}
              </div>
            </div>
            <div className="line-clamp-3 text-muted">{article.description}</div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

NewArticleNotificationGroup.displayName = 'NewArticleNotificationGroup';

export { NewArticleNotificationGroup };
