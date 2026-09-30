import { KeyTransport } from '../KeyTransport';
import { DataStore } from './dataStore';
import { InputError, StateError } from './errors';
import {
  Ciphertext,
  KeyStore,
  PrivateKey,
  PublicKey,
  SignedPublicKey,
  SigningPrivateKey,
  SymmetricKey,
} from './keyStore';

/**
 * @file Contains type definitions for the Double Ratchet library.
 */

/**
 * Defines the options for instantiating the DoubleRatchet class.
 * @see DoubleRatchet
 */
export interface DoubleRatchetOptions {
  /**
   * The application name, required for root key establishment.
   */
  readonly applicationName?: string | undefined;

  /**
   * The unique identifier for the ratchet state, used to reinitialize existing
   * or initialize new sessions.
   */
  readonly ratchetStateIdentifier: string;

  /**
   * The keystore implementation, providing preferably enclave-secured
   * cryptography.
   */
  readonly keyStore: KeyStore;

  /**
   * The datastore implementation, providing serialized ratchet state and
   * decrypted message retrieval/storage.
   */
  readonly dataStore: DataStore;

  /**
   * The identity key of the sender. Used for initializing a session's root key.
   */
  readonly sendingIdentityKey: SigningPrivateKey;

  /**
   * The signature of the identity key.
   */
  readonly base64SendingIdentityKeySignature: string;

  /**
   * The signed pre key of the sender. Used for initializing a session's root
   * key, where the sender is not the initiator.
   */
  readonly sendingSignedPreKey: PrivateKey;

  /**
   * The signature of the signed pre key.
   */
  readonly base64SendingSignedPreKeySignature: string;

  /**
   * The identity key of the receiver. Used for initializing a session's root
   * key.
   */
  readonly receivingIdentityKey: PublicKey;

  /**
   * The signed pre key of the receiver. Used for initializing a session's root
   * key, where the sender is the initiator.
   */
  readonly receivingSignedPreKey: SignedPublicKey;

  /**
   * The last receiving init message. Used for initializing a session's root
   * key, where the sender is not the initiator.
   */
  readonly lastReceivingInitMessage?: RatchetMessage | undefined;

  /**
   * The verifier for identity keys, intended to return some reference string
   * which the client may use to confirm authenticity of origin. Default use
   * case is using ethers.utils.verifyMessage to return the originating
   * signing wallet address and compare it against the source.
   */
  readonly identityKeyVerifier?: (
    base64PublicKey: string,
    base64Signature: string,
  ) => Promise<boolean>;

  /**
   * The key transport, if available.
   */
  readonly keyTransport?: KeyTransport | undefined;

  /**
   * Turns on debug logging.
   */
  readonly debug?: boolean;

  /**
   * When debug logging is on, onDebug is invoked with the debug message (and
   * object if included). If omitted, logs to `console.debug`.
   */
  readonly onDebug?: (message: string, obj?: unknown | null) => void;

  /**
   * Allows for responsive error handling of InputErrors.
   *
   * Input errors are implementation-based errors – i.e. the implementation of
   * the library produced this fault.
   */
  readonly onInputError?: (error: InputError) => void;

  /**
   * Allows for responsive error handling of StateErrors.
   *
   * State errors are interally-based errors – i.e. some aspect of the state
   * being managed is incorrect and should be actioned.
   */
  readonly onStateError?: (error: StateError) => void;
}

/**
 * Defines the current state of the ratchet.
 */
export interface RatchetState {
  /**
   * The current root key of the session.
   */
  readonly rootKey?: SymmetricKey | undefined;

  /**
   * The sender's identity key used to establish the session. If this mismatches
   * on restore, session will reinitialize.
   */
  readonly sendingIdentityKey?: PublicKey | undefined;

  /**
   * The signed pre key used to establish the session (if established as
   * receiver). If this mismatches on restore, session will reinitialize.
   */
  readonly sendingSignedPreKey?: PublicKey | undefined;

  /**
   * The receiver's identity key used to establish the session. If this
   * mismatches on restore, session will reinitialize.
   */
  readonly receivingIdentityKey?: PublicKey | undefined;

  /**
   * The receiver's signed pre key used to establish the session (if established
   * as sender). If this mismatches on restore, session will reinitialize.
   */
  readonly receivingSignedPreKey?: PublicKey | undefined;

  /**
   * The sending DH ratchet key.
   */
  readonly sendingPrivateKey?: PrivateKey | undefined;

  /**
   * The receiving public DH ratchet key.
   */
  readonly receivingPublicKey?: PublicKey | undefined;

  /**
   * The sending chain key.
   */
  readonly sendingChainKey?: SymmetricKey | undefined;

  /**
   * The receiving chain key.
   */
  readonly receivingChainKey?: SymmetricKey | undefined;

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
    Map<number, [messageKey: SymmetricKey, aeadValue: SymmetricKey]>
  >;
}

/**
 * Defines a request for encrypting a message and advancing the sending ratchet.
 */
export interface RatchetEncryptRequest {
  /**
   * The base64-encoded plaintext.
   */
  readonly base64Plaintext: string;

  /**
   * Mark this message as silent – do not use this to indicate that a message
   * should not be shown to the user, the only messages suppressed from view are
   * messages that cannot be decrypted or outright reinits.
   */
  readonly noNotify?: boolean | undefined;

  /**
   * The optional message identifier, used for deduplication/edit support. Safe
   * to omit.
   */
  readonly messageId?: string | undefined;
}

/**
 * Defines a request for decrypting a message and advancing the receiving
 * ratchet.
 */
export interface RatchetDecryptRequest {
  /**
   * The received message payload.
   */
  readonly message: RatchetMessage;

  /**
   * The optional transport bundle.
   */
  readonly transportBundle?: {
    base64IV: string;
    base64Ciphertext: string;
    base64AssociatedData: string;
  };
}

/**
 * Defines a header for a RatchetMessage.
 */
export interface RatchetHeader {
  /**
   * The sender's current ephemeral key. Must be sent with every message, due to
   * potential out-of-order message receipt.
   */
  readonly base64EphemeralKey: string;

  /**
   * The previous sending chain's length. Provides context for out-of-order
   * messaging.
   */
  readonly previousChainLength: number;

  /**
   * The current sending chain length number. Provides context for out-of-order
   * messaging.
   */
  readonly messageNumber: number;
}

/**
 * Defines a signed public key bundle used for session reinitialization.
 */
export interface SignedPublicKeyBundle {
  /**
   * The base64-encoded public key.
   */
  readonly base64PublicKey: string;

  /**
   * The base64-encoded signature.
   */
  readonly base64Signature: string;
}

/**
 * Defines a key bundle used for session reinitialization.
 */
export interface KeyBundle {
  /**
   * The signed pre-key of the message sender.
   */
  readonly preKey: SignedPublicKeyBundle;

  /**
   * The identity key of the message sender.
   */
  readonly identity: SignedPublicKeyBundle;
}

/**
 * Defines a ratchet message payload.
 */
export interface RatchetMessage {
  /**
   * The client has detected a key change, reinitializes the session with a new
   * ratchet state.
   */
  readonly reinitBundle?: KeyBundle | undefined;

  /**
   * The header of the RatchetMessage.
   */
  readonly header: RatchetHeader;

  /**
   * The ciphertext payload of the message.
   */
  readonly ciphertext: Ciphertext;

  /**
   * Send this message quietly, with no notification banner.
   */
  readonly noNotify?: boolean | undefined;

  /**
   * The optional message identifier, used for deduplication/edit support.
   */
  readonly messageId?: string | undefined;
}
