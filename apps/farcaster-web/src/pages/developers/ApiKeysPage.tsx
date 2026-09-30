import { ApiKey } from 'farcaster-client-data';
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FormControl } from '~/components/forms/FormControl';
import { Label } from '~/components/forms/Label';
import { TextInput } from '~/components/forms/TextInput';
import { AlertModal } from '~/components/modals/AlertModal';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { dayjs } from '~/utils/dayjs';

const ApiKeysPage: React.FC = () => {
  const { data: apiKeysData } = useApiKeys();
  const apiKeys = apiKeysData?.apiKeys || [];

  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSaveKeyModal, setShowSaveKeyModal] = useState(false);
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState(
    dayjs().add(1, 'year').format('YYYY-MM-DDTHH:mm'),
  );
  const [createdSecretKey, setCreatedSecretKey] = useState('');

  const onCreate = useCallback(async () => {
    const { secretKey } = await createApiKey({
      description,
      expiresAt: Date.parse(expiresAt),
    });
    setCreatedSecretKey(secretKey);
    setShowCreateModal(false);
    setShowSaveKeyModal(true);
  }, [createApiKey, description, expiresAt]);

  const onRevoke = useCallback(
    async (id: string) => {
      await revokeApiKey({ id });
    },
    [revokeApiKey],
  );

  const copySecretKey = useCallback(() => {
    navigator.clipboard.writeText(createdSecretKey);
  }, [createdSecretKey]);

  return (
    <Page meta={{ title: 'Developers / API Keys' }}>
      <BorderedMainContent className="max-w-4xl">
        <PageHeader hideCastButton>
          <PageTitle>Developers: API Keys</PageTitle>
        </PageHeader>
        <div className="flex flex-col px-4 pb-40">
          <table className="w-full text-left">
            <thead className="border-b font-bold border-faint">
              <tr>
                <th className="py-4">API Key</th>
                <th className="py-4">Description</th>
                <th className="py-4">Created</th>
                <th className="py-4">Expires</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length > 0 ? (
                apiKeys.map((apiKey) => (
                  <ApiKeyRow
                    key={apiKey.id}
                    apiKey={apiKey}
                    onRevoke={onRevoke}
                  />
                ))
              ) : (
                <tr>
                  <td className="py-4">No API keys.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 flex justify-start">
            <DefaultButton onClick={() => setShowCreateModal(true)}>
              Create an API Key
            </DefaultButton>
          </div>
          {showCreateModal && (
            <CreateApiKeyModal
              description={description}
              expiresAt={expiresAt}
              onCancel={() => setShowCreateModal(false)}
              onCreate={onCreate}
              setDescription={setDescription}
              setExpiresAt={setExpiresAt}
            />
          )}
          {showSaveKeyModal && (
            <SaveApiKeyModal
              createdSecretKey={createdSecretKey}
              onCopy={() => {
                copySecretKey();
                setShowSaveKeyModal(false);
              }}
            />
          )}
        </div>
      </BorderedMainContent>
    </Page>
  );
};

const ApiKeyRow: React.FC<{
  apiKey: ApiKey;
  onRevoke: (id: string) => void;
}> = ({ apiKey, onRevoke }) => {
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  return (
    <tr key={apiKey.id} className="border-b border-faint">
      <td className="py-4">
        <pre className={apiKey.revokedAt ? 'line-through' : ''}>
          wc_secret_{apiKey.tag}
        </pre>
      </td>
      <td className="py-4">{apiKey.description}</td>
      <td className="py-4">{dayjs(apiKey.createdAt).format('L')}</td>
      <td className="py-4">{dayjs(apiKey.expiresAt).format('L')}</td>
      <td className="hidden py-4 lg:block">
        {apiKey.revokedAt ? (
          <td>Revoked</td>
        ) : (
          <DefaultButton
            variant="danger"
            disabled={!!apiKey.revokedAt}
            onClick={() => setShowRevokeModal(true)}
          >
            Revoke
          </DefaultButton>
        )}
      </td>
      {showRevokeModal && (
        <ConfirmationModal
          onCancel={() => setShowRevokeModal(false)}
          onConfirm={() => {
            onRevoke(apiKey.id);
            setShowRevokeModal(false);
          }}
          confirmText="Revoke"
          title="Revoke API Key"
          destructive
        />
      )}
    </tr>
  );
};

const CreateApiKeyModal: React.FC<{
  description: string;
  expiresAt: string;
  onCancel: () => void;
  onCreate: () => void;
  setDescription: (value: string) => void;
  setExpiresAt: (value: string) => void;
}> = ({
  description,
  expiresAt,
  onCancel,
  onCreate,
  setDescription,
  setExpiresAt,
}) => (
  <ConfirmationModal
    confirmText="Create"
    onCancel={onCancel}
    onConfirm={onCreate}
    title="Create API Key"
    body={
      <>
        <FormControl
          label={<Label>Description</Label>}
          input={
            <TextInput
              value={description}
              maxLength={80}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
              minLength={1}
            />
          }
          instructions={undefined}
        />
        <FormControl
          label={<Label>Expires</Label>}
          input={
            <TextInput
              type="dateTime-local"
              value={expiresAt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExpiresAt(e.target.value)
              }
            />
          }
          instructions={undefined}
        />
      </>
    }
  />
);

const SaveApiKeyModal: React.FC<{
  createdSecretKey: string;
  onCopy: () => void;
}> = ({ createdSecretKey, onCopy }) => (
  <AlertModal okText="Copy API Key" onOk={onCopy}>
    <div>
      <div className="font-bold">Save Your Key</div>
      <div className="px-8 py-4">
        <p>
          Click the button below to copy your API key to the clipboard. You will
          not be able to view it again.
        </p>
      </div>
      <TextInput value={createdSecretKey} />
    </div>
  </AlertModal>
);

ApiKeysPage.displayName = 'ApiKeysPage';
export { ApiKeysPage };
