import {
  getStoragePurchaseErrorMessage,
  parseEip155ChainId,
} from 'farcaster-client-data';
import {
  formatShorthandNumber,
  getNotionLinkTarget,
  useInvalidateStorageUtilization,
  useRentStorageOfferings,
  useRentTransactionData,
  useStorageUtilization,
} from 'farcaster-client-hooks';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { createWalletClient, custom, Hex } from 'viem';
import { sendTransaction, switchChain } from 'viem/actions';
import { optimism } from 'viem/chains';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Divider } from '~/components/Divider';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { SettingsNav } from '~/layouts/SettingsNav';
import { formatCents } from '~/utils/currencyUtils';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

const formatPercent = (used: number, rented: number) => {
  if (rented <= 0) {
    return '0%';
  }
  return `${Math.round((used / rented) * 100)}%`;
};

const SettingsStoragePage = memo(() => {
  const currentUser = useCurrentUser();
  const { address, provider } = useWallet();
  const {
    data: { storageUtilization },
  } = useStorageUtilization();
  const {
    data: { rentStorageOfferings },
  } = useRentStorageOfferings();
  const rentTransactionData = useRentTransactionData();
  const invalidateStorageUtilization = useInvalidateStorageUtilization();
  const [selectedUnits, setSelectedUnits] = useState<number>();
  const [purchasePending, setPurchasePending] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string>();

  const selectedOffering = useMemo(() => {
    return (
      rentStorageOfferings.find(
        (offering) => offering.units === selectedUnits,
      ) ?? rentStorageOfferings[0]
    );
  }, [rentStorageOfferings, selectedUnits]);

  const rows = useMemo(
    () => [
      {
        label: 'Casts',
        used: storageUtilization.casts.used,
        rented: storageUtilization.casts.rented,
        previewRented:
          storageUtilization.casts.rented +
          (selectedOffering?.limits.casts ?? 0),
      },
      {
        label: 'Reactions',
        used: storageUtilization.reactions.used,
        rented: storageUtilization.reactions.rented,
        previewRented:
          storageUtilization.reactions.rented +
          (selectedOffering?.limits.reactions ?? 0),
      },
      {
        label: 'Follows',
        used: storageUtilization.links.used,
        rented: storageUtilization.links.rented,
        previewRented:
          storageUtilization.links.rented +
          (selectedOffering?.limits.links ?? 0),
      },
    ],
    [
      selectedOffering?.limits.casts,
      selectedOffering?.limits.links,
      selectedOffering?.limits.reactions,
      storageUtilization.casts.rented,
      storageUtilization.casts.used,
      storageUtilization.links.rented,
      storageUtilization.links.used,
      storageUtilization.reactions.rented,
      storageUtilization.reactions.used,
    ],
  );

  const purchaseButtonTitle = useMemo(() => {
    if (purchasePending) {
      return 'Confirming in wallet...';
    }
    if (!address || !provider) {
      return 'Connect wallet to purchase';
    }
    return 'Purchase storage';
  }, [address, provider, purchasePending]);

  const purchaseDisabled =
    purchasePending ||
    typeof selectedOffering === 'undefined' ||
    !address ||
    !provider;

  const onPurchaseStorage = useCallback(async () => {
    if (
      typeof selectedOffering === 'undefined' ||
      !address ||
      typeof provider === 'undefined'
    ) {
      return;
    }

    setPurchaseError(undefined);
    setPurchasePending(true);

    try {
      const intent = await rentTransactionData({
        fid: currentUser.fid,
        units: selectedOffering.units,
      });

      const chainId = parseEip155ChainId(intent.chainId);
      if (chainId !== optimism.id) {
        throw new Error(`Unsupported storage chain id: ${intent.chainId}`);
      }

      const client = createWalletClient({
        account: address,
        chain: optimism,
        transport: custom(provider),
      });

      const currentChainId = await client.getChainId();
      if (currentChainId !== optimism.id) {
        await switchChain(client, { id: optimism.id });
      }

      await sendTransaction(client, {
        account: address,
        chain: optimism,
        data: intent.params.data as Hex,
        to: intent.params.to as Hex,
        value: BigInt(intent.params.value),
      });

      await invalidateStorageUtilization();
      toast({
        message:
          'Storage transaction submitted. Your limits will update shortly.',
        type: 'success',
      });
    } catch (error) {
      trackError(error);
      setPurchaseError(getStoragePurchaseErrorMessage(error));
    } finally {
      setPurchasePending(false);
    }
  }, [
    address,
    currentUser.fid,
    invalidateStorageUtilization,
    provider,
    rentTransactionData,
    selectedOffering,
  ]);

  const currentUnitsText = `${storageUtilization.rentedUnits} storage ${
    storageUtilization.rentedUnits === 1 ? 'unit' : 'units'
  }`;
  const previewUnits =
    typeof selectedOffering === 'undefined'
      ? storageUtilization.rentedUnits
      : storageUtilization.rentedUnits + selectedOffering.units;
  const previewUnitsText = `${previewUnits} ${
    previewUnits === 1 ? 'unit' : 'units'
  }`;

  return (
    <Page meta={{ title: 'Storage Settings / Farcaster' }}>
      <>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-default">Storage</h2>
              <ExternalLink
                href={getNotionLinkTarget({ to: 'storage' })}
                title="Learn more about storage"
                className="text-action-link-default text-sm hover:underline"
              >
                Learn more
              </ExternalLink>
            </div>
            <p className="mb-3 text-sm text-secondary">
              You have {currentUnitsText}.
            </p>
            <Divider />
            <div className="mt-4 flex flex-col gap-4">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-6"
                >
                  <span className="text-sm font-medium text-default">
                    {row.label}
                  </span>
                  <span className="text-sm text-secondary">
                    {row.used.toLocaleString()} / {row.rented.toLocaleString()}{' '}
                    ({formatPercent(row.used, row.rented)})
                  </span>
                </div>
              ))}
            </div>
            <Divider />
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-default">
                  Buy more storage
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  Select an amount and confirm the transaction in your wallet.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {rentStorageOfferings.map((offering) => {
                  const selected = offering.units === selectedOffering?.units;

                  return (
                    <button
                      key={offering.sku.productId}
                      type="button"
                      aria-pressed={selected}
                      className={[
                        'flex flex-col rounded-lg border p-4 text-left',
                        selected
                          ? 'border-action-primary bg-faint'
                          : 'border-default hover:bg-faint',
                      ].join(' ')}
                      onClick={() => {
                        setSelectedUnits(offering.units);
                        setPurchaseError(undefined);
                      }}
                    >
                      <span className="text-sm font-semibold text-default">
                        {offering.units}{' '}
                        {offering.units === 1 ? 'unit' : 'units'}
                      </span>
                      <span className="mt-1 text-sm text-secondary">
                        {formatShorthandNumber(offering.limits.casts)} casts,{' '}
                        {formatShorthandNumber(offering.limits.reactions)}{' '}
                        reactions,{' '}
                        {formatShorthandNumber(offering.limits.links)} follows
                      </span>
                      <span className="mt-3 text-sm font-medium text-default">
                        {formatCents(offering.sku.price)} per year
                      </span>
                    </button>
                  );
                })}
              </div>
              {typeof selectedOffering !== 'undefined' && (
                <div className="rounded-lg border p-4 border-default">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-secondary">
                      After purchase
                    </span>
                    <span className="text-sm font-semibold text-default">
                      {previewUnitsText}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-6"
                      >
                        <span className="text-sm font-medium text-default">
                          {row.label}
                        </span>
                        <span className="text-sm text-secondary">
                          {row.used.toLocaleString()} /{' '}
                          {row.previewRented.toLocaleString()} (
                          {formatPercent(row.used, row.previewRented)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {purchaseError && (
                <div className="rounded-lg border px-3 py-2 text-sm border-danger text-danger">
                  {purchaseError}
                </div>
              )}
              {!address || !provider ? (
                <p className="text-sm text-secondary">
                  Connect a wallet in preferred wallet settings to purchase
                  storage.
                </p>
              ) : null}
              <DefaultButton
                className="w-full"
                disabled={purchaseDisabled}
                isLoading={purchasePending}
                onClick={onPurchaseStorage}
                size="lg"
              >
                {purchaseButtonTitle}
              </DefaultButton>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </>
    </Page>
  );
});

SettingsStoragePage.displayName = 'SettingsStoragePage';

export { SettingsStoragePage };
