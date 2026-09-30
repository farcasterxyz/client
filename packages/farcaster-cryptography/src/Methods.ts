import { Mutex } from 'async-mutex';

import { decodeBase64MessageField, KeyTransport } from './KeyTransport';
import {
  Ciphertext,
  ConflictingStateError,
  Conversation,
  DataStore,
  EmbargoedCryptographyError,
  InboxDirectCast,
  isCryptographyError,
  KeyStore,
  KeyTransportState,
  PrivateKey,
  SigningPrivateKey,
  StoredPasskey,
  SymmetricEncryptionMode,
  SymmetricKey,
  UnconfirmedAgreement,
  UnexpectedStateError,
} from './types';
import {
  ApiDirectCastConversation,
  ApiFid,
  ApiSyncChannelMessage,
  DirectCast,
  FarcasterApiClient,
} from './types/api';

const ensureKeyMutex = new Map<string, Mutex>();
const conversationMap = new Map<string, DirectCast[]>();
const conversationIdCacheMap = new Map<string, ApiDirectCastConversation>();
const keyStatusListeners = new Set<KeyStatusChangeEventListener>();
let keyTransportState: KeyTransportState | undefined = undefined;

type KeyStatus = {
  sendingIdentityKey: SigningPrivateKey;
  sendingSignedPreKey: PrivateKey;
};

export type OnKeyChangeParams = {
  type: string;
  hasKeyTransport: boolean;
  hasTransportBundle: boolean;
  localSyncTime: number;
  remoteKeyTimestamp: number;
};

type KeyStatusChangeEventListener = (update: KeyStatus | undefined) => void;
type RemoveKeyStatusChangeEventListenerFunc = () => void;

const MASTER_KEY = 'MASTER_KEY';

/**
 * Creates a random (not CSPRNG, not mandatory) identifier for a message which
 * has no relationship to the contents or state around the message itself.
 */
export const generateMessageId = () => {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
    const v = (Math.random() * 16) | 0;
    return v.toString(16);
  });
};

export const isPasskeysSupported = async ({
  keyStore,
}: {
  keyStore: KeyStore;
}): Promise<boolean> => {
  return await keyStore.isPasskeysSupported();
};

export const getStoredPasskeys = async ({
  keyStore,
}: {
  keyStore: KeyStore;
}): Promise<StoredPasskey[]> => {
  const keys = await keyStore.getStoredPasskeys();
  const deduplicatedSet: StoredPasskey[] = [];
  for (const key of keys) {
    const index = deduplicatedSet.findIndex((s) => s.address === key.address);
    if (index >= 0) {
      deduplicatedSet.splice(index, 1, key);
    } else {
      deduplicatedSet.push(key);
    }
  }
  return deduplicatedSet;
};

export const updateStoredPasskey = async ({
  keyStore,
  credentialId,
  storedPasskey,
}: {
  keyStore: KeyStore;
  credentialId: string;
  storedPasskey: StoredPasskey;
}): Promise<boolean> => {
  return await keyStore.updateStoredPasskey(credentialId, storedPasskey);
};

export const deleteStoredPasskey = async ({
  keyStore,
  credentialId,
}: {
  keyStore: KeyStore;
  credentialId: string;
}): Promise<boolean> => {
  return await keyStore.deleteStoredPasskey(credentialId);
};

export const hasRecoveryData = async ({
  keyStore,
  credentialId,
}: {
  keyStore: KeyStore;
  credentialId: string;
}): Promise<boolean> => {
  return await keyStore.hasRecoveryData(credentialId);
};

export const initiatePasskeyRegistration = async ({
  keyStore,
  address,
  username,
  displayName,
  fid,
  pfpUrl,
}: {
  keyStore: KeyStore;
  address: string;
  username: string;
  displayName: string;
  fid: number;
  pfpUrl: string;
}): Promise<string> => {
  const registrationResult = await keyStore.register({
    challenge: createChallenge(),
    rp: {
      name: 'Farcaster',
      id: 'farcaster.xyz',
    },
    user: {
      id: address,
      name: username,
      displayName: '@' + username,
    },
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7,
      },
      {
        type: 'public-key',
        alg: -257,
      },
    ],
    timeout: 1800000,
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: true,
      residentKey: 'required',
      userVerification: 'required',
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const credentialId = (registrationResult as any).id;

  await updateStoredPasskey({
    keyStore,
    credentialId,
    storedPasskey: {
      credentialId,
      address,
      fid,
      username,
      displayName,
      pfpUrl,
      domain: 'farcaster.xyz',
    },
  });

  return credentialId;
};

export const completePasskeyRegistration = async ({
  keyStore,
  credentialId,
  mnemonic,
}: {
  keyStore: KeyStore;
  credentialId: string;
  mnemonic: string;
}): Promise<boolean> => {
  return !!(await keyStore.addMnemonicToCredential({
    challenge: createChallenge(),
    timeout: 1800000,
    userVerification: 'required',
    rpId: 'farcaster.xyz',
    credentialId,
    largeBlob: mnemonic,
  }));
};

export const authenticatePasskey = async ({
  keyStore,
  credentialId,
}: {
  keyStore: KeyStore;
  credentialId?: string;
}): Promise<{ mnemonic: string; credentialId: string; domain: string }> => {
  let rpId = 'farcaster.xyz';

  if (credentialId) {
    const credential = (await getStoredPasskeys({ keyStore })).find(
      (p) => p.credentialId === credentialId,
    );
    // Keep this default as warpcast.com — an undefined `domain` means the
    // StoredPasskey predates dual-domain support, and those passkeys were
    // only ever registered under warpcast.com. Flipping to farcaster.xyz
    // silently breaks sign-in for anyone with a legacy passkey.
    rpId = credential?.domain ?? 'warpcast.com';
  }

  const authenticate = async (id: string) => {
    const result = await keyStore.authenticate({
      challenge: createChallenge(),
      timeout: 1800000,
      userVerification: 'required',
      rpId: id,
      credentialId,
    });
    if (!result.largeBlob) {
      throw new Error('Passkey did not return recovery data');
    }
    return {
      mnemonic: result.largeBlob,
      credentialId: result.rawId,
      domain: id,
    };
  };

  // Discovery mode: try farcaster.xyz then warpcast.com. Both platforms
  // conflate "no matching passkey" with other error shapes — iOS maps it to
  // ASAuthorizationError.canceled (same code as user cancellation); Android
  // throws NoCredentialException — so we can't short-circuit on cancellation
  // or no_credential without skipping legitimate legacy-passkey users.
  if (!credentialId) {
    const attempt = async (id: string) => {
      try {
        return { ok: true as const, value: await authenticate(id) };
      } catch (err) {
        if (!(err instanceof Error)) throw err;
        // Passkey WAS found but its mnemonic can't be recovered (iOS 26.4
        // largeBlob regression, empty decryption, etc.). Don't retry on the
        // other domain — it would double-prompt without fixing recovery data.
        if (
          err.message === 'Passkey did not return recovery data' ||
          err.message === 'LargeBlobMissing' ||
          err.message.includes('decrypted mnemonic is empty')
        ) {
          throw err;
        }
        return { ok: false as const, error: err };
      }
    };

    const first = await attempt('farcaster.xyz');
    if (first.ok) return first.value;

    const second = await attempt('warpcast.com');
    if (second.ok) return second.value;

    // Both domains produced soft errors (cancellation / no credential). Surface
    // the first error so callers show messaging tied to the current-brand
    // domain rather than the last-attempted warpcast.com.
    throw first.error;
  }

  return await authenticate(rpId);
};

/** Detect user-cancelled passkey prompts */
export const isPasskeyCancellation = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message.startsWith('UserCancelled') ||
    error.message === 'user_canceled');

/** Detect PRF / passkey-not-supported errors across platforms */
export const isPasskeyNotSupported = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message.startsWith('NotSupported') ||
    error.message === 'not_supported' ||
    error.message === 'PRF extension not supported');

/** Detect no-credential-available errors (e.g., no matching passkey found on the current device) */
export const isPasskeyNoCredential = (error: unknown): boolean =>
  error instanceof Error && error.message === 'no_credential';

export const getInbox = async ({
  keyStore,
  fid,
}: {
  keyStore: KeyStore;
  fid: ApiFid;
}): Promise<Conversation[]> => {
  await setName({ keyStore, fid });
  const inbox = await keyStore.getInbox();
  const convoMap = inbox
    .filter((i) => !!i.lastMessage)
    .map((i) => {
      return {
        conversationId: i.conversationId,
        fids: new Set(i.participants.map((p) => p.fid)),
        lastMessageTimestamp: i.lastMessage?.timestamp ?? 0,
      };
    })
    .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

  return inbox
    .sort(
      (a, b) =>
        (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0),
    )
    .filter(
      (i, idx) =>
        convoMap.findIndex((c) => {
          const fidSet = new Set(i.participants.map((p) => p.fid));
          return (
            c.fids.size === fidSet.size &&
            [...c.fids].every((f) => fidSet.has(f))
          );
        }) === idx,
    )
    .map((c) => {
      c.conversationId = [...new Set(c.participants.map((p) => p.fid))]
        .sort()
        .join('-');
      return c;
    });
};

export const getUnseenConversations = async ({
  keyStore,
  fid,
}: {
  keyStore: KeyStore;
  fid: ApiFid;
}): Promise<Conversation[]> => {
  const conversations = await getInbox({ keyStore, fid });

  return conversations.filter((c) => c.lastMessage?.messageType !== 'read');
};

export const getConversation = async ({
  keyStore,
  farcasterApiClient,
  participants,
  fid,
}: {
  keyStore: KeyStore;
  farcasterApiClient: FarcasterApiClient;
  participants: ApiFid[];
  fid: ApiFid;
}): Promise<Conversation> => {
  await sync({
    keyStore,
    fid,
  });
  const inbox = await keyStore.getInbox();
  const conversation = inbox
    .filter((i) => !!i.lastMessage)
    .sort(
      (a, b) =>
        (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0),
    )
    .find((c) => {
      const existingParticipants = new Set(c.participants.map((p) => p.fid));
      // console.log("in conversation:" + JSON.stringify(existingParticipants));
      // console.log("compare:" + JSON.stringify(participants));
      return (
        participants.length === existingParticipants.size &&
        participants.every((e) => existingParticipants.has(e))
      );
    });

  if (conversation) {
    conversation.conversationId = [
      ...new Set(conversation.participants.map((p) => p.fid)),
    ]
      .sort()
      .join('-');
    return conversation;
  }

  const keyInfo = await Promise.all(
    participants.map(async (f) => {
      const result = await farcasterApiClient.getDirectCastKeysByAccount({
        fid: f,
      });
      return {
        info: result.data.result,
      };
    }),
  );

  const conversationId = [...new Set([...participants, fid])].sort().join('-');

  return {
    conversationId,
    lastFetchedAt: new Date().getTime(),
    conversationName: '',
    retentionTime: 60 * 24 * 60 * 60 * 1000,
    participants: keyInfo.flatMap(({ info }) => {
      return info.keys.idk.map((ki) => {
        return {
          conversationId,
          inboxId: ki.inboxId,
          fid: info.user.fid,
          address: ki.account,
          userInfo: info.user,
          joinedAt: new Date().getTime(),
          identityKey: ki.base64PublicKey,
          signedPreKey: info.keys.spk.find((s) => s.inboxId === ki.inboxId)!
            .base64PublicKey,
        };
      });
    }),
    unreadCount: 0,
  };
};

export const getConversationPage = async ({
  keyStore,
  fid,
  conversationId,
  pageSize,
  before,
  after,
}: {
  keyStore: KeyStore;
  fid: ApiFid;
  conversationId: string;
  pageSize: number;
  before: number | undefined;
  after: number | undefined;
}): Promise<InboxDirectCast[]> => {
  await setName({ keyStore, fid });
  const inbox = await keyStore.getInbox();
  // yes, this is gross, but the UI no longer knows about the real conversation
  // ids, so we have this:
  const matchingFids = new Set(
    conversationId.split('-').map((c) => parseInt(c, 10)),
  );

  const convoMap = inbox.map((i) => {
    return {
      conversationId: i.conversationId,
      fids: new Set(i.participants.map((p) => p.fid)),
      lastMessage: i.lastMessage,
    };
  });
  const allRelated = convoMap.filter(
    (i) =>
      i.lastMessage &&
      i.fids.size === matchingFids.size &&
      [...i.fids].every((f) => matchingFids.has(f)),
  );
  // There's a weird double-hook call that's happening making the cursor bounce
  // unpredictably. Let's just overquery and remove the problem.
  if (allRelated.length > 1) {
    pageSize = 1000;
  }
  const result = (
    await Promise.all(
      allRelated.map(async (a) => {
        try {
          return await keyStore.getConversationPage(
            a.conversationId,
            pageSize,
            before,
            after,
          );
        } catch {
          // there is an odd edge case for early tests that get broken by this call,
          // ignore those failed promises
          return [];
        }
      }),
    )
  ).flatMap((a) => a);
  if (before !== undefined) {
    return result
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, pageSize)
      .sort((a, b) => a.timestamp - b.timestamp);
  } else {
    return result.sort((a, b) => a.timestamp - b.timestamp).slice(0, pageSize);
  }
};

let runOnce = 0;

export const setName = async ({
  keyStore,
  fid,
}: {
  keyStore: KeyStore;
  fid: ApiFid;
}) => {
  if (runOnce !== fid) {
    runOnce = fid;
    return await keyStore.initializeWithName('farcaster' + fid);
  }
};

export const ensureInboxKeys = async ({
  address,
  fid,
  walletSignMessage,
  deviceId,
  deviceName,
  keyStore,
  farcasterApiClient,
}: {
  address: string;
  fid: ApiFid;
  walletSignMessage: (message: ArrayLike<number> | string) => Promise<string>;
  deviceId: string;
  deviceName: string;
  keyStore: KeyStore;
  farcasterApiClient: FarcasterApiClient;
}) => {
  await setName({ keyStore, fid });
  try {
    let inboxId = await keyStore.getInboxId();
    // console.log("inboxId: " + inboxId);
    const keys = await farcasterApiClient.getDirectCastKeysByAccount({
      fid,
    });

    const addressMismatch = keys.data.result.keys.idk.filter(
      (i) => i.account.toLowerCase() !== address.toLowerCase(),
    );

    let inboxKeys = await keyStore.getPublicInboxKeys();

    // We want to consider a few scenarios. If there are mismatching addresses:
    if (addressMismatch.length > 0) {
      const existingKey = keys.data.result.keys.idk.filter(
        (i) => i.inboxId === inboxId,
      );
      // Do we have an existing key in the set?
      if (existingKey.length > 0) {
        // Are the mismatched address keys newer?
        const newerKeysWithMismatch = addressMismatch.filter(
          (a) => a.timestamp > existingKey[0]!.timestamp,
        );
        // If so, delete our own
        if (newerKeysWithMismatch.length > 0) {
          await wipeKeystore({ keyStore });
        } else {
          // Otherwise delete those
          for (const key of addressMismatch) {
            await farcasterApiClient.deleteDirectCastKeysByInbox({
              inboxId: key.inboxId,
            });
          }
        }
      }

      inboxId = await keyStore.getInboxId();
      inboxKeys = await keyStore.getPublicInboxKeys();
    }

    // console.log("fetched keys: " + JSON.stringify(keys));

    if (!keys.data.result.keys.idk.find((i) => i.inboxId === inboxId)) {
      // console.log("local keys: " + JSON.stringify(keys));
      const idkSig = await walletSignMessage(
        inboxKeys.idk.base64PublicKey + inboxKeys.idk.inboxId,
      );
      // console.log("idk sig: " + JSON.stringify(idkSig));
      const spkSig = await walletSignMessage(
        inboxKeys.spk.base64PublicKey + inboxKeys.spk.inboxId,
      );
      // console.log("spk sig: " + JSON.stringify(spkSig));
      await farcasterApiClient.addDirectCastKeysByAccount({
        idk: {
          ...inboxKeys.idk,
          account: address,
          deviceId,
          deviceName,
          base64Signature: Buffer.from(
            idkSig.replace('0x', ''),
            'hex',
          ).toString('base64'),
        },
        spk: {
          ...inboxKeys.spk,
          account: address,
          deviceId,
          deviceName,
          base64Signature: Buffer.from(
            spkSig.replace('0x', ''),
            'hex',
          ).toString('base64'),
        },
      });
      // console.log("uploaded new keys");
    }
  } catch (e: unknown) {
    if ((e as Error)?.message.includes('embargoed')) {
      throw new EmbargoedCryptographyError('ensureInboxKeys', { error: e });
    } else {
      throw e;
    }
  }
};

export const sync = async ({
  keyStore,
  fid,
}: {
  keyStore: KeyStore;
  fid: ApiFid;
}) => {
  await setName({ keyStore, fid });
  await keyStore.getInboxId();

  await keyStore.clearOldMessages();
};

export const deleteConversation = async ({
  keyStore,
  conversationId,
}: {
  keyStore: KeyStore;
  conversationId: string;
}): Promise<void> => {
  const inbox = await keyStore.getInbox();
  const matchingFids = new Set(
    conversationId.split('-').map((c) => parseInt(c, 10)),
  );
  const convoMap = inbox.map((i) => {
    return {
      conversationId: i.conversationId,
      fids: new Set(i.participants.map((p) => p.fid)),
      lastMessage: i.lastMessage,
    };
  });
  const allRelated = convoMap.filter(
    (i) =>
      i.lastMessage &&
      i.fids.size === matchingFids.size &&
      [...i.fids].every((f) => matchingFids.has(f)),
  );
  for (const related of allRelated) {
    await keyStore.deleteConversation(related.conversationId);
  }
};

/**
 * Encrypts plaintext data with the master storage key, returning a Ciphertext
 * object. Ciphertext can be safely used in `JSON.stringify`.
 */
export const encrypt = async ({
  keyStore,
  data,
  onError,
}: {
  keyStore: KeyStore;
  data: string;
  onError?: (error: unknown) => void;
}) => {
  let symKey: SymmetricKey | undefined;

  try {
    symKey = await keyStore.getSymmetricKey({
      id: MASTER_KEY,
    } as unknown as SymmetricKey);
  } catch (error) {
    if (onError) onError(error);
  }

  if (!symKey) {
    symKey = await keyStore.createSymmetricKey(MASTER_KEY);
  }

  return await symKey.encrypt({
    encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
    base64Plaintext: Buffer.from(data, 'utf-8').toString('base64'),
  });
};

export const wipeKeystore = async ({ keyStore }: { keyStore: KeyStore }) => {
  await keyStore.wipeData();
};

/**
 * Decrypts a Ciphertext with the master storage key, returning a plaintext.
 */
export const decrypt = async ({
  keyStore,
  data,
}: {
  keyStore: KeyStore;
  data: Ciphertext;
}) => {
  const symKey = await keyStore.getSymmetricKey({
    id: MASTER_KEY,
  } as unknown as SymmetricKey);

  return Buffer.from(
    await symKey.decrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      ciphertext: data,
    }),
    'base64',
  ).toString('utf-8');
};

export const getKeyTransportState = async ({
  keyStore,
  dataStore,
}: {
  keyStore: KeyStore;
  dataStore: DataStore;
}) => {
  const keyTransport = await getKeyTransport({
    keyStore,
    dataStore,
  });

  const transportKey = await keyTransport.getTransportKey();

  if (transportKey) {
    keyTransportState = KeyTransportState.INITIALIZED;
  } else {
    keyTransportState = KeyTransportState.NOT_INITIALIZED;
  }

  return keyTransportState;
};

export const createSyncChannel = async ({
  farcasterApiClient,
  syncChannelIdentifier,
  keyStore,
  dataStore,
  sender,
  cancelController,
}: {
  farcasterApiClient: FarcasterApiClient;
  syncChannelIdentifier: string;
  keyStore: KeyStore;
  dataStore: DataStore;
  sender: boolean;
  cancelController: { cancel: boolean };
}) => {
  const keyTransport = await getKeyTransport({
    keyStore,
    dataStore,
  });

  const params = await keyTransport.initiateKeyAgreement(syncChannelIdentifier);
  let initiated = false;
  while (!initiated) {
    if (cancelController.cancel) {
      keyTransportState = KeyTransportState.NOT_INITIALIZED;
      throw new ConflictingStateError({
        message: 'the operation has been cancelled',
      });
    }

    try {
      await farcasterApiClient.updateSyncChannel(params);
      initiated = true;
    } catch {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    } // Deploys and connectivity issues will interrupt this, we shouldn't break
  }

  let messages: ApiSyncChannelMessage[] = [];

  do {
    if (cancelController.cancel) {
      keyTransportState = KeyTransportState.NOT_INITIALIZED;
      throw new ConflictingStateError({
        message: 'the operation has been cancelled',
      });
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
    try {
      const result = await farcasterApiClient.getSyncChannel(
        await keyTransport.generateSyncChannelGetParams(syncChannelIdentifier),
      );
      messages = result.data.result.messages;
    } catch {} // Deploys and connectivity issues will interrupt this, we shouldn't break
  } while (messages.length === 0);

  if (!sender) {
    let updated = false;
    while (!updated) {
      if (cancelController.cancel) {
        keyTransportState = KeyTransportState.NOT_INITIALIZED;
        throw new ConflictingStateError({
          message: 'the operation has been cancelled',
        });
      }

      try {
        await farcasterApiClient.updateSyncChannel(
          await keyTransport.initiateKeyAgreement(syncChannelIdentifier),
        );
        updated = true;
      } catch {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        });
      } // Deploys and connectivity issues will interrupt this, we shouldn't break
    }

    do {
      if (cancelController.cancel) {
        keyTransportState = KeyTransportState.NOT_INITIALIZED;
        throw new ConflictingStateError({
          message: 'the operation has been cancelled',
        });
      }
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });

      try {
        const result = await farcasterApiClient.getSyncChannel(
          await keyTransport.generateSyncChannelGetParams(
            syncChannelIdentifier,
          ),
        );
        messages = result.data.result.messages;
      } catch {} // Deploys and connectivity issues will interrupt this, we shouldn't break
    } while (messages.length === 0);
  }

  let agreement: UnconfirmedAgreement | undefined;
  let _parseFailureCount = 0; // Track for potential future metrics/logging

  /**
   * The first non-empty channel fetch can include only self-authored or invalid keys;
   * the counterparty may post shortly after. Keep polling and skip already-failed hashes
   * until we establish agreement or hit the cap (~3 minutes at 1s interval).
   */
  const processedMessageHashes = new Set<string>();
  const maxAgreementPolls = 180;
  const agreementPollIntervalMs = 1000;
  let agreementPollRounds = 0;
  let agreementFetchFailureCount = 0;
  let consecutiveAgreementFetchFailureCount = 0;
  let lastAgreementFetchError: unknown;

  for (
    let pollRound = 0;
    pollRound < maxAgreementPolls && !agreement;
    pollRound++
  ) {
    agreementPollRounds = pollRound + 1;

    if (cancelController.cancel) {
      keyTransportState = KeyTransportState.NOT_INITIALIZED;
      throw new ConflictingStateError({
        message: 'the operation has been cancelled',
      });
    }

    if (pollRound > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, agreementPollIntervalMs);
      });
      try {
        const result = await farcasterApiClient.getSyncChannel(
          await keyTransport.generateSyncChannelGetParams(
            syncChannelIdentifier,
          ),
        );
        messages = result.data.result.messages;
        consecutiveAgreementFetchFailureCount = 0;
      } catch (error) {
        // Deploys and connectivity issues will interrupt this, we shouldn't break
        agreementFetchFailureCount++;
        consecutiveAgreementFetchFailureCount++;
        lastAgreementFetchError = error;
        // Avoid processing stale snapshots when sync channel refresh fails.
        messages = [];
      }
    }

    for (const message of messages) {
      if (processedMessageHashes.has(message.messageHash)) {
        continue;
      }

      let messageType: string;
      try {
        const parsed = JSON.parse(
          decodeBase64MessageField(message.message).toString('utf-8'),
        );
        messageType = parsed.type;
      } catch {
        _parseFailureCount++;
        processedMessageHashes.add(message.messageHash);
        continue;
      }

      if (messageType !== 'PublicKey') {
        processedMessageHashes.add(message.messageHash);
        continue;
      }

      try {
        agreement = await keyTransport.receiveKeyAgreementRequest({
          channelId: syncChannelIdentifier,
          ...message,
        });
        const readParams = await keyTransport.generateSetMessageReadParams(
          syncChannelIdentifier,
          message.messageHash,
        );

        let markedRead = false;
        while (!markedRead) {
          if (cancelController.cancel) {
            keyTransportState = KeyTransportState.NOT_INITIALIZED;
            throw new ConflictingStateError({
              message: 'the operation has been cancelled',
            });
          }

          try {
            await farcasterApiClient.markSyncChannelMessageRead(readParams);
            markedRead = true;
          } catch {
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            });
          } // Deploys and connectivity issues will interrupt this, we shouldn't break
        }
        break;
      } catch (error) {
        if (error instanceof ConflictingStateError) {
          throw error;
        }
        processedMessageHashes.add(message.messageHash);
        // Corrupted, stale, or self-authored PublicKey messages should not abort
        // the handshake. Continue scanning for the next valid candidate.
        continue;
      }
    }
  }

  // Note: _parseFailureCount tracks corrupted messages for potential future metrics/logging
  // If agreement is undefined here, it means no valid PublicKey message was found
  if (!agreement) {
    keyTransportState = KeyTransportState.NOT_INITIALIZED;

    const attemptedAgreementFetches = Math.max(0, agreementPollRounds - 1);
    const failedAllAgreementFetches =
      attemptedAgreementFetches > 0 &&
      agreementFetchFailureCount === attemptedAgreementFetches;
    const lastAgreementFetchErrorMessage =
      typeof lastAgreementFetchError === 'undefined'
        ? undefined
        : lastAgreementFetchError instanceof Error
          ? lastAgreementFetchError.message
          : String(lastAgreementFetchError);
    const lastFetchErrorDiagnostic = lastAgreementFetchErrorMessage
      ? `, lastFetchError=${lastAgreementFetchErrorMessage}`
      : '';

    if (failedAllAgreementFetches) {
      throw new UnexpectedStateError({
        message: `Unable to fetch sync channel updates during key agreement polling after ${agreementPollRounds} poll rounds (${agreementPollIntervalMs}ms interval). fetchFailures=${agreementFetchFailureCount}, consecutiveFetchFailures=${consecutiveAgreementFetchFailureCount}.`,
        error: lastAgreementFetchError,
      });
    }

    throw new UnexpectedStateError({
      message: `No valid PublicKey message found in sync channel after ${agreementPollRounds} poll rounds (${agreementPollIntervalMs}ms interval). parseFailures=${_parseFailureCount}, processedMessages=${processedMessageHashes.size}, fetchFailures=${agreementFetchFailureCount}, consecutiveFetchFailures=${consecutiveAgreementFetchFailureCount}${lastFetchErrorDiagnostic}. Key agreement cannot be established.`,
      error: lastAgreementFetchError,
    });
  }

  keyTransportState = KeyTransportState.AGREE_KEY;
  return agreement;
};

export const confirmKeyAgreement = async ({
  agreement,
  farcasterApiClient,
  syncChannelIdentifier,
  keyStore,
  dataStore,
  sender,
  cancelController,
}: {
  agreement: UnconfirmedAgreement;
  farcasterApiClient: FarcasterApiClient;
  syncChannelIdentifier: string;
  keyStore: KeyStore;
  dataStore: DataStore;
  sender: boolean;
  cancelController: { cancel: boolean };
}) => {
  const keyTransport = await getKeyTransport({
    keyStore,
    dataStore,
  });

  // Wrap only opaque/native errors (e.g. a `TypeError` from `Buffer.from(...)`
  // when an agreement field arrived as `object` instead of a base64 string, or
  // a key-store / data-store serialization failure) so they surface as a typed
  // `UnexpectedStateError` instead of leaking as `failureKind: 'unknown'` with
  // no diagnostic context.
  //
  // Typed cryptography errors (`IrrecoverableStateError`,
  // `InvalidInputError`, `UnexpectedStateError`, `ConflictingStateError`,
  // `MaliciousInputError`) and `EmbargoedCryptographyError` are passed through
  // unchanged. They already carry the right semantic meaning for the login
  // classifier — for example, `IrrecoverableStateError("Could not confirm
  // confirmation code")` thrown by `KeyTransport.confirmKeyAgreement` denotes
  // a confirmation-code mismatch (potential tampering), which must not get
  // re-labeled as `malformed_message`.
  let optionalMessage: Awaited<
    ReturnType<typeof keyTransport.confirmKeyAgreement>
  >;
  try {
    optionalMessage = await keyTransport.confirmKeyAgreement(
      syncChannelIdentifier,
      agreement,
      sender,
    );
  } catch (error) {
    if (
      isCryptographyError(error) ||
      error instanceof EmbargoedCryptographyError
    ) {
      throw error;
    }
    keyTransportState = KeyTransportState.NOT_INITIALIZED;
    const underlyingMessage =
      error instanceof Error ? error.message : String(error ?? 'unknown');
    const underlyingType = error instanceof Error ? error.name : typeof error;
    // Only narrow-shape JS errors indicate a malformed agreement field:
    //   - `TypeError` from `Buffer.from(...)` when a field is the wrong type
    //   - `SyntaxError` from `JSON.parse(...)` when a payload isn't valid JSON
    // Other opaque errors (e.g. `DOMException` from Web Crypto or IndexedDB
    // such as `QuotaExceededError`, OS errors from the key store, custom data-
    // store errors) must NOT be re-labeled as `malformed_message` by the
    // analytics classifier — they need to surface as the default `protocol`
    // bucket so the new label keeps a real signal.
    const isShapeError =
      error instanceof TypeError || error instanceof SyntaxError;
    const message = isShapeError
      ? `Key transport rejected the agreement during confirmKeyAgreement (likely a malformed agreement field). underlyingType=${underlyingType}, underlyingMessage=${underlyingMessage}`
      : `Key transport failed during confirmKeyAgreement due to an unexpected non-cryptography error. underlyingType=${underlyingType}, underlyingMessage=${underlyingMessage}`;
    throw new UnexpectedStateError({
      message,
      error,
    });
  }

  // Sender writes its SymmetricKey to the channel. We bound the retry loop so
  // a persistent backend rejection surfaces as a real failure instead of
  // spinning silently until the outer login-screen timeout cancels it (which
  // is classified as `cancelled` and dropped from telemetry, hiding the bug).
  // Receiver-only handshakes have no message to send and skip this block.
  if (optionalMessage) {
    const senderWriteIntervalMs = 1000;
    const maxSenderWriteAttempts = 30;
    let sent = false;
    let senderWriteAttempts = 0;
    let lastSenderWriteError: unknown;

    while (!sent && senderWriteAttempts < maxSenderWriteAttempts) {
      if (cancelController.cancel) {
        keyTransportState = KeyTransportState.NOT_INITIALIZED;
        throw new ConflictingStateError({
          message: 'the operation has been cancelled',
        });
      }

      try {
        await farcasterApiClient.updateSyncChannel(optionalMessage);
        sent = true;
      } catch (error) {
        lastSenderWriteError = error;
        senderWriteAttempts++;
        if (senderWriteAttempts < maxSenderWriteAttempts) {
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, senderWriteIntervalMs);
          });
        }
      } // Deploys and connectivity issues will interrupt this, we shouldn't break
    }

    if (!sent) {
      keyTransportState = KeyTransportState.NOT_INITIALIZED;
      const lastErrorDiagnostic =
        lastSenderWriteError instanceof Error
          ? `, lastError=${lastSenderWriteError.message}`
          : lastSenderWriteError !== undefined
            ? `, lastError=${String(lastSenderWriteError)}`
            : '';

      throw new UnexpectedStateError({
        message: `Failed to write SymmetricKey to sync channel after ${maxSenderWriteAttempts} attempts (${senderWriteIntervalMs}ms interval)${lastErrorDiagnostic}. Key transport cannot be initialized.`,
        error: lastSenderWriteError,
      });
    }
  } else if (sender) {
    // The sender path produced no message to write. This is a key-transport
    // state-machine failure that previously fell through silently — receivers
    // would then time out waiting for a SymmetricKey that was never going to
    // arrive. Surface it explicitly so it shows up in observability.
    keyTransportState = KeyTransportState.NOT_INITIALIZED;
    throw new UnexpectedStateError({
      message:
        'confirmKeyAgreement produced no SymmetricKey message to write to the channel. Key transport cannot be initialized.',
    });
  }

  if (!sender) {
    // Receiver waits for the sender's SymmetricKey to land in the channel and
    // then decrypts it to finalize the transport. Previously this was a
    // single-shot scan: poll once until the channel was non-empty, scan those
    // messages once, throw if none were a valid SymmetricKey. That raced
    // against the sender's write — if the receiver's snapshot landed before
    // the SymmetricKey did (or only contained stale Phase A leftovers), the
    // handshake would fail in seconds with a confusing "No valid SymmetricKey
    // message found" error.
    //
    // We now mirror the `createSyncChannel` Phase A pattern: poll-and-rescan
    // up to `maxConfirmationPolls` rounds, dedupe via `processedMessageHashes`,
    // and surface rich diagnostics on exhaustion so we can tell race vs.
    // backend failure vs. genuine sender no-show in PostHog.
    const processedMessageHashes = new Set<string>();
    const maxConfirmationPolls = 180;
    const confirmationPollIntervalMs = 1000;
    let confirmationPollRounds = 0;
    let parseFailureCount = 0;
    let fetchFailureCount = 0;
    let consecutiveFetchFailureCount = 0;
    let lastFetchError: unknown;
    let foundSymmetricKey = false;

    for (
      let pollRound = 0;
      pollRound < maxConfirmationPolls && !foundSymmetricKey;
      pollRound++
    ) {
      confirmationPollRounds = pollRound + 1;

      if (cancelController.cancel) {
        keyTransportState = KeyTransportState.NOT_INITIALIZED;
        throw new ConflictingStateError({
          message: 'the operation has been cancelled',
        });
      }

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, confirmationPollIntervalMs);
      });

      let messages: ApiSyncChannelMessage[] = [];
      try {
        const result = await farcasterApiClient.getSyncChannel(
          await keyTransport.generateSyncChannelGetParams(
            syncChannelIdentifier,
          ),
        );
        messages = result.data.result.messages;
        consecutiveFetchFailureCount = 0;
      } catch (error) {
        fetchFailureCount++;
        consecutiveFetchFailureCount++;
        lastFetchError = error;
        // Avoid processing a stale snapshot from a previous iteration.
        continue;
      }

      for (const message of messages) {
        if (processedMessageHashes.has(message.messageHash)) {
          continue;
        }

        let messageType: string;
        try {
          const parsed = JSON.parse(
            decodeBase64MessageField(message.message).toString('utf-8'),
          );
          messageType = parsed.type;
        } catch {
          parseFailureCount++;
          processedMessageHashes.add(message.messageHash);
          continue;
        }

        if (messageType !== 'SymmetricKey') {
          processedMessageHashes.add(message.messageHash);
          continue;
        }

        try {
          await keyTransport.handleSyncMessage({
            ...message,
            channelId: syncChannelIdentifier,
          });
          // Consider key processing successful once we can decrypt and apply
          // the SymmetricKey. Mark-as-read is best-effort and must not gate
          // transport initialization.
          foundSymmetricKey = true;

          const readParams = await keyTransport.generateSetMessageReadParams(
            syncChannelIdentifier,
            message.messageHash,
          );
          let markedRead = false;
          while (!markedRead) {
            if (cancelController.cancel) {
              keyTransportState = KeyTransportState.NOT_INITIALIZED;
              throw new ConflictingStateError({
                message: 'the operation has been cancelled',
              });
            }

            try {
              await farcasterApiClient.markSyncChannelMessageRead(readParams);
              markedRead = true;
            } catch {
              await new Promise<void>((resolve) => {
                setTimeout(() => {
                  resolve();
                }, 1000);
              });
            } // Deploys and connectivity issues will interrupt this, we shouldn't break
          }
          break;
        } catch (error) {
          if (error instanceof ConflictingStateError) {
            throw error;
          }
          // Ignore malformed or undecryptable SymmetricKey messages and keep
          // searching for one that this device can unwrap.
          processedMessageHashes.add(message.messageHash);
          continue;
        }
      }
    }

    if (!foundSymmetricKey) {
      keyTransportState = KeyTransportState.NOT_INITIALIZED;

      const attemptedConfirmationFetches = Math.max(
        0,
        confirmationPollRounds - fetchFailureCount,
      );
      const failedAllConfirmationFetches =
        confirmationPollRounds > 0 &&
        fetchFailureCount === confirmationPollRounds;
      const lastFetchErrorMessage =
        lastFetchError instanceof Error
          ? lastFetchError.message
          : lastFetchError !== undefined
            ? String(lastFetchError)
            : undefined;
      const lastFetchErrorDiagnostic = lastFetchErrorMessage
        ? `, lastFetchError=${lastFetchErrorMessage}`
        : '';

      if (failedAllConfirmationFetches) {
        throw new UnexpectedStateError({
          message: `Unable to fetch sync channel updates during SymmetricKey polling after ${confirmationPollRounds} poll rounds (${confirmationPollIntervalMs}ms interval). fetchFailures=${fetchFailureCount}, consecutiveFetchFailures=${consecutiveFetchFailureCount}${lastFetchErrorDiagnostic}. Key transport cannot be initialized.`,
          error: lastFetchError,
        });
      }

      throw new UnexpectedStateError({
        message: `No valid SymmetricKey message found in sync channel after ${confirmationPollRounds} poll rounds (${confirmationPollIntervalMs}ms interval). parseFailures=${parseFailureCount}, processedMessages=${processedMessageHashes.size}, successfulFetches=${attemptedConfirmationFetches}, fetchFailures=${fetchFailureCount}, consecutiveFetchFailures=${consecutiveFetchFailureCount}${lastFetchErrorDiagnostic}. Key transport cannot be initialized.`,
        error: lastFetchError,
      });
    }
  }

  keyTransportState = KeyTransportState.INITIALIZED;
  conversationIdCacheMap.clear();
  conversationMap.clear();
  return keyTransport;
};

export const addKeyStatusChangeListener = (
  listener: KeyStatusChangeEventListener,
): RemoveKeyStatusChangeEventListenerFunc => {
  // This needs to be updated for multi-account.
  ensureKeyMutex.get('farcaster')?.runExclusive(() => {
    keyStatusListeners.add(listener);
  });

  return () => {
    ensureKeyMutex.get('farcaster')?.runExclusive(() => {
      keyStatusListeners.delete(listener);
    });
  };
};

const keyTransport = new Map<string, KeyTransport>();

export const getKeyTransport = async ({
  keyStore,
  dataStore,
}: {
  keyStore: KeyStore;
  dataStore: DataStore;
}): Promise<KeyTransport> => {
  if (!keyTransport.has(keyStore.name)) {
    const eckey = await keyStore.createEphemeralKey();
    keyTransport.set(
      keyStore.name,
      new KeyTransport({
        ecTransportAgreementKey: eckey,
        keyStore,
        dataStore,
      }),
    );
  }

  return keyTransport.get(keyStore.name)!;
};

export const unsafeKeyTransportReset = async ({
  keyStore,
  dataStore,
}: {
  keyStore: KeyStore;
  dataStore: DataStore;
}) => {
  const keyTransport = await getKeyTransport({
    keyStore,
    dataStore,
  });
  await keyTransport.resetKeyTransport();

  for (const listener of keyStatusListeners.values()) {
    listener(undefined);
  }
};

// On a surface glance this seems dangerous, but the challenge is effectively
// moot, just needs to be unique.
const createChallenge = () => {
  return Buffer.from(
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(
      /[x]/g,
      () => {
        const r = (Math.random() * 16) | 0,
          v = r;
        return v.toString(16);
      },
    ),
    'hex',
  ).toString('base64');
};
