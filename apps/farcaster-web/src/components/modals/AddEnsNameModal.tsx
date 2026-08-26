import { CheckCircleIcon } from '@primer/octicons-react';
import {
  getEnsVerificationError,
  isHandledFetchError,
} from 'farcaster-client-data';
import {
  formatDuration,
  useAddUserUsername,
  useSetUserUsername,
  validateEnsName,
} from 'farcaster-client-hooks';
import React, { FC, memo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { Link } from '~/components/links/Link';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';

type AddEnsNameModalProps = {
  fid: number;
  usernameNotEditableFor: number | undefined;
  usernameUpdateLimitMillis: number | undefined;
  onCancel: () => void;
  onCloseWithUpdates: () => void;
};

const AddEnsNameModal: FC<AddEnsNameModalProps> = memo(
  ({
    fid,
    usernameNotEditableFor,
    usernameUpdateLimitMillis,
    onCancel,
    onCloseWithUpdates,
  }) => {
    const addUserUsername = useAddUserUsername();
    const setUserUsername = useSetUserUsername();

    const [error, setError] = useState<string>('');
    const [ensName, setEnsName] = useState<string>('');
    const [ensNameWithSuffix, setEnsNameWithSuffix] = useState<string>('');
    const [showConnectLink, setShowConnectLink] = useState<boolean>(false);

    const [nameAdded, setNameAdded] = useState<boolean>(false);

    return (
      <Modal>
        <DefaultModalContainer onClose={onCancel}>
          <div className="flex size-full flex-col items-center p-4">
            <div
              className="relative mt-[calc(50vh-140px)] flex w-full max-w-[500px] flex-col items-center justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex w-full justify-end">
                <DefaultCloseModalButton onClick={onCancel} className="p-2" />
              </div>
              {!nameAdded && (
                <>
                  <div className="mb-6 text-center text-2xl font-bold">
                    Add ENS name
                  </div>
                  <div className="flex items-stretch">
                    <TextInput
                      value={ensName}
                      className="w-64 rounded-r-none p-4"
                      onChange={(e) => {
                        const value = e.target.value;
                        const valueWithSuffix = value + '.eth';
                        setEnsName(value);
                        setEnsNameWithSuffix(valueWithSuffix);
                        setShowConnectLink(false);
                        const validationResult =
                          validateEnsName(valueWithSuffix);
                        if (!validationResult.valid) {
                          setError(validationResult.error);
                        } else {
                          setError('');
                        }
                      }}
                    />
                    <span className="flex items-center rounded-r border border-l-0 px-2 text-sm text-muted border-default">
                      .eth
                    </span>
                  </div>

                  {error && (
                    <div className="mt-8 px-14 text-center text-sm text-danger">
                      {error}
                    </div>
                  )}
                  {showConnectLink && (
                    <div className="mt-4">
                      <Link
                        title="Connect wallet"
                        to="settingsConnectedAddresses"
                        params={{}}
                        searchParams={{}}
                        className="text-sm hover:bg-overlay-faint"
                      >
                        Connect address
                      </Link>
                    </div>
                  )}
                  <div className="mt-8 pb-4">
                    <DefaultButton
                      className="w-40"
                      disabled={error !== ''}
                      onClick={async () => {
                        try {
                          await addUserUsername({
                            username: {
                              name: ensNameWithSuffix,
                              type: 'ens_l1',
                            },
                          });
                          setNameAdded(true);
                        } catch (error) {
                          if (
                            isHandledFetchError(error) &&
                            error.responseData.errors.length
                          ) {
                            const message =
                              error.responseData.errors[0].message;
                            setError(message);
                            setShowConnectLink(
                              getEnsVerificationError(error)?.data
                                .showConnectAddressLink || false,
                            );
                          }
                        }
                      }}
                    >
                      Add
                    </DefaultButton>
                  </div>
                </>
              )}
              {nameAdded && (
                <>
                  <div className="mb-8 text-center text-2xl font-bold">
                    {ensNameWithSuffix} was verified
                  </div>
                  <div className="mb-8">
                    <CheckCircleIcon size={96} />
                  </div>
                  {usernameNotEditableFor && (
                    <>
                      <div className="mb-6 text-sm">
                        Your username cannot be changed for{' '}
                        {formatDuration(usernameNotEditableFor, true)}.
                      </div>
                      <div className="pb-4">
                        <DefaultButton
                          className="w-40"
                          onClick={async () => {
                            onCloseWithUpdates();
                          }}
                        >
                          OK
                        </DefaultButton>
                      </div>
                    </>
                  )}
                  {!usernameNotEditableFor && (
                    <>
                      <div className="px-14 text-center text-sm">
                        Change your username to @{ensNameWithSuffix}?{' '}
                        {usernameUpdateLimitMillis ? (
                          <>
                            You can't change this again for{' '}
                            <span className="font-bold">
                              {formatDuration(usernameUpdateLimitMillis)}
                            </span>
                            .
                          </>
                        ) : null}
                      </div>
                      <div className="mt-6 flex gap-4 pb-4">
                        <div>
                          <DefaultButton
                            className="w-40"
                            variant="muted"
                            onClick={async () => {
                              onCloseWithUpdates();
                            }}
                          >
                            Not now
                          </DefaultButton>
                        </div>
                        <div>
                          <DefaultButton
                            className="min-w-[160px] px-6"
                            variant="danger"
                            onClick={async () => {
                              try {
                                await setUserUsername({
                                  fid,
                                  username: ensNameWithSuffix,
                                });
                                onCloseWithUpdates();
                              } catch (error) {
                                if (
                                  isHandledFetchError(error) &&
                                  error.responseData.errors.length
                                ) {
                                  const message =
                                    error.responseData.errors[0].message;
                                  setError(message);
                                }
                              }
                            }}
                          >
                            Use @{ensNameWithSuffix}
                          </DefaultButton>
                        </div>
                      </div>
                      {error && (
                        <div className="mt-2 px-14 pb-4 text-center text-sm text-danger">
                          {error}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

AddEnsNameModal.displayName = 'AddEnsNameModal';

export { AddEnsNameModal };
