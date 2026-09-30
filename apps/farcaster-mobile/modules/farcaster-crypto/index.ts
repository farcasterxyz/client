import { mnemonicToSeedWebcrypto } from '@scure/bip39';
import type { Sign } from 'farcaster-client-hooks';
import { bytesToHex, type HDAccount, type Hex, type LocalAccount } from 'viem';
import {
  english,
  generateMnemonic,
  HDKey,
  hdKeyToAccount,
  privateKeyToAccount,
  sign,
  signMessage,
  signTransaction,
  signTypedData,
  toAccount,
} from 'viem/accounts';

export type HDAccountWithMnemonic = HDAccount & {
  mnemonic: string;
  sign: Sign;
};

export async function toHDAccountWithMnemonic({
  mnemonic,
}: {
  mnemonic: string;
}): Promise<HDAccountWithMnemonic> {
  const seed = await mnemonicToSeedWebcrypto(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const account = hdKeyToAccount(hdKey);
  const privateKey = bytesToHex(account.getHdKey().privateKey!);

  return {
    mnemonic,
    ...account,
    sign: ({ hash }) => sign({ hash, privateKey, to: 'hex' }),
  };
}

export async function createMnemonicWallet(): Promise<HDAccountWithMnemonic> {
  const mnemonic = generateMnemonic(english);
  return toHDAccountWithMnemonic({ mnemonic });
}

export type LocalAccountWithMnemonic = LocalAccount & {
  mnemonic: string;
  sign: Sign;
};

export async function toLocalAccountWithMnemonic({
  mnemonic,
  privateKey,
}: {
  mnemonic: string;
  privateKey: Hex;
}): Promise<LocalAccountWithMnemonic> {
  const account = privateKeyToAccount(privateKey);
  return {
    mnemonic,
    ...account,
    sign: ({ hash }) => sign({ hash, privateKey, to: 'hex' }),
  };
}

/**
 * Instantiating an account from a private key results in an expensive
 * precomputation needed to derive the public key (see
 * https://github.com/paulmillr/noble-curves?tab=readme-ov-file#speed). It
 * takes ~200ms on an iPhone 12.
 *
 * As a performance optimization we setup an account with the address.
 */
export async function optimizedToAccountWithMnemonic({
  address,
  privateKey,
  mnemonic,
}: {
  address: Hex;
  privateKey: Hex;
  mnemonic: string;
}): Promise<LocalAccountWithMnemonic> {
  const account = toAccount({
    address,
    async signMessage({ message }) {
      return signMessage({ message, privateKey });
    },

    async signTransaction(transaction, options) {
      return signTransaction({
        privateKey,
        transaction,
        serializer: options?.serializer,
      });
    },

    async signTypedData(typedData) {
      return signTypedData({ ...typedData, privateKey });
    },
  });

  return {
    mnemonic,
    ...account,
    sign: ({ hash }) => sign({ hash, privateKey, to: 'hex' }),
  };
}
