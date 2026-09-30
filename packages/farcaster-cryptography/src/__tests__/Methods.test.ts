// Mock KeyTransport to avoid pulling in @noble/hashes (ESM) which Jest can't parse
jest.mock('../KeyTransport', () => ({}));

import {
  authenticatePasskey,
  isPasskeyCancellation,
  isPasskeyNoCredential,
  isPasskeyNotSupported,
} from '../Methods';
import { KeyStore, StoredPasskey } from '../types/keyStore';

describe('passkey error predicates', () => {
  describe('isPasskeyCancellation', () => {
    it('matches UserCancelled prefix (iOS)', () => {
      expect(isPasskeyCancellation(new Error('UserCancelled'))).toBe(true);
      expect(
        isPasskeyCancellation(new Error('UserCancelled: some detail')),
      ).toBe(true);
    });

    it('matches user_canceled exact (Android)', () => {
      expect(isPasskeyCancellation(new Error('user_canceled'))).toBe(true);
    });

    it('rejects other errors', () => {
      expect(isPasskeyCancellation(new Error('request_failed'))).toBe(false);
      expect(isPasskeyCancellation(new Error('no_credential'))).toBe(false);
      expect(isPasskeyCancellation(new Error('not_supported'))).toBe(false);
      expect(isPasskeyCancellation(new Error(''))).toBe(false);
    });

    it('rejects non-Error values', () => {
      expect(isPasskeyCancellation(null)).toBe(false);
      expect(isPasskeyCancellation(undefined)).toBe(false);
      expect(isPasskeyCancellation('UserCancelled')).toBe(false);
      expect(isPasskeyCancellation({ message: 'user_canceled' })).toBe(false);
    });
  });

  describe('isPasskeyNotSupported', () => {
    it('matches NotSupported prefix (iOS)', () => {
      expect(isPasskeyNotSupported(new Error('NotSupported'))).toBe(true);
      expect(
        isPasskeyNotSupported(new Error('NotSupported: some detail')),
      ).toBe(true);
    });

    it('matches not_supported exact (Android)', () => {
      expect(isPasskeyNotSupported(new Error('not_supported'))).toBe(true);
    });

    it('matches PRF extension not supported', () => {
      expect(
        isPasskeyNotSupported(new Error('PRF extension not supported')),
      ).toBe(true);
    });

    it('rejects other errors', () => {
      expect(isPasskeyNotSupported(new Error('request_failed'))).toBe(false);
      expect(isPasskeyNotSupported(new Error('no_credential'))).toBe(false);
      expect(isPasskeyNotSupported(new Error('user_canceled'))).toBe(false);
      expect(isPasskeyNotSupported(new Error(''))).toBe(false);
    });

    it('rejects non-Error values', () => {
      expect(isPasskeyNotSupported(null)).toBe(false);
      expect(isPasskeyNotSupported(undefined)).toBe(false);
      expect(isPasskeyNotSupported('not_supported')).toBe(false);
    });
  });

  describe('isPasskeyNoCredential', () => {
    it('matches no_credential exact (Android)', () => {
      expect(isPasskeyNoCredential(new Error('no_credential'))).toBe(true);
    });

    it('rejects other errors', () => {
      expect(isPasskeyNoCredential(new Error('request_failed'))).toBe(false);
      expect(isPasskeyNoCredential(new Error('user_canceled'))).toBe(false);
      expect(isPasskeyNoCredential(new Error('not_supported'))).toBe(false);
      expect(isPasskeyNoCredential(new Error(''))).toBe(false);
    });

    it('does not match prefix or substring', () => {
      expect(isPasskeyNoCredential(new Error('no_credential: extra'))).toBe(
        false,
      );
      expect(isPasskeyNoCredential(new Error('prefix_no_credential'))).toBe(
        false,
      );
    });

    it('rejects non-Error values', () => {
      expect(isPasskeyNoCredential(null)).toBe(false);
      expect(isPasskeyNoCredential(undefined)).toBe(false);
      expect(isPasskeyNoCredential('no_credential')).toBe(false);
      expect(isPasskeyNoCredential({ message: 'no_credential' })).toBe(false);
    });
  });
});

describe('authenticatePasskey', () => {
  const successResult = {
    id: 'cred-raw',
    rawId: 'cred-raw',
    response: {
      authenticatorData: '',
      clientDataJSON: '',
      signature: '',
      userHandle: '',
    },
    largeBlob: 'word1 word2 word3',
  };

  const buildKeyStore = (overrides: {
    storedPasskeys?: StoredPasskey[];
    authenticate?: jest.Mock;
  }) => {
    const authenticate =
      overrides.authenticate ?? jest.fn().mockResolvedValue(successResult);
    const getStoredPasskeys = jest
      .fn()
      .mockResolvedValue(overrides.storedPasskeys ?? []);
    const keyStore = { authenticate, getStoredPasskeys } as unknown as KeyStore;
    return { keyStore, authenticate, getStoredPasskeys };
  };

  describe('known-credential mode', () => {
    it('uses warpcast.com when StoredPasskey.domain is undefined (pre-May-2025 legacy)', async () => {
      // Legacy entries written before commit 8194a7e1a have no `domain` field
      const legacyPasskey: StoredPasskey = {
        credentialId: 'cred-1',
        address: '0xabc',
        fid: 1,
        pfpUrl: '',
        username: 'u',
        displayName: 'U',
      };
      const { keyStore, authenticate } = buildKeyStore({
        storedPasskeys: [legacyPasskey],
      });

      const result = await authenticatePasskey({
        keyStore,
        credentialId: 'cred-1',
      });

      expect(authenticate).toHaveBeenCalledTimes(1);
      expect(authenticate).toHaveBeenCalledWith(
        expect.objectContaining({ rpId: 'warpcast.com' }),
      );
      expect(result.domain).toBe('warpcast.com');
    });

    it('uses StoredPasskey.domain when set (farcaster.xyz)', async () => {
      const passkey: StoredPasskey = {
        credentialId: 'cred-1',
        address: '0xabc',
        fid: 1,
        pfpUrl: '',
        username: 'u',
        displayName: 'U',
        domain: 'farcaster.xyz',
      };
      const { keyStore, authenticate } = buildKeyStore({
        storedPasskeys: [passkey],
      });

      await authenticatePasskey({ keyStore, credentialId: 'cred-1' });

      expect(authenticate).toHaveBeenCalledWith(
        expect.objectContaining({ rpId: 'farcaster.xyz' }),
      );
    });

    it('does not fall back to the other domain on failure (single attempt)', async () => {
      const passkey: StoredPasskey = {
        credentialId: 'cred-1',
        address: '0xabc',
        fid: 1,
        pfpUrl: '',
        username: 'u',
        displayName: 'U',
        domain: 'farcaster.xyz',
      };
      const authenticate = jest
        .fn()
        .mockRejectedValue(new Error('UserCancelled'));
      const { keyStore } = buildKeyStore({
        storedPasskeys: [passkey],
        authenticate,
      });

      await expect(
        authenticatePasskey({ keyStore, credentialId: 'cred-1' }),
      ).rejects.toThrow('UserCancelled');
      expect(authenticate).toHaveBeenCalledTimes(1);
    });
  });

  describe('discovery mode', () => {
    it('returns farcaster.xyz result on first attempt when successful', async () => {
      const authenticate = jest.fn().mockResolvedValue(successResult);
      const { keyStore } = buildKeyStore({ authenticate });

      const result = await authenticatePasskey({ keyStore });

      expect(authenticate).toHaveBeenCalledTimes(1);
      expect(authenticate).toHaveBeenCalledWith(
        expect.objectContaining({ rpId: 'farcaster.xyz' }),
      );
      expect(result.domain).toBe('farcaster.xyz');
    });

    it('falls back to warpcast.com when farcaster.xyz throws UserCancelled (iOS no-passkey)', async () => {
      // iOS conflates "user cancelled" and "no matching passkey for rpId" into
      // ASAuthorizationError.canceled. The fallback must still run.
      const authenticate = jest
        .fn()
        .mockRejectedValueOnce(new Error('UserCancelled'))
        .mockResolvedValueOnce(successResult);
      const { keyStore } = buildKeyStore({ authenticate });

      const result = await authenticatePasskey({ keyStore });

      expect(authenticate).toHaveBeenCalledTimes(2);
      expect(authenticate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ rpId: 'farcaster.xyz' }),
      );
      expect(authenticate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ rpId: 'warpcast.com' }),
      );
      expect(result.domain).toBe('warpcast.com');
    });

    it('falls back to warpcast.com when farcaster.xyz throws no_credential (Android)', async () => {
      const authenticate = jest
        .fn()
        .mockRejectedValueOnce(new Error('no_credential'))
        .mockResolvedValueOnce(successResult);
      const { keyStore } = buildKeyStore({ authenticate });

      const result = await authenticatePasskey({ keyStore });

      expect(authenticate).toHaveBeenCalledTimes(2);
      expect(result.domain).toBe('warpcast.com');
    });

    it('does not retry on LargeBlobMissing — passkey was found, recovery data is broken', async () => {
      const authenticate = jest
        .fn()
        .mockRejectedValue(new Error('LargeBlobMissing'));
      const { keyStore } = buildKeyStore({ authenticate });

      await expect(authenticatePasskey({ keyStore })).rejects.toThrow(
        'LargeBlobMissing',
      );
      expect(authenticate).toHaveBeenCalledTimes(1);
    });

    it('does not retry when assertion succeeded but largeBlob was empty', async () => {
      const authenticate = jest
        .fn()
        .mockRejectedValue(new Error('Passkey did not return recovery data'));
      const { keyStore } = buildKeyStore({ authenticate });

      await expect(authenticatePasskey({ keyStore })).rejects.toThrow(
        'Passkey did not return recovery data',
      );
      expect(authenticate).toHaveBeenCalledTimes(1);
    });

    it('throws the first error when both domains fail (prefers current-brand context)', async () => {
      const firstError = new Error('UserCancelled: farcaster');
      const secondError = new Error('no_credential');
      const authenticate = jest
        .fn()
        .mockRejectedValueOnce(firstError)
        .mockRejectedValueOnce(secondError);
      const { keyStore } = buildKeyStore({ authenticate });

      await expect(authenticatePasskey({ keyStore })).rejects.toThrow(
        firstError,
      );
      expect(authenticate).toHaveBeenCalledTimes(2);
    });
  });
});
