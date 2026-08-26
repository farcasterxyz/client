/**
 * @file Contains type definitions for the local keystore.
 */

import {
  ApiDirectCastKey,
  ApiDirectCastKeysByAccount,
  ApiInboxDirectCast,
  ApiUser,
} from './api';

/**
 * Defines a key store implementation, providing preferably enclave-secured cryptography.
 */
export interface KeyStore {
  /**
   * The name of the keystore used, useful for namespace-separation if multiple accounts are used.
   */
  readonly name: string;

  /**
   * Sets the name of the keystore, useful for namespace-separation if multiple accounts are used.
   */
  readonly setName: (name: string) => Promise<void>;

  /**
   * Gets the list of stored passkey information, does not contain mnemonic or
   * require biometric authentication.
   */
  readonly getStoredPasskeys: () => Promise<StoredPasskey[]>;

  /**
   * Updates a specific stored passkey.
   */
  readonly updateStoredPasskey: (
    credentialId: string,
    storedPasskey: StoredPasskey,
  ) => Promise<boolean>;

  /**
   * Deletes a specific stored passkey.
   */
  readonly deleteStoredPasskey: (credentialId: string) => Promise<boolean>;

  /**
   * Checks if a stored passkey has recovery data (encrypted mnemonic).
   */
  readonly hasRecoveryData: (credentialId: string) => Promise<boolean>;

  /**
   * Initiates a passkey registration, requires biometric auth.
   */
  readonly register: (request: PasskeyRegistrationRequest) => Promise<object>;

  /**
   * Sets the mnemonic for the passkey, requires biometric auth.
   */
  readonly addMnemonicToCredential: (
    request: PasskeyAuthenticationRequestLargeBlob,
  ) => Promise<PasskeyAuthenticationResult>;

  /**
   * Performs a passkey authentication, requires biometric auth.
   */
  readonly authenticate: (
    request: PasskeyAuthenticationRequest,
  ) => Promise<PasskeyAuthenticationResult>;

  /**
   * Gets a signed prekey, given its public key.
   */
  readonly getSignedPreKey: (pubKey: PublicKey) => Promise<PrivateKey>;

  /**
   * Gets an identity key.
   */
  readonly getIdentityKey: (pubKey: PublicKey) => Promise<SigningPrivateKey>;

  /**
   * Gets an identity key, given its public key.
   */
  readonly getEphemeralKey: (pubKey: PublicKey) => Promise<PrivateKey>;

  /**
   * Gets a symmetric key, given its non-native form.
   */
  readonly getSymmetricKey: (
    symmetricKey: SymmetricKey,
  ) => Promise<SymmetricKey>;

  /**
   * Creates an identityKey.
   */
  readonly createIdentityKey: () => Promise<SigningPrivateKey>;

  /**
   * Creates a signed prekey, given the parent identity key.
   */
  readonly createSignedPreKey: (
    identityPubKey: PublicKey,
  ) => Promise<SignedPublicKey>;

  /**
   * Creates an ephemeral keypair.
   */
  readonly createEphemeralKey: () => Promise<PrivateKey>;

  /**
   * Creates a symmetric key.
   */
  readonly createSymmetricKey: (id: string) => Promise<SymmetricKey>;

  /**
   * Deletes a signed prekey.
   */
  readonly deleteSignedPreKey: (pubKey: PublicKey) => Promise<void>;

  /**
   * Deletes an ephemeral key.
   */
  readonly deleteEphemeralKey: (pubKey: PublicKey) => Promise<void>;

  /**
   * Deletes a symmetric key.
   */
  readonly deleteSymmetricKey: (symmetricKey: SymmetricKey) => Promise<void>;

  /**
   * Parses a base64-encoded public key.
   */
  readonly parsePublicKey: (
    base64PubKey: string,
  ) => Promise<VerifyingPublicKey>;

  /**
   * Verifies a signature of a given public key from a signing public key.
   */
  readonly verifyPublicKey: (
    base64PubKey: string,
    base64Signature: string,
    base64SigningPublicKey: string,
  ) => Promise<boolean>;

  /**
   * Derives a symmetric key or keys.
   */
  readonly deriveKey: (
    options: SymmetricDeriveKeyOptions,
  ) => Promise<SymmetricKey | SymmetricKey[]>;

  readonly getInbox: () => Promise<Conversation[]>;

  readonly getConversationPage: (
    conversationId: string,
    pageSize: number,
    before: number | undefined,
    after: number | undefined,
  ) => Promise<InboxDirectCast[]>;

  readonly getInboxId: () => Promise<string>;

  readonly getConversationParticipants: (
    conversationId: string,
  ) => Promise<ConversationParticipant[]>;

  readonly bulkRatchetDecrypt: (
    participants: ApiDirectCastKeysByAccount[],
    messages: ApiInboxDirectCast[],
  ) => Promise<boolean>;

  readonly bulkRatchetEncrypt: (
    conversationId: string,
    keys: ApiDirectCastKeysByAccount[],
    participants: ConversationParticipant[],
    message: string,
    account: string,
    fid: number,
    messageId: string | undefined,
  ) => Promise<ApiInboxDirectCast[]>;

  readonly getPublicInboxKeys: () => Promise<{
    idk: ApiDirectCastKey;
    spk: ApiDirectCastKey;
  }>;

  readonly initializeWithName: (name: string) => Promise<void>;

  readonly setMessageStatus: (
    messageId: string,
    fid: number,
    status: string,
  ) => Promise<void>;

  readonly setConversationsRead: (
    conversationReadInfo: ConversationReadInfo[],
  ) => Promise<void>;

  readonly wipeData: () => Promise<void>;

  readonly isPasskeysSupported: () => Promise<boolean>;

  readonly clearOldMessages: () => Promise<void>;

  readonly deleteConversation: (conversationId: string) => Promise<void>;
}

/**
 * Defines the symmetric key derivation modes.
 */
export enum SymmetricDerivationMode {
  HKDF_SHA256,
  HMAC_SHA256,
}

/**
 * Defines the options for deriving a symmetric key.
 */
export interface SymmetricDeriveKeyOptions {
  /**
   * The derivation mode to use.
   */
  readonly derivationMode: SymmetricDerivationMode;

  /**
   * The base64-encoded salt input.
   */
  readonly base64Salt?: string;

  /**
   * The salt input as a SymmetricKey.
   */
  readonly saltKey?: SymmetricKey | undefined;

  /**
   * Optional base64-encoded prefix to the input key, used for domain separation based on specialized key agreement scenarios.
   */
  readonly base64Prefix?: string | undefined;

  /**
   * The additional input key, or keys. If multiple keys are provided, they are concatenated as one input.
   */
  readonly inputKey: SymmetricKey | SymmetricKey[];

  /**
   * Optional info parameter to be used with HKDF.
   */
  readonly info?: string | undefined;

  /**
   * The output byte length.
   */
  readonly outputLength?: number | undefined;

  /**
   * The output key length. If not omitted and not equal to output length, the output is split into
   * `ceil(outputLength / outputKeyLengths)`, where the last key length is the remaining
   * length if not even evenly divisble.
   */
  readonly outputKeyLengths?: number | undefined;
}

/**
 * Defines the derivation modes for asymmetric key derivation.
 */
export enum AsymmetricDerivationMode {
  /**
   * Performs ECDH, then SHA-256 on the resulting key.
   */
  ECDH_SHA256,
}

/**
 * Defines the options for performing key derviation via PrivateKey.deriveKey.
 */
export interface AsymmetricDeriveKeyOptions {
  /**
   * The given derivation mode.
   */
  readonly derivationMode: AsymmetricDerivationMode;

  /**
   * The counterparty's public key used to perform key agreement.
   */
  readonly counterpartyPublicKey: PublicKey;
}

/**
 * Defines choices for hash algorithm.
 */
export enum HashAlgorithm {
  SHA256,
  SHA512,
}

/**
 * Defines a PrivateKey which also performs signing operations.
 */
export interface SigningPrivateKey extends PrivateKey {
  /**
   * Signs a public key, serialized as ASN.1 encoding.
   */
  readonly signPublicKey: (
    publicKey: PublicKey,
    hash: HashAlgorithm,
  ) => Promise<SignedPublicKey>;
}

/**
 * Defines a Signature payload.
 */
export interface Signature {
  /**
   * The base64 encoded public key corresponding to the signature.
   */
  readonly base64PublicKey: string;

  /**
   * The base64 encoded signature.
   */
  readonly base64Signature: string;
}

/**
 * Defines a PrivateKey used for key derivation.
 */
export interface PrivateKey extends PublicKey {
  /**
   * Derives a symmetric key.
   */
  readonly deriveKey: (
    options: AsymmetricDeriveKeyOptions,
  ) => Promise<SymmetricKey>;

  /**
   * Signs a message, serialized as ASN.1 encoding.
   */
  readonly signMessage: (messageHash: string) => Promise<Signature>;
}

/**
 * Defines a PublicKey which has a signature produced via a parent SigningPrivateKey.
 */
export interface SignedPublicKey extends PublicKey {
  /**
   * The base64-encoded DER signature.
   */
  readonly base64Signature: string;

  /**
   * Verifies the signature using a provided signing key.
   */
  readonly verify: (signingKey: PublicKey) => Promise<boolean>;
}

/**
 * Defines a PublicKey which can verify signatures.
 */
export interface VerifyingPublicKey extends PublicKey {
  /**
   * Verifies the provided signature using the message and public key.
   */
  readonly verifySignature: (
    message: string,
    signature: string,
  ) => Promise<boolean>;
}

/**
 * Defines a PublicKey, to be used for key agreement.
 */
export interface PublicKey {
  /**
   * The base64-encoded ASN.1 DER representation of the public key.
   */
  readonly base64PublicKey: string;
}

/******************************************************************/

/**
 * Defines the modes available for symmetric encryption.
 */
export enum SymmetricEncryptionMode {
  AES_256_GCM,
}

/**
 * Defines the options for performing symmetric encryption.
 */
export interface SymmetricEncryptionOptions {
  /**
   * The encryption mode to use.
   */
  readonly encryptionMode: SymmetricEncryptionMode;

  /**
   * The base64-encoded plaintext being encrypted.
   */
  readonly base64Plaintext: string;

  /**
   * The AEAD prefix.
   */
  readonly aeadPrefix?: SymmetricKey;

  /**
   * The base64-encoded associated data.
   */
  readonly base64AssociatedData?: string;
}

/**
 * Defines the options for performing symmetric decryption.
 */
export interface SymmetricDecryptionOptions {
  /**
   * The encryption mode to use.
   */
  readonly encryptionMode: SymmetricEncryptionMode;

  /**
   * The ciphertext bundle to decrypt.
   */
  readonly ciphertext: Ciphertext;

  /**
   * The AEAD prefix.
   */
  readonly aeadPrefix?: SymmetricKey;
}

/**
 * Defines a symmetric key.
 */
export interface SymmetricKey {
  /**
   * Encrypts a plaintext.
   */
  readonly encrypt: (
    options: SymmetricEncryptionOptions,
  ) => Promise<Ciphertext>;

  /**
   * Decrypts a ciphertext.
   */
  readonly decrypt: (options: SymmetricDecryptionOptions) => Promise<string>;

  /**
   * Compares the key with another. If they match, returns true.
   */
  readonly compareKey: (other: SymmetricKey) => Promise<boolean>;

  /**
   * Generates a six digit string which can be used to confirm key agreement
   * out of band.
   */
  readonly generateConfirmationValue: () => Promise<string>;

  /**
   * Confirms whether the provided confirmation value matches the derived value
   * from the symmetric key.
   */
  readonly compareConfirmationValue: (
    confirmationValue: string,
  ) => Promise<boolean>;

  /**
   * Encrypts a symmetric key to an exportable format.
   */
  readonly wrapSymmetricKey: (other: SymmetricKey) => Promise<string>;

  /**
   * Encrypts an ephemeral key to an exportable format.
   */
  readonly wrapEphemeralKey: (other: PublicKey) => Promise<string>;

  /**
   * Encrypts a signed pre key to an exportable format.
   */
  readonly wrapSignedPreKey: (other: PublicKey) => Promise<string>;

  /**
   * Encrypts an identity key to an exportable format.
   */
  readonly wrapIdentityKey: (other: PublicKey) => Promise<string>;

  /**
   * Decrypts a symmetric key in a usable format.
   */
  readonly unwrapSymmetricKey: (other: string) => Promise<SymmetricKey>;

  /**
   * Decrypts an ephemeral key in a usable format.
   */
  readonly unwrapEphemeralKey: (other: string) => Promise<PrivateKey>;

  /**
   * Decrypts a signed pre key in a usable format.
   */
  readonly unwrapSignedPreKey: (other: string) => Promise<PrivateKey>;

  /**
   * Decrypts an identity key in a usable format.
   */
  readonly unwrapIdentityKey: (other: string) => Promise<SigningPrivateKey>;
}

/**
 * A resulting ciphertext output.
 */
export interface Ciphertext {
  /**
   * The base64-encoded initialization vector.
   */
  readonly base64IV: string;

  /**
   * The base64-encoded ciphertext.
   */
  readonly base64Ciphertext: string;

  /**
   * The base64-encoded associated data, if used.
   */
  readonly base64AssociatedData?: string | undefined;
}

export interface PasskeyRegistrationRequest {
  challenge: string;
  rp: {
    id: string;
    name?: string;
  };
  user: {
    id: string;
    name?: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout: number;
  attestation: string;
  authenticatorSelection: {
    authenticatorAttachment?: string;
    requireResidentKey?: boolean;
    residentKey?: string;
    userVerification?: string;
  };
}

/**
 * The FIDO2 Attestation Result
 */
export interface PasskeyRegistrationResult {
  id: string;
  rawId: string;
  type?: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
}

/**
 * The FIDO2 Assertion Request with large blob
 */
export interface PasskeyAuthenticationRequestLargeBlob {
  challenge: string;
  timeout: number;
  userVerification: string;
  rpId: string;
  credentialId: string;
  largeBlob: string;
}

/**
 * The FIDO2 Assertion Request
 */
export interface PasskeyAuthenticationRequest {
  challenge: string;
  timeout: number;
  userVerification: string;
  rpId: string;
  credentialId?: string;
}

/**
 * The FIDO2 Assertion Result
 */
export interface PasskeyAuthenticationResult {
  id: string;
  rawId: string;
  type?: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle: string;
  };
  largeBlob?: string;
}

export interface StoredPasskey {
  credentialId: string;
  address: string;
  fid: number;
  pfpUrl: string;
  username: string;
  displayName: string;
  // Optional: passkeys created before dual-domain support (pre-May 2025) have
  // no stored domain. Consumers treat a missing domain as warpcast.com, the RP
  // those legacy passkeys were registered under.
  domain?: string;
}

export interface Conversation {
  conversationId: string;
  lastFetchedAt: number;
  conversationName: string;
  retentionTime: number;
  participants: ConversationParticipant[];
  lastMessage?: InboxDirectCast | undefined;
  unreadCount: number;
}

export interface ConversationParticipantInfo {
  conversationId: string;
  inboxId: string;
  fid: number;
  address: string;
  userInfo: string;
  joinedAt: number;
  identityKey: string;
  signedPreKey: string;
}

export interface ConversationParticipant {
  conversationId: string;
  inboxId: string;
  fid: number;
  address: string;
  userInfo: ApiUser;
  joinedAt: number;
  identityKey: string;
  signedPreKey: string;
}

type MessageType =
  | 'text-unsent'
  | 'text-sending'
  | 'text-sent'
  | 'new-device'
  | 'decrypt-failed'
  | 'read';

export interface InboxDirectCast {
  conversationId: string;
  messageId: string;
  senderFid: number;
  address: string;
  timestamp: number;
  message: string;
  messageType: MessageType;
  noNotify: boolean;
}

export interface ConversationReadInfo {
  conversationId: string;
  lastReadTime: number;
}
