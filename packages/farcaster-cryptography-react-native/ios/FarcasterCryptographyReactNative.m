#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FarcasterCryptographyReactNative, NSObject)

RCT_EXTERN_METHOD(getInbox:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearOldMessages:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteConversation:(NSString)conversationId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getConversationPage:(NSString)conversationId
                  withPageSize:(nonnull NSNumber)pageSize
                  withCursor:(nonnull NSNumber)cursor
                  withDirection:(NSString)direction
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getInboxId:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getConversationParticipants:(NSString)conversationId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(bulkRatchetDecrypt:(NSString)participantsJson
                  withMessagesJson:(NSString)messagesJson
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(bulkRatchetEncrypt:(NSString)participantsJson
                  withRequestJson:(NSString)requestJson
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPublicInboxKeys:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(initializeWithName:(NSString)name
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setMessageStatus:(NSString)messageId
                 withFid:(nonnull NSNumber)fid
                 withStatus:(NSString)status
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setConversationsRead:(NSString)info
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(wipeData:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(name:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(getStoredPasskeys:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateStoredPasskeys:(NSString)credentialId
                 withPasskey:(NSString)passkey
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(deleteStoredPasskey:(NSString)credentialId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(register:(NSString)identifier
                  withChallenge:(NSString)challenge
                  withDisplayName:(NSString) displayName
                  withUserId:(NSString) userId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(addMnemonicToCredential:(NSString)identifier
                  withChallenge:(NSString)challenge
                  withCredentialId:(NSString)credentialId
                  withMnemonic:(NSString)mnemonic
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(authenticate:(NSString)identifier
                  withChallenge:(NSString)challenge
                  withCredentialId:(NSString)credentialId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(getSignedPreKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getIdentityKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getEphemeralKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSymmetricKey:(NSString)id
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createIdentityKey:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createSignedPreKey:(NSString)identityBase64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createEphemeralKey:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteSignedPreKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteEphemeralKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteSymmetricKey:(NSString)id
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(parsePublicKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deriveKey:(NSString)options
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(agreeWithEphemeralKey:(NSString)base64EphemeralPublicKey
                 withBase64PublicKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(agreeWithSignedPreKey:(NSString)base64SignedPrePublicKey
                 withBase64PublicKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(agreeWithIdentityKey:(NSString)base64IdentityPublicKey
                 withBase64PublicKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decrypt:(NSString)id
                 withBase64IV:(NSString)base64IV
                 withBase64Ciphertext:(NSString)base64Ciphertext
                 withBase64AssociatedData:(NSString)base64AssociatedData
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encrypt:(NSString)id
                 withBase64Plaintext:(NSString)base64Plaintext
                 withAeadPrefixId:(NSString)aeadPrefixId
                 withBase64AssociatedData:(NSString)base64AssociatedData
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(compareKey:(NSString)id
                 withOtherId:(NSString)otherId
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generateConfirmationValue:(NSString)id
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(wrapSymmetricKey:(NSString)id
                 withOtherId:(NSString)otherId
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(wrapEphemeralKey:(NSString)id
                 withBase64PublicKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(wrapSignedPreKey:(NSString)id
                 withBase64PublicKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(wrapIdentityKey:(NSString)id
                 withBase64PublicKey:(NSString)base64PublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(unwrapSymmetricKey:(NSString)id
                 withCiphertext:(NSString)ciphertext
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(unwrapEphemeralKey:(NSString)id
                 withCiphertext:(NSString)ciphertext
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(unwrapSignedPreKey:(NSString)id
                 withCiphertext:(NSString)ciphertext
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(unwrapIdentityKey:(NSString)id
                 withCiphertext:(NSString)ciphertext
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifyPublicKey:(NSString)base64PubKey
                 withSignature:(NSString)base64Signature
                 withSigningPublicKey:(NSString)base64SigningPublicKey
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifySignature:(NSString)base64PublicKey
                 withMessage:(NSString)message
                 withSignature:(NSString)base64Signature
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signWithIdentityKey:(NSString)base64PublicKey
                 withMessage:(NSString)message
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signWithSignedPreKey:(NSString)base64PublicKey
                 withMessage:(NSString)message
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signWithEphemeralKey:(NSString)base64PublicKey
                 withMessage:(NSString)message
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
