import { PromptInfo } from '~/types';

import { getItem, setItem } from './StorageUtils';

const getDefaultPromptInfo = (): PromptInfo => ({
  hasOptedOut: false,
  hasPresentedThisSession: false,
  lastPresentedAt: 0,
  presentedCount: 0,
});
const getPromptInfo = async ({ storageKey }: { storageKey: string }) =>
  getItem({ key: storageKey, fallback: getDefaultPromptInfo() });

const setPromptInfo = async ({
  info,
  storageKey,
}: {
  info: Partial<PromptInfo>;
  storageKey: string;
}) => {
  const existingInfo = await getPromptInfo({ storageKey });
  setItem({ key: storageKey, value: { ...existingInfo, ...info } });
};

export { getPromptInfo, setPromptInfo };
