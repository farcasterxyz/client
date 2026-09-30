import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiDirectCastKey,
  ApiDirectCastKeysByAccount,
  ApiInboxDirectCast,
  AsymmetricDerivationMode,
  AsymmetricDeriveKeyOptions,
  Ciphertext,
  Conversation,
  ConversationParticipant,
  ConversationParticipantInfo,
  ConversationReadInfo,
  DataStore,
  HashAlgorithm,
  InboxDirectCast,
  KeyStore,
  PasskeyAuthenticationRequest,
  PasskeyAuthenticationRequestLargeBlob,
  PasskeyAuthenticationResult,
  PasskeyRegistrationRequest,
  PrivateKey,
  PublicKey,
  Signature,
  SignedPublicKey,
  SigningPrivateKey,
  StoredPasskey,
  SymmetricDecryptionOptions,
  SymmetricDerivationMode,
  SymmetricDeriveKeyOptions,
  SymmetricEncryptionOptions,
  SymmetricKey,
  UnexpectedStateError,
  VerifyingPublicKey,
} from 'farcaster-cryptography';
import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'farcaster-cryptography-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

class FarcasterSymmetricKey implements SymmetricKey {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  async encrypt(options: SymmetricEncryptionOptions): Promise<Ciphertext> {
    return JSON.parse(
      await FarcasterCryptographyNativeKeyStore.encrypt(
        this.id,
        options.base64Plaintext,
        options.aeadPrefix
          ? (options.aeadPrefix as FarcasterSymmetricKey).id
          : undefined,
        options.base64AssociatedData,
      ),
    );
  }

  async decrypt(options: SymmetricDecryptionOptions): Promise<string> {
    return await FarcasterCryptographyNativeKeyStore.decrypt(
      this.id,
      options.ciphertext.base64IV,
      options.ciphertext.base64Ciphertext,
      options.ciphertext.base64AssociatedData,
    );
  }

  async compareKey(other: SymmetricKey): Promise<boolean> {
    return await FarcasterCryptographyNativeKeyStore.compareKey(
      this.id,
      (other as FarcasterSymmetricKey).id,
    );
  }

  async generateConfirmationValue(): Promise<string> {
    return await FarcasterCryptographyNativeKeyStore.generateConfirmationValue(
      this.id,
    );
  }

  async compareConfirmationValue(confirmationValue: string): Promise<boolean> {
    return (
      confirmationValue ===
      (await FarcasterCryptographyNativeKeyStore.generateConfirmationValue(
        this.id,
      ))
    );
  }

  async wrapSymmetricKey(other: SymmetricKey): Promise<string> {
    return await FarcasterCryptographyNativeKeyStore.wrapSymmetricKey(
      this.id,
      (other as FarcasterSymmetricKey).id,
    );
  }

  async wrapEphemeralKey(other: PublicKey): Promise<string> {
    return await FarcasterCryptographyNativeKeyStore.wrapEphemeralKey(
      this.id,
      (other as FarcasterEphemeralPrivateKey).base64PublicKey,
    );
  }

  async wrapSignedPreKey(other: PublicKey): Promise<string> {
    return await FarcasterCryptographyNativeKeyStore.wrapSignedPreKey(
      this.id,
      (other as FarcasterPrePrivateKey).base64PublicKey,
    );
  }

  async wrapIdentityKey(other: PublicKey): Promise<string> {
    return await FarcasterCryptographyNativeKeyStore.wrapIdentityKey(
      this.id,
      (other as FarcasterIdentitySigningPrivateKey).base64PublicKey,
    );
  }

  async unwrapSymmetricKey(other: string): Promise<SymmetricKey> {
    return new FarcasterSymmetricKey(
      (
        JSON.parse(
          await FarcasterCryptographyNativeKeyStore.unwrapSymmetricKey(
            this.id,
            other,
          ),
        ) as FarcasterSymmetricKey
      ).id,
    );
  }

  async unwrapEphemeralKey(other: string): Promise<PrivateKey> {
    return new FarcasterEphemeralPrivateKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.unwrapEphemeralKey(
          this.id,
          other,
        ),
      ) as FarcasterEphemeralPrivateKey,
    );
  }

  async unwrapSignedPreKey(other: string): Promise<PrivateKey> {
    return new FarcasterPrePrivateKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.unwrapSignedPreKey(
          this.id,
          other,
        ),
      ) as FarcasterPrePrivateKey,
    );
  }

  async unwrapIdentityKey(other: string): Promise<SigningPrivateKey> {
    return new FarcasterIdentitySigningPrivateKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.unwrapIdentityKey(
          this.id,
          other,
        ),
      ) as FarcasterIdentitySigningPrivateKey,
    );
  }
}

class FarcasterEphemeralPrivateKey implements PrivateKey {
  constructor(baseKey: PrivateKey) {
    this.base64PublicKey = baseKey.base64PublicKey;
  }

  async deriveKey(options: AsymmetricDeriveKeyOptions): Promise<SymmetricKey> {
    return new FarcasterSymmetricKey(
      (
        JSON.parse(
          await FarcasterCryptographyNativeKeyStore.agreeWithEphemeralKey(
            this.base64PublicKey,
            options.counterpartyPublicKey.base64PublicKey,
          ),
        ) as FarcasterSymmetricKey
      ).id,
    );
  }

  async signMessage(messageHash: string): Promise<Signature> {
    return JSON.parse(
      await FarcasterCryptographyNativeKeyStore.signWithEphemeralKey(
        this.base64PublicKey,
        messageHash,
      ),
    ) as Signature;
  }

  readonly base64PublicKey: string;
}

class FarcasterPrePrivateKey implements PrivateKey {
  constructor(baseKey: PrivateKey) {
    this.base64PublicKey = baseKey.base64PublicKey;
  }

  async deriveKey(options: AsymmetricDeriveKeyOptions): Promise<SymmetricKey> {
    return new FarcasterSymmetricKey(
      (
        JSON.parse(
          await FarcasterCryptographyNativeKeyStore.agreeWithSignedPreKey(
            this.base64PublicKey,
            options.counterpartyPublicKey.base64PublicKey,
          ),
        ) as FarcasterSymmetricKey
      ).id,
    );
  }

  async signMessage(messageHash: string): Promise<Signature> {
    return JSON.parse(
      await FarcasterCryptographyNativeKeyStore.signWithSignedPreKey(
        this.base64PublicKey,
        messageHash,
      ),
    ) as Signature;
  }

  readonly base64PublicKey: string;
}

class FarcasterVerifyingPublicKey implements VerifyingPublicKey {
  constructor(baseKey: PublicKey) {
    this.base64PublicKey = baseKey.base64PublicKey;
  }

  readonly base64PublicKey: string;

  async verifySignature(message: string, signature: string): Promise<boolean> {
    return await FarcasterCryptographyNativeKeyStore.verifySignature(
      this.base64PublicKey,
      message,
      signature,
    );
  }
}

class FarcasterSignedPublicKey implements SignedPublicKey {
  constructor(baseKey: SignedPublicKey) {
    this.base64PublicKey = baseKey.base64PublicKey;
    this.base64Signature = baseKey.base64Signature;
  }

  readonly base64Signature: string;

  async verify(_: PublicKey): Promise<boolean> {
    throw new Error('!');
  }

  async deriveKey(options: AsymmetricDeriveKeyOptions): Promise<SymmetricKey> {
    return new FarcasterSymmetricKey(
      (
        JSON.parse(
          await FarcasterCryptographyNativeKeyStore.agreeWithSignedPreKey(
            this.base64PublicKey,
            options.counterpartyPublicKey.base64PublicKey,
          ),
        ) as FarcasterSymmetricKey
      ).id,
    );
  }

  readonly base64PublicKey: string;
}

class FarcasterIdentitySigningPrivateKey implements SigningPrivateKey {
  constructor(baseKey: PrivateKey) {
    this.base64PublicKey = baseKey.base64PublicKey;
  }

  async signMessage(messageHash: string): Promise<Signature> {
    return JSON.parse(
      await FarcasterCryptographyNativeKeyStore.signWithIdentityKey(
        this.base64PublicKey,
        messageHash,
      ),
    ) as Signature;
  }

  async signPublicKey(
    _: PublicKey,
    _2: HashAlgorithm,
  ): Promise<SignedPublicKey> {
    throw new Error('!');
  }

  async deriveKey(options: AsymmetricDeriveKeyOptions): Promise<SymmetricKey> {
    return new FarcasterSymmetricKey(
      (
        JSON.parse(
          await FarcasterCryptographyNativeKeyStore.agreeWithIdentityKey(
            this.base64PublicKey,
            options.counterpartyPublicKey.base64PublicKey,
          ),
        ) as FarcasterSymmetricKey
      ).id,
    );
  }

  readonly base64PublicKey: string;
}

export class FarcasterAsyncDataStore implements DataStore {
  async getSyncChannelKey(
    syncChannelIdentifier: string,
  ): Promise<SymmetricKey | undefined> {
    return await this.getItem('channelkey:' + syncChannelIdentifier, undefined);
  }

  async setSyncChannelKey(
    syncChannelIdentifier: string,
    symmetricKey: SymmetricKey | undefined,
  ): Promise<void> {
    await this.setItem('channelkey:' + syncChannelIdentifier, symmetricKey);
  }

  private async getItem<T>(key: string, fallback: T): Promise<T> {
    try {
      const result = await AsyncStorage.getItem(key);
      if (result === null) {
        return fallback;
      }

      return JSON.parse(result) as T;
    } catch {
      return fallback;
    }
  }

  private async setItem(key: string, value: unknown) {
    await AsyncStorage.setItem(
      key,
      value === undefined ? JSON.stringify(null) : JSON.stringify(value),
    );
  }
}

export class FarcasterCryptographyKeyStore implements KeyStore {
  constructor(name: string) {
    this.name = name;
  }

  readonly name: string;

  async setName(name: string): Promise<void> {
    return await FarcasterCryptographyNativeKeyStore.initializeWithName(name);
  }

  async getSignedPreKey(pubKey: PublicKey): Promise<PrivateKey> {
    return new FarcasterPrePrivateKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.getSignedPreKey(
          pubKey.base64PublicKey,
        ),
      ),
    );
  }

  async getIdentityKey(pubKey: PublicKey): Promise<SigningPrivateKey> {
    return new FarcasterIdentitySigningPrivateKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.getIdentityKey(
          pubKey.base64PublicKey,
        ),
      ),
    );
  }

  async getEphemeralKey(pubKey: PublicKey): Promise<PrivateKey> {
    return new FarcasterEphemeralPrivateKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.getEphemeralKey(
          pubKey.base64PublicKey,
        ),
      ),
    );
  }

  async getSymmetricKey(symmetricKey: SymmetricKey): Promise<SymmetricKey> {
    // TODO: make this method more direct in an update-we do this so a native
    // methods change (i.e. full app update) isn't required.
    try {
      const result = await AsyncStorage.getItem(
        (symmetricKey as FarcasterSymmetricKey).id,
      );
      if (result !== null) {
        const baseKeyId = JSON.parse(result) as string;
        const baseKeyJson =
          await FarcasterCryptographyNativeKeyStore.getSymmetricKey(baseKeyId);
        if (baseKeyJson) {
          return new FarcasterSymmetricKey(JSON.parse(baseKeyJson).id);
        }
      }
    } catch {}

    return new FarcasterSymmetricKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.getSymmetricKey(
          (symmetricKey as FarcasterSymmetricKey).id,
        ),
      ).id,
    );
  }

  async createSymmetricKey(id: string): Promise<SymmetricKey> {
    // TODO: make this method more direct in an update – we do this so a native
    // methods change (i.e. full app update) isn't required.
    try {
      const result = await AsyncStorage.getItem(id);
      if (result !== null) {
        const baseKeyId = JSON.parse(result) as string;
        const baseKeyJson =
          await FarcasterCryptographyNativeKeyStore.getSymmetricKey(baseKeyId);
        if (baseKeyJson) {
          return new FarcasterSymmetricKey(JSON.parse(baseKeyJson).id);
        }
      }
    } catch {}

    const left = await this.createEphemeralKey();
    const right = await this.createEphemeralKey();
    const baseSymKey = await left.deriveKey({
      derivationMode: AsymmetricDerivationMode.ECDH_SHA256,
      counterpartyPublicKey: right,
    });

    const baseKey = new FarcasterSymmetricKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.getSymmetricKey(
          (baseSymKey as FarcasterSymmetricKey).id,
        ),
      ).id,
    );
    await AsyncStorage.setItem(id, JSON.stringify(baseKey.id));

    return baseKey;
  }

  async createIdentityKey(): Promise<SigningPrivateKey> {
    return new FarcasterIdentitySigningPrivateKey(
      JSON.parse(await FarcasterCryptographyNativeKeyStore.createIdentityKey()),
    );
  }

  async createSignedPreKey(
    identityPubKey: PublicKey,
  ): Promise<SignedPublicKey> {
    return new FarcasterSignedPublicKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.createSignedPreKey(
          identityPubKey.base64PublicKey,
        ),
      ),
    );
  }

  async createEphemeralKey(): Promise<PrivateKey> {
    return new FarcasterEphemeralPrivateKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.createEphemeralKey(),
      ),
    );
  }

  async deleteSignedPreKey(pubKey: PublicKey): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.deleteSignedPreKey(
      pubKey.base64PublicKey,
    );
  }

  async deleteEphemeralKey(pubKey: PublicKey): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.deleteEphemeralKey(
      pubKey.base64PublicKey,
    );
  }

  async deleteSymmetricKey(symmetricKey: SymmetricKey): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.deleteSymmetricKey(
      (symmetricKey as FarcasterSymmetricKey).id,
    );
  }

  async parsePublicKey(base64PublicKey: string): Promise<VerifyingPublicKey> {
    return new FarcasterVerifyingPublicKey(
      JSON.parse(
        await FarcasterCryptographyNativeKeyStore.parsePublicKey(
          base64PublicKey,
        ),
      ) as PublicKey,
    );
  }

  async verifyPublicKey(
    base64PubKey: string,
    base64Signature: string,
    base64SigningPublicKey: string,
  ): Promise<boolean> {
    return await FarcasterCryptographyNativeKeyStore.verifyPublicKey(
      base64PubKey,
      base64Signature,
      base64SigningPublicKey,
    );
  }

  async deriveKey(
    options: SymmetricDeriveKeyOptions,
  ): Promise<SymmetricKey | SymmetricKey[]> {
    const keys = JSON.parse(
      await FarcasterCryptographyNativeKeyStore.deriveKey(
        JSON.stringify({
          derivationMode:
            options.derivationMode === SymmetricDerivationMode.HKDF_SHA256
              ? 'hkdfsha256'
              : 'hmacsha256',
          base64Salt: options.base64Salt,
          saltKeyId:
            options.saltKey === undefined
              ? undefined
              : (options.saltKey! as FarcasterSymmetricKey).id,
          base64Prefix: options.base64Prefix,
          inputKeyIds: Array.isArray(options.inputKey)
            ? options.inputKey.map((i) => (i as FarcasterSymmetricKey).id)
            : [(options.inputKey as FarcasterSymmetricKey).id],
          info: options.info,
          outputLength: options.outputLength ?? 32,
          outputKeyLengths: options.outputKeyLengths,
        }),
      ),
    );

    if (keys.length > 1) {
      return keys.map(
        (k: FarcasterSymmetricKey) => new FarcasterSymmetricKey(k.id),
      );
    } else {
      return new FarcasterSymmetricKey((keys[0] as FarcasterSymmetricKey).id);
    }
  }

  async getStoredPasskeys(): Promise<StoredPasskey[]> {
    if (await this.isPasskeysSupported()) {
      return JSON.parse(
        await FarcasterCryptographyNativeKeyStore.getStoredPasskeys(),
      );
    } else {
      throw new UnexpectedStateError({ message: 'not supported' });
    }
  }

  async updateStoredPasskey(
    credentialId: string,
    storedPasskey: StoredPasskey,
  ): Promise<boolean> {
    if (await this.isPasskeysSupported()) {
      return JSON.parse(
        await FarcasterCryptographyNativeKeyStore.updateStoredPasskeys(
          credentialId,
          JSON.stringify(storedPasskey),
        ),
      );
    } else {
      throw new UnexpectedStateError({ message: 'not supported' });
    }
  }

  async deleteStoredPasskey(credentialId: string): Promise<boolean> {
    if (await this.isPasskeysSupported()) {
      return JSON.parse(
        await FarcasterCryptographyNativeKeyStore.deleteStoredPasskey(
          credentialId,
        ),
      );
    } else {
      throw new UnexpectedStateError({ message: 'not supported' });
    }
  }

  async hasRecoveryData(credentialId: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // iOS stores recovery data in iCloud Keychain via largeBlob;
      // cannot check without an authentication ceremony. Return true
      // to skip the migration flow on iOS.
      return true;
    }
    if (await this.isPasskeysSupported()) {
      return FarcasterCryptographyNativeKeyStore.hasRecoveryData(credentialId);
    }
    return false;
  }

  async addMnemonicToCredential(
    request: PasskeyAuthenticationRequestLargeBlob,
  ): Promise<PasskeyAuthenticationResult> {
    if (await this.isPasskeysSupported()) {
      // Native writes the mnemonic directly to iCloud Keychain and resolves with "true".
      // No FIDO2 assertion is performed — return a stub result so callers get a truthy value.
      await FarcasterCryptographyNativeKeyStore.addMnemonicToCredential(
        request.rpId,
        request.challenge,
        request.credentialId,
        request.largeBlob,
      );
      return {
        id: request.credentialId,
        rawId: request.credentialId,
        response: {
          clientDataJSON: '',
          authenticatorData: '',
          signature: '',
          userHandle: '',
        },
      };
    } else {
      throw new UnexpectedStateError({ message: 'not supported' });
    }
  }

  async register(request: PasskeyRegistrationRequest): Promise<object> {
    if (await this.isPasskeysSupported()) {
      const { rpId, name, userID, challenge } = {
        rpId: request.rp.id,
        name: request.user.displayName,
        userID: request.user.id,
        challenge: request.challenge,
      };

      try {
        const response = await FarcasterCryptographyNativeKeyStore.register(
          rpId,
          challenge,
          name,
          userID,
        );
        return {
          id: response.credentialID,
          rawId: response.credentialID,
          response: {
            clientDataJSON: response.response.rawClientDataJSON,
            attestationObject: response.response.rawAttestationObject,
          },
        };
      } catch (error) {
        throw error;
      }
    } else {
      throw new UnexpectedStateError({ message: 'not supported' });
    }
  }

  async authenticate(
    request: PasskeyAuthenticationRequest,
  ): Promise<PasskeyAuthenticationResult> {
    if (await this.isPasskeysSupported()) {
      try {
        const response = await FarcasterCryptographyNativeKeyStore.authenticate(
          request.rpId,
          request.challenge,
          request.credentialId ?? '',
        );
        return {
          id: response.credentialID,
          rawId: response.credentialID,
          response: {
            clientDataJSON: response.response.rawClientDataJSON,
            authenticatorData: response.response.rawAuthenticatorData,
            signature: response.response.signature,
            userHandle: response.userID,
          },
          largeBlob: response.largeBlob,
        };
      } catch (error) {
        throw error;
      }
    } else {
      throw new UnexpectedStateError({ message: 'not supported' });
    }
  }

  async isPasskeysSupported(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return parseInt(Platform.Version, 10) > 16;
    }

    if (Platform.OS === 'android') {
      return Platform.Version >= 34;
    }

    return false;
  }

  async getInbox(): Promise<Conversation[]> {
    const conv = JSON.parse(
      await FarcasterCryptographyNativeKeyStore.getInbox(),
    ) as Conversation[];
    conv.map((c) => {
      c.participants = c.participants.map((p: unknown) => {
        return {
          ...(p as ConversationParticipantInfo),
          userInfo: JSON.parse((p as ConversationParticipantInfo).userInfo),
        };
      });
    });
    return conv;
  }

  async getConversationPage(
    conversationId: string,
    pageSize: number,
    before: number | undefined,
    after: number | undefined,
  ): Promise<InboxDirectCast[]> {
    return JSON.parse(
      await FarcasterCryptographyNativeKeyStore.getConversationPage(
        conversationId,
        pageSize,
        before ?? after ?? 0,
        before !== undefined ? 'before' : 'after',
      ),
    );
  }

  async getInboxId(): Promise<string> {
    return await FarcasterCryptographyNativeKeyStore.getInboxId();
  }

  async getConversationParticipants(
    conversationId: string,
  ): Promise<ConversationParticipant[]> {
    const info = JSON.parse(
      await FarcasterCryptographyNativeKeyStore.getConversationParticipants(
        conversationId,
      ),
    ) as ConversationParticipantInfo[];

    return info.map((i) => {
      return {
        ...i,
        userInfo: JSON.parse(i.userInfo),
      } as ConversationParticipant;
    });
  }

  async bulkRatchetDecrypt(
    participants: ApiDirectCastKeysByAccount[],
    messages: ApiInboxDirectCast[],
  ): Promise<boolean> {
    return JSON.parse(
      await FarcasterCryptographyNativeKeyStore.bulkRatchetDecrypt(
        JSON.stringify(participants),
        JSON.stringify(messages),
      ),
    );
  }

  async bulkRatchetEncrypt(
    conversationId: string,
    keys: ApiDirectCastKeysByAccount[],
    participants: ConversationParticipant[],
    message: string,
    account: string,
    fid: number,
    messageId: string | undefined,
  ): Promise<ApiInboxDirectCast[]> {
    return JSON.parse(
      await FarcasterCryptographyNativeKeyStore.bulkRatchetEncrypt(
        JSON.stringify(keys),
        JSON.stringify({
          conversationId,
          participants,
          message,
          account,
          fid,
          messageId,
        }),
      ),
    );
  }

  async getPublicInboxKeys(): Promise<{
    idk: ApiDirectCastKey;
    spk: ApiDirectCastKey;
  }> {
    const [idkPublicKey, spkPublicKey, ibxPublicKey] = JSON.parse(
      await FarcasterCryptographyNativeKeyStore.getPublicInboxKeys(),
    ) as string[];

    if (!idkPublicKey || !spkPublicKey || !ibxPublicKey) {
      throw new UnexpectedStateError({ message: 'keys not instantiated' });
    }

    return {
      idk: {
        keyId: '', // this is provided by the server
        type: 'idk',
        base64PublicKey: idkPublicKey,
        base64Signature: '', // this is provided upstream
        deviceId: '',
        deviceName: '',
        account: '', // this is provided upstream
        inboxId: ibxPublicKey,
        timestamp: Date.now(),
      },
      spk: {
        keyId: '', // this is provided by the server
        type: 'spk',
        base64PublicKey: spkPublicKey,
        base64Signature: '', // this is provided upstream
        deviceId: '',
        deviceName: '',
        account: '', // this is provided upstream
        inboxId: ibxPublicKey,
        timestamp: Date.now(),
      },
    };
  }

  async initializeWithName(name: string): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.initializeWithName(name);
  }

  async setMessageStatus(
    messageId: string,
    fid: number,
    status: string,
  ): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.setMessageStatus(
      messageId,
      fid,
      status,
    );
  }

  async setConversationsRead(
    conversationReadInfo: ConversationReadInfo[],
  ): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.setConversationsRead(
      JSON.stringify(conversationReadInfo),
    );
  }

  async wipeData(): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.wipeData();
  }

  async clearOldMessages(): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.clearOldMessages();
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await FarcasterCryptographyNativeKeyStore.deleteConversation(
      conversationId,
    );
  }
}

interface FarcasterCryptographyReactNativeKeyStore {
  initializeWithName(name: string): Promise<void>;
  getInbox(): Promise<string>;
  getConversationPage(
    conversationId: string,
    pageSize: number,
    cursor: number,
    direction: string,
  ): Promise<string>;
  getInboxId(): Promise<string>;
  clearOldMessages(): Promise<void>;
  deleteConversation(conversationId: string): Promise<void>;
  getConversationParticipants(conversationId: string): Promise<string>;
  bulkRatchetDecrypt(
    participantsJson: string,
    messagesJson: string,
  ): Promise<string>;
  bulkRatchetEncrypt(
    participantsJson: string,
    requestJson: string,
  ): Promise<string>;
  getPublicInboxKeys(): Promise<string>;
  setMessageStatus(
    messageId: string,
    fid: number,
    status: string,
  ): Promise<void>;
  setConversationsRead(info: string): Promise<void>;
  wipeData(): Promise<void>;
  name(): Promise<string>;
  getSignedPreKey(base64PublicKey: string): Promise<string>;
  getIdentityKey(base64PublicKey: string): Promise<string>;
  getEphemeralKey(base64PublicKey: string): Promise<string>;
  getSymmetricKey(id: string): Promise<string>;
  createIdentityKey(): Promise<string>;
  createSignedPreKey(identityBase64PublicKey: string): Promise<string>;
  createEphemeralKey(): Promise<string>;
  deleteSignedPreKey(base64PublicKey: string): Promise<string>;
  deleteEphemeralKey(base64PublicKey: string): Promise<string>;
  deleteSymmetricKey(id: string): Promise<string>;
  parsePublicKey(base64PublicKey: string): Promise<string>;
  deriveKey(options: string): Promise<string>;
  agreeWithEphemeralKey(
    base64EphemeralPublicKey: string,
    base64PublicKey: string,
  ): Promise<string>;
  agreeWithSignedPreKey(
    base64SignedPrePublicKey: string,
    base64PublicKey: string,
  ): Promise<string>;
  agreeWithIdentityKey(
    base64IdentityPublicKey: string,
    base64PublicKey: string,
  ): Promise<string>;
  decrypt(
    id: string,
    base64IV: string,
    base64Ciphertext: string,
    base64AssociatedData: string | undefined,
  ): Promise<string>;
  encrypt(
    id: string,
    base64Plaintext: string,
    aeadPrefixId: string | undefined,
    base64AssociatedData: string | undefined,
  ): Promise<string>;
  compareKey(id: string, otherId: string): Promise<boolean>;
  generateConfirmationValue(id: string): Promise<string>;
  wrapSymmetricKey(id: string, otherId: string): Promise<string>;
  wrapEphemeralKey(id: string, base64PublicKey: string): Promise<string>;
  wrapSignedPreKey(id: string, base64PublicKey: string): Promise<string>;
  wrapIdentityKey(id: string, base64PublicKey: string): Promise<string>;
  unwrapSymmetricKey(id: string, ciphertext: string): Promise<string>;
  unwrapEphemeralKey(id: string, ciphertext: string): Promise<string>;
  unwrapSignedPreKey(id: string, ciphertext: string): Promise<string>;
  unwrapIdentityKey(id: string, ciphertext: string): Promise<string>;
  verifySignature(
    base64PublicKey: string,
    message: string,
    base64Signature: string,
  ): Promise<boolean>;
  signWithIdentityKey(
    base64PublicKey: string,
    message: string,
  ): Promise<string>;
  signWithSignedPreKey(
    base64PublicKey: string,
    message: string,
  ): Promise<string>;
  signWithEphemeralKey(
    base64PublicKey: string,
    message: string,
  ): Promise<string>;
  verifyPublicKey(
    base64PubKey: string,
    base64Signature: string,
    base64SigningPublicKey: string,
  ): Promise<boolean>;
  getStoredPasskeys(): Promise<string>;
  updateStoredPasskeys(credentialId: string, passkey: string): Promise<string>;
  deleteStoredPasskey(credentialId: string): Promise<string>;
  hasRecoveryData(credentialId: string): Promise<boolean>;
  setMnemonicForPasskey(
    credentialId: string,
    mnemonic: string,
  ): Promise<string>;
  register(
    rpId: string,
    challenge: string,
    displayName: string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any>;
  addMnemonicToCredential(
    identifier: string,
    challenge: string,
    credentialId: string,
    mnemonic: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any>;
  authenticate(
    identifier: string,
    challenge: string,
    credentialId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any>;
}

const FarcasterCryptographyNativeKeyStore =
  NativeModules.FarcasterCryptographyReactNative
    ? (NativeModules.FarcasterCryptographyReactNative as FarcasterCryptographyReactNativeKeyStore)
    : (new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        },
      ) as FarcasterCryptographyReactNativeKeyStore);
