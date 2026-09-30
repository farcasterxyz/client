import {
  Ciphertext,
  InputError,
  PrivateKey,
  PublicKey,
  SignedPublicKey,
  StateError,
} from 'farcaster-cryptography';

/**
 * @file Contains type definitions for the Double Ratchet library.
 */

/**
 * Defines the options for instantiating the IndexedDBKeyStore class.
 *
 * @see IndexedDBKeyStore
 */
export interface IndexedDBKeyStoreOptions {
  /**
   * The ciphertext of the current root key. Used for re-initializing ratchet sessions.
   */
  readonly rootKeyCiphertext?: Ciphertext | undefined;

  /**
   * The identity key of the sender. Used for initializing a session's root key.
   */
  readonly sendingIdentityKey?: PrivateKey | undefined;

  /**
   * The identity key of the receiver. Used for initializing a session's root key.
   */
  readonly receivingIdentityKey?: PublicKey | undefined;

  /**
   * The signed pre key of the sender. Used for initializing a session's root key, where the sender is not the initiator.
   */
  readonly sendingSignedPreKey?: PrivateKey | undefined;

  /**
   * The signed pre key of the receiver. Used for initializing a session's root key, where the sender is the initiator.
   */
  readonly receivingSignedPreKey?: SignedPublicKey | undefined;

  /**
   * The ephemeral key of the receiver. Used for initializing a session's root key, where the sender is not the initiator.
   */
  readonly receivingEphemeralKey?: PublicKey | undefined;

  /**
   * Turns on debug logging.
   */
  readonly debug?: boolean;

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
}
