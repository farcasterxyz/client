import { curve25519, getPublicKey, sign, utils, verify } from '@noble/ed25519';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import {
  ApiDirectCastKey,
  ApiDirectCastKeysByAccount,
  ApiInboxDirectCast,
  AsymmetricDeriveKeyOptions,
  Ciphertext,
  Conversation,
  ConversationParticipant,
  ConversationReadInfo,
  DataStore,
  HashAlgorithm,
  InboxDirectCast,
  InputError,
  InvalidInputError,
  IrrecoverableStateError,
  KeyStore,
  mergeIntoDefaultOptions,
  PasskeyAuthenticationRequest,
  PasskeyAuthenticationRequestLargeBlob,
  PasskeyAuthenticationResult,
  PasskeyRegistrationRequest,
  PrivateKey,
  PublicKey,
  Signature,
  SignedPublicKey,
  SigningPrivateKey,
  StateError,
  StoredPasskey,
  stringifyError,
  SymmetricDecryptionOptions,
  SymmetricDerivationMode,
  SymmetricDeriveKeyOptions,
  SymmetricEncryptionMode,
  SymmetricEncryptionOptions,
  SymmetricKey,
  VerifyingPublicKey,
} from 'farcaster-cryptography';
import hkdf from 'futoin-hkdf';
import sjcl, { random } from 'sjcl';

import { IndexedDBKeyStoreOptions } from './types';
import { getKeyFromHash } from './utils/x25519';

const getDefaultOptions = () => ({
  applicationName: 'farcaster',
  debug: false,
  onInputError: (error: InputError) => {
    logError(error);
  },
  onStateError: (error: StateError) => {
    logError(error);
  },
});

const randomUUID = () => {
  const words = random.randomWords(4);

  // bigendian, so flip it to do bit ops
  words.reverse();

  // set the 7th byte to & 0x0f | 0x40
  // set the 9th byte to & 0x3f | 0x80
  words[2] &= 0xffff0f3f;
  words[2] |= 0x00004080;

  // now flip it back so it prints correctly
  words.reverse();

  const hexstring = sjcl.codec.hex.fromBits(words);
  return (
    hexstring.substring(0, 8) +
    '-' +
    hexstring.substring(8, 12) +
    '-' +
    hexstring.substring(12, 16) +
    '-' +
    hexstring.substring(16, 20) +
    '-' +
    hexstring.substring(20)
  );
};

const syncChannelStore = new Map<string, EphemeralSymmetricKey>();
const symmetricKeyStore = new Map<string, EphemeralSymmetricKey>();
const ephemeralKeyStore = new Map<string, EphemeralPrivateKey>();
const signedPreKeyStore = new Map<string, EphemeralPrivateKey>();
const identityKeyStore = new Map<string, EphemeralSigningPrivateKey>();

class EphemeralDataStore implements DataStore {
  private saveMessages: boolean;

  constructor(saveMessages: boolean = true) {
    this.saveMessages = saveMessages;
  }

  public async getSyncChannelKey(
    syncChannelIdentifier: string,
  ): Promise<SymmetricKey | undefined> {
    const key = syncChannelStore.get(syncChannelIdentifier);
    return key;
  }

  public async setSyncChannelKey(
    syncChannelIdentifier: string,
    symmetricKeyId: SymmetricKey | undefined,
  ): Promise<void> {
    if (symmetricKeyId) {
      const symKey = symmetricKeyId as EphemeralSymmetricKey;
      syncChannelStore.set(syncChannelIdentifier, symKey);
    } else {
      syncChannelStore.delete(syncChannelIdentifier);
    }
  }

  async getLastConversationFetchTime(_conversationId: string): Promise<number> {
    // TODO: implement
    return await new Promise((resolve) => resolve(0));
  }

  async setLastConversationFetchTime(
    _conversationId: string,
    _lastFetchTime: number,
  ): Promise<void> {
    // TODO: implement
    return await new Promise((resolve) => {
      resolve();
    });
  }

  async getLastConversationReadTime(_conversationId: string): Promise<number> {
    // TODO: implement
    return await new Promise((resolve) => resolve(0));
  }

  async setLastConversationReadTime(
    _conversationId: string,
    _lastReadTime: number,
  ): Promise<void> {
    // TODO: implement
    return await new Promise((resolve) => {
      resolve();
    });
  }

  async clearConversationFetchTimes(): Promise<void> {
    // TODO: implement
    return await new Promise((resolve) => {
      resolve();
    });
  }

  public async getLastSyncTime(): Promise<number> {
    // TODO: implement
    return await new Promise((resolve) => resolve(0));
  }

  public async setLastSyncTime(_?: number): Promise<void> {
    // TODO: implement
    return await new Promise((resolve) => {
      resolve();
    });
  }
}

/**
 * Browser-based implementation of SymmetricKey
 */
export class EphemeralSymmetricKey implements SymmetricKey {
  public readonly secret: Uint8Array;
  public readonly id: string;

  constructor(secret: Uint8Array, id: string) {
    this.secret = secret;
    this.id = id;
  }

  public async compareKey(other: SymmetricKey): Promise<boolean> {
    return this.secret === (other as unknown as EphemeralSymmetricKey).secret;
  }

  public async encrypt(
    options: SymmetricEncryptionOptions,
  ): Promise<Ciphertext> {
    const secretBits = sjcl.codec.base64.toBits(
      Buffer.from(this.secret).toString('base64'),
    );
    const cipher = new sjcl.cipher.aes(secretBits);
    const iv = sjcl.random.randomWords(3);
    let aeadLength = 0;

    if (options.aeadPrefix !== undefined) {
      aeadLength += (options.aeadPrefix as EphemeralSymmetricKey).secret.length;
    }

    if (options.base64AssociatedData !== undefined) {
      aeadLength += Buffer.from(options.base64AssociatedData, 'base64').length;
    }

    const aeadValue = new Uint8Array(aeadLength);
    let offset = 0;

    if (options.aeadPrefix !== undefined) {
      aeadValue.set((options.aeadPrefix as EphemeralSymmetricKey).secret, 0);
      offset += (options.aeadPrefix as EphemeralSymmetricKey).secret.length;
    }

    if (options.base64AssociatedData !== undefined) {
      aeadValue.set(
        new Uint8Array(Buffer.from(options.base64AssociatedData, 'base64')),
        offset,
      );
    }

    const associatedData = Buffer.from(aeadValue).toString('base64');
    const result = sjcl.mode.gcm.encrypt(
      cipher,
      sjcl.codec.base64.toBits(options.base64Plaintext),
      iv,
      sjcl.codec.base64.toBits(associatedData),
    );

    return {
      base64Ciphertext: sjcl.codec.base64.fromBits(result),
      base64IV: sjcl.codec.base64.fromBits(iv),
      base64AssociatedData: associatedData,
    };
  }

  public async decrypt(options: SymmetricDecryptionOptions): Promise<string> {
    const secretBits = sjcl.codec.base64.toBits(
      Buffer.from(this.secret).toString('base64'),
    );
    const cipher = new sjcl.cipher.aes(secretBits);
    const associatedData =
      options.ciphertext.base64AssociatedData !== undefined
        ? sjcl.codec.base64.toBits(options.ciphertext.base64AssociatedData)
        : undefined;
    const result = sjcl.mode.gcm.decrypt(
      cipher,
      sjcl.codec.base64.toBits(options.ciphertext.base64Ciphertext),
      sjcl.codec.base64.toBits(options.ciphertext.base64IV),
      associatedData,
    );

    return sjcl.codec.base64.fromBits(result);
  }

  public async generateConfirmationValue(): Promise<string> {
    const hash = sha256(this.secret);
    const result = bytesToHex(hash).toLowerCase().substring(0, 6);

    return result;
  }

  public async compareConfirmationValue(
    confirmationValue: string,
  ): Promise<boolean> {
    if (confirmationValue.length !== 6) return false;

    const check = await this.generateConfirmationValue();
    let result = true;

    for (let i = 0; i < 6; i++) {
      result = result && check[i] === confirmationValue[i];
    }

    return result;
  }

  public async wrapSymmetricKey(other: SymmetricKey): Promise<string> {
    const result = await this.encrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      base64Plaintext: Buffer.from(
        (other as EphemeralSymmetricKey).secret,
      ).toString('base64'),
    });

    return JSON.stringify(result);
  }

  public async wrapEphemeralKey(other: PublicKey): Promise<string> {
    const result = await this.encrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      base64Plaintext: Buffer.from(
        (other as EphemeralPrivateKey).privateKey,
      ).toString('base64'),
    });

    return JSON.stringify(result);
  }

  public async wrapSignedPreKey(other: PublicKey): Promise<string> {
    const result = await this.encrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      base64Plaintext: Buffer.from(
        (other as EphemeralPrivateKey).privateKey,
      ).toString('base64'),
    });

    return JSON.stringify(result);
  }

  public async wrapIdentityKey(other: PublicKey): Promise<string> {
    const result = await this.encrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      base64Plaintext: Buffer.from(
        (other as EphemeralPrivateKey).privateKey,
      ).toString('base64'),
    });

    return JSON.stringify(result);
  }

  public async unwrapSymmetricKey(other: string): Promise<SymmetricKey> {
    const ciphertext = JSON.parse(other) as Ciphertext;
    const result = await this.decrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      ciphertext: ciphertext,
    });

    const key = new Uint8Array(Buffer.from(result, 'base64'));

    const id = randomUUID().toLowerCase();
    const symKey = new EphemeralSymmetricKey(key, id);
    symmetricKeyStore.set(id, symKey);
    return symKey as SymmetricKey;
  }

  public async unwrapEphemeralKey(other: string): Promise<PrivateKey> {
    const ciphertext = JSON.parse(other) as Ciphertext;
    const result = await this.decrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      ciphertext: ciphertext,
    });

    const { head } = getKeyFromHash(Buffer.from(result, 'base64'));
    const pointBytes = curve25519.scalarMult(head, curve25519.BASE_POINT_U);
    const publicKey = Buffer.from(pointBytes).toString('base64');

    const key = new EphemeralPrivateKey(result, publicKey);
    ephemeralKeyStore.set(publicKey, key);
    return key;
  }

  public async unwrapSignedPreKey(other: string): Promise<PrivateKey> {
    const ciphertext = JSON.parse(other) as Ciphertext;
    const result = await this.decrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      ciphertext: ciphertext,
    });

    const { head } = getKeyFromHash(Buffer.from(result, 'base64'));
    const pointBytes = curve25519.scalarMult(head, curve25519.BASE_POINT_U);
    const publicKey = Buffer.from(pointBytes).toString('base64');

    const key = new EphemeralPrivateKey(result, publicKey);
    signedPreKeyStore.set(publicKey, key);
    return key;
  }

  public async unwrapIdentityKey(other: string): Promise<SigningPrivateKey> {
    const ciphertext = JSON.parse(other) as Ciphertext;
    const result = await this.decrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      ciphertext: ciphertext,
    });

    const { head } = getKeyFromHash(Buffer.from(result, 'base64'));
    const pointBytes = curve25519.scalarMult(head, curve25519.BASE_POINT_U);
    const publicKey = Buffer.from(pointBytes).toString('base64');

    const key = new EphemeralSigningPrivateKey(result, publicKey);
    identityKeyStore.set(publicKey, key);
    return key;
  }
}

/**
 * Browser-based implementation of VerifyingPublicKey
 */
class EphemeralVerifyingPublicKey implements VerifyingPublicKey {
  public readonly base64PublicKey: string;

  constructor(base64PublicKey: string) {
    this.base64PublicKey = base64PublicKey;
  }

  public async verifySignature(
    message: string,
    signature: string,
  ): Promise<boolean> {
    return await verify(
      Buffer.from(signature, 'base64'),
      Buffer.from(message, 'utf-8'),
      Buffer.from(this.base64PublicKey, 'base64'),
    );
  }
}

/**
 * Browser-based implementation of PrivateKey, uses IndexedDB
 * for storage.
 */
export class EphemeralPrivateKey implements PrivateKey {
  public readonly privateKey: Uint8Array;

  constructor(base64PrivateKey: string, base64PublicKey: string) {
    this.privateKey = new Uint8Array(Buffer.from(base64PrivateKey, 'base64'));
    this.base64PublicKey = base64PublicKey;
  }

  public async deriveKey(
    options: AsymmetricDeriveKeyOptions,
  ): Promise<SymmetricKey> {
    const u = Buffer.from(
      options.counterpartyPublicKey.base64PublicKey,
      'base64',
    );
    const { head } = getKeyFromHash(Buffer.from(this.privateKey));
    const secret = curve25519.scalarMult(head, u);

    const key = sha256(secret);
    const id = randomUUID().toLocaleLowerCase();
    const symKey = new EphemeralSymmetricKey(key, id);
    symmetricKeyStore.set(id, symKey);
    return symKey;
  }

  public readonly base64PublicKey: string;

  public async signMessage(messageHash: string): Promise<Signature> {
    const sig = await sign(Buffer.from(messageHash, 'utf8'), this.privateKey);

    return {
      base64PublicKey: Buffer.from(
        await getPublicKey(this.privateKey),
      ).toString('base64'),
      base64Signature: Buffer.from(sig).toString('base64'),
    };
  }
}

/**
 * Browser-based implementation of SigningPrivateKey, uses IndexedDB
 * for storage.
 */
class EphemeralSigningPrivateKey
  extends EphemeralPrivateKey
  implements SigningPrivateKey
{
  constructor(base64PrivateKey: string, base64PublicKey: string) {
    super(base64PrivateKey, base64PublicKey);
  }

  public async signPublicKey(
    publicKey: PublicKey,
    hash: HashAlgorithm,
  ): Promise<SignedPublicKey> {
    if (hash !== HashAlgorithm.SHA512)
      throw new InvalidInputError({
        message: 'unsupported algorithm',
        input: 'hash',
      });

    const rawPublicKey = new Uint8Array(
      Buffer.from(publicKey.base64PublicKey, 'base64'),
    );
    const signature = Buffer.from(
      await sign(rawPublicKey, this.privateKey),
    ).toString('base64');

    return {
      ...publicKey,
      base64Signature: signature,
      verify: async (signingKey: PublicKey) => {
        return await verify(
          new Uint8Array(Buffer.from(signature, 'base64')),
          new Uint8Array(Buffer.from(this.base64PublicKey, 'base64')),
          new Uint8Array(Buffer.from(signingKey.base64PublicKey, 'base64')),
        );
      },
    };
  }

  public async signMessage(messageHash: string): Promise<Signature> {
    const sig = await sign(messageHash, this.privateKey);
    return {
      base64PublicKey: Buffer.from(
        await getPublicKey(this.privateKey),
      ).toString('base64'),
      base64Signature: Buffer.from(sig).toString('base64'),
    };
  }
}

/**
 * Browser-based implementation of KeyStore, uses @noble/hashes cryptographic
 * implementations where relevant.
 */
class EphemeralKeyStore implements KeyStore {
  private readonly options: IndexedDBKeyStoreOptions;

  constructor(options: IndexedDBKeyStoreOptions) {
    this.validateOptions(options);

    this.options = mergeIntoDefaultOptions<IndexedDBKeyStoreOptions>({
      defaults: getDefaultOptions(),
      options,
    });
  }

  public async clearOldMessages(): Promise<void> {
    throw new Error('not implemented');
  }

  public async deleteConversation(_conversationId: string): Promise<void> {
    throw new Error('not implemented');
  }

  public async getStoredPasskeys(): Promise<StoredPasskey[]> {
    const passkeysList = window.localStorage.getItem('warpcast-passkeys-list');
    let passkeys: StoredPasskey[] = [];
    if (passkeysList) {
      passkeys = JSON.parse(passkeysList);
    }

    return passkeys;
  }

  public async updateStoredPasskey(
    credentialId: string,
    storedPasskey: StoredPasskey,
  ): Promise<boolean> {
    const passkeysList = window.localStorage.getItem('warpcast-passkeys-list');
    let passkeys: StoredPasskey[] = [];
    if (passkeysList) {
      passkeys = JSON.parse(passkeysList);
    }

    if (passkeys.filter((p) => p.credentialId === credentialId)) {
      passkeys = passkeys.filter((p) => p.credentialId !== credentialId);
    }

    passkeys.push(storedPasskey);

    window.localStorage.setItem(
      'warpcast-passkeys-list',
      JSON.stringify(passkeys),
    );

    return true;
  }

  public async deleteStoredPasskey(credentialId: string): Promise<boolean> {
    const passkeysList = window.localStorage.getItem('warpcast-passkeys-list');
    let passkeys: StoredPasskey[] = [];
    if (passkeysList) {
      passkeys = JSON.parse(passkeysList);
    }

    if (passkeys.filter((p) => p.credentialId === credentialId)) {
      passkeys = passkeys.filter((p) => p.credentialId !== credentialId);
    }

    window.localStorage.setItem(
      'warpcast-passkeys-list',
      JSON.stringify(passkeys),
    );

    return true;
  }

  public async hasRecoveryData(_credentialId: string): Promise<boolean> {
    // Web stores recovery data in largeBlob (WebAuthn extension), which
    // cannot be checked without an authentication ceremony. Return true
    // to avoid triggering the migration flow on web.
    return true;
  }

  public async register(request: PasskeyRegistrationRequest): Promise<object> {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: 'Warpcast',
          // id: request.rp.id,
        },
        user: {
          id: Buffer.from(request.user.id),
          name: request.user.name ?? request.user.displayName,
          displayName: request.user.displayName,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          userVerification: 'required',
          residentKey: 'required',
          //authenticatorAttachment: "cross-platform",
        },
        extensions: {
          // @ts-ignore typescript checker is wrong, this exists and it's being dumb
          largeBlob: {
            support: 'required',
          },
        },
      },
    });
    if (!credential) {
      throw new IrrecoverableStateError({
        message: 'could not register passkey',
      });
    }

    return {
      // @ts-ignore typescript checker is wrong, this exists and it's being dumb
      id: Buffer.from(credential.rawId).toString('base64'),
      // @ts-ignore typescript checker is wrong, this exists and it's being dumb
      rawId: Buffer.from(credential.rawId).toString('base64'),
    };
  }

  public async addMnemonicToCredential(
    request: PasskeyAuthenticationRequestLargeBlob,
  ): Promise<PasskeyAuthenticationResult> {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const write = await navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        allowCredentials: [
          {
            id: Buffer.from(request.credentialId, 'base64'),
            type: 'public-key',
          },
        ],
        extensions: {
          // @ts-ignore typescript checker is wrong, this exists and it's being dumb
          largeBlob: {
            write: Buffer.from(request.largeBlob, 'utf-8'),
          },
        },
      },
    });

    // @ts-ignore typescript checker is wrong, this exists and it's being dumb
    if (write?.getClientExtensionResults().largeBlob.written) {
      return {
        id: request.credentialId,
        rawId: request.credentialId,
        // we need none of these for the upstream handler, let's not be a signing oracle
        response: {
          authenticatorData: '',
          clientDataJSON: '',
          signature: '',
          userHandle: '',
        },
      };
    } else {
      throw new IrrecoverableStateError({
        message: 'could not add mnemonic to credential',
      });
    }
  }

  public async authenticate(
    request: PasskeyAuthenticationRequest,
  ): Promise<PasskeyAuthenticationResult> {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const allowCredentials = request.credentialId
      ? [
          {
            id: Buffer.from(request.credentialId, 'base64'),
            type: 'public-key' as const,
          },
        ]
      : undefined;

    const credential = await navigator.credentials.get({
      publicKey: {
        // don't do this in production!
        challenge: challenge,
        allowCredentials,
        extensions: {
          // @ts-ignore typescript checker is wrong, this exists and it's being dumb
          largeBlob: {
            read: true,
          },
        },
      },
    });

    if (credential) {
      if (
        // @ts-ignore typescript checker is wrong, this exists and it's being dumb
        typeof credential.getClientExtensionResults().largeBlob === 'undefined'
      ) {
        throw new IrrecoverableStateError({
          message: 'invalid authenticator',
        });
      }
      const mnemonic = Buffer.from(
        // @ts-ignore typescript checker is wrong, this exists and it's being dumb
        credential.getClientExtensionResults().largeBlob.blob,
      ).toString('utf-8');
      const credentialId = request.credentialId ?? credential.id;
      return {
        id: credentialId,
        rawId: credentialId,
        // we need none of these for the upstream handler, let's not be a signing oracle
        response: {
          authenticatorData: '',
          clientDataJSON: '',
          signature: '',
          userHandle: '',
        },
        largeBlob: mnemonic,
      };
    } else {
      throw new IrrecoverableStateError({
        message: 'could not authenticate',
      });
    }
  }

  public async isPasskeysSupported(): Promise<boolean> {
    const matches =
      navigator.userAgent.match(
        /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i,
      ) || [];
    if (/trident/i.test(matches[1])) {
      return false;
    }

    if (matches[1] === 'Chrome') {
      if (navigator.userAgent.match(/\b(OPR)\/(\d+)/) !== null) {
        return parseInt(matches[2], 10) >= 99;
      }
      return parseInt(matches[2], 10) >= 113;
    }

    if (
      matches[1] === 'Safari' &&
      navigator.userAgent.match(/version\/(\d+)/i) !== null
    ) {
      const versionMatch = navigator.userAgent.match(/version\/(\d+)/i);
      return versionMatch !== null && parseInt(versionMatch[1], 10) >= 17;
    }

    return false;
  }

  public async getInbox(): Promise<Conversation[]> {
    throw new Error('not implemented');
  }

  public async getConversationPage(
    _conversationId: string,
    _pageSize: number,
    _before: number | undefined,
    _after: number | undefined,
  ): Promise<InboxDirectCast[]> {
    throw new Error('not implemented');
  }

  public async getInboxId(): Promise<string> {
    throw new Error('not implemented');
  }

  public async getConversationParticipants(
    _conversationId: string,
  ): Promise<ConversationParticipant[]> {
    throw new Error('not implemented');
  }

  public async bulkRatchetDecrypt(
    _participants: ApiDirectCastKeysByAccount[],
    _messages: ApiInboxDirectCast[],
  ): Promise<boolean> {
    throw new Error('not implemented');
  }

  public async bulkRatchetEncrypt(
    _conversationId: string,
    _keys: ApiDirectCastKeysByAccount[],
    _participants: ConversationParticipant[],
    _message: string,
    _account: string,
    _fid: number,
    _messageId: string | undefined,
  ): Promise<ApiInboxDirectCast[]> {
    throw new Error('not implemented');
  }

  public async getPublicInboxKeys(): Promise<{
    idk: ApiDirectCastKey;
    spk: ApiDirectCastKey;
  }> {
    throw new Error('not implemented');
  }

  public async initializeWithName(_name: string): Promise<void> {
    throw new Error('not implemented');
  }

  public async setMessageStatus(
    _messageId: string,
    _fid: number,
    _status: string,
  ): Promise<void> {
    throw new Error('not implemented');
  }

  public async setConversationsRead(
    _conversationReadInfo: ConversationReadInfo[],
  ): Promise<void> {
    throw new Error('not implemented');
  }

  public async wipeData(): Promise<void> {
    throw new Error('not implemented');
  }

  public async saveSymmetricKey(key: EphemeralSymmetricKey) {
    symmetricKeyStore.set(key.id, key);
    return key;
  }

  public async saveIdentityKey(
    identityKey: EphemeralSigningPrivateKey,
    base64PublicKey: string,
  ) {
    identityKeyStore.set(base64PublicKey, identityKey);
    return identityKey;
  }

  public async saveSignedPreKey(
    preKey: EphemeralPrivateKey,
    base64PublicKey: string,
  ) {
    signedPreKeyStore.set(base64PublicKey, preKey);
    return preKey;
  }

  public async saveEphemeralKey(
    ephemeralKey: EphemeralPrivateKey,
    base64PublicKey: string,
  ) {
    ephemeralKeyStore.set(base64PublicKey, ephemeralKey);
    return ephemeralKey;
  }

  private validateOptions(_: IndexedDBKeyStoreOptions) {}

  public readonly name: string = 'FarcasterIndexDBKeyStore';

  public async setName(_: string) {
    // no-op for now
  }

  public async getSignedPreKey(publicKey: PublicKey): Promise<PrivateKey> {
    const key = signedPreKeyStore.get(publicKey.base64PublicKey);
    if (!key) throw Error('could not get');
    return key;
  }

  public async getIdentityKey(
    publicKey: PublicKey,
  ): Promise<SigningPrivateKey> {
    const key = identityKeyStore.get(publicKey.base64PublicKey);
    if (!key) throw Error('could not get');
    return key;
  }

  public async getEphemeralKey(publicKey: PublicKey): Promise<PrivateKey> {
    const key = ephemeralKeyStore.get(publicKey.base64PublicKey);
    if (!key) throw Error('could not get');
    return key;
  }

  public async getSymmetricKey(
    symmetricKey: SymmetricKey,
  ): Promise<SymmetricKey> {
    const key = symmetricKeyStore.get(
      (symmetricKey as EphemeralSymmetricKey).id,
    );
    if (!key) throw Error('could not get');
    return key;
  }

  public async createSymmetricKey(id: string): Promise<SymmetricKey> {
    const maybeCrypto = {
      node: crypto,
      web:
        typeof self === 'object' && 'crypto' in self ? self.crypto : undefined,
    };
    let rawKey: Uint8Array;

    if (maybeCrypto.web) {
      rawKey = maybeCrypto.web.getRandomValues(new Uint8Array(32));
    } else if (maybeCrypto.node) {
      // @ts-expect-error ignore this, it's platform-specific
      const { randomBytes } = maybeCrypto.node;
      rawKey = new Uint8Array(randomBytes(32).buffer);
    } else {
      throw new Error("The environment doesn't have randomBytes function");
    }

    const symKey = new EphemeralSymmetricKey(rawKey, id);
    return await this.saveSymmetricKey(symKey);
  }

  public async createIdentityKey(): Promise<SigningPrivateKey> {
    const privateKey = utils.randomPrivateKey();
    const base64PrivateKey = Buffer.from(privateKey).toString('base64');

    const { head } = getKeyFromHash(privateKey);
    const pointBytes = curve25519.scalarMult(head, curve25519.BASE_POINT_U);
    const base64PublicKey = Buffer.from(pointBytes).toString('base64');

    const identityKey = new EphemeralSigningPrivateKey(
      base64PrivateKey,
      base64PublicKey,
    );
    return await this.saveIdentityKey(identityKey, base64PublicKey);
  }

  public async createSignedPreKey(
    identityPubKey: PublicKey,
  ): Promise<SignedPublicKey> {
    const privateKey = utils.randomPrivateKey();
    const base64PrivateKey = Buffer.from(privateKey).toString('base64');

    const { head } = getKeyFromHash(privateKey);
    const pointBytes = curve25519.scalarMult(head, curve25519.BASE_POINT_U);
    const base64PublicKey = Buffer.from(pointBytes).toString('base64');

    const publicKey = await this.parsePublicKey(base64PublicKey);
    const preKey = new EphemeralPrivateKey(base64PrivateKey, base64PublicKey);
    const signedPreKey = await (
      await this.getIdentityKey(identityPubKey)
    ).signPublicKey(publicKey, HashAlgorithm.SHA512);
    await this.saveSignedPreKey(preKey, base64PublicKey);
    return signedPreKey;
  }

  public async createEphemeralKey(): Promise<PrivateKey> {
    const privateKey = utils.randomPrivateKey();
    const base64PrivateKey = Buffer.from(privateKey).toString('base64');

    const { head } = getKeyFromHash(privateKey);
    const pointBytes = curve25519.scalarMult(head, curve25519.BASE_POINT_U);
    const base64PublicKey = Buffer.from(pointBytes).toString('base64');

    const ephemeralKey = new EphemeralPrivateKey(
      base64PrivateKey,
      base64PublicKey,
    );
    return await this.saveEphemeralKey(ephemeralKey, base64PublicKey);
  }

  public async deleteSignedPreKey(publicKey: PublicKey): Promise<void> {
    signedPreKeyStore.delete(publicKey.base64PublicKey);
  }

  public async deleteEphemeralKey(publicKey: PublicKey): Promise<void> {
    ephemeralKeyStore.delete(publicKey.base64PublicKey);
  }

  public async deleteSymmetricKey(symKey: SymmetricKey): Promise<void> {
    symmetricKeyStore.delete((symKey as EphemeralSymmetricKey).id);
  }

  public async parsePublicKey(
    base64PublicKey: string,
  ): Promise<VerifyingPublicKey> {
    return new EphemeralVerifyingPublicKey(base64PublicKey);
  }

  public async verifyPublicKey(
    base64PubKey: string,
    base64Signature: string,
    base64SigningPublicKey: string,
  ): Promise<boolean> {
    return await verify(
      Buffer.from(base64Signature, 'base64'),
      Buffer.from(base64PubKey, 'base64'),
      Buffer.from(base64SigningPublicKey, 'base64'),
    );
  }

  public async deriveKey(
    options: SymmetricDeriveKeyOptions,
  ): Promise<SymmetricKey | SymmetricKey[]> {
    let secret: Uint8Array;
    let secretPrefix = new Uint8Array(0);
    if (options.base64Prefix !== undefined) {
      secretPrefix = new Uint8Array(
        Buffer.from(options.base64Prefix, 'base64'),
      );
    }
    let salt: Buffer | undefined;

    if (options.saltKey !== undefined) {
      salt = Buffer.from((options.saltKey as EphemeralSymmetricKey).secret);
    } else if (options.base64Salt !== undefined) {
      salt = Buffer.from(options.base64Salt, 'base64');
    }

    if (options.inputKey?.constructor === EphemeralSymmetricKey) {
      secret = new Uint8Array(
        (options.inputKey as EphemeralSymmetricKey).secret.length +
          secretPrefix.length,
      );
      secret = (options.inputKey as EphemeralSymmetricKey).secret;
    } else {
      const secrets = options.inputKey as EphemeralSymmetricKey[];
      let length = secretPrefix.length;

      for (const i of secrets) {
        length += i.secret.length;
      }

      secret = new Uint8Array(length);
      let offset = secretPrefix.length;
      secret.set(secretPrefix, 0);

      for (const i of secrets) {
        secret.set(i.secret, offset);
        offset += i.secret.length;
      }
    }

    switch (options.derivationMode) {
      case SymmetricDerivationMode.HKDF_SHA256: {
        const result = new Uint8Array(
          hkdf(Buffer.from(secret), options.outputLength!, {
            salt: salt,
            info: options.info,
            hash: 'sha256',
          }),
        );

        if (
          options.outputKeyLengths !== undefined &&
          options.outputKeyLengths < options.outputLength!
        ) {
          let keys: EphemeralSymmetricKey[] = [];
          for (
            let i = 0;
            i < Math.ceil(result.length / options.outputKeyLengths);
            i++
          ) {
            let subArray: Uint8Array;
            if (i === Math.ceil(result.length / options.outputKeyLengths) - 1) {
              subArray = result.subarray(i * options.outputKeyLengths);
            } else {
              subArray = result.subarray(
                i * options.outputKeyLengths,
                (i + 1) * options.outputKeyLengths,
              );
            }

            keys = [
              ...keys,
              new EphemeralSymmetricKey(
                subArray,
                randomUUID().toLocaleLowerCase(),
              ),
            ];
          }

          const keyPromises = keys.map(
            async (k) => await this.saveSymmetricKey(k),
          );
          return await Promise.all(keyPromises);
        }

        const newKey = new EphemeralSymmetricKey(
          result,
          randomUUID().toLocaleLowerCase(),
        );
        return await this.saveSymmetricKey(newKey);
      }
      case SymmetricDerivationMode.HMAC_SHA256: {
        const hmacResult = hmac(sha256, salt!, secret);
        const newHMACKey = new EphemeralSymmetricKey(
          hmacResult,
          randomUUID().toLocaleLowerCase(),
        );
        return await this.saveSymmetricKey(newHMACKey);
      }
      default:
        throw new InvalidInputError({
          message: 'Unsupported derivation mode',
          input: 'DerivationMode',
        });
    }
  }
}

const logPrefix = 'FarcasterCryptographyIndexedDBKeyStore:';

function logError(error: Error) {
  // eslint-disable-next-line no-console
  console.error(logPrefix + 'Encountered Error');
  // eslint-disable-next-line no-console
  console.error(stringifyError(error));
}

export { EphemeralDataStore, EphemeralKeyStore };
