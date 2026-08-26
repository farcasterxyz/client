import {
  addEmbedToCast,
  CastComposerEmbed,
  CastComposerEmbedsMap,
  removeEmbedsFromCast,
  syncEmbedsBySourceForCast,
} from './castComposerEmbedHelpers';

export type CastComposerImageEmbedV1 = {
  version: 'v1';
  url: string;
  imageDeleteHash: string;
};

export type CastComposerImageEmbedV2 = {
  version: 'v2';
  localUriRef: string;
  previewUrl: string;
  url: string;
  uploadPromise: Promise<Response>;
  uploadStatus?: 'idle' | 'uploading' | 'uploaded' | 'failed';
  aspectRatio: number;
};

export type CastComposerImageEmbed =
  | CastComposerImageEmbedV1
  | CastComposerImageEmbedV2;

export type CastComposerVideoEmbed = {
  localUriRef: string;
  url: string;
  videoId: string;
  width: number;
  height: number;
  thumbnailUrl?: string;
};

export type CastComposerUrlEmbed = {
  url: string;
};

export type CastComposerEmbeds = {
  images: CastComposerImageEmbed[];
  videos: CastComposerVideoEmbed[];
  urls: CastComposerUrlEmbed[];
};

export type CastComposerEmbedsPerCast = {
  [castLocalKey: number]: CastComposerEmbeds;
};

export type CastComposerEmbedStoreAction =
  | {
      type: 'add';
      castLocalKey: number;
      embed: CastComposerEmbed;
      maxEmbedsLength: number;
    }
  | {
      type: 'remove';
      castLocalKey: number;
      predicate: (embed: CastComposerEmbed) => boolean;
    }
  | {
      type: 'syncSource';
      castLocalKey: number;
      source: string;
      candidates: CastComposerEmbed[];
      maxEmbedsLength: number;
    }
  | {
      type: 'setCast';
      castLocalKey: number;
      embeds: CastComposerEmbed[];
    }
  | {
      type: 'updateCast';
      castLocalKey: number;
      updater: (embeds: CastComposerEmbed[]) => CastComposerEmbed[];
      upsert?: boolean;
    }
  | {
      type: 'setAll';
      updater: (embeds: CastComposerEmbedsMap) => CastComposerEmbedsMap;
    };

/**
 * Every `CastComposerEmbedStoreAction['type']` must appear here. If the action
 * union changes, TypeScript fails until this object is updated (in addition to
 * the reducer switch below).
 */
const _castComposerEmbedStoreActionTypeCoverage = {
  add: true,
  remove: true,
  syncSource: true,
  setCast: true,
  updateCast: true,
  setAll: true,
} as const satisfies Record<CastComposerEmbedStoreAction['type'], true>;

export type CastComposerEmbedStoreActionType =
  keyof typeof _castComposerEmbedStoreActionTypeCoverage;

export function reduceCastComposerEmbeds(
  state: CastComposerEmbedsMap,
  action: CastComposerEmbedStoreAction,
): CastComposerEmbedsMap {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        [action.castLocalKey]: addEmbedToCast(
          state[action.castLocalKey] ?? [],
          action.embed,
          action.maxEmbedsLength,
        ),
      };
    case 'remove': {
      if (!state[action.castLocalKey]) return state;
      return {
        ...state,
        [action.castLocalKey]: removeEmbedsFromCast(
          state[action.castLocalKey],
          action.predicate,
        ),
      };
    }
    case 'syncSource':
      return {
        ...state,
        [action.castLocalKey]: syncEmbedsBySourceForCast(
          state[action.castLocalKey] ?? [],
          action.source,
          action.candidates,
          action.maxEmbedsLength,
        ),
      };
    case 'setCast':
      return {
        ...state,
        [action.castLocalKey]: action.embeds,
      };
    case 'updateCast': {
      if (!state[action.castLocalKey] && !action.upsert) return state;
      return {
        ...state,
        [action.castLocalKey]: action.updater(state[action.castLocalKey] ?? []),
      };
    }
    case 'setAll':
      return action.updater(state);
    default: {
      const rogue = action as { type?: unknown };
      const _exhaustiveCheck: never = action;
      throw new Error(
        `[reduceCastComposerEmbeds] Unknown action type: ${String(rogue.type)}`,
      );
    }
  }
}
