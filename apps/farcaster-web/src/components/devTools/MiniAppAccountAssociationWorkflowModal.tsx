import {
  ApiDomainManifest,
  ApiJsonFarcasterSignature,
  isFarcasterApiError,
} from 'farcaster-client-data';
import {
  useDevToolsRefreshDomainManifest,
  useDevToolsRegisterDomain,
  useFetchDevToolsFarcasterJson,
  useFetchDevToolsGetRegisteredAccountAssociation,
  useFetchDevToolsTempAccountAssociation,
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
  useUserAuthAddress,
} from 'farcaster-client-hooks';
import { CheckIcon, InfoIcon } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { QRCode } from 'react-qrcode-logo';

import { PreviewFarcasterJson } from '~/components/devTools/PreviewConfiguration';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { isDev } from '~/constants/env';
import { useSilentSignManifestMutation } from '~/hooks/siwf/useSilentSignManifestMutation';
import { toast } from '~/utils/toast';

type MiniAppAccountAssociationWorkflowModalProps = {
  targetFid?: string;
  domain: string;
  onClose: () => void;
  onSuccess: () => void;
  isOwnershipTransfer?: boolean;
  onAccountAssociationGenerated?: (
    accountAssociation: ApiJsonFarcasterSignature,
  ) => void;
};

const SignWithWarpcastContent: React.FC<{
  domain: string;
  targetFid?: string;
  onSuccess: (accountAssociation: ApiJsonFarcasterSignature) => void;
  onAccountAssociationGenerated?: (
    accountAssociation: ApiJsonFarcasterSignature,
  ) => void;
}> = ({ domain, targetFid, onSuccess, onAccountAssociationGenerated }) => {
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const deepLink = useMemo(() => {
    if (targetFid) {
      return `https://farcaster.xyz/~/developers/register?domain=${domain}&fid=${targetFid}`;
    }
    return `https://farcaster.xyz/~/developers/register?domain=${domain}`;
  }, [domain, targetFid]);

  const fetchTempAccountAssociation = useFetchDevToolsTempAccountAssociation();
  const [tempAccountAssociation, setTempAccountAssociation] = useState<
    ApiJsonFarcasterSignature | undefined
  >(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const reportOnce = useRef(false);
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [firstFetchIsPending, setFirstFetchIsPending] = useState(true);
  const {
    data: authAddressState,
    isLoading: authAddressStateLoading,
    isSuccess: authAddressStateSuccess,
  } = useUserAuthAddress();
  const hasTriggeredSilentSign = useRef(false);

  const silentSignManifestMutation = useSilentSignManifestMutation({
    onSuccess: (data) => {
      setTempAccountAssociation(data);
    },
  });

  useEffect(() => {
    if (authAddressState?.state !== 'added') {
      return;
    }
    if (tempAccountAssociation) {
      return;
    }
    if (hasTriggeredSilentSign.current) {
      return;
    }
    if (silentSignManifestMutation.status === 'idle') {
      hasTriggeredSilentSign.current = true;
      silentSignManifestMutation.mutate(domain);
    }
  }, [
    authAddressState,
    silentSignManifestMutation,
    tempAccountAssociation,
    domain,
  ]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(deepLink);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [deepLink]);

  useEffect(() => {
    if (error && isFarcasterApiError(error) && error.status !== 404) {
      setIsError(true);
    }
  }, [error]);

  useEffect(() => {
    if (!tempAccountAssociation) {
      const startTime = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes in milliseconds
      const interval = setInterval(() => {
        if (Date.now() - startTime >= timeout) {
          clearInterval(interval);
          return;
        }
        if (isError) {
          clearInterval(interval);
          return;
        }
        if (tempAccountAssociation) {
          clearInterval(interval);
          if (!reportOnce.current) {
            if (onAccountAssociationGenerated) {
              onAccountAssociationGenerated(tempAccountAssociation);
            } else {
              onSuccess(tempAccountAssociation);
            }
            reportOnce.current = true;
          }
          return;
        }
        fetchTempAccountAssociation({
          domain,
          fid: targetFid ? Number(targetFid) : undefined,
        })
          .then((result) => {
            if (result) {
              setTempAccountAssociation(result);
            }
          })
          .catch((error) => {
            setError(error);
          });
      }, 10000);

      fetchTempAccountAssociation({
        domain,
        fid: targetFid ? Number(targetFid) : undefined,
      })
        .then((result) => {
          if (result) {
            setTempAccountAssociation(result);
          }
        })
        .catch((error) => {
          setError(error);
        })
        .finally(() => {
          setFirstFetchIsPending(false);
        });

      return () => clearInterval(interval);
    } else {
      if (!reportOnce.current) {
        if (onAccountAssociationGenerated) {
          onAccountAssociationGenerated(tempAccountAssociation);
        } else {
          onSuccess(tempAccountAssociation);
        }
        reportOnce.current = true;
      }
    }
  }, [
    tempAccountAssociation,
    isError,
    onSuccess,
    onAccountAssociationGenerated,
    domain,
    targetFid,
    fetchTempAccountAssociation,
  ]);

  const shouldStartSilentSign =
    authAddressStateSuccess &&
    embeddedWalletBridge && // ← guards against “no wallet” fallback
    silentSignManifestMutation.status === 'idle';

  const isLoading =
    firstFetchIsPending ||
    authAddressStateLoading || // ① auth still fetching
    shouldStartSilentSign || // ② waiting for effect to fire
    silentSignManifestMutation.isPending; // ③ mutation in flight

  if (isLoading && !isError && error === undefined) {
    return (
      <div className="flex size-full flex-col items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  } else if (tempAccountAssociation && onAccountAssociationGenerated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-4">
      <StepLabel number={1} label="Generate account association" />
      <span className="text-sm text-muted">
        Scan the QR code to open the Farcaster mobile app to generate a signed
        accountAssociation needed to associate the domain with{' '}
        {targetFid ? 'the target account' : 'your account'}.
      </span>
      <div className="flex w-full flex-col items-center justify-center gap-2">
        <QRCode
          bgColor="#ffffff"
          ecLevel="H"
          eyeRadius={0}
          fgColor="#000000"
          quietZone={20}
          size={250}
          value={deepLink}
        />
        {isDev && (
          <DefaultButton onClick={copyToClipboard} variant="secondary">
            {copied ? 'Copied' : 'Copy to clipboard'}
          </DefaultButton>
        )}
      </div>
      <span className="text-sm text-muted">
        Once signed, this page will automatically take you to the next step.
      </span>
      {isError && (
        <span className="text-danger">
          Error fetching the signed account association. Please try again.
        </span>
      )}
    </div>
  );
};

const StepLabel = ({ number, label }: { number: number; label: string }) => {
  return (
    <div className="flex flex-row items-center gap-x-2">
      <div className="flex size-6 items-center justify-center rounded-full text-sm bg-faint text-default">
        {number}
      </div>
      <div className="text-base font-medium text-muted">{label}</div>
    </div>
  );
};

const StoreSignatureContent: React.FC<{
  targetFid?: string;
  domain: string;
  accountAssociation: ApiJsonFarcasterSignature;
  onSuccess: () => void;
}> = ({ targetFid, domain, accountAssociation, onSuccess }) => {
  const fetchFarcasterJson = useFetchDevToolsFarcasterJson();
  const [farcasterJson, setFarcasterJson] = useState<
    ApiDomainManifest | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const registerDomain = useDevToolsRegisterDomain();
  const refreshDomain = useDevToolsRefreshDomainManifest();
  const [verifyAttempted, setVerifyAttempted] = useState(false);
  const manifest = !farcasterJson
    ? undefined
    : (farcasterJson as ApiDomainManifest);

  const [hasMatchingAccountAssociation, setHasMatchingAccountAssociation] =
    useState(false);
  const [registerError, setRegisterError] = useState<string | undefined>(
    undefined,
  );

  const refetchFarcasterJson = useCallback(() => {
    setIsLoading(true);
    setIsError(false);
    fetchFarcasterJson({ domain })
      .then((result) => {
        if (result) {
          setFarcasterJson(result);
        }
      })
      .catch(() => {
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [domain, fetchFarcasterJson]);

  useEffect(() => {
    if (!farcasterJson && !isLoading && !isError) {
      refetchFarcasterJson();
    }
  }, [
    domain,
    farcasterJson,
    fetchFarcasterJson,
    isError,
    isLoading,
    refetchFarcasterJson,
  ]);

  useEffect(() => {
    if (
      manifest &&
      manifest.accountAssociation &&
      manifest.accountAssociation.signature === accountAssociation.signature &&
      manifest.accountAssociation.header === accountAssociation.header &&
      manifest.accountAssociation.payload === accountAssociation.payload
    ) {
      setHasMatchingAccountAssociation(true);
    } else {
      setHasMatchingAccountAssociation(false);
      if (verifyAttempted) {
        toast({
          message: 'accountAssociation property does not match',
          type: 'error',
        });
        setVerifyAttempted(false);
      }
    }
  }, [manifest, accountAssociation, verifyAttempted]);

  const handleVerify = useCallback(() => {
    setVerifyAttempted(true);
    refetchFarcasterJson();
  }, [refetchFarcasterJson]);

  const handleRegister = useCallback(async () => {
    try {
      setIsRegistering(true);
      const state = targetFid
        ? await refreshDomain({ domain })
        : await registerDomain({ domain });
      if (state.verified) {
        toast({
          message: targetFid
            ? 'Transferred ownership'
            : 'Account association complete',
          type: 'success',
        });
        onSuccess();
      } else {
        setRegisterError(state.message);
      }
    } catch (error) {
      toast({
        message: targetFid
          ? 'Error transferring ownership'
          : 'Error associating with account',
        type: 'error',
      });
    } finally {
      setIsRegistering(false);
    }
  }, [domain, registerDomain, refreshDomain, onSuccess, targetFid]);

  if (isLoading) {
    return (
      <div className="flex size-full flex-col items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  // removed
  if (isError || (!isLoading && !farcasterJson)) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4">
        <span className="text-sm text-danger">
          Error fetching your manifest file. Please try again.
        </span>
        <DefaultButton onClick={refetchFarcasterJson}>Try again</DefaultButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <StepLabel number={2} label="Update account association" />
      {manifest && (
        <div className="flex flex-col gap-y-3">
          <span className="text-sm text-muted">
            Update the accountAssociation property of your
            /.well-known/farcaster.json
          </span>
          <PreviewFarcasterJson hideHeader manifest={{ accountAssociation }} />
        </div>
      )}
      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted">
          Before submitting, we'll verify your /.well-known/farcaster.json file
          to make sure it has the accountAssociation property as seen above.
        </span>
        {!hasMatchingAccountAssociation ? (
          <>
            <div className="flex justify-end">
              <DefaultButton
                onClick={handleVerify}
                isLoading={isLoading}
                disabled={isLoading}
              >
                Reverify
              </DefaultButton>
            </div>
            <div className="inline-flex flex-row gap-1 self-end rounded-lg px-[6px] py-[4px] bg-notification-blue">
              <InfoIcon className="size-4 text-informative" />
              <div className="text-xs text-informative">
                accountAssociation doesn't match
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-row justify-end gap-x-2">
            <div className="flex flex-row items-center gap-1 rounded-lg px-[6px] py-[4px] bg-notification-green">
              <CheckIcon className="size-4 text-success" />
              <div className="text-xs text-success">
                accountAssociation matches
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex w-full flex-col gap-y-3 pt-3">
        <StepLabel number={3} label="Submit ownership change" />
        <span className="text-sm text-muted">
          Submit account association to Farcaster to complete the process.
        </span>
        <div className="flex flex-row justify-end">
          <DefaultButton
            onClick={handleRegister}
            variant={hasMatchingAccountAssociation ? 'normal' : 'secondary'}
            disabled={!hasMatchingAccountAssociation || isRegistering}
            isLoading={isRegistering}
          >
            Submit
          </DefaultButton>
        </div>
        {registerError && <span className="text-danger">{registerError}</span>}
      </div>
    </div>
  );
};

const MiniAppAccountAssociationWorkflowModal: React.FC<MiniAppAccountAssociationWorkflowModalProps> =
  React.memo(
    ({
      domain,
      targetFid,
      onClose,
      onSuccess,
      isOwnershipTransfer = false,
      onAccountAssociationGenerated,
    }) => {
      return (
        <Modal>
          <DefaultModalContainer onClose={onClose}>
            <DefaultModalContent>
              <DefaultModalHeader
                title={'Account Association'}
                onClose={onClose}
              />
              <MiniAppAccountAssociationWorkflowModalContent
                domain={domain}
                targetFid={targetFid}
                onSuccess={onSuccess}
                isOwnershipTransfer={isOwnershipTransfer}
                onAccountAssociationGenerated={onAccountAssociationGenerated}
              />
            </DefaultModalContent>
          </DefaultModalContainer>
        </Modal>
      );
    },
  );

type MiniAppAccountAssociationWorkflowModalContentProps = {
  domain: string;
  targetFid?: string;
  onSuccess: () => void;
  isOwnershipTransfer?: boolean;
  onAccountAssociationGenerated?: (
    accountAssociation: ApiJsonFarcasterSignature,
  ) => void;
};

const MiniAppAccountAssociationWorkflowModalContent: React.FC<
  MiniAppAccountAssociationWorkflowModalContentProps
> = ({
  domain,
  targetFid: targetFidProp,
  onSuccess,
  isOwnershipTransfer,
  onAccountAssociationGenerated,
}) => {
  const { data, isLoading, isError } = useNonSuspenseFrameDetails({
    domain: domain ?? '',
    enabled: !!domain,
  });
  const frame = useGloballyCachedFrame(data);
  const [targetFid, setTargetFid] = useState<string | undefined>(targetFidProp);
  const fetchRegisteredAccountAssociation =
    useFetchDevToolsGetRegisteredAccountAssociation();
  const [isAccountAssociationLoading, setIsAccountAssociationLoading] =
    useState(false);
  const [accountAssociation, setAccountAssociation] = useState<
    ApiJsonFarcasterSignature | undefined
  >(undefined);
  const callOnce = useRef(false);

  const onSignSuccess = useCallback(
    (accountAssociation: ApiJsonFarcasterSignature) => {
      setAccountAssociation(accountAssociation);
    },
    [],
  );

  useEffect(() => {
    if (!isError && frame && domain && onAccountAssociationGenerated) {
      setIsAccountAssociationLoading(true);
      fetchRegisteredAccountAssociation({ domain })
        .then((result) => {
          if (result) {
            setAccountAssociation(result);
          }
        })
        .finally(() => {
          setIsAccountAssociationLoading(false);
        });
    }
  }, [
    domain,
    fetchRegisteredAccountAssociation,
    isError,
    frame,
    setAccountAssociation,
    onAccountAssociationGenerated,
  ]);

  if (isLoading || isAccountAssociationLoading) {
    return (
      <div className="flex size-full flex-col items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (!isError && frame) {
    if (
      onAccountAssociationGenerated &&
      accountAssociation &&
      !callOnce.current
    ) {
      onAccountAssociationGenerated(accountAssociation);
      callOnce.current = true;
      return null;
    } else if (
      isOwnershipTransfer &&
      frame.author &&
      frame.author.fid === Number(targetFid)
    ) {
      return (
        <div className="flex size-full flex-col">
          <div className="flex flex-1 flex-col rounded-b-md border-t p-[16px] bg-app border-default">
            <div className="flex flex-1 flex-col gap-4">
              <div className="text-sm text-muted">
                The domain is already associated with the target account
              </div>
              <DataCard>
                <Datum name="Domain" value={domain} />
                <Datum name="Target FID" value={targetFid} />
                <Datum
                  name="Associated with"
                  value={frame.author.username ?? `FID ${frame.author.fid}`}
                />
              </DataCard>
            </div>
          </div>
        </div>
      );
    }
  }

  if (isOwnershipTransfer && !targetFid) {
    return (
      <div className="flex size-full flex-col">
        <div className="flex flex-1 flex-col rounded-b-md border-t p-[16px] bg-app border-default">
          <div className="flex-1">
            <AskForTargetFidContent onSubmit={setTargetFid} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex size-full flex-col">
      <div className="flex flex-1 flex-col rounded-b-md border-t p-[16px] bg-app border-default">
        <div className="flex-1">
          {accountAssociation ? (
            <StoreSignatureContent
              targetFid={targetFid}
              domain={domain}
              accountAssociation={accountAssociation}
              onSuccess={onSuccess}
            />
          ) : (
            <SignWithWarpcastContent
              domain={domain}
              targetFid={targetFid}
              onSuccess={onSignSuccess}
              onAccountAssociationGenerated={onAccountAssociationGenerated}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const AskForTargetFidContent: React.FC<{
  onSubmit: (targetFid: string) => void;
}> = ({ onSubmit }) => {
  const [newOwnerFid, setNewOwnerFid] = useState<string>('');
  const handleFidChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewOwnerFid(e.target.value);
    },
    [],
  );
  const handleSubmit = useCallback(() => {
    onSubmit(newOwnerFid);
  }, [newOwnerFid, onSubmit]);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-base font-medium text-muted">Transfer Ownership</div>
      <span className="text-sm text-muted">
        To transfer ownership specify the target account's FID and follow the
        steps to associate the domain with the new account.
      </span>
      <div className="flex flex-col pb-4">
        <div className="flex flex-row items-center gap-2">
          <div className="text-xs font-medium text-faint">New Owner FID</div>
        </div>
        <TextInput
          value={newOwnerFid}
          onChange={handleFidChange}
          autoCapitalize="none"
          spellCheck={false}
          placeholder="e.g. 2345"
        />
      </div>
      <div className="flex justify-end">
        <DefaultButton
          onClick={handleSubmit}
          disabled={!newOwnerFid || isNaN(Number(newOwnerFid))}
        >
          Start Transfer
        </DefaultButton>
      </div>
    </div>
  );
};

const DataCard = ({ children }: { children: React.ReactNode }) => {
  return <div className="w-full rounded-lg bg-faint">{children}</div>;
};

const Datum = ({
  name,
  value,
}: {
  name: string;
  value: string | React.ReactNode;
}) => {
  return (
    <div className="flex flex-row items-center justify-between border-b p-[16px] border-app">
      <div className="text-base text-muted">{name}</div>
      <div className="text-base text-default">{value}</div>
    </div>
  );
};

export { MiniAppAccountAssociationWorkflowModal };
