import { verify } from '@farcaster/jfs';
import {
  ApiDomainFrameConfig,
  ApiDomainManifest,
  ApiJsonFarcasterSignature,
} from 'farcaster-client-data';
import {
  useDevToolsGetMiniAppManifest,
  useDevToolsStoreMiniAppManifest,
  useDevToolsUpdateMiniAppManifest,
} from 'farcaster-client-hooks';
import { SettingsIcon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BlueBanner } from '~/components/BlueBanner';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ManageHostedManifestsModal } from '~/components/devTools/ManageHostedManifestsModal';
import { ManifestBuilder } from '~/components/devTools/ManifestBuilder';
import { MiniAppAccountAssociationWorkflowModal } from '~/components/devTools/MiniAppAccountAssociationWorkflowModal';
import { PreviewFarcasterJson } from '~/components/devTools/PreviewConfiguration';
import { ViewDocsButton } from '~/components/devTools/ViewDocsButton';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { HostedManifestRedirectBanner } from '~/components/HostedManifestRedirectBanner';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useIsValidFarcasterJson } from '~/hooks/devTools/useIsValidFarcasterJson';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { useSilentSignManifestMutation } from '~/hooks/siwf/useSilentSignManifestMutation';
import { toast } from '~/utils/toast';

const HostedManifestsPage: React.FC = () => {
  const {
    id: paramId,
    domain: paramDomain,
    manage,
  } = useSearchParams('developersHostedManifests');

  const [manifestJsonInput, setManifestJsonInput] = useState('');
  const [domain, setDomain] = useState<string>(paramDomain ?? '');
  const [showAccountAssociationModal, setShowAccountAssociationModal] =
    useState(false);
  const [showManageManifestsModal, setShowManageManifestsModal] =
    useState(false);
  const [frameConfig, setFrameConfig] = useState<ApiDomainFrameConfig | null>(
    null,
  );
  const [accountAssociation, setAccountAssociation] =
    useState<ApiJsonFarcasterSignature | null>(null);

  const storeMutation = useDevToolsStoreMiniAppManifest();
  const updateMutation = useDevToolsUpdateMiniAppManifest();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [storedManifestId, setStoredManifestId] = useState<string | null>(null);
  const id = paramId || storedManifestId;

  const { data: fetchedManifest } = useDevToolsGetMiniAppManifest({
    id: id || '',
    enabled: !!id,
  });

  const isValidFarcasterJson = useIsValidFarcasterJson();
  const [isManifestValid, setIsManifestValid] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Hack to show "manage manifests" modal on load. Uses `manage=true` in the URL
  useEffect(() => {
    if (manage === 'true') {
      setShowManageManifestsModal(true);
    }
  }, [manage]);

  useEffect(() => {
    if (fetchedManifest && id) {
      setStoredManifestId(id);
      if (fetchedManifest.frame) {
        setFrameConfig(fetchedManifest.frame);
      }
      if (fetchedManifest.accountAssociation) {
        setAccountAssociation(fetchedManifest.accountAssociation);
      }
      setManifestJsonInput(JSON.stringify(fetchedManifest, null, 2));
      if (fetchedManifest.frame?.homeUrl) {
        try {
          const url = new URL(fetchedManifest.frame.homeUrl);
          setDomain(url.hostname);
        } catch (e) {}
      }
    }
  }, [fetchedManifest, id]);

  // Update manifestJsonInput whenever frameConfig or accountAssociation changes
  const computeManifest = useCallback(
    (
      frameConfig: ApiDomainFrameConfig | null,
      accountAssociation: ApiJsonFarcasterSignature | null,
    ): ApiDomainManifest => {
      const manifest: ApiDomainManifest = {
        accountAssociation: {
          header: '',
          payload: '',
          signature: '',
        },
      };
      if (frameConfig) {
        manifest.frame = frameConfig;
      }
      if (accountAssociation) {
        manifest.accountAssociation = accountAssociation;
      }
      return manifest;
    },
    [],
  );

  useEffect(() => {
    const manifest = computeManifest(frameConfig, accountAssociation);
    if (frameConfig || accountAssociation) {
      setManifestJsonInput(JSON.stringify(manifest, null, 2));
    } else {
      setManifestJsonInput('');
    }
  }, [frameConfig, accountAssociation, computeManifest]);

  // Validate the frame config whenever it changes
  useEffect(() => {
    if (frameConfig) {
      const isValid = isValidFarcasterJson({
        farcasterJson: frameConfig,
        recommended: true,
      });
      setIsManifestValid(isValid);
    } else {
      setIsManifestValid(false);
    }
  }, [frameConfig, isValidFarcasterJson]);

  const handleFrameConfigChanged = useCallback(
    (newFrameConfig: ApiDomainFrameConfig) => {
      setFrameConfig(newFrameConfig);
    },
    [],
  );

  const handleAccountAssociationGenerated = useCallback(
    (newAccountAssociation: ApiJsonFarcasterSignature) => {
      setAccountAssociation(newAccountAssociation);
      setShowAccountAssociationModal(false);
      toast({
        message: 'Account association generated successfully!',
        type: 'success',
      });
    },
    [],
  );

  const handleCloseAccountAssociationModal = useCallback(() => {
    setShowAccountAssociationModal(false);
  }, []);

  const handleSubmitManifest = useCallback(
    async (manifestJsonInput: string) => {
      if (!manifestJsonInput.trim()) {
        toast({
          message: 'Manifest JSON cannot be empty.',
          type: 'error',
        });
        return;
      }

      const manifest = JSON.parse(manifestJsonInput) as ApiDomainManifest;

      setIsSubmitting(true);
      storeMutation({ manifest })
        .then((storeId: string) => {
          setIsSubmitting(false);
          setStoredManifestId(storeId);
          setShowInstructions(true);
          toast({
            message: 'Manifest submitted successfully!',
            type: 'success',
          });
        })
        .catch(() => {
          setIsSubmitting(false);
          toast({
            message: 'Failed to submit manifest.',
            type: 'error',
          });
        });
    },
    [storeMutation, setIsSubmitting],
  );

  const domainIsDifferent = useMemo(() => {
    if (!domain) {
      return false;
    }
    if (!isManifestValid) {
      return false;
    }
    if (!accountAssociation?.payload) {
      return true;
    }

    // base64 decode header
    const decodedHeaderJson = Buffer.from(
      accountAssociation.payload,
      'base64',
    ).toString('utf-8');
    const decodedHeader: { domain: string } = JSON.parse(decodedHeaderJson);
    return domain !== decodedHeader.domain;
  }, [accountAssociation, domain, isManifestValid]);

  const [requiresManifestSigning, setRequiresManifestSigning] = useState(false);
  useEffect(() => {
    if (domainIsDifferent) {
      setRequiresManifestSigning(true);
      return;
    }
    if (!accountAssociation) {
      setRequiresManifestSigning(true);
      return;
    }
    verify({
      data: accountAssociation,
      keyTypes: ['custody', 'auth'],
    })
      .then(() => {
        setRequiresManifestSigning(false);
      })
      .catch(() => {
        setRequiresManifestSigning(true);
      });
  }, [
    domainIsDifferent,
    domain,
    accountAssociation,
    setRequiresManifestSigning,
  ]);

  const silentSignManifestMutation = useSilentSignManifestMutation();
  const handleSubmit = useCallback(async () => {
    let manifestToSave = manifestJsonInput;
    if (requiresManifestSigning) {
      try {
        const newAccountAssociation =
          await silentSignManifestMutation.mutateAsync(domain);
        setAccountAssociation(newAccountAssociation);
        manifestToSave = JSON.stringify(
          computeManifest(frameConfig, newAccountAssociation),
        );
      } catch (e) {
        setShowAccountAssociationModal(true);
      }
    }

    if (id) {
      // When editing via URL id, we need to update
      setIsUpdating(true);

      // If manifest requires signing, we need to sign it
      // this can happen asynchronously and transparently if user has an auth address
      // otherwise we need to show the QR code flow

      updateMutation({ id, manifest: JSON.parse(manifestToSave) })
        .then(() => {
          setIsUpdating(false);
          setStoredManifestId(id);
          toast({
            message: 'Manifest updated successfully!',
            type: 'success',
          });
        })
        .catch(() => {
          setIsUpdating(false);
          toast({
            message: 'Failed to update manifest.',
            type: 'error',
          });
        });
    } else {
      handleSubmitManifest(manifestToSave);
    }
  }, [
    id,
    updateMutation,
    handleSubmitManifest,
    requiresManifestSigning,
    domain,
    silentSignManifestMutation,
    computeManifest,
    frameConfig,
    manifestJsonInput,
  ]);

  return (
    <Page
      meta={{ title: 'Developers / Hosted Manifests' }}
      className="max-w-[1000px]"
    >
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          visibleOnMobile
          iconRight={
            <div className="flex items-center gap-2">
              <ViewDocsButton href="https://miniapps.farcaster.xyz/docs/guides/publishing#define-your-application-configuration" />
              <DefaultButton
                onClick={() => setShowManageManifestsModal(true)}
                variant="secondary"
                className="ml-auto"
              >
                <div className="flex flex-row items-center gap-2">
                  <SettingsIcon className="size-4" />
                  Manage Hosted Manifests
                </div>
              </DefaultButton>
            </div>
          }
        >
          <PageTitle>
            <BackButton />
            <span>{id ? 'Manage' : 'New'} Manifest</span>
          </PageTitle>
        </PageHeader>
        <div className="flex flex-col gap-6 p-4 pb-20">
          <div>
            <div className="mb-2 text-base font-medium">
              {id ? `Edit manifest (ID: ${id})` : 'Create a new manifest'}
            </div>

            <BlueBanner className="my-4">
              <div className="flex flex-row gap-3 lg:items-center">
                <div className="flex flex-col">
                  <div className="text-sm font-semibold text-informative">
                    Understanding Manifests
                  </div>
                  <div className="text-sm text-muted">
                    A Manifest (<code>farcaster.json</code>) is required to
                    register your Mini App and bind it to your domain. Think of
                    it as DNS for your Mini App - it tells Farcaster clients
                    about your app's name, icon, functionality, and enables deep
                    integrations with the Farcaster ecosystem.
                  </div>
                </div>
              </div>
            </BlueBanner>

            <div className="mb-6">
              <div className="mb-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-faint">Domain</div>
                <TextInput
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                />
              </div>
              <ManifestBuilder
                domain={domain || undefined}
                onFrameConfigChanged={handleFrameConfigChanged}
                initialFrameConfig={frameConfig && id ? frameConfig : undefined}
              />
            </div>

            <div className="flex justify-end gap-2">
              {storedManifestId && (
                <DefaultButton
                  onClick={() => {
                    setShowInstructions(!showInstructions);
                  }}
                >
                  {showInstructions ? 'Hide instructions' : 'View instructions'}
                </DefaultButton>
              )}
              <DefaultButton
                onClick={handleSubmit}
                disabled={isSubmitting || isUpdating || !isManifestValid}
              >
                {id ? 'Update' : 'Submit'}
              </DefaultButton>
            </div>

            {storedManifestId && showInstructions && (
              <HostedManifestRedirectBanner manifestId={storedManifestId} />
            )}

            <div className="mt-4">
              <PreviewFarcasterJson
                className="min-h-[230px]"
                header="Manifest JSON"
                description=" "
                manifest={
                  frameConfig || accountAssociation
                    ? ({
                        ...(frameConfig && { frame: frameConfig }),
                        ...(accountAssociation && { accountAssociation }),
                      } as ApiDomainManifest)
                    : undefined
                }
                disableCopy
                isInvalid={!isManifestValid}
              />
            </div>
          </div>
        </div>
      </BorderedMainContent>
      {showAccountAssociationModal && domain && (
        <MiniAppAccountAssociationWorkflowModal
          domain={domain}
          onClose={handleCloseAccountAssociationModal}
          onSuccess={() => {}} // Not used since we have onAccountAssociationGenerated
          onAccountAssociationGenerated={handleAccountAssociationGenerated}
        />
      )}
      {showManageManifestsModal && (
        <ManageHostedManifestsModal
          onClose={() => setShowManageManifestsModal(false)}
        />
      )}
    </Page>
  );
};

export { HostedManifestsPage };
