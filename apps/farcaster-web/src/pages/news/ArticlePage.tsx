import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsernameShort, useArticle } from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FrameIconImage } from '~/components/images/FrameIconImage';
import { Image } from '~/components/images/Image';
import { AppStoreRedirectsModal } from '~/components/modals/AppStoreRedirectsModal';
import { Clickable } from '~/components/motion/Clickable';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';
import { useParams } from '~/hooks/navigation/useParams';
const ArticlePage = React.memo(() => {
  const isSignedIn = useIsSignedIn();

  const { trackEvent } = useAnalytics();

  const { id: publicId } = useParams('news');

  const { data } = useArticle({ publicId });

  const article = React.useMemo(() => {
    return data.article;
  }, [data.article]);

  const articleDeeplinkUri = `farcaster://~/news/${publicId}`;
  const articleUrl = `https://farcaster.xyz/~/news/${publicId}`;

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewArticle, { publicId, isSignedIn });
  }, [isSignedIn, publicId, trackEvent]);

  const [appStoreRedirectModalVisible, setAppStoreRedirectModalVisible] =
    React.useState<boolean>(false);

  const externalNavigate = useExternalNavigate();

  const userIsLikelyOnMobile = React.useMemo(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
  }, []);

  const onClickOpenWarpcast = React.useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      trackEvent(AnalyticsEvent.ClickOpenArticle, {
        publicId: publicId,
      });

      e.preventDefault();
      e.stopPropagation();

      const to = userIsLikelyOnMobile ? articleDeeplinkUri : articleUrl;

      externalNavigate({
        to: to,
        openInNewTab: true,
      });
    },
    [
      articleDeeplinkUri,
      articleUrl,
      externalNavigate,
      publicId,
      trackEvent,
      userIsLikelyOnMobile,
    ],
  );

  const takeaways = React.useMemo(() => {
    if (
      typeof article.takeaways !== 'undefined' &&
      article.takeaways.length !== 0
    ) {
      return article.takeaways;
    }

    return [article.description];
  }, [article.description, article.takeaways]);

  const isGeoRestricted = useWalletGeoRestricted();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;

  const { launchMiniApp } = useMinimizableWindowContext();

  const onMiniAppClick = React.useCallback(() => {
    if (
      typeof article.miniApp !== 'undefined' &&
      typeof article.miniAppUrl !== 'undefined'
    ) {
      trackEvent(AnalyticsEvent.PressArticleMiniApp, {
        domain: article.miniApp.domain,
      });

      launchMiniApp({
        context: {
          type: 'open_miniapp',
          referrerDomain: 'https://farcaster.xyz',
        },
        launchConfig: {
          type: 'standalone',
          name: article.miniApp.name,
          url: article.miniAppUrl,
          splashImageUrl: article.miniApp.splashImageUrl,
          splashBackgroundColor: article.miniApp.splashBackgroundColor,
          author: article.miniApp.author,
        },
      });
    }
  }, [article.miniApp, article.miniAppUrl, launchMiniApp, trackEvent]);

  const onTokenClick = React.useCallback(() => {
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
          via: 'web-clankler-spotlight-banner',
        },
      });
    }
  }, [article.token, isGeoRestricted, navigateInWallet]);

  const navigateToProfile = useNavigateToProfile();

  const navigate = useExternalNavigate();

  const onTeamClick = React.useCallback(
    ({ user }: { user: ApiUser }) => {
      trackEvent(AnalyticsEvent.PressArticleDev, { fid: user.fid });

      navigateToProfile({ user: user });
    },
    [navigateToProfile, trackEvent],
  );

  return (
    <Page
      meta={{
        title: `${article.title} / News`,
      }}
    >
      <BorderedMainContent className="flex !min-h-dvh w-full flex-col items-center pt-1 md:justify-start">
        <div className="w-full">
          <PageHeader hideCastButton={true} visibleOnMobile={false}>
            <BackButton />
          </PageHeader>
        </div>
        <div className="my-2 flex size-full flex-col items-center justify-center space-y-6">
          <div className="relative mx-2 space-y-6 rounded-lg md:mx-4">
            <Image
              alt={'News article illustration'}
              src={article.imageUrl}
              className="inset-0 rounded-lg object-cover object-left-top"
            />
            <div className="flex flex-col items-start justify-center space-y-2">
              <div className="text-2xl font-semibold text-default">
                {article.title}
              </div>
              {takeaways.map((item) => (
                <div className="break-gracefully">
                  <LinkifiedText
                    content={item}
                    mentions={undefined}
                    ignoreMentionsArray={true}
                    channelMentions={[]}
                    tokenMentions={
                      typeof article.token !== 'undefined' &&
                      typeof article.token.symbol !== 'undefined'
                        ? [article.token.symbol]
                        : undefined
                    }
                    // @ts-expect-error-next-line internal component only needs the ticker
                    tokenMentionsV2={
                      typeof article.token !== 'undefined' &&
                      typeof article.token.symbol !== 'undefined'
                        ? [{ ...article.token, ticker: article.token.symbol }]
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
            {isSignedIn && typeof article.token !== 'undefined' && (
              <div className="w-full flex-1 flex-col space-y-2">
                {typeof article.miniApp !== 'undefined' && (
                  <DefaultButton
                    variant="muted"
                    size="lg"
                    className="!h-14 !w-full !py-[12px]"
                    onClick={onMiniAppClick}
                  >
                    <div className="flex flex-row justify-center gap-2">
                      <FrameIconImage
                        imageUrl={article.miniApp.iconUrl}
                        size={24}
                      />
                      <span className="pt-px">
                        {article.miniApp.buttonTitle ||
                          article.miniApp.ogTitle ||
                          'Open mini app'}
                      </span>
                    </div>
                  </DefaultButton>
                )}
                <DefaultButton
                  variant="normal"
                  size="lg"
                  className="!h-14 !w-full !py-[12px]"
                  onClick={onTokenClick}
                >
                  Buy {article.token.symbol}
                </DefaultButton>
              </div>
            )}
            {typeof article.miniAppDevelopers !== 'undefined' &&
              article.miniAppDevelopers.length !== 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-tertiary">Team</span>
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {article.miniAppDevelopers.map((mad) => {
                      return (
                        <Clickable
                          disabled={false}
                          onClick={() => onTeamClick({ user: mad })}
                        >
                          <div className="flex h-[32px] w-max items-center justify-start gap-1 rounded-[24px] px-2 text-base font-normal bg-tertiary text-default">
                            <Avatar user={mad} size="xs" />
                            <span>
                              {resolveUsernameShort({
                                username: mad.username,
                                fid: mad.fid,
                              })}
                            </span>
                          </div>
                        </Clickable>
                      );
                    })}
                  </div>
                </div>
              )}
            {typeof article.sources !== 'undefined' &&
              article.sources.length !== 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-tertiary">Sources</span>
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {article.sources.map((source) => {
                      return (
                        <Clickable
                          disabled={false}
                          onClick={() => {
                            navigate({ to: source, openInNewTab: true });
                          }}
                        >
                          <div className="flex h-[32px] w-max items-center justify-start gap-1 rounded-[24px] px-2 text-base font-normal bg-tertiary text-default">
                            <span>{source}</span>
                          </div>
                        </Clickable>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>

          {!isSignedIn && (
            <div className="flex w-full flex-col items-center justify-center space-y-2 px-2 md:px-4">
              <DefaultButton
                variant="normal"
                size="lg"
                className="!w-full !py-[12px]"
                onClick={onClickOpenWarpcast}
              >
                Open Farcaster
              </DefaultButton>
              <DefaultButton
                variant="link"
                className="text-sm !font-normal !text-muted md:w-40"
                onClick={() => setAppStoreRedirectModalVisible(true)}
                size={'sm'}
              >
                Download
              </DefaultButton>
            </div>
          )}
          {appStoreRedirectModalVisible && window.innerWidth < 720 && (
            <AppStoreRedirectsModal
              onClose={() => setAppStoreRedirectModalVisible(false)}
            />
          )}
        </div>
      </BorderedMainContent>
    </Page>
  );
});

ArticlePage.displayName = 'ArticlePage';

export { ArticlePage };
