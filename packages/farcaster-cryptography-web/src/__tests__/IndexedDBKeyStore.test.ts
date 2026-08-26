import 'fake-indexeddb/auto';

import { verify } from '@noble/ed25519';
import { AsymmetricDerivationMode, KeyTransport } from 'farcaster-cryptography';

import {
  EphemeralDataStore,
  EphemeralKeyStore,
  EphemeralPrivateKey,
  EphemeralSymmetricKey,
} from '../IndexedDBKeyStore';

// TODO: Uncomment once symmetric keystore is implemented.
// function mockDataStore(): DataStore {
//   const ratchetStore = new Map<string, RatchetState>();
//   const decryptedMessageStore = new Map<RatchetMessage, string>();

//   return {
//     getRatchetState: async (ratchetStateIdentifier: string) => {
//       return ratchetStore.get(ratchetStateIdentifier);
//     },

//     getDecryptedMessage: async (ratchetMessage: RatchetMessage) => {
//       return decryptedMessageStore.get(ratchetMessage);
//     },

//     setRatchetState: async (ratchetStateIdentifier: string, ratchetState: RatchetState | undefined) => {
//       if (ratchetState) {
//         ratchetStore.set(ratchetStateIdentifier, ratchetState);
//       } else {
//         ratchetStore.delete(ratchetStateIdentifier);
//       }
//     },

//     setDecryptedMessage: async (ratchetMessage: RatchetMessage, plaintext: string) => {
//       decryptedMessageStore.set(ratchetMessage, plaintext);
//     },
//   }
// }

describe('IndexedDBKeyStore', () => {
  describe('Key Construction', () => {
    it('should perform key agreement', async () => {
      const store = new EphemeralKeyStore({});
      const k1 = await store.createEphemeralKey();
      const k2 = await store.createEphemeralKey();
      expect(k1).toBeDefined();
      expect(k2).toBeDefined();
      const sym = await k1.deriveKey({
        derivationMode: AsymmetricDerivationMode.ECDH_SHA256,
        counterpartyPublicKey: k2,
      });
      expect(sym).toBeDefined();
    });

    it('should perform key transport', async () => {
      // Create two separate key stores and transports (sender and receiver)
      const keyStore1 = new EphemeralKeyStore({});
      const dataStore1 = new EphemeralDataStore();
      const ephKey1 = await keyStore1.createEphemeralKey();
      const keyTransport1 = new KeyTransport({
        ecTransportAgreementKey: ephKey1,
        keyStore: keyStore1,
        dataStore: dataStore1,
        debug: true,
      });

      const keyStore2 = new EphemeralKeyStore({});
      const dataStore2 = new EphemeralDataStore();
      const ephKey2 = await keyStore2.createEphemeralKey();
      const keyTransport2 = new KeyTransport({
        ecTransportAgreementKey: ephKey2,
        keyStore: keyStore2,
        dataStore: dataStore2,
        debug: true,
      });

      // Sender initiates key agreement
      const agreement = await keyTransport1.initiateKeyAgreement('foo');
      expect(agreement).toBeDefined();

      // Receiver processes the key agreement request
      const resp = await keyTransport2.receiveKeyAgreementRequest(agreement);
      expect(resp).toBeDefined();

      // Receiver confirms the key agreement
      const result = await keyTransport2.confirmKeyAgreement(
        'foo',
        resp,
        false,
      );
      expect(result).toBeUndefined();

      const messageJson = `{"base64PublicKey": "lm4Fb/I18fLuSOHCR2RXVRg/20HjV93jfdkt6hmJ9SA=", "base64Signature": "E1xdFo/FMaa/EVDAV7BxV23FReZ2Dq05qMU1cKZrIBjo127xVFHbAq+GhjD4MdbnRgQwGIjevVV0VF0wvnfQAQ==", "channelId": "foo", "message": "eyJwYXlsb2FkIjoiSTBBT2hJZE40Vkd2UGtKb2NTd200UXdKencxcUxMUDZ4NmlUUjZOWTZDWT0iLCJ0eXBlIjoiUHVibGljS2V5In0=", "messageHash": "0x68dcd31489a3760c7e741595f40b184a827672363244a68ca52b7e0872d6fe24e806330e0c34ad6dbde52f67b80bc1d3ae455b7bd6e38e180b626efa2b40685c"}`;
      const message = JSON.parse(messageJson);
      const time = 55719455;
      const base64Hash = Buffer.from(
        message.messageHash.replace('0x', ''),
        'hex',
      ).toString('base64');
      const sig = Buffer.from(message.base64Signature, 'base64');
      const signedMessage = Buffer.from(base64Hash + time.toString(), 'utf-8');
      const pubKey = Buffer.from(message.base64PublicKey, 'base64');
      const confirm = await verify(sig, signedMessage, pubKey);
      expect(confirm).toBe(true);
    });

    it('should unwrap/wrap to expected vectors', async () => {
      // take a randomly-generated ephemeral key from IndexedDBKeyStore:
      const ephKey = new EphemeralPrivateKey(
        'pRs477cu2k0xKOFD2HPH4eUMlUarkW03+s83paj26eM=',
        'aNoGweS9ODDnIn7abEByD2W9S+Y/3xVsTmsKlPfB1lA=',
      );

      // perform DH with a key generated from iOS:
      const dhk = await ephKey.deriveKey({
        derivationMode: AsymmetricDerivationMode.ECDH_SHA256,
        counterpartyPublicKey: {
          base64PublicKey: 'W9CvgoAJGJ9zNZihaTQehchEu5D3sb+S39t3dayI2B4=',
        },
      });

      // should be equivalent to DH key iOS generated:
      expect(
        Buffer.from((dhk as EphemeralSymmetricKey).secret).toString('base64'),
      ).toBe('Rkw4/SZQas3cXJOHfVk/1d+rt8EQPvhLzu0S0JWAS9M=');

      // now take wrapped ephemeral key from iOS used in above agreement and unwrap it:
      const importedEK = await dhk.unwrapEphemeralKey(
        '{"base64AssociatedData":"","base64Ciphertext":"rGMs38NmBkEnRjB7pFEqLTxNBtnXZzULVxogFLNnbT0d+D//PbjrUjOCrSoiC/p0","base64IV":"oK6XctqiLVzWKyC1IU0CUQ=="}',
      );

      // should result in corresponding private key:
      expect(
        Buffer.from((importedEK as EphemeralPrivateKey).privateKey).toString(
          'base64',
        ),
      ).toBe('aBSKC1PxP0Z0Pu04mXUn/2EeJ2Yfhuxk0/CrXX4YLEU=');
      // should generate the same public key iOS reported:
      expect(importedEK.base64PublicKey).toBe(
        'W9CvgoAJGJ9zNZihaTQehchEu5D3sb+S39t3dayI2B4=',
      );

      // ed25519 signature should produce the same pubkey:
      expect(await (await importedEK.signMessage('test')).base64PublicKey).toBe(
        'KFkWrRxfYRXweaUaiO+aqhujoRMYRqD2FovwKDHYCdE=',
      );

      // now confirm key agreement comes out the same
      const dhk2 = await importedEK.deriveKey({
        derivationMode: AsymmetricDerivationMode.ECDH_SHA256,
        counterpartyPublicKey: ephKey,
      });

      expect(
        Buffer.from((dhk2 as EphemeralSymmetricKey).secret).toString('base64'),
      ).toBe(
        Buffer.from((dhk as EphemeralSymmetricKey).secret).toString('base64'),
      );

      // now repeat in reverse, wrapping the EK with the agreed key:
      const wrappedEK = await dhk.wrapEphemeralKey(importedEK);
      // then unwrapping again with the other agreed key (shouldn't matter which):
      const unwrappedEK = await dhk2.unwrapEphemeralKey(wrappedEK);

      // Now compare to the same vectors (note, we can't compare directly with
      // importedEK because if it partially worked – i.e. the public key resolved correctly,
      // but something else went wrong – they'll be referentially identical due to how we
      // store):
      expect(unwrappedEK.base64PublicKey).toBe(
        'W9CvgoAJGJ9zNZihaTQehchEu5D3sb+S39t3dayI2B4=',
      );
      expect(
        Buffer.from((unwrappedEK as EphemeralPrivateKey).privateKey).toString(
          'base64',
        ),
      ).toBe('aBSKC1PxP0Z0Pu04mXUn/2EeJ2Yfhuxk0/CrXX4YLEU=');
      expect(
        await (
          await unwrappedEK.signMessage('test')
        ).base64PublicKey,
      ).toBe('KFkWrRxfYRXweaUaiO+aqhujoRMYRqD2FovwKDHYCdE=');
    });
  });
});
