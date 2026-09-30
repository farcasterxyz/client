import { SymmetricKey } from './keyStore';

/**
 * @file Contains type definitions for the local datastore.
 */

/**
 * Defines a simple data store implementation.
 */
export interface DataStore {
  /**
   * Gets the symmetric key corresponding to a given channel id.
   */
  readonly getSyncChannelKey: (
    syncChannelIdentifier: string,
  ) => Promise<SymmetricKey | undefined>;

  /**
   * Sets the symmetric key corresponding to a given channel id.
   */
  readonly setSyncChannelKey: (
    syncChannelIdentifier: string,
    symmetricKeyId: SymmetricKey | undefined,
  ) => Promise<void>;
}
