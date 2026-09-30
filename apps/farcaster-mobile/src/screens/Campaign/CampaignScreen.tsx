import { Ionicons, Octicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VersionedTransaction } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCampaign,
  ApiCampaignAction,
  ApiCampaignState,
  ApiCampaignStep,
  ApiCampaignTheme,
  ApiCreateCastCampaignRequirement,
  ApiFollowUserCampaignRequirement,
  ApiFundWalletCampaignRequirement,
  ApiInstallFrameCampaignRequirement,
  ApiNavigateCampaignAction,
  ApiOpenFrameCampaignAction,
} from 'farcaster-client-data';
import {
  getCloudflareImageUrl,
  useCampaign,
  useCompleteCampaign,
  useFrameDetails,
  useGloballyCachedFrame,
  useTrackEvent,
  useUser,
} from 'farcaster-client-hooks';
import {
  ActivitySpinner,
  CircleIconBadge,
  solanaConnection,
  useEmbeddedWallet,
  useWalletTransactions,
} from 'farcaster-expo';
import { ArrowUpRight, Check } from 'lucide-react-native';
import React, {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  InteractionManager,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ButtonV2 } from '~/components/ButtonV2';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { RemoteImage } from '~/components/RemoteImage';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import {
  FundWalletBottomSheet,
  useFundWalletData,
} from '~/components/Wallet/FundWalletBottomSheet';
import { imageRequestHeaders } from '~/constants/Images';
import { hitSlop } from '~/constants/Pressable';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import {
  FavoriteFrameProvider,
  useFavoriteFrame,
} from '~/contexts/FavoriteFrameProvider';
import {
  useViewProfileAction,
  ViewProfileActionProvider,
} from '~/contexts/Frames/ViewProfileActionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePushOrNavigateInActiveTab } from '~/hooks/navigation/usePushOrNavigateInActiveTab';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { FullParamList, RootNativeStackParamList, ScreenName } from '~/types';

type CampaignScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'Campaign'
>;

const CampaignBannerContext = React.createContext<JSX.Element | undefined>(
  undefined,
);

export function useGetBanner() {
  const banner = React.useContext(CampaignBannerContext);
  return { banner };
}

export const CampaignScreen = buildScreen<CampaignScreenProps>(
  { name: 'Campaign', insetBottom: true },
  ({
    route: {
      params: { campaignId },
    },
  }) => {
    const { data } = useCampaign({ id: campaignId });
    const t = useTheme();
    const goBack = useGoBack();
    const insets = useSafeAreaInsets();
    const [isImagePrefetched, setIsImagePrefetched] = useState(false);

    useEffect(() => {
      if (!data) {
        return;
      }
      const imageUrl = data?.data.steps?.[0].imageUrl;
      if (imageUrl) {
        const transformedUrl = getCloudflareImageUrl({
          url: imageUrl,
          windowWidth: 100,
          width: 100,
        });

        InteractionManager.runAfterInteractions(() => {
          Image.prefetch([transformedUrl], {
            headers: imageRequestHeaders,
            cachePolicy: 'memory-disk',
          }).then((success) => {
            setIsImagePrefetched(success);
          });
        });
      } else {
        setIsImagePrefetched(true);
      }
    }, [data]);

    // return FullScreenLoadingIndicator if image is not prefetched
    const isImageLoadingCompleted = !data || isImagePrefetched;
    if (!data || !isImageLoadingCompleted) {
      return <FullScreenLoadingIndicator />;
    }

    return (
      <BottomSheetModalProvider>
        <View
          style={[
            t.flex1,
            t.m3,
            {
              gap: 8,
              marginTop: Platform.select({
                android: insets.top,
                ios: undefined,
              }),
            },
          ]}
        >
          <View style={[t.itemsStart, t.p1]}>
            <TouchableOpacity
              onPress={goBack}
              hitSlop={hitSlop}
              activeOpacity={0.5}
            >
              <Octicons name="x" color={t.colors.text.tertiary} size={20} />
            </TouchableOpacity>
          </View>
          <CampaignScreenInner campaign={data} />
        </View>
      </BottomSheetModalProvider>
    );
  },
);

function CampaignScreenInner({ campaign }: { campaign: ApiCampaign }) {
  const t = useTheme();
  const completeCampaign = useCompleteCampaign();
  const { refetch } = useCampaign({ id: campaign.id });
  const { trackEvent } = useTrackEvent();

  const [refetchInterval, setRefetchInterval] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [state, setState] = useState<ApiCampaignState>(
    campaign.viewerContext?.state ?? 'pending',
  );

  const [
    hasClearedPostClaimOnchainOperation,
    setHasClearedPostClaimOnchainOperation,
  ] = useState(false);

  const watchForCompletion = useCallback(() => {
    if (!refetchInterval) {
      const interval = setInterval(async () => {
        const result = await refetch();
        if (result.data?.viewerContext?.state === 'completed') {
          clearInterval(interval);
          setRefetchInterval(null);
        }
      }, 2000);

      setRefetchInterval(interval);
    }
  }, [refetch, refetchInterval]);

  React.useEffect(() => {
    return () => {
      if (refetchInterval) {
        clearInterval(refetchInterval);
      }
    };
  }, [refetchInterval]);

  React.useEffect(() => {
    setState(campaign.viewerContext?.state ?? 'pending');
    if (campaign.viewerContext?.state === 'processing') {
      watchForCompletion();
    }
  }, [campaign.viewerContext?.state, watchForCompletion]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewCampaign, {
      campaignId: campaign.id,
    });
  }, [campaign.id, trackEvent]);

  const handleRequirementsMet = useCallback(async () => {
    setState('processing');
    let result = { success: false };
    while (!result.success) {
      result = await completeCampaign({ campaignId: campaign.id });
      if (result.success) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    trackEvent(AnalyticsEvent.CompleteCampaign, {
      campaignId: campaign.id,
    });
    await refetch();
  }, [campaign.id, completeCampaign, refetch, trackEvent]);

  // Once the campaign is completed, we need to wait for the post claim onchain operation to complete
  // So we "trick" the header into thinking it's still processing until the post claim onchain operation is complete
  const headerState = useMemo(() => {
    if (state !== 'completed') {
      return state;
    }
    return hasClearedPostClaimOnchainOperation ? 'completed' : 'processing';
  }, [state, hasClearedPostClaimOnchainOperation]);

  // TODO: Support multiple steps
  const step = campaign.data.steps?.[0];

  const solanaPendingClaimBanner = useMemo(() => {
    if (campaign.data.airdrop.chain !== 'solana') {
      return;
    }
    return (
      <View style={[t.mT4, t.flexCol, t.justifyEnd]}>
        <Text2 size="xs" color="secondary">
          Redeeming may cost up to $0.50 in SOL, optionally refunded later
        </Text2>
      </View>
    );
  }, [campaign, t]);

  if (!step) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <ScrollView contentContainerStyle={[t.flex1, { gap: 16 }]}>
      <CampaignHeader
        state={headerState}
        imageUrl={step.imageUrl}
        theme={campaign.data.theme}
      />
      {state === 'pending' && (
        <CampaignBannerContext.Provider value={solanaPendingClaimBanner}>
          <CampaignContent title={step.title} description={step.description}>
            <CampaignRequirements
              campaign={campaign}
              step={step}
              onRequirementsMet={handleRequirementsMet}
            />
          </CampaignContent>
        </CampaignBannerContext.Provider>
      )}
      {state === 'processing' && (
        <CampaignContent
          title={campaign.data.processing.title}
          description={campaign.data.processing.description}
        />
      )}
      {state === 'completed' && (
        <CampaignCompleted
          campaign={campaign}
          isPostClaimProcessingComplete={hasClearedPostClaimOnchainOperation}
          onPostClaimProcessingComplete={() =>
            setHasClearedPostClaimOnchainOperation(true)
          }
        />
      )}
    </ScrollView>
  );
}

function CampaignHeader({
  state,
  imageUrl,
  theme,
}: {
  state: ApiCampaignState;
  imageUrl?: string;
  theme?: ApiCampaignTheme;
}) {
  const t = useTheme();

  const gradientColors: [string, string] = useMemo(() => {
    const bgColor = t.colors.bgDefault;
    const processingColor = t.colors.bgLightPurple;

    const completedColor =
      t.scheme === 'dark' ? t.colors.green900 : t.colors.bgLightGreen;

    let pendingColor = t.colors.bgLightPurple;
    if (theme) {
      const scheme = t.dark ? 'dark' : 'light';
      pendingColor = theme[scheme]?.backgroundColor ?? pendingColor;
    }
    ``;
    switch (state) {
      case 'pending':
        return [bgColor, pendingColor];
      case 'processing':
        return [bgColor, processingColor];
      case 'completed':
        return [bgColor, completedColor];
    }
  }, [state, t, theme]);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.5, y: 0.1 }}
      style={[
        t.justifyCenter,
        t.itemsCenter,
        {
          height: 236,
          gap: 16,
          paddingTop: 12,
          borderRadius: 24,
        },
      ]}
    >
      {state === 'pending' && (
        <View>
          <RemoteImage
            uri={imageUrl}
            height={100}
            width={100}
            style={[t.roundedFull]}
            containerStyle={[{ backgroundColor: 'transparent' }]}
            shouldFadeIn={false}
            showLoadingIndicator={false}
          />
        </View>
      )}
      {state === 'processing' && <ActivitySpinner size={100} />}
      {state === 'completed' && (
        <CircleIconBadge
          variant="success"
          size="100"
          style={{
            backgroundColor:
              t.scheme === 'dark' ? t.colors.green700 : t.colors.green200,
          }}
          Icon={(props) => <Check {...props} />}
        />
      )}
      <View style={{ height: 9 }}>
        {state !== 'processing' && (
          <Svg width="88" height="9" viewBox="0 0 88 9" fill="none">
            <Path
              d="M0 4.52108C0 5.57303 4.6357 6.58189 12.8873 7.32573C21.1389 8.06957 32.3305 8.48746 44 8.48746C55.6695 8.48746 66.8611 8.06957 75.1127 7.32573C83.3643 6.58189 88 5.57303 88 4.52108C88 3.46913 83.3643 2.46026 75.1127 1.71642C66.8611 0.972573 55.6695 0.554688 44 0.554688C32.3305 0.554688 21.1389 0.972573 12.8873 1.71642C4.6357 2.46026 0 3.46913 0 4.52108Z"
              fill={
                t.scheme === 'dark'
                  ? t.colors.text.quaternary
                  : t.colors.text.secondary
              }
            />
          </Svg>
        )}
      </View>
    </LinearGradient>
  );
}

function CampaignContent({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[t.justifyBetween, t.flex1, { gap: 16 }]}>
      <View style={[{ gap: 16 }]}>
        <Text2 weight="semibold" size="3xl" align="center">
          {title}
        </Text2>
        {description && <Text2 color="secondary">{description}</Text2>}
      </View>
      {children}
    </View>
  );
}

function CampaignCompleted({
  campaign,
  isPostClaimProcessingComplete,
  onPostClaimProcessingComplete,
}: {
  campaign: ApiCampaign;
  isPostClaimProcessingComplete: boolean;
  onPostClaimProcessingComplete: () => void;
}) {
  const { solanaAddress } = useEmbeddedWallet();
  const { submitTransaction } = useWalletTransactions();
  const { trackEvent } = useTrackEvent();
  const t = useTheme();
  const hasStartedDecompress = useRef(false);

  const triggerSolanaDecompress = useCallback(
    async (encodedTransaction: string) => {
      if (!solanaAddress) {
        onPostClaimProcessingComplete();
        return;
      }

      try {
        // Decode the base58 encoded transaction
        const transactionBytes = bs58.default.decode(encodedTransaction);
        const decompressTx = VersionedTransaction.deserialize(transactionBytes);

        // Build the transaction with latest blockhash
        const buildTransaction = async () => {
          const { blockhash } = await solanaConnection.getLatestBlockhash();
          decompressTx.message.recentBlockhash = blockhash;
          return decompressTx;
        };

        // Submit the transaction
        submitTransaction({
          protocol: 'solana',
          chain: 'solana',
          buildTransaction,
          onSuccess: () => {
            trackEvent(AnalyticsEvent.CompleteCampaignAction, {
              campaignId: campaign.id,
              type: 'solana-decompress',
              action: 'success',
            });
            onPostClaimProcessingComplete();
          },
          onError: () => {
            // Even on error, we complete the processing to show the success screen
            trackEvent(AnalyticsEvent.CompleteCampaignAction, {
              campaignId: campaign.id,
              type: 'solana-decompress',
              action: 'error',
            });
            onPostClaimProcessingComplete();
          },
          metadata: {
            type: 'decompress' as const,
            view: 'on-claim',
          },
        });
      } catch (error) {
        // If decoding fails, complete the processing anyway
        trackEvent(AnalyticsEvent.CompleteCampaignAction, {
          campaignId: campaign.id,
          type: 'solana-decompress',
          action: 'decode-error',
        });
        onPostClaimProcessingComplete();
      }
    },
    [
      solanaAddress,
      submitTransaction,
      trackEvent,
      campaign.id,
      onPostClaimProcessingComplete,
    ],
  );

  useEffect(() => {
    if (isPostClaimProcessingComplete) {
      return;
    }

    // If there is no post-claim operation, we are done
    const operation = campaign.viewerContext?.postClaimOnchainOperation;
    if (!operation) {
      onPostClaimProcessingComplete();
      return;
    }

    // Guard against re-renders
    if (hasStartedDecompress.current) {
      return;
    }
    hasStartedDecompress.current = true;

    // TODO: add other chains here if needed
    if (operation.chain === 'solana') {
      triggerSolanaDecompress(operation.transaction);
    }
  }, [
    campaign.viewerContext?.postClaimOnchainOperation,
    isPostClaimProcessingComplete,
    triggerSolanaDecompress,
    onPostClaimProcessingComplete,
  ]);

  if (isPostClaimProcessingComplete === true) {
    return (
      <CampaignContent
        title={campaign.data.success.title.replace(
          '{{amount}}',
          campaign.viewerContext?.airdropAmount.toLocaleString() ?? '',
        )}
        description={campaign.data.success.description}
      >
        <CampaignAction
          campaign={campaign}
          action={campaign.data.success.action}
        />
      </CampaignContent>
    );
  }

  // While processing, show a loading state
  return (
    <View style={[t.flex1, t.itemsCenter, t.justifyCenter]}>
      <CampaignContent title="Finalizing your airdrop">
        <View style={[t.flex1, t.itemsCenter]}>
          <Text2 style={[t.texts.secondary]} size="sm">
            Should be ready in just a few seconds...
          </Text2>
        </View>
      </CampaignContent>
    </View>
  );
}

function CampaignRequirements({
  campaign,
  step,
  onRequirementsMet,
}: {
  campaign: ApiCampaign;
  step: ApiCampaignStep;
  onRequirementsMet: () => void;
}) {
  const [requirementsLeft, setRequirementsLeft] = useState(
    step.requirements.length,
  );

  const decrementRequirementsLeft = useCallback(() => {
    const remainingRequirements = requirementsLeft - 1;
    setRequirementsLeft(remainingRequirements);
    if (remainingRequirements === 0) {
      onRequirementsMet();
    }
  }, [requirementsLeft, onRequirementsMet]);

  // TODO: Support multiple requirements
  if (step.requirements.length > 1) {
    return null;
  }

  const requirement = step.requirements[0];

  switch (requirement.type) {
    case 'install-frame':
      return (
        <FavoriteFrameProvider>
          <InstallFrameRequirement
            campaign={campaign}
            requirement={requirement}
            onComplete={decrementRequirementsLeft}
          />
        </FavoriteFrameProvider>
      );
    case 'fund-wallet':
      return (
        <FundWalletRequirement
          campaign={campaign}
          requirement={requirement}
          onComplete={decrementRequirementsLeft}
        />
      );
    case 'create-cast':
      return (
        <CreateCastRequirement
          campaign={campaign}
          requirement={requirement}
          onComplete={decrementRequirementsLeft}
        />
      );
    case 'follow-user':
      return (
        <ViewProfileActionProvider>
          <FollowUserRequirement
            campaign={campaign}
            requirement={requirement}
            onComplete={decrementRequirementsLeft}
          />
        </ViewProfileActionProvider>
      );
    default:
      return null;
  }
}

function InstallFrameRequirement({
  campaign,
  requirement,
  onComplete,
}: {
  campaign: ApiCampaign;
  requirement: ApiInstallFrameCampaignRequirement;
  onComplete: () => void;
}) {
  const t = useTheme();
  const { data } = useFrameDetails({ domain: requirement.domain });
  const frame = useGloballyCachedFrame(data);
  const { confirmAddFavoriteFrame } = useFavoriteFrame();
  const { trackEvent } = useTrackEvent();
  const { banner } = useGetBanner();

  const handleInstallFrame = useCallback(async () => {
    if (!frame || frame.harmful) {
      return;
    }

    if (!frame.viewerContext?.favorited) {
      await confirmAddFavoriteFrame({
        frame,
        emit: undefined,
      });
    }

    trackEvent(AnalyticsEvent.CompleteCampaignStep, {
      campaignId: campaign.id,
      type: requirement.type,
      domain: requirement.domain,
    });

    onComplete();
  }, [
    frame,
    confirmAddFavoriteFrame,
    onComplete,
    campaign.id,
    requirement.type,
    requirement.domain,
    trackEvent,
  ]);

  return (
    <View style={{ gap: 12 }}>
      {campaign.data.steps[0]?.cta.subtext && (
        <TouchableOpacity
          style={[
            t.bgFaint,
            t.roundedLg,
            t.p2,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.borderDefault,
            t.borderHairline,
          ]}
          onPress={() => {
            if (campaign.data.steps[0]?.cta.subtextUrl) {
              openBrowserAsync(campaign.data.steps[0]?.cta.subtextUrl);
            }
          }}
        >
          <Text2 color="secondary" align="center" size="sm">
            {campaign.data.steps[0]?.cta.subtext}
          </Text2>
          <ArrowUpRight size={16} color={t.colors.text.secondary} />
        </TouchableOpacity>
      )}
      {banner}
      <ButtonV2
        title={requirement.title}
        textSize="lg"
        disabled={!frame}
        onPress={handleInstallFrame}
      />
    </View>
  );
}

function FundWalletRequirement({
  campaign,
  requirement,
  onComplete,
}: {
  campaign: ApiCampaign;
  requirement: ApiFundWalletCampaignRequirement;
  onComplete: () => void;
}) {
  const [showSheet, setShowSheet] = useState(false);
  const { trackEvent } = useTrackEvent();
  const { missingUsdValue, isLoading } = useFundWalletData({
    chain: requirement.chain,
    cas: requirement.cas,
    requiredUsdValue: Number(requirement.amount),
  });
  const { banner } = useGetBanner();

  const handlePress = useCallback(() => {
    if (missingUsdValue === 0) {
      onComplete();
    } else {
      setShowSheet(true);
    }
    setShowSheet(true);

    trackEvent(AnalyticsEvent.CompleteCampaignStep, {
      campaignId: campaign.id,
      type: requirement.type,
    });
  }, [campaign.id, requirement.type, trackEvent, missingUsdValue, onComplete]);

  return (
    <>
      {banner}
      <ButtonV2
        title={requirement.title}
        textSize="lg"
        onPress={handlePress}
        disabled={isLoading}
      />
      {showSheet && (
        <FundWalletBottomSheet
          chain={requirement.chain}
          cas={requirement.cas}
          requiredUsdValue={Number(requirement.amount)}
          onComplete={onComplete}
          onDismiss={() => setShowSheet(false)}
        />
      )}
    </>
  );
}

function CreateCastRequirement({
  campaign,
  requirement,
  onComplete,
}: {
  campaign: ApiCampaign;
  requirement: ApiCreateCastCampaignRequirement;
  onComplete: () => void;
}) {
  const t = useTheme();
  const openComposer = useOpenComposer();
  const navigate = useNavigate();
  const { trackEvent } = useTrackEvent();
  const { banner } = useGetBanner();

  const handlePress = useCallback(() => {
    openComposer({
      intent: {
        text: requirement.placeholder ?? '',
        embeds: [],
        mentions: [],
        channelKey: requirement.channelKey,
      },
      placeholder: requirement.placeholder,
      onSuccess: () => {
        navigate('Campaign', { campaignId: campaign.id });

        trackEvent(AnalyticsEvent.CompleteCampaignStep, {
          campaignId: campaign.id,
          type: requirement.type,
          channelKey: requirement.channelKey,
        });

        onComplete();
      },
    });
  }, [
    navigate,
    openComposer,
    requirement.channelKey,
    requirement.placeholder,
    onComplete,
    campaign.id,
    trackEvent,
    requirement.type,
  ]);

  return (
    <View style={[t.flex1, t.justifyBetween, { gap: 8 }]}>
      <View
        style={[
          t.roundedLg,
          t.bgLightGray,
          t.p3,
          t.flexRow,
          t.itemsCenter,
          { gap: 6 },
        ]}
      >
        <Ionicons
          name="people-circle-outline"
          size={24}
          color={t.colors.text.secondary}
        />
        <View>
          <Text2 weight="semibold">{requirement.title}</Text2>
          <Text2 color="secondary">{requirement.description}</Text2>
        </View>
      </View>
      {banner}
      <ButtonV2
        title={campaign.data.steps[0]?.cta.text}
        textSize="lg"
        onPress={handlePress}
      />
    </View>
  );
}

function FollowUserRequirement({
  campaign,
  requirement,
  onComplete,
}: {
  campaign: ApiCampaign;
  requirement: ApiFollowUserCampaignRequirement;
  onComplete: () => void;
}) {
  const t = useTheme();
  const { data, refetch } = useUser({ fid: requirement.fid });
  const { viewProfile, closeProfile } = useViewProfileAction();
  const { trackEvent } = useTrackEvent();
  const { banner } = useGetBanner();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleFollow = useCallback(() => {
    trackEvent(AnalyticsEvent.CompleteCampaignStep, {
      campaignId: campaign.id,
      type: requirement.type,
      fid: requirement.fid,
    });
    onComplete();
  }, [campaign.id, requirement.type, requirement.fid, trackEvent, onComplete]);

  const handleToggle = useCallback(
    (toggle: 'follow' | 'unfollow') => {
      if (toggle === 'unfollow') {
        closeProfile();
        handleFollow();
      }
    },
    [handleFollow, closeProfile],
  );

  const handlePress = useCallback(async () => {
    if (!data.result.user.viewerContext?.following) {
      await viewProfile({ fid: requirement.fid, onToggle: handleToggle });
      return;
    }

    handleFollow();
  }, [viewProfile, requirement, data, handleToggle, handleFollow]);

  return (
    <View style={{ gap: 12 }}>
      {campaign.data.steps[0]?.cta.subtext && (
        <TouchableOpacity
          style={[
            t.bgFaint,
            t.roundedLg,
            t.p2,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.borderDefault,
            t.borderHairline,
          ]}
          onPress={() => {
            if (campaign.data.steps[0]?.cta.subtextUrl) {
              openBrowserAsync(campaign.data.steps[0]?.cta.subtextUrl);
            }
          }}
        >
          <Text2 color="secondary" align="center" size="sm">
            {campaign.data.steps[0]?.cta.subtext}
          </Text2>
          <ArrowUpRight size={16} color={t.colors.text.secondary} />
        </TouchableOpacity>
      )}
      {banner}
      <ButtonV2
        title={campaign.data.steps[0]?.cta.text}
        textSize="lg"
        onPress={handlePress}
      />
    </View>
  );
}

function CampaignAction({
  campaign,
  action,
}: {
  campaign: ApiCampaign;
  action: ApiCampaignAction;
}) {
  switch (action.type) {
    case 'open-frame':
      return <OpenFrameAction campaign={campaign} action={action} />;
    case 'navigate':
      return <NavigateAction campaign={campaign} action={action} />;
    default:
      return null;
  }
}

function OpenFrameAction({
  campaign,
  action,
}: {
  campaign: ApiCampaign;
  action: ApiOpenFrameCampaignAction;
}) {
  const { data } = useFrameDetails({ domain: action.domain });
  const frame = useGloballyCachedFrame(data);
  const launchFrame = useLaunchFrame();
  const { trackEvent } = useTrackEvent();
  const goBack = useGoBack();

  const launch = useCallback(() => {
    if (!frame || frame.harmful) {
      return;
    }

    trackEvent(AnalyticsEvent.CompleteCampaignAction, {
      campaignId: campaign.id,
      type: action.type,
      domain: action.domain,
    });

    launchFrame({
      context: {
        type: 'launcher',
      },
      config: {
        name: frame.name,
        url: frame.homeUrl,
        splashImageUrl: frame.splashImageUrl,
        splashBackgroundColor: frame.splashBackgroundColor,
      },
      author: frame.author,
    });

    goBack();
  }, [
    frame,
    launchFrame,
    campaign.id,
    action.type,
    action.domain,
    trackEvent,
    goBack,
  ]);

  return <ButtonV2 title={action.title} textSize="lg" onPress={launch} />;
}

function NavigateAction({
  campaign,
  action,
}: {
  campaign: ApiCampaign;
  action: ApiNavigateCampaignAction;
}) {
  const navigate = usePushOrNavigateInActiveTab();
  const screen: ScreenName = action.screenName as ScreenName;
  const params = action.screenParams as FullParamList[typeof screen];
  const { trackEvent } = useTrackEvent();

  const handlePress = useCallback(() => {
    trackEvent(AnalyticsEvent.CompleteCampaignAction, {
      campaignId: campaign.id,
      type: action.type,
      screenName: action.screenName,
      screenParams: JSON.stringify(action.screenParams),
    });

    navigate(screen, params);
  }, [
    navigate,
    screen,
    params,
    trackEvent,
    campaign.id,
    action.type,
    action.screenName,
    action.screenParams,
  ]);

  return <ButtonV2 title={action.title} textSize="lg" onPress={handlePress} />;
}
