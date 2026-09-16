import { ApiKeyStoreKey } from 'farcaster-client-data';
import { PublicKey, SignedPublicKey } from 'farcaster-cryptography';

class SignedApiKeyStoreKey implements SignedPublicKey {
  base64Signature: string;
  base64PublicKey: string;
  verifier: (signingKey: PublicKey) => Promise<boolean>;

  constructor(
    key: ApiKeyStoreKey,
    verifier: (signingKey: PublicKey) => Promise<boolean>,
  ) {
    this.base64PublicKey = key.base64PublicKey;
    this.base64Signature = key.base64Signature;
    this.verifier = verifier;
  }

  async verify(signingKey: PublicKey) {
    return await this.verifier(signingKey);
  }
}

export { SignedApiKeyStoreKey };
