import { sha512 } from '@noble/hashes/sha2.js';

import {
  AsymmetricDerivationMode,
  Ciphertext,
  EncryptedBundle,
  InputError,
  InvalidInputError,
  IrrecoverableStateError,
  isCryptographyError,
  isInputError,
  isStateError,
  KeyTransportOptions,
  MarkSyncChannelMessageReadParams,
  StateError,
  SymmetricEncryptionMode,
  SymmetricKey,
  SyncChannelGetParams,
  SyncChannelMessage,
  UnconfirmedAgreement,
  UnexpectedStateError,
  VerifyingPublicKey,
} from './types';
import { logDebug, logError, mergeIntoDefaultOptions } from './utils';

const getDefaultOptions = (debug: boolean) => ({
  applicationName: 'farcaster',
  debug: false,
  allowLegacyUnverifiedSyncMessages: true,
  onInputError: (error: InputError) => {
    logError(error);
  },
  onStateError: (error: StateError) => {
    logError(error);
  },
  onDebug: debug ? logDebug : (_1: string, _2?: unknown | null) => {},
});

/**
 * Safely decode a sync-channel message `.message` field. PostHog telemetry has
 * shown that occasionally this field arrives as something other than a base64
 * string (most commonly a Node Buffer JSON-serialization round-trip,
 * `{ type: 'Buffer', data: [...] }`), which makes the underlying
 * `Buffer.from(x, 'base64')` throw a native `TypeError: The first argument
 * must be one of type string, Buffer, ArrayBuffer, ...`. That bare TypeError
 * escapes the cryptography layer with no diagnostic context.
 *
 * This helper:
 * - Accepts the happy path (base64-encoded `string`) unchanged.
 * - Recovers from the Node-Buffer JSON round-trip shape.
 * - Recovers from already-binary inputs (`Uint8Array` / `ArrayBuffer`).
 * - Throws a typed `InvalidInputError` with a structured preview of the
 *   unknown shape so the actual offender is visible in PostHog and can be
 *   fixed at its source on the next iteration.
 *
 * Exported so callers in `Methods.ts` (the Phase A / Phase B scan loops) can
 * normalize through the same path before doing their own `JSON.parse`.
 */
export const decodeBase64MessageField = (raw: unknown): Buffer => {
  if (typeof raw === 'string') {
    return Buffer.from(raw, 'base64');
  }
  if (raw instanceof Uint8Array) {
    return Buffer.from(raw);
  }
  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw);
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as { type?: unknown; data?: unknown };
    if (
      obj.type === 'Buffer' &&
      Array.isArray(obj.data) &&
      obj.data.every((v) => typeof v === 'number')
    ) {
      return Buffer.from(obj.data as number[]);
    }
  }
  let preview: string;
  try {
    preview = JSON.stringify(raw)?.slice(0, 200) ?? String(raw);
  } catch {
    preview = '<unserializable>';
  }
  const keys =
    raw && typeof raw === 'object' ? Object.keys(raw).join(',') : 'n/a';
  throw new InvalidInputError({
    message: `Sync-channel message field has unsupported shape. type=${typeof raw}, keys=${keys}, preview=${preview}`,
    input: 'message',
  });
};

class KeyTransport {
  private options: KeyTransportOptions;
  private onDebug: (message: string, obj?: unknown | null) => void;
  private readonly syncMessageForwardWindowToleranceInSteps = 1;
  private readonly syncMessageBackwardWindowToleranceInSteps = 9;

  constructor(options: KeyTransportOptions) {
    this.validateOptions(options);

    this.options = mergeIntoDefaultOptions<KeyTransportOptions>({
      defaults: getDefaultOptions(options.debug ?? false),
      options,
    });

    // We have to do this weird typehack or otherwise the call convention gets gross.
    this.onDebug = this.options.onDebug!;
  }

  private validateOptions(options: KeyTransportOptions) {
    if (options.keyStore === undefined) {
      throw new InvalidInputError({
        message: 'KeyStore must be provided.',
        input: 'KeyStore',
      });
    }

    if (options.dataStore === undefined) {
      throw new InvalidInputError({
        message: 'DataStore must be provided.',
        input: 'DataStore',
      });
    }

    if (options.ecTransportAgreementKey === undefined) {
      throw new InvalidInputError({
        message: 'ECTransportAgreementKey must be provided.',
        input: 'ECTransportAgreementKey',
      });
    }
  }

  public resetOptions(options: KeyTransportOptions) {
    this.options = mergeIntoDefaultOptions<KeyTransportOptions>({
      defaults: options,
      options,
    });
  }

  public async resetKeyTransport(): Promise<void> {
    try {
      await this.options.dataStore.setSyncChannelKey(
        'sync-channel-key',
        undefined,
      );
    } catch (e) {
      this.onDebug('Failed to reset key transport', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async initiateKeyAgreement(
    syncChannelIdentifier: string,
  ): Promise<SyncChannelMessage> {
    try {
      this.onDebug('Initiating Key Agreement');

      return await this.formatSyncMessage(
        syncChannelIdentifier,
        this.options.ecTransportAgreementKey.base64PublicKey,
        'PublicKey',
      );
    } catch (e) {
      this.onDebug('Failed to initiate key agreement', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async receiveKeyAgreementRequest(
    response: SyncChannelMessage,
  ): Promise<UnconfirmedAgreement> {
    try {
      this.onDebug('Performing Key Agreement');

      const isSyncMessageValid = await this.validateSyncMessage(response);
      if (
        !isSyncMessageValid &&
        !(await this.shouldAllowLegacyUnverifiedSyncMessage(response))
      ) {
        throw new InvalidInputError({
          message: 'Could not validate sync message',
          input: 'response',
        });
      }

      const { payload } = JSON.parse(
        decodeBase64MessageField(response.message).toString('utf-8'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      if (payload === this.options.ecTransportAgreementKey.base64PublicKey) {
        throw new InvalidInputError({
          message:
            'Received self-authored PublicKey sync message while negotiating key agreement',
          input: 'response',
        });
      }
      const counterpartyKey =
        await this.options.keyStore.parsePublicKey(payload);

      this.onDebug('Counterparty key is valid, calculating ECDH');
      const symmetricKey = await this.options.ecTransportAgreementKey.deriveKey(
        {
          derivationMode: AsymmetricDerivationMode.ECDH_SHA256,
          counterpartyPublicKey: counterpartyKey,
        },
      );

      this.onDebug('Key agreement succeeded, generating confirmation code');
      const confirmation = await symmetricKey.generateConfirmationValue();

      return {
        symmetricKey: symmetricKey,
        confirmationCode: confirmation,
      };
    } catch (e) {
      this.onDebug('Failed to begin key agreement', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async confirmKeyAgreement(
    syncChannelIdentifier: string,
    agreement: UnconfirmedAgreement,
    sender: boolean,
  ): Promise<SyncChannelMessage | undefined> {
    try {
      if (
        await agreement.symmetricKey.compareConfirmationValue(
          agreement.confirmationCode,
        )
      ) {
        let existingKeyId =
          await this.options.dataStore.getSyncChannelKey('sync-channel-key');

        if (!sender) {
          await this.options.dataStore.setSyncChannelKey(
            'sync-channel-key',
            agreement.symmetricKey,
          );
          return undefined;
        } else {
          await this.options.dataStore.setSyncChannelKey(
            'sync-channel-key',
            agreement.symmetricKey,
          );

          existingKeyId =
            await this.options.dataStore.getSyncChannelKey('sync-channel-key');

          const symKey = await this.options.keyStore.getSymmetricKey(
            existingKeyId!,
          );

          return await this.encryptSymmetricKey(
            syncChannelIdentifier,
            symKey,
            agreement.symmetricKey,
          );
        }
      } else {
        throw new IrrecoverableStateError({
          message: 'Could not confirm confirmation code',
        });
      }
    } catch (e) {
      this.onDebug('Failed to complete key agreement', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async getTransportKey(): Promise<SymmetricKey | undefined> {
    try {
      const channelKeyId =
        await this.options.dataStore.getSyncChannelKey('sync-channel-key');

      if (channelKeyId === undefined) {
        return undefined;
      }

      const channelKey =
        await this.options.keyStore.getSymmetricKey(channelKeyId);

      return channelKey;
    } catch {
      // Deal with odd native platform-based issues
      return undefined;
    }
  }

  public async handleSyncMessage(
    syncMessage: SyncChannelMessage,
  ): Promise<VerifyingPublicKey | SymmetricKey | string> {
    try {
      this.onDebug('Handling sync message');

      const existingKeyId =
        await this.options.dataStore.getSyncChannelKey('sync-channel-key');

      const isSyncMessageValid = await this.validateSyncMessage(syncMessage);
      if (
        !existingKeyId &&
        !isSyncMessageValid &&
        !(await this.shouldAllowLegacyUnverifiedSyncMessage(syncMessage))
      ) {
        throw new InvalidInputError({
          message: 'could not validate sync message',
          input: 'syncMessage',
        });
      }

      return await this.decryptMessage(
        JSON.parse(
          decodeBase64MessageField(syncMessage.message).toString('utf8'),
        ) as EncryptedBundle,
      );
    } catch (e) {
      this.onDebug('Could not handle message', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async encryptString(
    syncChannelIdentifier: string,
    payload: string,
    type: string = 'string',
  ): Promise<SyncChannelMessage> {
    try {
      this.onDebug('Encrypting payload for message');
      const channelKeyId =
        await this.options.dataStore.getSyncChannelKey('sync-channel-key');

      if (channelKeyId === undefined) {
        throw new UnexpectedStateError({
          message: 'Channel Key is not established.',
        });
      }

      const channelKey =
        await this.options.keyStore.getSymmetricKey(channelKeyId);
      const wrapped = Buffer.from(
        JSON.stringify(
          await channelKey.encrypt({
            encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
            base64Plaintext: Buffer.from(payload, 'utf-8').toString('base64'),
          }),
        ),
        'utf-8',
      ).toString('base64');

      return await this.formatSyncMessage(syncChannelIdentifier, wrapped, type);
    } catch (e) {
      this.onDebug('Failed to encrypt string', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async encryptSymmetricKey(
    syncChannelIdentifier: string,
    payload: SymmetricKey,
    encryptingKey?: SymmetricKey,
  ): Promise<SyncChannelMessage> {
    try {
      this.onDebug('Encrypting payload for message');

      if (!encryptingKey) {
        const channelKeyId =
          await this.options.dataStore.getSyncChannelKey('sync-channel-key');

        if (channelKeyId === undefined) {
          throw new UnexpectedStateError({
            message: 'Channel Key is not established.',
          });
        }

        const channelKey =
          await this.options.keyStore.getSymmetricKey(channelKeyId);
        encryptingKey = channelKey;
      }

      const wrapped = await encryptingKey.wrapSymmetricKey(payload);

      return await this.formatSyncMessage(
        syncChannelIdentifier,
        wrapped,
        'SymmetricKey',
      );
    } catch (e) {
      this.onDebug('Failed to encrypt symmetric key', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  private async decryptMessage(
    message: EncryptedBundle,
  ): Promise<VerifyingPublicKey | SymmetricKey | string> {
    try {
      if (!message.payload || !message.type) {
        throw new InvalidInputError({
          message: 'Encrypted bundle is not in expected format.',
          input: 'message',
        });
      }

      switch (message.type) {
        case 'string':
          return await this.decryptString(message.payload);
        case 'SymmetricKey':
          return await this.decryptSymmetricKey(message.payload);
        case 'PublicKey':
          return await this.options.keyStore.parsePublicKey(message.payload);
        default:
          throw new InvalidInputError({
            message: 'Encrypted bundle has invalid payload type',
            input: 'type',
          });
      }
    } catch (e) {
      this.onDebug('Failed to decrypt bundle', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async decryptString(payload: string): Promise<string> {
    const channelKeyId =
      await this.options.dataStore.getSyncChannelKey('sync-channel-key');

    if (channelKeyId === undefined) {
      throw new UnexpectedStateError({
        message: 'Channel Key is not established.',
      });
    }

    const channelKey =
      await this.options.keyStore.getSymmetricKey(channelKeyId);
    const ciphertext = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf8'),
    ) as Ciphertext;

    return await channelKey.decrypt({
      encryptionMode: SymmetricEncryptionMode.AES_256_GCM,
      ciphertext: ciphertext,
    });
  }

  public async decryptSymmetricKey(payload: string): Promise<SymmetricKey> {
    const channelKeyId =
      await this.options.dataStore.getSyncChannelKey('sync-channel-key');

    if (channelKeyId === undefined) {
      throw new UnexpectedStateError({
        message: 'Channel Key is not established.',
      });
    }

    const channelKey =
      await this.options.keyStore.getSymmetricKey(channelKeyId);

    const newKey = await channelKey.unwrapSymmetricKey(payload);

    await this.options.dataStore.setSyncChannelKey('sync-channel-key', newKey);

    return newKey;
  }

  private async formatSyncMessage(
    syncChannelIdentifier: string,
    payload: string,
    type: string,
  ): Promise<SyncChannelMessage> {
    try {
      this.onDebug('Formatting payload for message');
      const message = Buffer.from(
        JSON.stringify({ payload, type }),
        'utf-8',
      ).toString('base64');
      this.onDebug('Calculating hash for sync message');
      const preSig = await this.options.ecTransportAgreementKey.signMessage(
        '' + this.getCurrentUnixEpochWindow().toString(),
      );
      const hash = sha512(
        Buffer.from(
          JSON.stringify({
            channelId: syncChannelIdentifier,
            message: message,
            base64PublicKey: preSig.base64PublicKey,
          }),
          'utf-8',
        ),
      );
      const base64Hash = Buffer.from(hash).toString('base64');

      this.onDebug(
        'Calculating signature for sync message',
        this.getCurrentUnixEpochWindow().toString(),
      );
      const signature = await this.options.ecTransportAgreementKey.signMessage(
        base64Hash + this.getCurrentUnixEpochWindow().toString(),
      );

      const msg = {
        channelId: syncChannelIdentifier,
        messageHash: '0x' + Buffer.from(hash).toString('hex'),
        message: message,
        base64PublicKey: signature.base64PublicKey,
        base64Signature: signature.base64Signature,
      };
      this.onDebug('Returning sync message', msg);
      return msg;
    } catch (e) {
      this.onDebug('Failed to format sync message', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  private async validateSyncMessage(
    message: SyncChannelMessage,
  ): Promise<boolean> {
    try {
      this.onDebug('Confirming payload for message');
      const messageHash = this.calculateSyncMessageHash(message);
      const base64Hash = Buffer.from(messageHash).toString('base64');

      if (
        message.messageHash !==
        '0x' + Buffer.from(messageHash).toString('hex')
      )
        return false;

      const pubKey = await this.options.keyStore.parsePublicKey(
        message.base64PublicKey,
      );
      let verified = false;

      for (
        let i = this.syncMessageForwardWindowToleranceInSteps;
        i >= -this.syncMessageBackwardWindowToleranceInSteps;
        i--
      ) {
        if (
          await pubKey.verifySignature(
            base64Hash + this.getCurrentUnixEpochWindow(i).toString(),
            message.base64Signature,
          )
        ) {
          verified = true;
          break;
        }
      }

      return verified;
    } catch (e) {
      this.onDebug('Failed to verify sync message', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async generateSyncChannelGetParams(
    syncChannelIdentifier: string,
  ): Promise<SyncChannelGetParams> {
    try {
      const signature = await this.options.ecTransportAgreementKey.signMessage(
        syncChannelIdentifier + this.getCurrentUnixEpochWindow().toString(),
      );

      return {
        channelId: syncChannelIdentifier,
        base64PublicKey: signature.base64PublicKey
          .replaceAll('+', '-')
          .replaceAll('/', '_')
          .replaceAll('=', ''),
        base64Signature: signature.base64Signature
          .replaceAll('+', '-')
          .replaceAll('/', '_')
          .replaceAll('=', ''),
      };
    } catch (e) {
      this.onDebug('Failed to get sync channel params', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  public async generateSetMessageReadParams(
    syncChannelIdentifier: string,
    messageHash: string,
  ): Promise<MarkSyncChannelMessageReadParams> {
    try {
      const hashBase64 = Buffer.from(
        messageHash.replace('0x', ''),
        'hex',
      ).toString('base64');
      const signature = await this.options.ecTransportAgreementKey.signMessage(
        syncChannelIdentifier +
          hashBase64 +
          this.getCurrentUnixEpochWindow().toString(),
      );

      return {
        channelId: syncChannelIdentifier,
        messageHash: messageHash,
        base64PublicKey: signature.base64PublicKey,
        base64Signature: signature.base64Signature,
      };
    } catch (e) {
      this.onDebug('Failed to get sync channel params', e);

      if (isCryptographyError(e)) {
        if (isInputError(e)) this.options.onInputError!(e);
        if (isStateError(e)) this.options.onStateError!(e);
      }

      throw e;
    }
  }

  private getCurrentUnixEpochWindow(offset: number = 0): number {
    const resolution = 30000;
    return Math.floor((Date.now() + offset * resolution) / resolution);
  }

  private calculateSyncMessageHash(message: SyncChannelMessage): Uint8Array {
    return sha512(
      Buffer.from(
        JSON.stringify({
          channelId: message.channelId,
          message: message.message,
          base64PublicKey: message.base64PublicKey,
        }),
        'utf-8',
      ),
    );
  }

  private async shouldAllowLegacyUnverifiedSyncMessage(
    message: SyncChannelMessage,
  ): Promise<boolean> {
    if (!this.options.allowLegacyUnverifiedSyncMessages) {
      return false;
    }

    const messageHash = this.calculateSyncMessageHash(message);
    if (
      message.messageHash !==
      '0x' + Buffer.from(messageHash).toString('hex')
    ) {
      return false;
    }

    try {
      const decodedMessage = JSON.parse(
        decodeBase64MessageField(message.message).toString('utf-8'),
      ) as EncryptedBundle;

      // Restrict compatibility mode to key-agreement messages only.
      if (decodedMessage.type !== 'PublicKey') {
        return false;
      }

      await this.options.keyStore.parsePublicKey(decodedMessage.payload);
      this.onDebug(
        'Allowing unverified sync message via legacy compatibility path',
      );
      return true;
    } catch (e) {
      this.onDebug(
        'Failed to evaluate legacy compatibility path for sync message',
        e,
      );
      return false;
    }
  }
}

export { KeyTransport };
