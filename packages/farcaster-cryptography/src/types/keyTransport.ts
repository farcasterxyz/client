import { DataStore } from './dataStore';
import { InputError, StateError } from './errors';
import { KeyStore, PrivateKey, SymmetricKey } from './keyStore';

/**
 * Defines the options for establishing key transport.
 * @see KeyTransport
 */
export interface KeyTransportOptions {
  /**
   * The key used for establishing an agreement key.
   */
  readonly ecTransportAgreementKey: PrivateKey;

  /**
   * The keystore implementation, providing preferably enclave-secured cryptography.
   */
  readonly keyStore: KeyStore;

  /**
   * The datastore implementation, providing channel state information/storage.
   */
  readonly dataStore: DataStore;

  /**
   * Turns on debug logging.
   */
  readonly debug?: boolean;

  /**
   * When debug logging is on, onDebug is invoked with the debug message (and object if included). If omitted,
   * logs to `console.debug`.
   */
  readonly onDebug?: (message: string, obj?: unknown | null) => void;

  /**
   * Allows for responsive error handling of InputErrors.
   *
   * Input errors are implementation-based errors – i.e. the implementation of the library produced this fault.
   */
  readonly onInputError?: (error: InputError) => void;

  /**
   * Allows for responsive error handling of StateErrors.
   *
   * State errors are interally-based errors – i.e. some aspect of the state being managed is incorrect and should be actioned.
   */
  readonly onStateError?: (error: StateError) => void;

  /**
   * Enables a backwards-compatible sync-message validation fallback for key agreement.
   *
   * When true, messages with a valid content hash but unverifiable signature may still be
   * accepted for initial key agreement (for legacy native clients with known signing bugs).
   * Set to false to enforce strict signature validation only.
   */
  readonly allowLegacyUnverifiedSyncMessages?: boolean;
}

/**
 * Defines the message format for synchronization.
 */
export interface SyncChannelMessage {
  /**
   * The unique identifier which corresponds to the sync channel.
   */
  readonly channelId: string;

  /**
   * The hash of the message, signed by the public key.
   */
  readonly messageHash: string;

  /**
   * The message payload.
   */
  readonly message: string;

  /**
   * The base64 encoded public key.
   */
  readonly base64PublicKey: string;

  /**
   * The base64 encoded signature.
   */
  readonly base64Signature: string;
}

/**
 * The parameters to pass in for retrieving messages from the sync channel
 */
export interface SyncChannelGetParams {
  /**
   * The unique identifier which corresponds to the sync channel.
   */
  readonly channelId: string;

  /**
   * The base64 encoded public key.
   */
  readonly base64PublicKey: string;

  /**
   * The base64 encoded signature.
   */
  readonly base64Signature: string;
}

/**
 * The parameters to set messages as read from the sync channel
 */
export interface MarkSyncChannelMessageReadParams {
  /**
   * The unique identifier which corresponds to the sync channel.
   */
  readonly channelId: string;

  /**
   * The unique message hash which corresponds to the sync channel message.
   */
  readonly messageHash: string;

  /**
   * The base64 encoded public key.
   */
  readonly base64PublicKey: string;

  /**
   * The base64 encoded signature.
   */
  readonly base64Signature: string;
}

/**
 * Defines an indirect reference of an agreement key, intended to be confirmed
 * by the user before using.
 */
export interface UnconfirmedAgreement {
  /**
   * The symmetric key produced from agreement.
   */
  readonly symmetricKey: SymmetricKey;

  /**
   * The six digit confirmation code to be displayed/entered by the user.
   */
  readonly confirmationCode: string;
}

/**
 * Defines a wrapped version of ratchet state
 */
export interface WrappedRatchetState {
  /**
   * The current root key of the session.
   */
  readonly rootKey?: string | undefined;

  /**
   * The sender's identity key used to establish the session. If this mismatches on restore,
   * session will reinitialize.
   */
  readonly sendingIdentityKey?: string | undefined;

  /**
   * The signed pre key used to establish the session (if established as receiver).
   * If this mismatches on restore, session will reinitialize.
   */
  readonly sendingSignedPreKey?: string | undefined;

  /**
   * The sending DH ratchet key.
   */
  readonly sendingPrivateKey?: string | undefined;

  /**
   * The sending chain key.
   */
  readonly sendingChainKey?: string | undefined;

  /**
   * The receiving chain key.
   */
  readonly receivingChainKey?: string | undefined;

  /**
   * The number of messages in the previous sending chain.
   */
  readonly previousChainLength?: number | undefined;

  /**
   * The number of messages in the current sending chain.
   */
  readonly currentSendingChainLength?: number | undefined;

  /**
   * The number of messages in the current receiving chain.
   */
  readonly currentReceivingChainLength?: number | undefined;

  /**
   * A map of skipped receiving keys, used to catch up on out-of-order receives.
   */
  readonly skippedReceivingKeysMap?: Map<
    string,
    Map<number, [messageKey: string, aeadValue: string]>
  >;
}

/**
 * Defines the common encrypted bundle interface for messages.
 */
export interface EncryptedBundle {
  /**
   * The payload, encoded as base64.
   */
  readonly payload: string;

  /**
   * The type that is encrypted.
   */
  readonly type: string;
}

export enum KeyTransportState {
  NOT_INITIALIZED = 0,
  AGREE_KEY = 1,
  INITIALIZED = 2,
}
