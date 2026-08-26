import * as Octicons from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useAddMuteKeyword,
  useMutedKeyword,
  useMutedKeywords,
  useRemoveMuteKeyword,
} from 'farcaster-client-hooks';
import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { Toggle } from '~/components/forms/Toggle';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { SettingsNav } from '~/layouts/SettingsNav';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

const SettingsMutedKeywordsPage = memo(() => {
  const { trackEvent } = useAnalytics();

  const { data } = useMutedKeywords();

  const removeKeyword = useRemoveMuteKeyword();

  const mutedKeywords = React.useMemo(() => {
    return data.result.mutedKeywords;
  }, [data.result.mutedKeywords]);

  const [showTokenModalForKeyword, setShowTokenModal] = React.useState<
    string | undefined
  >(undefined);

  const onAddNewClick = React.useCallback(() => {
    setShowTokenModal('');
  }, []);

  const onKeywordClick = React.useCallback(
    ({ keyword }: { keyword: string }) => {
      setShowTokenModal(keyword);
    },
    [],
  );

  const MutedKeywordRow = ({ keyword }: { keyword: string }) => {
    const remove = useCallback(async ({ keyword }: { keyword: string }) => {
      try {
        await removeKeyword({ keyword });
        trackEvent(AnalyticsEvent.UnmuteKeyword, { keyword });
        toast({
          message: `Unmuted ${keyword}`,
          position: 'bottom-center',
        });
      } catch (error) {
        trackError(error);
      }
    }, []);

    return (
      <div
        key={keyword}
        className="flex cursor-pointer flex-row items-center px-4 py-2 hover:bg-overlay-faint"
        onClick={() => onKeywordClick({ keyword })}
      >
        <div className="justify-left flex w-full flex-row items-center">
          <span className="w-auto overflow-hidden text-ellipsis sm:max-w-40 lg:max-w-none">
            {keyword}
          </span>
        </div>
        <div
          className="cursor-pointer text-faint hover:text-default"
          onClick={(e) => {
            e.stopPropagation();
            remove({ keyword });
          }}
        >
          <Octicons.XIcon size={18} />
        </div>
      </div>
    );
  };

  return (
    <Page meta={{ title: 'Muted words / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="mb-4 flex flex-col">
              <span className="mb-2 font-semibold">Muted words</span>
              <div className="-mx-4 mb-2 space-y-2 border-b px-4 pb-4 text-muted border-default">
                <p className="">
                  Enter a keyword or phrase to mute. Muted content won't appear
                  in your feed.
                </p>
                <DefaultButton className="w-full" onClick={onAddNewClick}>
                  Add
                </DefaultButton>
              </div>
              <div className="-mx-4 flex flex-col space-y-2">
                {mutedKeywords.length === 0 ? (
                  <div className="w-full text-center text-faint">
                    No keywords or phrases muted
                  </div>
                ) : (
                  mutedKeywords.map(({ keyword }) => (
                    <MutedKeywordRow key={keyword} keyword={keyword} />
                  ))
                )}
              </div>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
      {typeof showTokenModalForKeyword !== 'undefined' && (
        <MutedKeywordModal
          keyword={showTokenModalForKeyword}
          onClose={() => setShowTokenModal(undefined)}
        />
      )}
    </Page>
  );
});

SettingsMutedKeywordsPage.displayName = 'SettingsMutedKeywordsPage';

type KeywordReducerAction =
  | { type: 'ApplyToFrames'; apply: boolean }
  | { type: 'ApplyToChannels'; apply: boolean }
  | { type: 'ApplyToNotifications'; apply: boolean };

interface KeywordReducerState {
  applyToFrames: boolean;
  applyToChannels: boolean;
  applyToNotifications: boolean;
}

function keywordReducer(
  state: KeywordReducerState,
  action: KeywordReducerAction,
): KeywordReducerState {
  let updatedState = state;

  switch (action.type) {
    case 'ApplyToChannels':
      updatedState = { ...state, applyToChannels: action.apply };
      break;
    case 'ApplyToFrames':
      updatedState = { ...state, applyToFrames: action.apply };
      break;
    case 'ApplyToNotifications':
      updatedState = { ...state, applyToNotifications: action.apply };
      break;
  }

  return updatedState;
}

function MutedKeywordModal({
  keyword,
  onClose,
}: {
  keyword: string;
  onClose: () => void;
}) {
  const { trackEvent } = useAnalytics();
  const addKeyword = useAddMuteKeyword();

  const { data: keywordsData } = useMutedKeywords();

  const { data } = useMutedKeyword({
    keyword: keyword === '' ? undefined : keyword,
  });

  const existingMutedKeyword = useMemo(() => {
    if (typeof data === 'undefined') {
      return undefined;
    }

    return data.mutedKeyword;
  }, [data]);

  const existingMutedKeywords = useMemo(() => {
    return keywordsData.result.keywords;
  }, [keywordsData.result.keywords]);

  const [isAdding, setIsAdding] = useState<boolean>(false);

  const keywordPropertiesReducer = React.useReducer(keywordReducer, {
    applyToFrames: true,
    applyToChannels: false,
    applyToNotifications: false,
  });

  const [state, dispatch] = keywordPropertiesReducer;

  React.useEffect(() => {
    if (existingMutedKeyword) {
      dispatch({
        type: 'ApplyToFrames',
        apply: existingMutedKeyword.properties.frames,
      });
      dispatch({
        type: 'ApplyToChannels',
        apply: existingMutedKeyword.properties.channels,
      });
      dispatch({
        type: 'ApplyToNotifications',
        apply: existingMutedKeyword.properties.notifications,
      });
    }
  }, [dispatch, existingMutedKeyword]);

  const [newKeywordValue, setNewKeywordValue] = useState<string | undefined>(
    keyword || undefined,
  );

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const onSetNewKeywordValue = useCallback(
    (value: string) => {
      setErrorMessage(undefined);

      setNewKeywordValue(value);

      if (existingMutedKeywords.includes(value)) {
        setErrorMessage('This keyword has already been muted.');
      }
    },
    [existingMutedKeywords],
  );

  const onAddKeyword = useCallback(async () => {
    if (!newKeywordValue) {
      return;
    }

    setIsAdding(true);
    try {
      addKeyword({
        keyword: newKeywordValue,
        properties: {
          channels: state.applyToChannels,
          frames: state.applyToFrames,
          notifications: state.applyToNotifications,
        },
      });

      setIsAdding(false);
      setErrorMessage(undefined);
      toast({ message: `${newKeywordValue} muted`, position: 'bottom-center' });
      trackEvent(AnalyticsEvent.MuteKeyword, { newKeywordValue });
      setNewKeywordValue(undefined);

      onClose();
    } catch (error) {
      setErrorMessage(`Unable to mute ${newKeywordValue}`);
      setIsAdding(false);
      trackError(error);
      return;
    }
  }, [
    addKeyword,
    newKeywordValue,
    onClose,
    state.applyToChannels,
    state.applyToFrames,
    state.applyToNotifications,
    trackEvent,
  ]);

  const onApplyToFramesChange = React.useCallback(
    (value: boolean) => {
      if (value) {
        trackEvent(AnalyticsEvent.ApplyMutedWordToFrames, {});
      }

      dispatch({
        type: 'ApplyToFrames',
        apply: value,
      });
    },
    [dispatch, trackEvent],
  );

  const onApplyToChannelsChange = React.useCallback(
    (value: boolean) => {
      if (value) {
        trackEvent(AnalyticsEvent.ApplyMutedWordToChannels, {});
      }

      dispatch({
        type: 'ApplyToChannels',
        apply: value,
      });
    },
    [dispatch, trackEvent],
  );

  const creatingNewKeyword = keyword === '';

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full flex-col items-center justify-center">
          <div
            className="flex h-auto w-[602px] flex-col items-start justify-center rounded-lg border bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex size-full flex-col space-y-8 p-6">
              <div
                className={classNames(
                  'flex flex-col space-y-2',
                  !creatingNewKeyword && 'opacity-50',
                )}
              >
                <div className="font-semibold text-default">Muted word</div>
                <div className="flex grow flex-col items-center">
                  <TextInput
                    value={newKeywordValue}
                    placeholder="Enter word or phrase..."
                    onChange={(e) => onSetNewKeywordValue(e.target.value)}
                  />
                  {typeof errorMessage !== 'undefined' && (
                    <div className="flex flex-row">
                      <span className="my-1 text-sm text-danger">
                        {errorMessage}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="font-semibold text-default">Apply mute to</div>
                <div className="flex grow flex-col items-center space-y-2">
                  <Toggle
                    label={'Mini Apps'}
                    description={
                      "Casts with mini app URLs matching won't appear in your home feed."
                    }
                    value={state.applyToFrames}
                    onValueChange={onApplyToFramesChange}
                  />
                  <Toggle
                    label={'Channels'}
                    description={
                      "Casts with channel names matching won't appear in your home feed."
                    }
                    value={state.applyToChannels}
                    onValueChange={onApplyToChannelsChange}
                  />
                </div>
              </div>
              <DefaultModalActionButtons
                isPrimaryButtonDisabled={
                  typeof newKeywordValue === 'undefined' ||
                  isAdding ||
                  !!errorMessage
                }
                onPrimaryButtonClick={onAddKeyword}
                primaryButtonLabel={creatingNewKeyword ? 'Mute' : 'Save'}
              />
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
}

export { SettingsMutedKeywordsPage };
