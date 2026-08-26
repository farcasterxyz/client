import { CastComposerEmbeds } from 'farcaster-client-hooks';

export type ImagePreviewDimensions = {
  width: number;
  height: number;
};

export type PromptInfo = {
  hasOptedOut: boolean;
  hasPresentedThisSession: boolean;
  lastPresentedAt: number;
  presentedCount: number;
};

export type CastDraftKeyParams = {
  parentHash: string | undefined;
};

export type CastDraft = {
  savedAt: number;
  text: string;
  embeds: CastComposerEmbeds;
  channelKey?: string;
};

export type CastDrafts = Record<string, CastDraft | undefined>;

export type HeaderOptions = Partial<{
  hideCancel: boolean;
  disableCancel: boolean;
  cancelPopsToTop: boolean;
  onCancelPress: () => void | undefined;
  onBackPress: () => void | undefined;
}>;
