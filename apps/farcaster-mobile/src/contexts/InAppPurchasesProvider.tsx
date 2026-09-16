import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import * as Device from 'expo-device';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiInAppPurchaseMetadata,
  ApiOnchainTransactionType,
  ApiSKU,
  ApiSKUType,
} from 'farcaster-client-data';
import {
  FinishInAppPurchaseError,
  useCachedOnboardingState,
  useFinishInAppPurchase,
  useProductCatalog,
  useStartInAppPurchase,
} from 'farcaster-client-hooks';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  getSubscriptions,
  initConnection,
  Product,
  Purchase,
  Subscription,
  useIAP,
  withIAPContext,
} from 'react-native-iap';

import { useIAPDisabled } from '~/hooks/data/useIAPDisabled';
import { InAppPurchaseError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

import { useAnalytics } from './AnalyticsProvider';
import { useWallet } from './WalletProvider';

// TODO: Ideally this type is the same type coming from the server.
// However, we currently have no way to localize pricing on the server
// and Apple already does the heavy lifting on it. So we will utilize
// the value returned by core engine and set it on our object.
type LocalizedSKU = ApiSKU & {
  localizedPrice: string;
};

type Offerings = { [productId: string]: LocalizedSKU };

type IapDebugData = {
  productCatalog: {
    productId: string;
    name: string;
    description: string;
    type: ApiSKUType;
    price: number;
  }[];
  iapProducts: (Product | Subscription)[];
};

type InAppPurchasesContext = {
  getAvailableOffering: ({
    productId,
  }: {
    productId: string;
  }) => LocalizedSKU | undefined;
  hasPurchasedOffering: ({ productId }: { productId: string }) => boolean;
  purchase: ({
    onchainTransactionType,
    productId,
    metadata,
  }: {
    onchainTransactionType: ApiOnchainTransactionType;
    productId: string;
    metadata?: ApiInAppPurchaseMetadata;
  }) => Promise<void>;
  requestedPurchaseSucceeded: boolean;
  requestedPurchaseFailed: boolean;
  requestedPurchaseCancelledByUser: boolean;
  requestedPurchaseTrackingId: string | undefined;
  inAppPurchasingIsEnabled: boolean;
  restorePurchases: () => Promise<void>;
  resetPurchaseState: () => void;
  availableConsumableOfferings: string[];

  // Data that can be sent to monitoring tools to
  // debug IAP state
  iapDebugData: IapDebugData;

  // Is the platform library connected?
  isConnected: boolean;

  // Have the products been loaded?
  isInitialized: boolean;

  // Re-fetch store products after a failed getProducts/getSubscriptions call.
  retryProductFetch: () => void;
};

const InAppPurchasesContext = React.createContext<InAppPurchasesContext>(null!);

type InAppPurchasesProviderProps = {
  children: React.ReactNode;
};

const InAppPurchasesProvider: React.FC<InAppPurchasesProviderProps> =
  withIAPContext(({ children }) => {
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'InAppPurchasesProvider',
    });
    const { trackEvent } = useAnalytics();
    const { account } = useWallet();
    const {
      result: {
        state: { id: onboardingId },
      },
    } = useCachedOnboardingState();

    const { disabled: inAppPurchasesServerDisabled } = useIAPDisabled();

    // TODO: Better way to manage these instead of global refs?
    // Maybe this becomes the local check for the purchasing actions instead.
    // Something to think about it a bit more, but this is sufficient enough
    // to start.
    const requestedPurchaseProductId = React.useRef<string>(undefined);
    const requestedPurchaseOnchainTransactionType =
      React.useRef<ApiOnchainTransactionType>(undefined);
    const requestedPurchaseProductTrackingId = React.useRef<string>(undefined);

    const [currentPurchaseSucceeded, setCurrentPurchaseSucceded] =
      React.useState<boolean>(false);
    const [currentPurchaseFailed, setCurrentPurchaseFailed] =
      React.useState<boolean>(false);
    const [isInitialized, setIsInitialized] = React.useState<boolean>(false);
    const [productFetchRetryCount, setProductFetchRetryCount] =
      React.useState<number>(0);

    // Tracks the device's IAP availability. On iOS, `initConnection` resolves
    // with `SKPaymentQueue.canMakePayments()`, which is `false` when the user
    // has Screen Time / parental controls blocking in-app purchases. On
    // Android, it indicates whether the billing connection succeeded.
    // `null` means the value has not resolved yet.
    const [canMakePayments, setCanMakePayments] = React.useState<
      boolean | null
    >(null);

    const {
      getProducts,
      getPurchaseHistory,
      products,
      subscriptions,
      purchaseHistory,
      requestPurchase,
      currentPurchase,
      currentPurchaseError,
      finishTransaction,
      initConnectionError,
      connected,
    } = useIAP();

    const { data } = useProductCatalog();
    const startInAppPurchase = useStartInAppPurchase();
    const finishInAppPurchase = useFinishInAppPurchase();

    const inAppPurchasingIsEnabled = React.useMemo(() => {
      return (
        Device.isDevice &&
        !inAppPurchasesServerDisabled &&
        canMakePayments !== false
      );
    }, [canMakePayments, inAppPurchasesServerDisabled]);

    const productCatalog = React.useMemo(() => {
      return data?.catalog || [];
    }, [data?.catalog]);

    const availableOfferings = React.useMemo(() => {
      const offerings: Offerings = {};

      const allStoreProducts: (Product | Subscription)[] = [
        ...products,
        ...subscriptions,
      ];

      for (const product of allStoreProducts) {
        const sku = productCatalog.find(
          ({ productId }) => productId === product.productId,
        );

        if (typeof sku !== 'undefined') {
          offerings[sku.productId] = {
            productId: sku.productId,
            name: sku.name,
            description: sku.description,
            type: sku.type,
            price: sku.price,
            localizedPrice:
              'localizedPrice' in product ? product.localizedPrice : '',
          };
        }
      }

      return offerings;
    }, [productCatalog, products, subscriptions]);

    const iapDebugData = React.useMemo<IapDebugData>(() => {
      return {
        productCatalog: productCatalog.map((sku) => ({
          productId: sku.productId,
          name: sku.name,
          description: sku.description,
          type: sku.type,
          price: sku.price,
        })),
        iapProducts: [...products, ...subscriptions],
      };
    }, [productCatalog, products, subscriptions]);

    const availableConsumableOfferings = React.useMemo(() => {
      const offerings = Object.keys(availableOfferings);
      const consumableOfferings = offerings.filter(
        (o) => o.indexOf('WARPNONCONSUMABLE') === -1,
      );
      return consumableOfferings;
    }, [availableOfferings]);

    const purchasedOfferings = React.useMemo(() => {
      const offerings: Offerings = {};

      for (const purchase of purchaseHistory) {
        const purchasedProductId = purchase.productId;
        const purchasedOffering = availableOfferings[purchasedProductId];
        if (typeof purchasedOffering !== 'undefined') {
          offerings[purchase.productId] = purchasedOffering;
        }
      }

      return offerings;
    }, [availableOfferings, purchaseHistory]);

    const requestedPurchaseSucceeded = React.useMemo(() => {
      return (
        typeof requestedPurchaseProductId.current !== 'undefined' &&
        currentPurchase?.productId === requestedPurchaseProductId.current &&
        currentPurchaseSucceeded
      );
    }, [currentPurchase?.productId, currentPurchaseSucceeded]);

    const requestedPurchaseFailed = React.useMemo(() => {
      return (
        typeof requestedPurchaseProductId.current !== 'undefined' &&
        currentPurchaseError?.productId ===
          requestedPurchaseProductId.current &&
        currentPurchaseFailed
      );
    }, [currentPurchaseError?.productId, currentPurchaseFailed]);

    const requestedPurchaseTrackingId = React.useMemo(() => {
      if (requestedPurchaseSucceeded || requestedPurchaseFailed) {
        return requestedPurchaseProductTrackingId.current;
      }
      return undefined;
    }, [requestedPurchaseFailed, requestedPurchaseSucceeded]);

    // True when the failure came from the purchase listener and was a voluntary
    // user dismissal rather than a genuine billing error.
    const requestedPurchaseCancelledByUser = React.useMemo(() => {
      return (
        requestedPurchaseFailed &&
        currentPurchaseError?.code === 'E_USER_CANCELLED'
      );
    }, [currentPurchaseError?.code, requestedPurchaseFailed]);

    const getAvailableOffering = React.useCallback(
      ({ productId }: { productId: string }) => {
        const availableOffering = availableOfferings[productId];

        if (typeof availableOffering === 'undefined') {
          return undefined;
        }

        return availableOffering;
      },
      [availableOfferings],
    );

    const hasPurchasedOffering = React.useCallback(
      ({ productId }: { productId: string }) => {
        return typeof purchasedOfferings[productId] !== 'undefined';
      },
      [purchasedOfferings],
    );

    const restorePurchases = React.useCallback(async () => {
      await getPurchaseHistory();
    }, [getPurchaseHistory]);

    const resetPurchaseState = React.useCallback(() => {
      requestedPurchaseProductId.current = undefined;
      requestedPurchaseOnchainTransactionType.current = undefined;
      requestedPurchaseProductTrackingId.current = undefined;
      setCurrentPurchaseSucceded(false);
      setCurrentPurchaseFailed(false);
    }, []);

    const retryProductFetch = React.useCallback(() => {
      setIsInitialized(false);
      setProductFetchRetryCount((c) => c + 1);
    }, []);

    const finalizePurchasing = React.useCallback(
      async ({
        onchainTransactionType,
        currentPurchase,
      }: {
        onchainTransactionType: ApiOnchainTransactionType;
        currentPurchase: Purchase;
      }) => {
        const platform = Platform.OS;
        if (platform !== 'ios' && platform !== 'android') {
          throw new Error(`Unsupported in-app purchase platform ${platform}`);
        }

        try {
          await finishInAppPurchase({
            onchainTransactionType,
            productId: currentPurchase.productId,
            transactionIdIOS: currentPurchase.transactionId,
            transactionReceiptIOS: currentPurchase.transactionReceipt,
            platform,
            account: account!,
            productPurchaseTrackingId:
              requestedPurchaseProductTrackingId.current,
          });

          setCurrentPurchaseSucceded(true);

          // Consumers of this provider rely on requestedPurchaseSucceeded
          // being true to know a purchase succeeded. As soon as we call
          // finalizeTransaction the currentPurchase value is cleared and
          // requestedPurchaseSucceeded will be false. This hack delays the
          // calling of finishTransaction for a small amount of time so that
          // that will value will be true long enough for the consumer to react.
          //
          // This is unideal since it we don't know exactly how long to wait and
          // are trading off between either failing to finishTransaction in which
          // case we aren't paid or calling it before the consumer can react.
          //
          // Ideally we could finish the transaction and then signal to the consumer
          // the purchase is finished. This would be a non-trivial change and is being
          // avoided for now.
          //
          // IAP flow requires finish trx to be called to call purchasing "final"
          setTimeout(() => {
            finishTransaction({
              purchase: currentPurchase,
              isConsumable: true,
            });
          }, 150);
        } catch (error) {
          // We won't report this to the user but will log it to track.
          trackError(new FinishInAppPurchaseError({ error }));
        }
      },
      [account, finishInAppPurchase, finishTransaction],
    );

    const purchase = React.useCallback(
      async ({
        onchainTransactionType,
        productId,
        metadata,
      }: {
        onchainTransactionType: ApiOnchainTransactionType;
        productId: string;
        metadata?: ApiInAppPurchaseMetadata;
      }) => {
        if (typeof requestedPurchaseProductId.current !== 'undefined') {
          // TODO: Is this going to be possible? Document why it might - and alert callers, if so.
          throw new InAppPurchaseError({
            error: 'Another in-app purchase in progress.',
            productId,
          });
        }

        try {
          const offering = availableOfferings[productId];

          if (typeof offering === 'undefined') {
            throw new InAppPurchaseError({
              error: 'Tried to purchase a product not offered.',
              productId,
            });
          }

          requestedPurchaseProductId.current = offering.productId;
          requestedPurchaseOnchainTransactionType.current =
            onchainTransactionType;

          // Check if there is already an unconsumed purchase with the same ID,
          // if so consume it rather than requesting a new purchase.
          if (currentPurchase && currentPurchase.productId === productId) {
            await finalizePurchasing({
              onchainTransactionType,
              currentPurchase,
            });
            trackEvent(AnalyticsEvent.RecoverUnconsumedInAppPurchase, {
              productId,
            });
            return;
          }

          const data = await startInAppPurchase({
            onchainTransactionType,
            productId: offering.productId,
            account: account!,
            metadata: metadata,
          });
          if (data === null) {
            // eslint-disable-next-line no-console
            console.warn(
              'data was null: InAppPurchasesProvider:startInAppPurchase',
            );
          }
          const { result } = data;

          requestedPurchaseProductTrackingId.current =
            result.productPurchaseTrackingId;

          if (Platform.OS === 'ios') {
            await requestPurchase({
              // iOS looks for SKU to be set.
              sku: offering.productId,
              // Android looks for SKUs to be set.
              skus: [offering.productId],
              appAccountToken: onboardingId,
            });
          } else if (Platform.OS === 'android') {
            await requestPurchase({
              // iOS looks for SKU to be set.
              sku: offering.productId,
              // Android looks for SKUs to be set.
              skus: [offering.productId],
              obfuscatedAccountIdAndroid: onboardingId,
            });
          } else {
            throw new Error(
              `Unsupported platform ${Platform.OS} for in-app purchases`,
            );
          }
        } catch (error) {
          resetPurchaseState();

          // Re-throw user cancellations unwrapped so callers can detect them
          // without confusing them with actual purchase failures.
          if ((error as { code?: string })?.code === 'E_USER_CANCELLED') {
            throw error;
          }

          throw new InAppPurchaseError({
            error: error instanceof Error ? error : undefined,
            productId,
          });
        }
      },
      [
        availableOfferings,
        currentPurchase,
        startInAppPurchase,
        account,
        finalizePurchasing,
        trackEvent,
        requestPurchase,
        onboardingId,
        resetPurchaseState,
      ],
    );

    const finalizePurchasingOnError = React.useCallback(
      async ({ productId }: { productId: string }) => {
        try {
          await finishTransaction({
            // We have to call "finish" through this package so we get the error state
            // cleaned-up. Of course we don't have the full purchase obj so hope here is
            // calling it like this will fail and properly clear the error purchase state.

            // @ts-ignore-next-line
            purchase: { productId },
          });
        } catch (error) {
          // No-op - we tried all we could for this specific case.
        }
      },
      [finishTransaction],
    );

    React.useEffect(() => {
      if (
        typeof requestedPurchaseProductId.current !== 'undefined' &&
        typeof requestedPurchaseOnchainTransactionType.current !==
          'undefined' &&
        currentPurchase?.productId === requestedPurchaseProductId.current
      ) {
        finalizePurchasing({
          onchainTransactionType:
            requestedPurchaseOnchainTransactionType.current,
          currentPurchase,
        });
      }
    }, [currentPurchase, finalizePurchasing]);

    React.useEffect(() => {
      if (
        typeof requestedPurchaseProductId.current !== 'undefined' &&
        currentPurchaseError?.productId === requestedPurchaseProductId.current
      ) {
        setCurrentPurchaseFailed(true);
        finalizePurchasingOnError({
          productId: currentPurchaseError?.productId,
        });
      }
    }, [currentPurchaseError?.productId, finalizePurchasingOnError]);

    // Resolve the device's IAP availability once on mount. `initConnection` is
    // idempotent on the native side (`react-native-iap` guards the transaction
    // observer with a `hasTransactionObserver` flag), so calling it here in
    // addition to `withIAPContext`'s internal call is safe. We treat
    // rejections as "not allowed" defensively so we never trigger the iOS
    // restrictions modal when the device's IAP capability is unknown.
    //
    // IMPORTANT: the product-fetch effect below depends on canMakePayments
    // transitioning from null → true/false so that getProducts is never called
    // before the billing client is ready (Android E_NOT_PREPARED race).
    React.useEffect(() => {
      let cancelled = false;
      initConnection()
        .then((value) => {
          if (!cancelled) {
            setCanMakePayments(Boolean(value));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCanMakePayments(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, []);

    React.useEffect(() => {
      // Catalog hasn't loaded from the server yet — wait.
      if (typeof data === 'undefined') {
        return;
      }

      // Wait for initConnection to settle before querying products.
      // On Android, calling getProducts before the billing client is ready
      // yields E_NOT_PREPARED. canMakePayments is null until initConnection
      // resolves or rejects.
      if (canMakePayments === null) {
        return;
      }

      if (!canMakePayments) {
        setIsInitialized(true);
        return;
      }

      if (productCatalog.length === 0) {
        // Catalog loaded but empty — nothing to fetch from the store.
        setIsInitialized(true);
        return;
      }

      const iapSkus = productCatalog
        .filter(({ type }) => type === 'iap')
        .map(({ productId }) => productId);

      const subscriptionSkus = productCatalog
        .filter(({ type }) => type === 'subscription')
        .map(({ productId }) => productId);

      // These calls update the iap.products / iap.subscriptions values async.
      // On Android, getProducts only returns INAPP type; subscription products
      // require a separate getSubscriptions call. iOS SKProductsRequest handles
      // both in a single call but splitting is harmless.
      const fetches: Promise<unknown>[] = [];
      if (iapSkus.length > 0) {
        fetches.push(getProducts({ skus: iapSkus }));
      }
      if (subscriptionSkus.length > 0) {
        fetches.push(getSubscriptions({ skus: subscriptionSkus }));
      }

      let stale = false;
      Promise.allSettled(fetches).then(() => {
        if (!stale) {
          setIsInitialized(true);
        }
      });

      return () => {
        stale = true;
      };
    }, [
      canMakePayments,
      data,
      getProducts,
      productCatalog,
      productFetchRetryCount,
    ]);

    useEffect(() => {
      if (initConnectionError) {
        trackError(initConnectionError);
        trackEvent(AnalyticsEvent.InAppPurchaseConnectError, {
          message: initConnectionError.message,
        });
      }
    }, [initConnectionError, trackEvent]);

    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'InAppPurchasesProvider',
    });

    return (
      <InAppPurchasesContext.Provider
        value={{
          getAvailableOffering,
          hasPurchasedOffering,
          purchase,
          requestedPurchaseSucceeded,
          requestedPurchaseFailed,
          requestedPurchaseCancelledByUser,
          requestedPurchaseTrackingId,
          inAppPurchasingIsEnabled,
          restorePurchases,
          resetPurchaseState,
          availableConsumableOfferings,
          iapDebugData,
          isConnected: connected,
          isInitialized,
          retryProductFetch,
        }}
      >
        {children}
      </InAppPurchasesContext.Provider>
    );
  });

const useInAppPurchases = () => React.useContext(InAppPurchasesContext);

export { InAppPurchasesProvider, type LocalizedSKU, useInAppPurchases };
