package com.farcastercryptographyreactnative

import kotlinx.serialization.Serializable

@Serializable
data class FarcasterPrivateKey(val base64PublicKey: String)

@Serializable
data class FarcasterSymmetricKey(val id: String)

@Serializable
data class FarcasterSignedPublicKey(val base64PublicKey: String, val base64Signature: String)

@Serializable
data class FarcasterPublicKey(val base64PublicKey: String)

@Serializable
data class FarcasterSignature(val base64PublicKey: String, val base64Signature: String)

@Serializable
data class DeriveKeyOptions(
    val derivationMode: String,
    val base64Salt: String? = null,
    val saltKeyId: String? = null,
    val base64Prefix: String? = null,
    val inputKeyIds: Array<String>,
    val info: String? = null,
    val outputLength: Int,
    val outputKeyLengths: Int? = null)

@Serializable
data class FarcasterCiphertext(val base64IV: String, val base64Ciphertext: String, val base64AssociatedData: String)

@Serializable
data class ApiDirectCastHeader(
    val base64IdentityKey: String?,
    val base64SignedPreKey: String?,
    val base64EphemeralKey: String,
    val previousChainLength: Int,
    val messageNumber: Int)

@Serializable
data class ApiDirectCastCiphertext(
    val base64IV: String,
    val base64Ciphertext: String,
    val base64AssociatedData: String)

@Serializable
data class RatchetEncryptRequest(
    val conversationId: String,
    val account: String,
    val fid: Int,
    val messageId: String?,
    val participants: ArrayList<HydratedConversationParticipantInfo>,
    val message: String)

@Serializable
data class ApiDirectCastMessage(
    val conversationId: String,
    val inboxId: String,
    val messageId: String,
    val account: String,
    val fid: Int,
    val base64Identifier: String,
    val reinit: Boolean,
    val noNotify: Boolean,
    val serverTimestamp: Long,
    val header: ApiDirectCastHeader,
    val ciphertext: ApiDirectCastCiphertext)

@Serializable
data class SkippedKeyTuple(val messageKey: String, val aeadValue: String)

@Serializable
data class ApiPfp(val url: String, val verified: Boolean)

@Serializable
data class ApiBio(val text: String, val mentions: ArrayList<String>)

@Serializable
data class ApiLocation(val placeId: String, val description: String)

@Serializable
data class ApiProfile(val bio: ApiBio, val location: ApiLocation?)

@Serializable
data class ViewerContext(val following: Boolean?, val followedBy: Boolean?, val canSendDirectCasts: Boolean?, val nerfed: Boolean?, val invisible: Boolean?)

@Serializable
data class ApiUser(
    val fid: Int,
    val username: String,
    val displayName: String,
    val pfp: ApiPfp,
    val profile: ApiProfile,
    val followerCount: Int,
    val followingCount: Int,
    val referrerUsername: String?,
    val viewerContext: ViewerContext?)

@Serializable
data class ApiDirectCastKey(
    val keyId: String,
    val type: String,
    val base64PublicKey: String,
    val base64Signature: String,
    val deviceId: String,
    val deviceName: String,
    val account: String,
    val inboxId: String,
    val timestamp: Long)

@Serializable
data class ApiDirectCastKeysBundle(
    val idk: ArrayList<ApiDirectCastKey>,
    val spk: ArrayList<ApiDirectCastKey>)

@Serializable
data class ApiDirectCastKeysByAccount(val user: ApiUser, val keys: ApiDirectCastKeysBundle)

@Serializable
data class HydratedConversationParticipantInfo(
    val conversationId: String,
    val inboxId: String,
    val fid: Int,
    val address: String,
    var userInfo: ApiUser,
    val joinedAt: Long,
    var identityKey: String,
    var signedPreKey: String)

@Serializable
data class ConversationReadInfo(val conversationId: String, val lastReadTime: Long)

@Serializable
data class StoredPasskey(
    val credentialId: String,
    val address: String,
    val fid: Long,
    val pfpUrl: String? = null,
    val username: String,
    val displayName: String? = null,
    val domain: String? = null
)

enum class PassKeyError(val rawValue: String) {
    INVALID_CHALLENGE("invalid_challenge"),
    REQUEST_FAILED("request_failed"),
    NOT_SUPPORTED("not_supported"),
    USER_CANCELED("user_canceled"),
    NO_CREDENTIAL("no_credential")
}

@Serializable
data class PassKeyRegistrationResult(
    val credentialID: String,
    val rawAttestationObject: String,
    val rawClientDataJSON: String
)

@Serializable
data class PassKeyAssertionResult(
    val credentialID: String,
    val rawAuthenticatorData: String,
    val rawClientDataJSON: String,
    val signature: String,
    val userID: String,
    val largeBlob: String? = null,
    val registeredLargeBlob: Boolean = false
)

@Serializable
data class PassKeyResult(
    val registrationResult: PassKeyRegistrationResult? = null,
    val assertionResult: PassKeyAssertionResult? = null
)
