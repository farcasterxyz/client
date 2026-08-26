struct FarcasterPrivateKey: Codable {
  let base64PublicKey: String

  init(base64PublicKey: String) {
    self.base64PublicKey = base64PublicKey
  }

  init?(json: [String: Any]) {
    guard let base64PublicKey = json["base64PublicKey"] as? String
    else {
      return nil
    }

    self.base64PublicKey = base64PublicKey
  }
}

struct FarcasterSignedPublicKey: Codable {
  let base64PublicKey: String
  let base64Signature: String

  init(base64PublicKey: String, base64Signature: String) {
    self.base64PublicKey = base64PublicKey
    self.base64Signature = base64Signature
  }

  init?(json: [String: Any]) {
    guard let base64PublicKey = json["base64PublicKey"] as? String,
      let base64Signature = json["base64Signature"] as? String
    else {
      return nil
    }

    self.base64PublicKey = base64PublicKey
    self.base64Signature = base64Signature
  }
}

struct FarcasterPublicKey: Codable {
  let base64PublicKey: String

  init(base64PublicKey: String) {
    self.base64PublicKey = base64PublicKey
  }

  init?(json: [String: Any]) {
    guard let base64PublicKey = json["base64PublicKey"] as? String
    else {
      return nil
    }

    self.base64PublicKey = base64PublicKey
  }
}

struct FarcasterSymmetricKey: Codable {
  let id: String

  init (id: String) {
    self.id = id
  }

  init?(json: [String: Any]) {
    guard let id = json["id"] as? String
    else {
      return nil
    }

    self.id = id
  }
}

struct FarcasterSignature: Codable {
  let base64PublicKey: String
  let base64Signature: String

  init (base64PublicKey: String, base64Signature: String) {
    self.base64PublicKey = base64PublicKey;
    self.base64Signature = base64Signature;
  }

  init?(json: [String: Any]) {
    guard let base64PublicKey = json["base64PublicKey"] as? String,
      let base64Signature = json["base64Signature"] as? String
    else {
      return nil
    }

    self.base64PublicKey = base64PublicKey
    self.base64Signature = base64Signature
  }
}

struct FarcasterCiphertext: Codable {
  let base64IV: String
  let base64Ciphertext: String
  let base64AssociatedData: String

  init(base64IV: String, base64Ciphertext: String, base64AssociatedData: String) {
    self.base64IV = base64IV
    self.base64Ciphertext = base64Ciphertext
    self.base64AssociatedData = base64AssociatedData
  }

  init?(json: [String: Any]) {
    guard let base64IV = json["base64IV"] as? String,
      let base64Ciphertext = json["base64Ciphertext"] as? String,
      let base64AssociatedData = json["base64AssociatedData"] as? String
    else {
      return nil
    }

    self.base64IV = base64IV
    self.base64Ciphertext = base64Ciphertext
    self.base64AssociatedData = base64AssociatedData
  }
}

struct DeriveKeyOptions: Codable {
  let derivationMode: String
  let base64Salt: String?
  let saltKeyId: String?
  let base64Prefix: String?
  let inputKeyIds: [String]
  let info: String?
  let outputLength: Int
  let outputKeyLengths: Int?

  init(derivationMode: String, base64Salt: String?, saltKeyId: String?, base64Prefix: String?, inputKeyIds: [String], info: String?, outputLength: Int, outputKeyLengths: Int?) {
    self.derivationMode = derivationMode
    self.base64Salt = base64Salt
    self.saltKeyId = saltKeyId
    self.base64Prefix = base64Prefix
    self.inputKeyIds = inputKeyIds
    self.info = info
    self.outputLength = outputLength
    self.outputKeyLengths = outputKeyLengths
  }

  init?(json: [String: Any]) {
    guard let derivationMode = json["derivationMode"] as? String,
      let base64Salt = json["base64Salt"] as? String?,
      let saltKeyId = json["saltKeyId"] as? String?,
      let base64Prefix = json["base64Prefix"] as? String?,
      let inputKeyIds = json["inputKeyIds"] as? [String],
      let info = json["info"] as? String?,
      let outputLength = json["outputLength"] as? Int,
      let outputKeyLengths = json["outputKeyLengths"] as? Int?
    else {
      return nil
    }

    self.derivationMode = derivationMode
    self.base64Salt = base64Salt
    self.saltKeyId = saltKeyId
    self.base64Prefix = base64Prefix
    self.inputKeyIds = inputKeyIds
    self.info = info
    self.outputLength = outputLength
    self.outputKeyLengths = outputKeyLengths
  }
}

struct RatchetEncryptRequest: Codable {
  let conversationId: String
  let account: String
  let fid: Int
  let messageId: String?
  let participants: [HydratedConversationParticipantInfo]
  let message: String
}

struct ApiDirectCastHeader: Codable {
  let base64IdentityKey: String?
  let base64SignedPreKey: String?
  let base64EphemeralKey: String
  let previousChainLength: Int
  let messageNumber: Int

  init(base64IdentityKey: String?, base64SignedPreKey: String?, base64EphemeralKey: String, previousChainLength: Int, messageNumber: Int) {
    self.base64IdentityKey = base64IdentityKey
    self.base64SignedPreKey = base64SignedPreKey
    self.base64EphemeralKey = base64EphemeralKey
    self.previousChainLength = previousChainLength
    self.messageNumber = messageNumber
  }

  init?(json: [String: Any]) {
    guard let base64IdentityKey = json["base64IdentityKey"] as? String?,
      let base64SignedPreKey = json["base64SignedPreKey"] as? String?,
      let base64EphemeralKey = json["base64EphemeralKey"] as? String,
      let previousChainLength = json["previousChainLength"] as? Int,
      let messageNumber = json["messageNumber"] as? Int
    else {
      return nil
    }

    self.base64IdentityKey = base64IdentityKey
    self.base64SignedPreKey = base64SignedPreKey
    self.base64EphemeralKey = base64EphemeralKey
    self.previousChainLength = previousChainLength
    self.messageNumber = messageNumber
  }
}

struct ApiDirectCastCiphertext: Codable {
  let base64IV: String
  let base64Ciphertext: String
  let base64AssociatedData: String

  init(base64IV: String, base64Ciphertext: String, base64AssociatedData: String) {
    self.base64IV = base64IV
    self.base64Ciphertext = base64Ciphertext
    self.base64AssociatedData = base64AssociatedData
  }

  init?(json: [String: Any]) {
    guard let base64IV = json["base64IV"] as? String,
      let base64Ciphertext = json["base64Ciphertext"] as? String,
      let base64AssociatedData = json["base64AssociatedData"] as? String
    else {
      return nil
    }

    self.base64IV = base64IV
    self.base64Ciphertext = base64Ciphertext
    self.base64AssociatedData = base64AssociatedData
  }
}

struct ApiDirectCastMessage: Codable {
  let conversationId: String
  let inboxId: String
  let messageId: String
  let account: String
  let fid: Int
  let base64Identifier: String
  let reinit: Bool
  let noNotify: Bool
  let serverTimestamp: Int
  let header: ApiDirectCastHeader
  let ciphertext: ApiDirectCastCiphertext

  init(conversationId: String, inboxId: String, messageId: String, account: String, fid: Int, base64Identifier: String, reinit: Bool, noNotify: Bool, serverTimestamp: Int, header: ApiDirectCastHeader, ciphertext: ApiDirectCastCiphertext) {
    self.conversationId = conversationId
    self.inboxId = inboxId
    self.messageId = messageId
    self.account = account
    self.fid = fid
    self.base64Identifier = base64Identifier
    self.reinit = reinit
    self.noNotify = noNotify
    self.serverTimestamp = serverTimestamp
    self.header = header
    self.ciphertext = ciphertext
  }

  init?(json: [String: Any]) {
    guard let conversationId = json["conversationId"] as? String,
      let inboxId = json["inboxId"] as? String,
      let messageId = json["messageId"] as? String,
      let account = json["account"] as? String,
      let fid = json["fid"] as? Int,
      let base64Identifier = json["base64Identifier"] as? String,
      let reinit = json["reinit"] as? Bool,
      let noNotify = json["noNotify"] as? Bool,
      let serverTimestamp = json["serverTimestamp"] as? Int,
      let header = json["header"] as? ApiDirectCastHeader,
      let ciphertext = json["ciphertext"] as? ApiDirectCastCiphertext
    else {
      return nil
    }

    self.conversationId = conversationId
    self.inboxId = inboxId
    self.messageId = messageId
    self.account = account
    self.fid = fid
    self.base64Identifier = base64Identifier
    self.reinit = reinit
    self.noNotify = noNotify
    self.serverTimestamp = serverTimestamp
    self.header = header
    self.ciphertext = ciphertext
  }
}

struct SkippedKeyTuple: Codable {
  let messageKey: String
  let aeadValue: String
}

typealias SkippedKeysMap = [String: [Int: SkippedKeyTuple]]

struct ApiPfp: Codable {
  let url: String
  let verified: Bool
}

struct ApiBio: Codable {
  let text: String
  let mentions: [String]
}

struct ApiLocation: Codable {
  let placeId: String
  let description: String
};

struct ApiProfile: Codable {
  let bio: ApiBio
  let location: ApiLocation?
}

struct ViewerContext: Codable {
  let following: Bool?
  let followedBy: Bool?
  let canSendDirectCasts: Bool?
  let nerfed: Bool?
  let invisible: Bool?
};

struct ApiUser: Codable {
  let fid: Int64
  let username: String
  let displayName: String
  let pfp: ApiPfp
  let profile: ApiProfile
  let followerCount: Int64
  let followingCount: Int64
  let referrerUsername: String?
  let viewerContext: ViewerContext?
}

struct ApiDirectCastKey: Codable {
  let keyId: String
  let type: String
  let base64PublicKey: String
  let base64Signature: String
  let deviceId: String
  let deviceName: String
  let account: String
  let inboxId: String
  let timestamp: Int64
}

struct ApiDirectCastKeysBundle: Codable {
  let idk: [ApiDirectCastKey]
  let spk: [ApiDirectCastKey]
}

struct ApiDirectCastKeysByAccount: Codable {
  let user: ApiUser
  let keys: ApiDirectCastKeysBundle
}

struct HydratedConversationParticipantInfo: Codable {
    let conversationId: String
    let inboxId: String
    let fid: Int64
    let address: String
    var userInfo: ApiUser
    let joinedAt: Float
    var identityKey: String
    var signedPreKey: String
}

struct ConversationReadInfo: Codable {
  let conversationId: String
  let lastReadTime: Int64
}

struct StoredPasskey: Codable {
  let credentialId: String
  var address: String
  var fid: Int64
  var pfpUrl: String?
  var username: String
  var displayName: String?
  var domain: String?
}