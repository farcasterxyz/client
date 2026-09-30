import AuthenticationServices
import Foundation
import CryptoKit
import CryptoSwift

@objc(FarcasterCryptographyReactNative)
class FarcasterCryptographyReactNative: NSObject {
  var name: String = "main"
  var store: KeychainStore = KeychainStore()
  let storePrefix = "xyz.farcaster.keystore."
  let wrappingKey = "kek"
  var passKeyDelegate: PasskeyDelegate?;
  var encryptedStore: EncryptedStore? = nil

  @objc(initializeWithName:withResolver:withRejecter:)
  func initializeWithName(name: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    self.name = name
    do {
      self.encryptedStore = try EncryptedStore(name)
      resolve(true)
    } catch {
      reject("init", "\(error)", nil)
    }
  }

  @objc(getInbox:withRejecter:)
  func getInbox(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let conversations = try self.encryptedStore?.getAllConversations()
      guard let result = try? JSONEncoder().encode(conversations) else {
        reject("getInbox", "could not encode (getInbox)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("getInbox", "\(error)", nil)
    }
  }

  @objc(clearOldMessages:withRejecter:)
  func clearOldMessages(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try self.encryptedStore?.clearOldMessages()
      resolve(true)
    } catch {
      reject("clearOldMessages", "\(error)", nil)
    }
  }

  @objc(deleteConversation:withResolver:withRejecter:)
  func deleteConversation(conversationId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try self.encryptedStore?.deleteAllMessagesForConversation(targetConversationId: conversationId)
      resolve(true)
    } catch {
      reject("deleteConversation", "\(error)", nil)
    }
  }

  @objc(getConversationPage:withPageSize:withCursor:withDirection:withResolver:withRejecter:)
  func getConversationPage(conversationId: String, pageSize: NSNumber, cursor: NSNumber, direction: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      var messages: [ConversationMessage]? = []
      if (direction == "before") {
        messages = try self.encryptedStore?.getAllMessagesForConversation(conversationId, pageSize: pageSize.intValue, before: cursor.int64Value, after: nil)
      } else {
        messages = try self.encryptedStore?.getAllMessagesForConversation(conversationId, pageSize: pageSize.intValue, before: nil, after: cursor.int64Value)
      }
      guard let result = try? JSONEncoder().encode(messages) else {
        reject("getConversationPage", "could not encode (getConversationPage)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("getConversationPage", "\(error)", nil)
    }
  }

  func ensureKeys() -> [Key]? {
    do {
      let keys = try self.encryptedStore?.getAllKeys()
      if (keys == nil) {
        let idkPrivateKey = Curve25519.KeyAgreement.PrivateKey()
        let idkBase64PrivateKey = idkPrivateKey.rawRepresentation.base64EncodedString()
        let idkBase64PublicKey = idkPrivateKey.publicKey.rawRepresentation.base64EncodedString()
        let spkPrivateKey = Curve25519.KeyAgreement.PrivateKey()
        let spkBase64PrivateKey = spkPrivateKey.rawRepresentation.base64EncodedString()
        let spkBase64PublicKey = spkPrivateKey.publicKey.rawRepresentation.base64EncodedString()
        let inboxPrivateKey = Curve25519.KeyAgreement.PrivateKey()
        let inboxBase64PrivateKey = inboxPrivateKey.rawRepresentation.base64EncodedString()
        let inboxBase64PublicKey = inboxPrivateKey.publicKey.rawRepresentation.base64EncodedString()
        try self.encryptedStore?.addKey(Key(
          publicKey: idkBase64PublicKey,
          privateKey: idkBase64PrivateKey,
          keyType: "idk"
        ))
        try self.encryptedStore?.addKey(Key(
          publicKey: spkBase64PublicKey,
          privateKey: spkBase64PrivateKey,
          keyType: "spk"
        ))
        try self.encryptedStore?.addKey(Key(
          publicKey: inboxBase64PublicKey,
          privateKey: inboxBase64PrivateKey,
          keyType: "ibx"
        ))
        return try self.encryptedStore?.getAllKeys()
      } else {
        let idk = keys!.first(where: {$0.keyType == "idk"})
        let spk = keys!.first(where: {$0.keyType == "spk"})
        let ibx = keys!.first(where: {$0.keyType == "ibx"})
        if (idk == nil) {
          let idkPrivateKey = Curve25519.KeyAgreement.PrivateKey()
          let idkBase64PrivateKey = idkPrivateKey.rawRepresentation.base64EncodedString()
          let idkBase64PublicKey = idkPrivateKey.publicKey.rawRepresentation.base64EncodedString()
          try self.encryptedStore?.addKey(Key(
            publicKey: idkBase64PublicKey,
            privateKey: idkBase64PrivateKey,
            keyType: "idk"
          ))
        }
        if (spk == nil) {
          let spkPrivateKey = Curve25519.KeyAgreement.PrivateKey()
          let spkBase64PrivateKey = spkPrivateKey.rawRepresentation.base64EncodedString()
          let spkBase64PublicKey = spkPrivateKey.publicKey.rawRepresentation.base64EncodedString()
          try self.encryptedStore?.addKey(Key(
            publicKey: spkBase64PublicKey,
            privateKey: spkBase64PrivateKey,
            keyType: "spk"
          ))
        }
        if (ibx == nil) {
          let inboxPrivateKey = Curve25519.KeyAgreement.PrivateKey()
          let inboxBase64PrivateKey = inboxPrivateKey.rawRepresentation.base64EncodedString()
          let inboxBase64PublicKey = inboxPrivateKey.publicKey.rawRepresentation.base64EncodedString()
          try self.encryptedStore?.addKey(Key(
            publicKey: inboxBase64PublicKey,
            privateKey: inboxBase64PrivateKey,
            keyType: "ibx"
          ))
        }
        return try self.encryptedStore?.getAllKeys()
      }
    } catch {
      return nil
    }
  }

  @objc(getInboxId:withRejecter:)
  func getInboxId(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let keys = ensureKeys()
      if (keys == nil) {
        reject("getInboxId", "could not ensure keys", nil)
      } else {
        resolve(keys!.first(where: { $0.keyType == "ibx" })!.publicKey)
      }
    } catch {
      reject("getInboxId", "\(error)", nil)
    }
  }

  @objc(getConversationParticipants:withResolver:withRejecter:)
  func getConversationParticipants(conversationId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let participants = try self.encryptedStore?.getAllParticipantsInfoForConversation(conversationId)
      guard let result = try? JSONEncoder().encode(participants) else {
        reject("getConversationParticipants", "could not encode (getConversationParticipants)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("getConversationParticipants", "\(error)", nil)
    }
  }

  func decryptInternalSym(messageKey: SymmetricKey, ciphertext: ApiDirectCastCiphertext) throws -> String {
    guard let ciphertextData = Data(base64Encoded: ciphertext.base64Ciphertext) else {
      throw KeychainKeyStoreError("could not decrypt: invalid ciphertext")
    }
    // 16-byte auth tag is required.
    guard ciphertextData.count >= 16 else {
      throw KeychainKeyStoreError("could not decrypt: ciphertext too short")
    }
    let rawCiphertext = ciphertextData.subdata(in: 0..<ciphertextData.count-16)
    guard let nonce = Data(base64Encoded: ciphertext.base64IV) else {
      throw KeychainKeyStoreError("could not decrypt: invalid iv")
    }
    let tag = ciphertextData.subdata(in: ciphertextData.count-16..<ciphertextData.count)
    var associatedData = Data()
    if (ciphertext.base64AssociatedData.count > 0) {
      associatedData = Data(base64Encoded: ciphertext.base64AssociatedData) ?? associatedData
    }

    let decGCM = GCM(iv: Array(nonce), authenticationTag: Array(tag), additionalAuthenticatedData: Array(associatedData), mode: .detached)
    let aes = try AES(key: Array(messageKey.rawRepresentation), blockMode: decGCM, padding: .noPadding)

    // Swift AES implementation thinks no ciphertext is an error. Why? God only knows.
    if (rawCiphertext.count > 0) {
      let decrypted = try aes.decrypt(Array(rawCiphertext))

      let decryptedData = Data(decrypted)
      guard let plaintext = String(data: decryptedData, encoding: .utf8) else {
        throw KeychainKeyStoreError("could not decrypt: invalid utf8")
      }
      return plaintext
    } else {
      return ""
    }
  }

  func trySkippedKeys(participant: inout ConversationParticipant, message: ApiDirectCastMessage) -> ConversationMessage? {
    if (participant.skippedReceivingKeysMap == "") {
      return nil
    }

    do {
      var skippedKeys = try JSONDecoder().decode(SkippedKeysMap.self, from: Data(participant.skippedReceivingKeysMap.utf8))
      if var applicableSet = skippedKeys[message.header.base64EphemeralKey] {
        let pair = applicableSet[message.header.messageNumber]
        if (pair == nil) {
          return nil
        }

        let plaintext = try self.decryptInternalSym(messageKey: SymmetricKey(rawRepresentation: Data(base64Encoded: pair!.messageKey)!), ciphertext: message.ciphertext)

        applicableSet.removeValue(forKey: message.header.messageNumber)
        skippedKeys[message.header.base64EphemeralKey] = applicableSet

        if (skippedKeys[message.header.base64EphemeralKey]!.count == 0) {
          skippedKeys.removeValue(forKey: message.header.base64EphemeralKey)
        }
      
        participant.skippedReceivingKeysMap = String(data: try JSONEncoder().encode(skippedKeys), encoding: .utf8)!
        let outputMessage = ConversationMessage(
          conversationId: message.conversationId,
          messageId: message.messageId,
          address: message.account,
          senderFid: Int64(message.fid),
          previousChainLength: Int64(message.header.previousChainLength),
          messageNumber: Int64(message.header.messageNumber),
          timestamp: Int64(message.serverTimestamp),
          message: plaintext,
          messageType: "text-sent",
          noNotify: message.noNotify
        )
        try self.encryptedStore?.addMessage(outputMessage)
        try self.encryptedStore?.updateParticipant(participant)
        return outputMessage
      } else {
        return nil
      }
    } catch {
      return nil
    }
  }

  func hmacKDF(result: DeriveKeyOptions, key: Data) throws -> SymmetricKey? {
    let derivationMode = result.derivationMode
    let base64Salt = result.base64Salt
    let saltKeyId = result.saltKeyId
    let base64Prefix = result.base64Prefix
    let info = result.info
    let outputLength = result.outputLength
    let outputKeyLengths = result.outputKeyLengths

    // key + custom salt
    guard let base64SaltValue = base64Salt, let salt = Data(base64Encoded: base64SaltValue) else {
      throw KeychainKeyStoreError("could not derive key: invalid salt")
    }

    let hmac = try HMAC(key: Array(key), variant: .sha2(.sha256)).authenticate(Array(salt))
    let derivedKey = Data(hmac)
    let id = UUID().uuidString
    let newKey = try? SymmetricKey(rawRepresentation: derivedKey)

    return newKey
  }

  func skipKeys(participant: inout ConversationParticipant, limit: Int) throws -> Void {
    if (participant.currentReceivingChainLength + 30 < limit) {
      throw KeychainKeyStoreError("skip length too high")
    }

    if (participant.receivingChainKey != "") {
      guard let key = Data(base64Encoded: participant.receivingChainKey) else {
        throw KeychainKeyStoreError("could not skip keys: invalid receiving chain key")
      }
      while (participant.currentReceivingChainLength < limit) {
        let messageKey = try self.hmacKDF(result: DeriveKeyOptions(
          derivationMode: "hmacsha256",
          base64Salt: "AQ==",
          saltKeyId: nil,
          base64Prefix: nil,
          inputKeyIds: [],
          info: nil,
          outputLength: 32,
          outputKeyLengths: nil
        ), key: key)
        let nextReceivingChainKey =  try self.hmacKDF(result: DeriveKeyOptions(
          derivationMode: "hmacsha256",
          base64Salt: "Ag==",
          saltKeyId: nil,
          base64Prefix: nil,
          inputKeyIds: [],
          info: nil,
          outputLength: 32,
          outputKeyLengths: nil
        ), key: key)
        let aeadPrefix = try self.hmacKDF(result: DeriveKeyOptions(
          derivationMode: "hmacsha256",
          base64Salt: "Aw==",
          saltKeyId: nil,
          base64Prefix: nil,
          inputKeyIds: [],
          info: nil,
          outputLength: 32,
          outputKeyLengths: nil
        ), key: key)

        if (participant.skippedReceivingKeysMap == "") {
          participant.skippedReceivingKeysMap = "{}"
        }

        if (messageKey == nil || nextReceivingChainKey == nil || aeadPrefix == nil) {
          throw KeychainKeyStoreError("could not derive")
        }

        guard var skippedKeys = try? JSONDecoder().decode(SkippedKeysMap.self, from: Data(participant.skippedReceivingKeysMap.utf8)) else {
          throw KeychainKeyStoreError("could not decode")
        }
        
        if (skippedKeys[participant.receivingEphemeralKey] == nil) {
          skippedKeys[participant.receivingEphemeralKey] = [:]
        }

        if var map = skippedKeys[participant.receivingEphemeralKey] {
          map[Int(participant.currentReceivingChainLength)] = SkippedKeyTuple(
            messageKey: messageKey!.rawRepresentation.base64EncodedString(),
            aeadValue: aeadPrefix!.rawRepresentation.base64EncodedString()
          )
          skippedKeys[participant.receivingEphemeralKey] = map
        }

        participant.receivingChainKey = nextReceivingChainKey!.rawRepresentation.base64EncodedString()
        participant.currentReceivingChainLength += 1
      }
    }
  }

  func advanceSendingRatchet(participant: inout ConversationParticipant, header: ApiDirectCastHeader) throws -> Void {
    let sepk = Curve25519.KeyAgreement.PrivateKey()
    let base64PrivateKey = sepk.rawRepresentation.base64EncodedString()
    let base64PublicKey = sepk.publicKey.rawRepresentation.base64EncodedString()
    let receivingPublicKey = header.base64EphemeralKey
    guard let cepkData = Data(base64Encoded: receivingPublicKey) else {
      throw KeychainKeyStoreError("could not advance sending ratchet: invalid ephemeral key")
    }
    let cepk = try Curve25519.KeyAgreement.PublicKey(rawRepresentation: cepkData)

    let dh = try sepk.sharedSecretFromKeyAgreement(with: cepk)
    let dhKey = try SymmetricKey(rawRepresentation: SHA256.hash(data: dh.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })
    let base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

    let info = "farcaster"
    let outputLength = 64

    var key = Data()
    guard let keyFiller = Data(base64Encoded: "//////////////////////////////////////////8="),
          let rootKeyData = Data(base64Encoded: participant.rootKey) else {
      throw KeychainKeyStoreError("could not advance sending ratchet: invalid root key")
    }
    key.append(keyFiller)
    key.append(rootKeyData)

    guard var salt = Data(base64Encoded: base64Salt) else {
      throw KeychainKeyStoreError("could not advance sending ratchet: invalid salt")
    }
    salt.append(dhKey.rawRepresentation)

    var results: [Data] = []
    var infoData = Data()

    if let infoBytes = info.data(using: .utf8) {
      infoData.append(infoBytes)
    }

    let derived = try HKDF(password: Array(key), salt: Array(salt), info: Array(infoData), keyLength: outputLength, variant: HMAC.Variant.sha2(.sha256)).calculate()
    let derivedKey = Data(derived)
    results = stride(from: 0, to: outputLength, by: 32).map {
      return derivedKey.subdata(in: $0 ..< Swift.min($0 + 32, outputLength))
    }

    participant.rootKey = results[0].base64EncodedString()
    participant.sendingChainKey = results[1].base64EncodedString()
    participant.sendingEphemeralKey = base64PrivateKey
    participant.previousChainLength = participant.currentSendingChainLength
    participant.currentReceivingChainLength = 0
    participant.currentSendingChainLength = 0
  }

  func advanceReceiverRatchet(participant: inout ConversationParticipant, header: ApiDirectCastHeader) throws -> Void {
    let receivingPublicKey = header.base64EphemeralKey
    guard let cepkData = Data(base64Encoded: receivingPublicKey) else {
      throw KeychainKeyStoreError("could not advance receiver ratchet: invalid ephemeral key")
    }
    let cepk = try Curve25519.KeyAgreement.PublicKey(rawRepresentation: cepkData)
    guard let sepkData = Data(base64Encoded: participant.sendingEphemeralKey) else {
      throw KeychainKeyStoreError("could not advance receiver ratchet: invalid sending ephemeral key")
    }
    let sepk = try Curve25519.KeyAgreement.PrivateKey(rawRepresentation: sepkData)
    
    let dh = try sepk.sharedSecretFromKeyAgreement(with: cepk)
    let dhKey = try SymmetricKey(rawRepresentation: SHA256.hash(data: dh.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })
    
    let base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

    let info = "farcaster"
    let outputLength = 64

    var key = Data()
    guard let keyFiller = Data(base64Encoded: "//////////////////////////////////////////8="),
          let rootKeyData = Data(base64Encoded: participant.rootKey) else {
      throw KeychainKeyStoreError("could not advance receiver ratchet: invalid root key")
    }
    key.append(keyFiller)
    key.append(rootKeyData)

    guard var salt = Data(base64Encoded: base64Salt) else {
      throw KeychainKeyStoreError("could not advance receiver ratchet: invalid salt")
    }
    salt.append(dhKey.rawRepresentation)

    var results: [Data] = []
    var infoData = Data()

    if let infoBytes = info.data(using: .utf8) {
      infoData.append(infoBytes)
    }

    let derived = try HKDF(password: Array(key), salt: Array(salt), info: Array(infoData), keyLength: outputLength, variant: HMAC.Variant.sha2(.sha256)).calculate()
    let derivedKey = Data(derived)
    results = stride(from: 0, to: outputLength, by: 32).map {
      return derivedKey.subdata(in: $0 ..< Swift.min($0 + 32, outputLength))
    }

    participant.rootKey = results[0].base64EncodedString()
    participant.receivingChainKey = results[1].base64EncodedString()
    participant.receivingEphemeralKey = receivingPublicKey
    try self.advanceSendingRatchet(participant: &participant, header: header);
  }

  @objc(bulkRatchetDecrypt:withMessagesJson:withResolver:withRejecter:)
  func bulkRatchetDecrypt(participantsJson: String, messagesJson: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let participantsReq = try? JSONDecoder().decode([ApiDirectCastKeysByAccount].self, from: Data(participantsJson.utf8)) else {
      reject("ratchetDecrypt", "bad json", nil)
      return
    }

    guard let req = try? JSONDecoder().decode([ApiDirectCastMessage].self, from: Data(messagesJson.utf8)) else {
      reject("ratchetDecrypt", "bad json", nil)
      return
    }

    struct GroupingKey: Hashable {
      let base64IdentityKey: String
      let conversationId: String
    }

    let groupedByIDKAndConversation = Dictionary(grouping: req) { GroupingKey(base64IdentityKey: $0.header.base64IdentityKey!, conversationId: $0.conversationId) }
    guard let keys = try? self.encryptedStore?.getAllKeys() else {
      reject("ratchetDecrypt", "cannot find keys", nil)
      return
    }

    let keysGroupedByFid = Dictionary(grouping: participantsReq) { $0.user.fid }

    let idkRecord = keys.first(where: {$0.keyType == "idk"})!
    let spkRecord = keys.first(where: {$0.keyType == "spk"})!
    let idkPrivateKey = Data(base64Encoded: idkRecord.privateKey)
    let idk = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: idkPrivateKey!)
    let spkPrivateKey = Data(base64Encoded: spkRecord.privateKey)
    let spk = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: spkPrivateKey!)

    Task {
      let errors: [String?] = await withTaskGroup(of: String?.self) { taskGroup in
        for (key, messages) in groupedByIDKAndConversation {
          let base64IdentityKey = key.base64IdentityKey
          let conversationId = key.conversationId
          do {
            let existingConversation = try? self.encryptedStore?.getConversation(conversationId)
            if (existingConversation == nil) {
              try self.encryptedStore?.addConversation(Conversation(conversationId: conversationId, lastFetchedAt: Int64(Date().timeIntervalSince1970) * 1000, lastReadTime: Int64(0), conversationName: "", retentionTime: 60*24*60*60*1000, participants: [], unreadCount: 0))
            }
          } catch {
            return ["could not create conversation: \(error)"]
          }
          guard let knownParticipants = try? self.encryptedStore?.getAllParticipantsForConversation(conversationId) else {
            return ["could not get participants"]
          }

          taskGroup.addTask {
            let userAndKeys = keysGroupedByFid[Int64(messages[0].fid)]?[0]
            let user = userAndKeys?.user
            guard let userJson = try? JSONEncoder().encode(user) else {
              return "could not encode user json for \(messages[0].fid)"
            }

            let inboxId = userAndKeys?.keys.idk.first(where: {$0.base64PublicKey == base64IdentityKey})?.inboxId
            if (inboxId == nil) {
              return "could not find inbox id for idk \(base64IdentityKey)"
            }

            if (knownParticipants.first(where: {$0.identityKey == idkRecord.publicKey}) == nil) {
              let ownUser = participantsReq.first(where: {$0.keys.idk.first(where: {$0.base64PublicKey == idkRecord.publicKey}) != nil})
              let ownIdk = ownUser!.keys.idk.first(where: {$0.base64PublicKey == idkRecord.publicKey})
              guard let ownUserJson = try? JSONEncoder().encode(ownUser!.user) else {
                return "could not encode user json for \(ownUser!.user.fid)"
              }
              let participant = ConversationParticipant(
                conversationId: conversationId,
                inboxId: ownIdk!.inboxId,
                fid: ownUser!.user.fid,
                address: ownIdk!.account,
                userInfo: String(data: ownUserJson, encoding: .utf8)!,
                joinedAt: Int64(Date().timeIntervalSince1970) * 1000,
                identityKey: idkRecord.publicKey,
                signedPreKey: spkRecord.publicKey,
                rootKey: "",
                currentReceivingChainLength: 0,
                previousChainLength: 0,
                currentSendingChainLength: 0,
                sendingEphemeralKey: "",
                receivingEphemeralKey: "",
                sendingChainKey: "",
                receivingChainKey: "",
                skippedReceivingKeysMap: ""
              )
              do {
                try self.encryptedStore?.addParticipant(participant)
              } catch {
                return nil
              }
            }

            var maybeKnownParticipant = knownParticipants.first(where: {$0.identityKey == base64IdentityKey})
            if (maybeKnownParticipant == nil) {
              let cepkData = Data(base64Encoded: messages[0].header.base64EphemeralKey)
              let cepk = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: cepkData!)
              let cidkData = Data(base64Encoded: messages[0].header.base64IdentityKey!)
              let cidk = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: cidkData!)
              let cspkData = Data(base64Encoded: messages[0].header.base64SignedPreKey!)
              let cspk = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: cspkData!)

              let dh1 = try! spk!.sharedSecretFromKeyAgreement(with: cidk!)
              let dh1Key = try! SymmetricKey(rawRepresentation: SHA256.hash(data: dh1.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })

              let dh2 = try! idk!.sharedSecretFromKeyAgreement(with: cepk!)
              let dh2Key = try! SymmetricKey(rawRepresentation: SHA256.hash(data: dh2.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })

              let dh3 = try! spk!.sharedSecretFromKeyAgreement(with: cepk!)
              let dh3Key = try! SymmetricKey(rawRepresentation: SHA256.hash(data: dh3.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })

              let base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

              let info = "farcaster"
              let outputLength = 32

              var key = Data()
              key.append(Data(base64Encoded: "//////////////////////////////////////////8=")!)

              for dhKey in [dh1Key, dh2Key, dh3Key] {
                key.append(dhKey.rawRepresentation)
              }

              var salt = Data(base64Encoded: base64Salt)!

              var results: [FarcasterSymmetricKey] = []
              var infoData = Data()

              if (info != nil) {
                infoData.append(info.data(using: .utf8)!)
              }

              guard let derived = try? HKDF(password: Array(key), salt: Array(salt), info: Array(infoData), keyLength: outputLength, variant: HMAC.Variant.sha2(.sha256)).calculate() else {
                return "could not derive session key for \(messages[0].fid)"
              }
              let derivedKey = Data(derived)

              let sessionKey = try? SymmetricKey(rawRepresentation: derivedKey)

              maybeKnownParticipant = ConversationParticipant(
                conversationId: conversationId,
                inboxId: inboxId!,
                fid: Int64(messages[0].fid),
                address: messages[0].account,
                userInfo: String(data: userJson, encoding: .utf8)!,
                joinedAt: Int64(messages[0].serverTimestamp),
                identityKey: messages[0].header.base64IdentityKey!,
                signedPreKey: messages[0].header.base64SignedPreKey!,
                rootKey: sessionKey!.rawRepresentation.base64EncodedString(),
                currentReceivingChainLength: 0,
                previousChainLength: 0,
                currentSendingChainLength: 0,
                sendingEphemeralKey: spkRecord.privateKey,
                receivingEphemeralKey: "",
                sendingChainKey: "",
                receivingChainKey: "",
                skippedReceivingKeysMap: ""
              )
              do {
                try self.encryptedStore?.addParticipant(maybeKnownParticipant!)
              } catch {
                return "could not add participant to store: \(error)"
              }
            }
            var knownParticipant = maybeKnownParticipant!
            
            for message in messages {
              do {
                let existingMessage = try self.encryptedStore?.getMessage(conversationId, msgId: message.messageId, fid: Int64(message.fid))
                if (existingMessage != nil) {
                  continue
                }

                let skippedMessage = self.trySkippedKeys(participant: &knownParticipant, message: message)
                if (skippedMessage != nil) {
                  continue
                }

                if (knownParticipant.receivingEphemeralKey != message.header.base64EphemeralKey) {
                  try self.skipKeys(participant: &knownParticipant, limit: message.header.previousChainLength)
                  try self.advanceReceiverRatchet(participant: &knownParticipant, header: message.header)
                }

                try self.skipKeys(participant: &knownParticipant, limit: message.header.messageNumber)
                let key = Data(base64Encoded: knownParticipant.receivingChainKey)!
                let messageKey = try self.hmacKDF(result: DeriveKeyOptions(
                  derivationMode: "hmacsha256",
                  base64Salt: "AQ==",
                  saltKeyId: nil,
                  base64Prefix: nil,
                  inputKeyIds: [],
                  info: nil,
                  outputLength: 32,
                  outputKeyLengths: nil
                ), key: key)
                let nextReceivingChainKey =  try self.hmacKDF(result: DeriveKeyOptions(
                  derivationMode: "hmacsha256",
                  base64Salt: "Ag==",
                  saltKeyId: nil,
                  base64Prefix: nil,
                  inputKeyIds: [],
                  info: nil,
                  outputLength: 32,
                  outputKeyLengths: nil
                ), key: key)
                let aeadPrefix = try self.hmacKDF(result: DeriveKeyOptions(
                  derivationMode: "hmacsha256",
                  base64Salt: "Aw==",
                  saltKeyId: nil,
                  base64Prefix: nil,
                  inputKeyIds: [],
                  info: nil,
                  outputLength: 32,
                  outputKeyLengths: nil
                ), key: key)

                let plaintext = try self.decryptInternalSym(
                  messageKey: messageKey!,
                  ciphertext: message.ciphertext
                )

                knownParticipant.userInfo = String(data: userJson, encoding: .utf8)!
                knownParticipant.currentReceivingChainLength += 1
                knownParticipant.receivingChainKey = nextReceivingChainKey!.rawRepresentation.base64EncodedString()
                try self.encryptedStore?.addMessage(ConversationMessage(
                  conversationId: message.conversationId,
                  messageId: message.messageId,
                  address: message.account,
                  senderFid: Int64(message.fid),
                  previousChainLength: Int64(message.header.previousChainLength),
                  messageNumber: Int64(message.header.messageNumber),
                  timestamp: Int64(message.serverTimestamp) - 3000,
                  message: plaintext,
                  messageType: "text-sent",
                  noNotify: message.noNotify
                ))
                try self.encryptedStore?.updateParticipant(knownParticipant)
              } catch {
                try? self.encryptedStore?.deleteParticipant(knownParticipant)
                return "could not decrypt: \(error)"
              }
            }     
            return nil
          }
        }

        return [nil]
      }

      let resolvedErrors = errors.filter({$0 != nil}).map({$0!})
      
      if (resolvedErrors.count > 0) {
        reject("ratchetDecrypt", "errors while decrypting: \(errors)", nil)
      } else {
        resolve("true")
      }
    }
  }

  @objc(bulkRatchetEncrypt:withRequestJson:withResolver:withRejecter:)
  func bulkRatchetEncrypt(participantsJson: String, requestJson: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let participantsReq = try? JSONDecoder().decode([ApiDirectCastKeysByAccount].self, from: Data(participantsJson.utf8)) else {
      reject("ratchetEncrypt", "bad json", nil)
      return
    }

    guard let req = try? JSONDecoder().decode(RatchetEncryptRequest.self, from: Data(requestJson.utf8)) else {
      reject("ratchetEncrypt", "bad json", nil)
      return
    }

    guard let knownParticipants = try? self.encryptedStore?.getAllParticipantsForConversation(req.conversationId) else {
      reject("ratchetEncrypt", "could not get participants", nil)
      return
    }

    guard let keys = try? self.encryptedStore?.getAllKeys() else {
      reject("ratchetEncrypt", "could not get keys", nil)
      return
    }
    
    let keysGroupedByFid = Dictionary(grouping: participantsReq) { $0.user.fid }
    let idkRecord = keys.first(where: {$0.keyType == "idk"})!
    let spkRecord = keys.first(where: {$0.keyType == "spk"})!
    let idkPrivateKey = Data(base64Encoded: idkRecord.privateKey)
    let idk = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: idkPrivateKey!)
    let spkPrivateKey = Data(base64Encoded: spkRecord.privateKey)
    let spk = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: spkPrivateKey!)
    let messageId = req.messageId ?? UUID().uuidString
    let base64MessageId = Data(messageId.utf8).base64EncodedString()
    do {
      let existingConversation = try? self.encryptedStore?.getConversation(req.conversationId)
      if (existingConversation == nil) {
        try self.encryptedStore?.addConversation(Conversation(conversationId: req.conversationId, lastFetchedAt: Int64(Date().timeIntervalSince1970) * 1000, lastReadTime: Int64(Date().timeIntervalSince1970 + 1000) * 1000, conversationName: "", retentionTime: 60*24*60*60*1000, participants: [], unreadCount: 0))
      }
    } catch {
      reject("ratchetEncrypt", "could not create conversation: \(error)", nil)
      return
    }

    Task {
      let messages: [ApiDirectCastMessage?] = await withTaskGroup(of: ApiDirectCastMessage?.self) { taskGroup in
        var results: [ApiDirectCastMessage?] = []
        var idkDict: [String:(Int64,ApiDirectCastKey)] = [:]
        var spkDict: [String:(Int64,ApiDirectCastKey)] = [:]
        for participant in participantsReq {
          for i in participant.keys.idk {
              idkDict[i.inboxId] = (participant.user.fid, i)
          }
          for i in participant.keys.spk {
              spkDict[i.inboxId] = (participant.user.fid, i)
          }
        }
        // This is kind of weird, but for some reason Swift's compiler thinks a dictionary
        // access was somehow mutation? This makes it not complain.
        let idkInboxes = idkDict
        let spkInboxes = spkDict
        for (inboxId, (fid, inboxIdk)) in idkInboxes {
          taskGroup.addTask { () -> ApiDirectCastMessage? in
            let userAndKeys = keysGroupedByFid[fid]?[0]
            let user = userAndKeys?.user
            guard let userJson = try? JSONEncoder().encode(user) else {
              reject("ratchetEncrypt", "could not encode userJson", nil)
              return nil
            }
            var knownParticipant = knownParticipants.first(where: {$0.inboxId == inboxId})
            if (knownParticipant == nil) {
              let sepk = Curve25519.KeyAgreement.PrivateKey()
              let base64PrivateKey = sepk.rawRepresentation.base64EncodedString()
              let base64PublicKey = sepk.publicKey.rawRepresentation.base64EncodedString()
              let cidkData = Data(base64Encoded: inboxIdk.base64PublicKey)
              let cidk = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: cidkData!)
              let cspkData = Data(base64Encoded: spkInboxes[inboxId]!.1.base64PublicKey)
              let cspk = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: cspkData!)

              let dh1 = try! idk!.sharedSecretFromKeyAgreement(with: cspk!)
              let dh1Key = try! SymmetricKey(rawRepresentation: SHA256.hash(data: dh1.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })

              let dh2 = try! sepk.sharedSecretFromKeyAgreement(with: cidk!)
              let dh2Key = try! SymmetricKey(rawRepresentation: SHA256.hash(data: dh2.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })

              let dh3 = try! sepk.sharedSecretFromKeyAgreement(with: cspk!)
              let dh3Key = try! SymmetricKey(rawRepresentation: SHA256.hash(data: dh3.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })

              let base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

              let info = "farcaster"
              var outputLength = 32

              var key = Data()
              key.append(Data(base64Encoded: "//////////////////////////////////////////8=")!)

              for dhKey in [dh1Key, dh2Key, dh3Key] {
                key.append(dhKey.rawRepresentation)
              }

              var salt = Data(base64Encoded: base64Salt)!

              var infoData = Data()

              if (info != nil) {
                infoData.append(info.data(using: .utf8)!)
              }

              guard let derived = try? HKDF(password: Array(key), salt: Array(salt), info: Array(infoData), keyLength: outputLength, variant: HMAC.Variant.sha2(.sha256)).calculate() else {
                reject("ratchetEncrypt", "could not derive", nil)
                return nil
              }
              var derivedKey = Data(derived)

              let sessionKey = try? SymmetricKey(rawRepresentation: derivedKey)

              key = Data()
              key.append(Data(base64Encoded: "//////////////////////////////////////////8=")!)
              key.append(sessionKey!.rawRepresentation)

              salt = Data(base64Encoded: base64Salt)!
              salt.append(dh3Key.rawRepresentation)

              var results: [Data] = []
              infoData = Data()

              if (info != nil) {
                infoData.append(info.data(using: .utf8)!)
              }

              outputLength = 64
              guard let nextDerived = try? HKDF(password: Array(key), salt: Array(salt), info: Array(infoData), keyLength: outputLength, variant: HMAC.Variant.sha2(.sha256)).calculate() else {
                reject("ratchetEncrypt", "could not derive", nil)
                return nil
              }
              derivedKey = Data(nextDerived)
              
              results = try! stride(from: 0, to: outputLength, by: 32).map {
                return derivedKey.subdata(in: $0 ..< Swift.min($0 + 32, outputLength))
              }

              knownParticipant = ConversationParticipant(
                conversationId: req.conversationId,
                inboxId: inboxId,
                fid: fid,
                address: inboxIdk.account,
                userInfo: String(data: userJson, encoding: .utf8)!,
                joinedAt: Int64(Date().timeIntervalSince1970) * 1000,
                identityKey: inboxIdk.base64PublicKey,
                signedPreKey: spkInboxes[inboxId]!.1.base64PublicKey,
                rootKey: results[0].base64EncodedString(),
                currentReceivingChainLength: 0,
                previousChainLength: 0,
                currentSendingChainLength: 0,
                sendingEphemeralKey: base64PrivateKey,
                receivingEphemeralKey: cspk!.rawRepresentation.base64EncodedString(),
                sendingChainKey: results[1].base64EncodedString(),
                receivingChainKey: "",
                skippedReceivingKeysMap: ""
              )
              do {
                try self.encryptedStore?.addParticipant(knownParticipant!)
              } catch {
                return nil
              }
            }

            let key = Data(base64Encoded: knownParticipant!.sendingChainKey)!

            do {
              let messageKey = try? self.hmacKDF(result: DeriveKeyOptions(
                derivationMode: "hmacsha256",
                base64Salt: "AQ==",
                saltKeyId: nil,
                base64Prefix: nil,
                inputKeyIds: [],
                info: nil,
                outputLength: 32,
                outputKeyLengths: nil
              ), key: key)
              let nextSendingChainKey = try? self.hmacKDF(result: DeriveKeyOptions(
                derivationMode: "hmacsha256",
                base64Salt: "Ag==",
                saltKeyId: nil,
                base64Prefix: nil,
                inputKeyIds: [],
                info: nil,
                outputLength: 32,
                outputKeyLengths: nil
              ), key: key)
              let aeadPrefix = try? self.hmacKDF(result: DeriveKeyOptions(
                derivationMode: "hmacsha256",
                base64Salt: "Aw==",
                saltKeyId: nil,
                base64Prefix: nil,
                inputKeyIds: [],
                info: nil,
                outputLength: 32,
                outputKeyLengths: nil
              ), key: key)

              var aeadPayload = Data()
              aeadPayload.append(aeadPrefix!.rawRepresentation)

              let iv = AES.randomIV(AES.blockSize)
              let gcm = GCM(iv: iv, additionalAuthenticatedData: Array(aeadPayload), mode: .detached)

              guard let aes = try? AES(key: Array(messageKey!.rawRepresentation), blockMode: gcm, padding: .noPadding) else {
                reject("encrypt", "could not encrypt", nil)
                return nil
              }

              guard let encrypted = try? aes.encrypt(Array(Data(req.message.utf8))) else {
                reject("encrypt", "could not encrypt", nil)
                return nil
              }

              var encryptedPayload = Data(encrypted)
              encryptedPayload.append(Data(gcm.authenticationTag!))

              let ciphertext = ApiDirectCastCiphertext(
                base64IV: Data(iv).base64EncodedString(),
                base64Ciphertext: Data(encryptedPayload).base64EncodedString(),
                base64AssociatedData: aeadPayload.base64EncodedString())

              let ephemeralKey = knownParticipant!.sendingEphemeralKey != "" ? try! Curve25519.KeyAgreement.PrivateKey(rawRepresentation: Data(base64Encoded: knownParticipant!.sendingEphemeralKey)!) : Curve25519.KeyAgreement.PrivateKey()

              let message = ApiDirectCastMessage(
                conversationId: req.conversationId,
                inboxId: knownParticipant!.inboxId,
                messageId: messageId,
                account: req.account,
                fid: req.fid,
                base64Identifier: base64MessageId,
                reinit: false,
                noNotify: false,
                serverTimestamp: 0,
                header: ApiDirectCastHeader(
                  base64IdentityKey: idk!.publicKey.rawRepresentation.base64EncodedString(),
                  base64SignedPreKey: spk!.publicKey.rawRepresentation.base64EncodedString(),
                  base64EphemeralKey: ephemeralKey.publicKey.rawRepresentation.base64EncodedString(),
                  previousChainLength: Int(knownParticipant!.previousChainLength),
                  messageNumber: Int(knownParticipant!.currentSendingChainLength)
                ),
                ciphertext: ciphertext
              )
              knownParticipant!.userInfo = String(data: userJson, encoding: .utf8)!
              knownParticipant!.sendingChainKey = nextSendingChainKey!.rawRepresentation.base64EncodedString()
              knownParticipant!.currentSendingChainLength += 1
              try self.encryptedStore?.updateParticipant(knownParticipant!)
              
              return message
            } catch {
              reject("encrypt", "could not encrypt: \(error)", nil)
              return nil
            }
          }
        }
        
        for await result in taskGroup {
          results.append(result)
        }
        
        return results  
      }

      let storedMessage = ConversationMessage(
        conversationId: req.conversationId,
        messageId: messageId,
        address: req.account,
        senderFid: Int64(req.fid),
        previousChainLength: 0,
        messageNumber: 0,
        timestamp: Int64(Date().timeIntervalSince1970) * 1000 - 3000,
        message: req.message,
        messageType: "text-sending",
        noNotify: false
      )
      try self.encryptedStore?.addMessage(storedMessage)

      guard let response = try? JSONEncoder().encode(messages) else {
        reject("encrypt", "could not encode", nil)
        return
      }

      resolve(String(data: response, encoding:.utf8)!)
    }
  }

  @objc(getPublicInboxKeys:withRejecter:)
  func getPublicInboxKeys(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let keys = ensureKeys()
      if (keys == nil) {
        reject("getPublicInboxKeys", "could not ensure keys", nil)
        return
      }
      
      let idkRecord = keys!.first(where: {$0.keyType == "idk"})!
      let spkRecord = keys!.first(where: {$0.keyType == "spk"})!
      let ibxRecord = keys!.first(where: {$0.keyType == "ibx"})!
      let idkPrivateKey = Data(base64Encoded: idkRecord.privateKey)
      let idk = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: idkPrivateKey!)
      let spkPrivateKey = Data(base64Encoded: spkRecord.privateKey)
      let spk = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: spkPrivateKey!)
      let ibxPrivateKey = Data(base64Encoded: ibxRecord.privateKey)
      let ibx = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: ibxPrivateKey!)
      var strings: [String] = [
        idk!.publicKey.rawRepresentation.base64EncodedString(),
        spk!.publicKey.rawRepresentation.base64EncodedString(),
        ibx!.publicKey.rawRepresentation.base64EncodedString()
      ]

      guard let response = try? JSONEncoder().encode(strings) else {
        reject("getPublicInboxKeys", "could not encode", nil)
        return
      }

      resolve(String(data: response, encoding:.utf8)!)
    } catch {
      reject("getPublicInboxKeys", "\(error)", nil)
    }
  }

  @objc(setMessageStatus:withFid:withStatus:withResolver:withRejecter:)
  func setMessageStatus(messageId: String, fid: NSNumber, status: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try self.encryptedStore?.setMessageStatus(messageId, fid: fid.int64Value, status: status)
      resolve(nil)
    } catch {
      reject("setMessageStatus", "error \(error)", nil)
    }
  }

  @objc(setConversationsRead:withResolver:withRejecter:)
  func setConversationsRead(info: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let result = try? JSONDecoder().decode([ConversationReadInfo].self, from: Data(info.utf8)) else {
        reject("setConversationsRead", "could not decode options (setConversationsRead)", nil)
        return
      }
      
      try self.encryptedStore?.setConversationsRead(result)
      resolve(nil)
    } catch {
      reject("setConversationsRead", "error \(error)", nil)
    }
  }

  @objc(wipeData:withRejecter:)
  func wipeData(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try self.encryptedStore?.wipeData()
      resolve(nil)
    } catch {
      reject("wipeData", "error \(error)", nil)
    }
  }

  @objc(name:withRejecter:)
  func name(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    resolve(self.name)
  }

  @objc(register:withChallenge:withDisplayName:withUserId:withResolver:withRejecter:)
  func register(_ identifier: String, challenge: String, displayName: String, userId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let challengeData: Data = Data(base64Encoded: challenge) else {
      reject(PassKeyError.invalidChallenge.rawValue, PassKeyError.invalidChallenge.rawValue, nil);
      return;
    }
    let userIdData: Data = RCTConvert.nsData(userId);
    
    if #available(iOS 17.0, *) {
      let keyProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: identifier);
      let authRequest = keyProvider.createCredentialRegistrationRequest(challenge: challengeData, name: displayName, userID: userIdData)
      let authController = ASAuthorizationController(authorizationRequests: [authRequest]);
      self.passKeyDelegate = PasskeyDelegate { error, result in
        if (error != nil) {
          let passkeyError = self.mapErrorCode(error: error!);
          reject(passkeyError.rawValue, passkeyError.rawValue, nil);
          return;
        }
        
        if let registrationResult = result?.registrationResult {
          let authResponse: NSDictionary = [
            "rawAttestationObject": registrationResult.rawAttestationObject.base64EncodedString(),
            "rawClientDataJSON": registrationResult.rawClientDataJSON.base64EncodedString()
          ];
          
          let authResult: NSDictionary = [
            "credentialID": registrationResult.credentialID.base64EncodedString(),
            "response": authResponse
          ]
          resolve(authResult);
        } else {
          reject(PassKeyError.requestFailed.rawValue, PassKeyError.requestFailed.rawValue, nil);
        }
      }
      
      if let passKeyDelegate = self.passKeyDelegate {
        passKeyDelegate.performAuthForController(controller: authController);
      }
    } else {
      reject(PassKeyError.notSupported.rawValue, PassKeyError.notSupported.rawValue, nil);
    }
  }

  @objc(getStoredPasskeys:withRejecter:)
  func getStoredPasskeys(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let storedPasskeys: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.passkeys", name: "info", iCloudEnabled: true)

    if storedPasskeys == nil {
      resolve("[]")
      return
    }

    guard let rawJson = String(data: storedPasskeys!.rawRepresentation, encoding: .utf8) else {
      reject("getStoredPasskeys", "could not decode stored passkeys (getStoredPasskeys)", nil)
      return
    }
    resolve(rawJson)
  }

  @objc(updateStoredPasskeys:withPasskey:withResolver:withRejecter:)
  func updateStoredPasskeys(_ credentialId: String, passkey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let storedPasskeys: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.passkeys", name: "info", iCloudEnabled: true)

    var storedPasskeysRawJson = storedPasskeys?.rawRepresentation
    if storedPasskeysRawJson == nil {
      storedPasskeysRawJson = Data("[]".utf8)
    }

    guard var storedPasskeysCollection = try? JSONDecoder().decode([StoredPasskey].self, from: storedPasskeysRawJson!) else {
      reject("updateStoredPasskeys", "could not decode stored passkeys (updateStoredPasskeys)", nil)
      return
    }

    guard var updatedPasskey = try? JSONDecoder().decode(StoredPasskey.self, from: Data(passkey.utf8)) else {
      reject("updateStoredPasskeys", "could not decode updated passkey (updateStoredPasskeys)", nil)
      return
    }

    var found = false
    var newPasskeys: [StoredPasskey] = []
    for existingPasskey in storedPasskeysCollection {
      if existingPasskey.credentialId == credentialId {
        newPasskeys.append(StoredPasskey(
          credentialId: updatedPasskey.credentialId,
          address: updatedPasskey.address,
          fid: updatedPasskey.fid,
          pfpUrl: updatedPasskey.pfpUrl,
          username: updatedPasskey.username,
          displayName: updatedPasskey.displayName,
          domain: updatedPasskey.domain
        ))
        found = true
      } else {
        newPasskeys.append(existingPasskey)
      }
    }

    if !found {
      newPasskeys.append(updatedPasskey)
    }

    storedPasskeysRawJson = try? JSONEncoder().encode(newPasskeys)

    if storedPasskeysRawJson == nil {
      reject("updateStoredPasskeys", "could not encode updated passkeys (updateStoredPasskeys)", nil)
      return
    }

    do {
      try store.store(SymmetricKey(data: storedPasskeysRawJson!), account: "\(self.storePrefix)farcaster.passkeys", name: "info", iCloudEnabled: true)
    } catch {
      reject("updateStoredPasskeys", "could not store updated passkeys \(error)", nil)
      return
    }

    resolve("true")
  }

  @objc(deleteStoredPasskey:withResolver:withRejecter:)
  func deleteStoredPasskey(_ credentialId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let storedPasskeys: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.passkeys", name: "info", iCloudEnabled: true)

    var storedPasskeysRawJson = storedPasskeys?.rawRepresentation
    if storedPasskeysRawJson == nil {
      storedPasskeysRawJson = Data("[]".utf8)
    }

    guard var storedPasskeysCollection = try? JSONDecoder().decode([StoredPasskey].self, from: storedPasskeysRawJson!) else {
      reject("deleteStoredPasskey", "could not decode stored passkeys (updateStoredPasskeys)", nil)
      return
    }

    var newPasskeys: [StoredPasskey] = []
    for existingPasskey in storedPasskeysCollection {
      if existingPasskey.credentialId != credentialId {
        newPasskeys.append(existingPasskey)
      }
    }

    storedPasskeysRawJson = try? JSONEncoder().encode(newPasskeys)

    if storedPasskeysRawJson == nil {
      reject("deleteStoredPasskey", "could not encode updated passkeys (updateStoredPasskeys)", nil)
      return
    }

    do {
      try store.store(SymmetricKey(data: storedPasskeysRawJson!), account: "\(self.storePrefix)farcaster.passkeys", name: "info", iCloudEnabled: true)
    } catch {
      reject("deleteStoredPasskey", "could not store updated passkeys \(error)", nil)
      return
    }

    resolve("true")
  }

  @objc(addMnemonicToCredential:withChallenge:withCredentialId:withMnemonic:withResolver:withRejecter:)
  func addMnemonicToCredential(_ identifier: String, challenge: String, credentialId: String, mnemonic: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let mnemonicData = Data(mnemonic.utf8)
    do {
      try store.store(
        SymmetricKey(data: mnemonicData),
        account: "\(self.storePrefix)passkey.mnemonic.\(credentialId)",
        name: "mnemonic",
        iCloudEnabled: true
      )
      resolve("true")
    } catch {
      reject("StoreMnemonicFailed", "Failed to store mnemonic: \(error)", nil)
    }
  }
  
  @objc(authenticate:withChallenge:withCredentialId:withResolver:withRejecter:)
  func authenticate(_ identifier: String, challenge: String, credentialId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let challengeData: Data = Data(base64Encoded: challenge) else {
      reject(PassKeyError.invalidChallenge.rawValue, PassKeyError.invalidChallenge.rawValue, nil)
      return
    }

    if #available(iOS 17.0, *) {
      let isDiscovery = credentialId.isEmpty

      // For non-discovery: check iCloud Keychain before assertion (we know the credentialId)
      // For discovery: we don't know the credentialId yet, so defer Keychain lookup to after assertion
      let preAuthKeychainMnemonic: SymmetricKey? = isDiscovery ? nil : (try? store.get(
        account: "\(self.storePrefix)passkey.mnemonic.\(credentialId)",
        name: "mnemonic",
        iCloudEnabled: true
      ))

      let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: identifier)
      let authRequest = platformProvider.createCredentialAssertionRequest(challenge: challengeData)

      // Only request largeBlob for non-discovery mode when Keychain missed.
      // In discovery mode, requesting largeBlob can break the assertion UI on iOS 26.
      if !isDiscovery && preAuthKeychainMnemonic == nil {
        authRequest.largeBlob = ASAuthorizationPublicKeyCredentialLargeBlobAssertionInput.read
      }

      if !isDiscovery, let credentialData = Data(base64Encoded: credentialId) {
        authRequest.allowedCredentials = [ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: credentialData)]
      }
      let authController = ASAuthorizationController(authorizationRequests: [authRequest])

      self.passKeyDelegate = PasskeyDelegate { error, result in
        if let error = error {
          let passkeyError = self.mapErrorCode(error: error)
          reject(passkeyError.rawValue, passkeyError.rawValue, nil)
          return
        }
        guard let assertionResult = result?.assertionResult else {
          reject(PassKeyError.requestFailed.rawValue, PassKeyError.requestFailed.rawValue, nil)
          return
        }

        let authResponse: NSDictionary = [
          "rawAuthenticatorData": assertionResult.rawAuthenticatorData.base64EncodedString(),
          "rawClientDataJSON": assertionResult.rawClientDataJSON.base64EncodedString(),
          "signature": assertionResult.signature.base64EncodedString(),
        ]

        // Resolve the mnemonic: use pre-auth Keychain result if available,
        // otherwise look up Keychain now using the credentialId from the assertion
        let returnedCredentialId = assertionResult.credentialID.base64EncodedString()
        let keychainMnemonic: SymmetricKey? = preAuthKeychainMnemonic ?? (try? self.store.get(
          account: "\(self.storePrefix)passkey.mnemonic.\(returnedCredentialId)",
          name: "mnemonic",
          iCloudEnabled: true
        ))

        if let existingMnemonic = keychainMnemonic {
          // iCloud Keychain hit — return mnemonic directly
          let mnemonic = String(data: existingMnemonic.rawRepresentation, encoding: .utf8) ?? ""
          let authResult: NSDictionary = [
            "credentialID": returnedCredentialId,
            "userID": String(decoding: assertionResult.userID, as: UTF8.self),
            "response": authResponse,
            "largeBlob": mnemonic,
          ]
          resolve(authResult)
        } else if let largeBlobData = assertionResult.largeBlob {
          // Legacy largeBlob read succeeded — migrate to iCloud Keychain for future logins
          let migrateCredentialId = isDiscovery ? returnedCredentialId : credentialId
          try? self.store.store(
            SymmetricKey(data: largeBlobData),
            account: "\(self.storePrefix)passkey.mnemonic.\(migrateCredentialId)",
            name: "mnemonic",
            iCloudEnabled: true
          )
          let authResult: NSDictionary = [
            "credentialID": returnedCredentialId,
            "userID": String(decoding: assertionResult.userID, as: UTF8.self),
            "response": authResponse,
            "largeBlob": String(decoding: largeBlobData, as: UTF8.self),
          ]
          resolve(authResult)
        } else {
          // Neither Keychain nor largeBlob has the mnemonic — user must re-register
          reject(PassKeyError.largeBlobMissing.rawValue, PassKeyError.largeBlobMissing.rawValue, nil)
        }
      }

      if let passKeyDelegate = self.passKeyDelegate {
        passKeyDelegate.performAuthForController(controller: authController)
      }
    } else {
      reject(PassKeyError.notSupported.rawValue, PassKeyError.notSupported.rawValue, nil)
    }
  }
  
  func mapErrorCode(error: Error) -> PassKeyError {
    let errorCode = (error as NSError).code;
    switch errorCode {
      case 1001:
        return PassKeyError.cancelled;
      case 1004:
        return PassKeyError.requestFailed;
      case 4004:
        return PassKeyError.notConfigured;
      default:
        return PassKeyError.unknown;
    }
  }

  @objc(getSignedPreKey:withResolver:withRejecter:)
  func getSignedPreKey(base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let preKey: Curve25519.KeyAgreement.PrivateKey? = try? store.get(account: "\(self.storePrefix)farcaster.pre", name: base64PublicKey)

    if preKey == nil {
      reject("signedPreKeyId", "could not get (signedPreKeyId)", nil)
      return
    }

    let base64PublicKey = preKey!.publicKey.rawRepresentation.base64EncodedString()
    let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

    guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
      reject("getSignedPreKey", "could not encode (getSignedPreKey)", nil)
      return
    }

    resolve(String(data: result, encoding: .utf8)!)
  }

  // Note: This function is a kludge to get us over the device-creates-two-IDKs issue:
  func getIdentityWithFailover<T: KeyStoreConvertible>(_ base64PublicKey: String) -> T? {
    var identityKey: T? = try? store.get(account: "\(self.storePrefix)farcaster.identity", name: base64PublicKey)

    if identityKey == nil {
      identityKey = try? store.get(account: "\(self.storePrefix)farcaster.identity", name: "identity")
    }

    return identityKey
  }

  @objc(getIdentityKey:withResolver:withRejecter:)
  func getIdentityKey(base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let identityKey: Curve25519.KeyAgreement.PrivateKey? = try? getIdentityWithFailover(base64PublicKey)

    if identityKey == nil {
      reject("identitykeyId", "could not get (identitykeyId)", nil)
      return
    }

    let base64PublicKey = identityKey!.publicKey.rawRepresentation.base64EncodedString()
    let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

    guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
      reject("getIdentityKey", "could not encode (getIdentityKey)", nil)
      return
    }

    resolve(String(data: result, encoding: .utf8)!)
  }

  @objc(getEphemeralKey:withResolver:withRejecter:)
  func getEphemeralKey(base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let ephemeralKey: Curve25519.KeyAgreement.PrivateKey? = try? store.get(account: "\(self.storePrefix)farcaster.ephemeral", name: base64PublicKey)

    if ephemeralKey == nil {
      reject("ephemeralKeyId", "could not get (ephemeralKeyId)", nil)
      return
    }

    let base64PublicKey = ephemeralKey!.publicKey.rawRepresentation.base64EncodedString()
    let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

    guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
      reject("getEphemeralKey", "could not encode (getEphemeralKey)", nil)
      return
    }

    resolve(String(data: result, encoding: .utf8)!)
  }

  @objc(getSymmetricKey:withResolver:withRejecter:)
  func getSymmetricKey(id: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let symKey: SymmetricKey = try store.get(account: "\(self.storePrefix)farcaster.symmetric", name: id) else {
        reject("getSymmetricKey", "could not get (getSymmetricKey)", nil)
        return
      }

      let serializableSymKey = FarcasterSymmetricKey(id: id)
      guard let result = try? JSONEncoder().encode(serializableSymKey) else {
        reject("getSymmetricKey", "could not encode (getSymmetricKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("getSymmetricKey", "could not get (getSymmetricKey)", nil)
      return
    }
  }

  @objc(createIdentityKey:withRejecter:)
  func createIdentityKey(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let clientPrivateKey = Curve25519.KeyAgreement.PrivateKey()
    let base64PublicKey = clientPrivateKey.publicKey.rawRepresentation.base64EncodedString()

    do {
      try store.store(clientPrivateKey, account: "\(self.storePrefix)farcaster.identity", name: base64PublicKey)
    } catch {
      reject("createIdentityKey", "could not store (createIdentityKey)", nil)
      return
    }

    let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

    guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
      reject("createIdentityKey", "could not encode (createIdentityKey)", nil)
      return
    }

    resolve(String(data: result, encoding: .utf8)!)
  }

  @objc(createSignedPreKey:withResolver:withRejecter:)
  func createSignedPreKey(identityBase64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let clientPrivateKey = Curve25519.KeyAgreement.PrivateKey()
    let base64PublicKey = clientPrivateKey.publicKey.rawRepresentation.base64EncodedString()
    var signature: Data

    do {
      let identityKey: Curve25519.KeyAgreement.PrivateKey? = try? getIdentityWithFailover(identityBase64PublicKey)

      if identityKey == nil {
        reject("identitykeyId", "could not get (identitykeyId)", nil)
        return
      }

      let identitySigningKey = try Curve25519.Signing.PrivateKey(rawRepresentation: identityKey!.rawRepresentation)
      signature = try identitySigningKey.signature(for: clientPrivateKey.publicKey.rawRepresentation)

      try store.store(clientPrivateKey, account: "\(self.storePrefix)farcaster.pre", name: base64PublicKey)
    } catch {
      reject("createSignedPreKey", "could not store (createSignedPreKey)", nil)
      return
    }

    let base64Signature = signature.base64EncodedString()
    let publicKeySerializable = FarcasterSignedPublicKey(base64PublicKey: base64PublicKey, base64Signature: base64Signature)

    guard let result = try? JSONEncoder().encode(publicKeySerializable) else {
      reject("createSignedPreKey", "could not encode (createSignedPreKey)", nil)
      return
    }

    resolve(String(data: result, encoding: .utf8)!)
  }

  @objc(createEphemeralKey:withRejecter:)
  func createEphemeralKey(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    let clientPrivateKey = Curve25519.KeyAgreement.PrivateKey()
    let base64PublicKey = clientPrivateKey.publicKey.rawRepresentation.base64EncodedString()

    do {
      try store.store(clientPrivateKey, account: "\(self.storePrefix)farcaster.ephemeral", name: base64PublicKey)
    } catch {
      reject("createEphemeralKey", "could not store (createEphemeralKey)", nil)
      return
    }

    let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

    guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
      reject("createEphemeralKey", "could not encode (createEphemeralKey)", nil)
      return
    }

    resolve(String(data: result, encoding: .utf8)!)
  }

  @objc(deleteSignedPreKey:withResolver:withRejecter:)
  func deleteSignedPreKey(base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try store.delete(account: "\(self.storePrefix)farcaster.pre", name: base64PublicKey)
      resolve(true)
    } catch {
      reject("deleteSignedPreKey", "could not delete (deleteSignedPreKey)", nil)
    }
  }

  @objc(deleteEphemeralKey:withResolver:withRejecter:)
  func deleteEphemeralKey(base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try store.delete(account: "\(self.storePrefix)farcaster.ephemeral", name: base64PublicKey)
      resolve(true)
    } catch {
      reject("deleteSignedPreKey", "could not delete (deleteSignedPreKey)", nil)
    }
  }

  @objc(deleteSymmetricKey:withResolver:withRejecter:)
  func deleteSymmetricKey(id: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      try store.delete(account: "\(self.storePrefix)farcaster.symmetric", name: id)
      resolve(true)
    } catch {
      reject("deleteSignedPreKey", "could not delete (deleteSignedPreKey)", nil)
    }
  }

  @objc(parsePublicKey:withResolver:withRejecter:)
  func parsePublicKey(base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    // We could add validation here, but it'll surface immediately in calls that use it,
    // like key agreement where points not on curve fail.
    let publicKey = FarcasterPublicKey(base64PublicKey: base64PublicKey)
    guard let result = try? JSONEncoder().encode(publicKey) else {
      reject("parsePublicKey", "could not encode (parsePublicKey)", nil)
      return
    }

    resolve(String(data: result, encoding: .utf8)!)
  }

  @objc(deriveKey:withResolver:withRejecter:)
  func deriveKey(options: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let result = try? JSONDecoder().decode(DeriveKeyOptions.self, from: Data(options.utf8)) else {
        reject("deriveKey", "could not decode options (deriveKey)", nil)
        return
      }

      let derivationMode = result.derivationMode
      let base64Salt = result.base64Salt
      let saltKeyId = result.saltKeyId
      let base64Prefix = result.base64Prefix
      let inputKeyId = result.inputKeyIds
      let info = result.info
      let outputLength = result.outputLength
      let outputKeyLengths = result.outputKeyLengths

      var key = Data()

      if (base64Prefix != nil) {
        key.append(Data(base64Encoded: base64Prefix!)!)
      }

      for keyId in inputKeyId {
        let symKey: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: keyId)
        
        if symKey == nil {
          reject("deriveKey", "could not get input symkey", nil)
          return
        }

        key.append(symKey!.rawRepresentation)
      }

      var salt = Data()
      if (saltKeyId != nil) {
        let symKey: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: saltKeyId!)

        if symKey == nil {
          reject("deriveKey", "could not get salt symkey", nil)
          return
        }

        salt.append(symKey!.rawRepresentation)
      }

      if (base64Salt != nil) {
        salt.append(Data(base64Encoded: base64Salt!)!)
      }

      var results: [FarcasterSymmetricKey] = []

      switch derivationMode {
      case "hmacsha256":
        let hmac = try! HMAC(key: Array(key), variant: .sha2(.sha256)).authenticate(Array(salt))
        let derivedKey = Data(hmac)
        let id = UUID().uuidString
        let newKey = try? SymmetricKey(rawRepresentation: derivedKey)
        try store.store(newKey!, account: "\(self.storePrefix)farcaster.symmetric", name: id)
        let serializableSymKey = FarcasterSymmetricKey(id: id)
        results.append(serializableSymKey)
        break
      case "hkdfsha256":
        var infoData = Data()

        if (info != nil) {
          infoData.append(info!.data(using: .utf8)!)
        }

        let derived = try HKDF(password: Array(key), salt: Array(salt), info: Array(infoData), keyLength: outputLength, variant: HMAC.Variant.sha2(.sha256)).calculate()
        let derivedKey = Data(derived)

        if (outputKeyLengths != nil && outputKeyLengths! < outputLength) {
          results = try! stride(from: 0, to: outputLength, by: outputKeyLengths!).map {
            let id = UUID().uuidString
            let newKey = try? SymmetricKey(rawRepresentation: derivedKey.subdata(in: $0 ..< Swift.min($0 + outputKeyLengths!, outputLength)))
            try store.store(newKey!, account: "\(self.storePrefix)farcaster.symmetric", name: id)
            let serializableSymKey = FarcasterSymmetricKey(id: id)
            return serializableSymKey
          }
        } else {
          let id = UUID().uuidString
          let newKey = try? SymmetricKey(rawRepresentation: derivedKey)
          try store.store(newKey!, account: "\(self.storePrefix)farcaster.symmetric", name: id)
          let serializableSymKey = FarcasterSymmetricKey(id: id)
          results.append(serializableSymKey)
        }
        break
      default:
        reject("deriveKey", "invalid option (deriveKey)", nil)
        return
      }

      guard let result = try? JSONEncoder().encode(results) else {
        reject("deriveKey", "could not encode (deriveKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("deriveKey", "failure encountered (deriveKey)", nil)
    }
  }

  @objc(agreeWithEphemeralKey:withBase64PublicKey:withResolver:withRejecter:)
  func agreeWithEphemeralKey(base64EphemeralPublicKey: String, base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let ephemeralKey: Curve25519.KeyAgreement.PrivateKey? = try? store.get(account: "\(self.storePrefix)farcaster.ephemeral", name: base64EphemeralPublicKey)
      if ephemeralKey == nil {
        reject("agreeWithEphemeralKey", "could not get ephemeral key (agreeWithEphemeralKey)", nil)
        return
      }

      let otherKeyData = Data(base64Encoded: base64PublicKey)
      if otherKeyData == nil {
        reject("agreeWithEphemeralKey", "other key data invalid (agreeWithEphemeralKey)", nil)
        return
      }

      let otherKey = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: otherKeyData!)
      if otherKey == nil {
        reject("agreeWithEphemeralKey", "other key data invalid (agreeWithEphemeralKey)", nil)
        return
      }

      let sharedSecret = try! ephemeralKey!.sharedSecretFromKeyAgreement(with: otherKey!)
      let symKey = try! SymmetricKey(rawRepresentation: SHA256.hash(data: sharedSecret.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })
      let id = UUID().uuidString

      try store.store(symKey, account: "\(self.storePrefix)farcaster.symmetric", name: id)
      let serializableSymKey = FarcasterSymmetricKey(id: id)

      guard let result = try? JSONEncoder().encode(serializableSymKey) else {
        reject("agreeWithEphemeralKey", "could not encode (agreeWithEphemeralKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("agreeWithEphemeralKey", "could not agree (agreeWithEphemeralKey)", nil)
      return
    }
  }

  @objc(agreeWithSignedPreKey:withBase64PublicKey:withResolver:withRejecter:)
  func agreeWithSignedPreKey(base64SignedPrePublicKey: String, base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let preKey: Curve25519.KeyAgreement.PrivateKey? = try? store.get(account: "\(self.storePrefix)farcaster.pre", name: base64SignedPrePublicKey)

      if preKey == nil {
        reject("base64SignedPrePublicKey", "could not get (base64SignedPrePublicKey)", nil)
        return
      }

      let sharedSecret = try! preKey!.sharedSecretFromKeyAgreement(with: Curve25519.KeyAgreement.PublicKey(rawRepresentation: Data(base64Encoded: base64PublicKey)!))
      let symKey = try! SymmetricKey(rawRepresentation: SHA256.hash(data: sharedSecret.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })
      let id = UUID().uuidString

      try store.store(symKey, account: "\(self.storePrefix)farcaster.symmetric", name: id)
      let serializableSymKey = FarcasterSymmetricKey(id: id)

      guard let result = try? JSONEncoder().encode(serializableSymKey) else {
        reject("agreeWithEphemeralKey", "could not encode (agreeWithEphemeralKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("agreeWithSignedPreKey", "could not agree (agreeWithSignedPreKey)", nil)
      return
    }
  }

  @objc(agreeWithIdentityKey:withBase64PublicKey:withResolver:withRejecter:)
  func agreeWithIdentityKey(base64IdentityPublicKey: String, base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let identityKey: Curve25519.KeyAgreement.PrivateKey? = try? getIdentityWithFailover(base64IdentityPublicKey)

      if identityKey == nil {
        reject("agreeWithIdentityKey", "could not get (base64IdentityPublicKey)", nil)
        return
      }

      let sharedSecret = try! identityKey!.sharedSecretFromKeyAgreement(with: Curve25519.KeyAgreement.PublicKey(rawRepresentation: Data(base64Encoded: base64PublicKey)!))
      let symKey = try! SymmetricKey(rawRepresentation: SHA256.hash(data: sharedSecret.withUnsafeBytes { Data($0) }).withUnsafeBytes { Data($0) })
      let id = UUID().uuidString

      try store.store(symKey, account: "\(self.storePrefix)farcaster.symmetric", name: id)
      let serializableSymKey = FarcasterSymmetricKey(id: id)

      guard let result = try? JSONEncoder().encode(serializableSymKey) else {
        reject("agreeWithIdentityKey", "could not encode (agreeWithIdentityKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("agreeWithIdentityKey", "could not agree (agreeWithIdentityKey)", nil)
      return
    }
  }

  @objc(decrypt:withBase64IV:withBase64Ciphertext:withBase64AssociatedData:withResolver:withRejecter:)
  func decrypt(id: String, base64IV: String, base64Ciphertext: String, base64AssociatedData: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let decryptedData = try self.decryptInternal(id: id, base64IV: base64IV, base64Ciphertext: base64Ciphertext, base64AssociatedData: base64AssociatedData)

      if (decryptedData == nil) {
        reject("decrypt", "thrown could not decrypt", nil)
        return
      }

      resolve(decryptedData!.base64EncodedString())
    } catch {
      reject("decrypt", "thrown could not decrypt", nil)
      return
    }
  }

  func decryptInternal(id: String, base64IV: String, base64Ciphertext: String, base64AssociatedData: String) throws -> Data? {
    let symKey: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: id)
    if (symKey == nil) {
      return nil
    }

    let ciphertextData = Data(base64Encoded: base64Ciphertext)
    let ciphertext = ciphertextData!.subdata(in: 0..<ciphertextData!.count-16)
    let nonce = Data(base64Encoded: base64IV)
    let tag = ciphertextData!.subdata(in: ciphertextData!.count-16..<ciphertextData!.count)
    var associatedData = Data()
    if (base64AssociatedData.count > 0) {
      associatedData = Data(base64Encoded: base64AssociatedData) ?? associatedData
    }

    let decGCM = GCM(iv: Array(nonce!), authenticationTag: Array(tag), additionalAuthenticatedData: Array(associatedData), mode: .detached)
    guard let aes = try? AES(key: Array(symKey!.rawRepresentation), blockMode: decGCM, padding: .noPadding) else {
      return nil
    }

    // Swift AES implementation thinks no ciphertext is an error. Why? God only knows.
    if (ciphertext.count > 0) {
      guard let decrypted = try? aes.decrypt(Array(ciphertext)) else {
        return nil
      }

      let decryptedData = Data(decrypted)
      return decryptedData
    } else {
      return Data.init()
    }
  }

  @objc(encrypt:withBase64Plaintext:withAeadPrefixId:withBase64AssociatedData:withResolver:withRejecter:)
  func encrypt(id: String, base64Plaintext: String, aeadPrefixId: String?, base64AssociatedData: String?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let symKey: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: id)
      var aeadPayload = Data()

      if (aeadPrefixId != nil) {
        let aeadPrefix: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: aeadPrefixId!)
        aeadPayload.append(aeadPrefix!.rawRepresentation)
      }

      if (base64AssociatedData != nil) {
        aeadPayload.append(Data(base64Encoded: base64AssociatedData!)!)
      }

      let iv = AES.randomIV(AES.blockSize)
      let gcm = GCM(iv: iv, additionalAuthenticatedData: Array(aeadPayload), mode: .detached)
      guard let aes = try? AES(key: Array(symKey!.rawRepresentation), blockMode: gcm, padding: .noPadding) else {
        reject("encrypt", "could not encrypt", nil)
        return
      }

      guard let encrypted = try? aes.encrypt(Array(Data(base64Encoded: base64Plaintext)!)) else {
        reject("encrypt", "could not encrypt", nil)
        return
      }

      var encryptedPayload = Data(encrypted)
      encryptedPayload.append(Data(gcm.authenticationTag!))

      let ciphertext = FarcasterCiphertext(
        base64IV: Data(iv).base64EncodedString(),
        base64Ciphertext: Data(encryptedPayload).base64EncodedString(),
        base64AssociatedData: aeadPayload.base64EncodedString())
      guard let result = try? JSONEncoder().encode(ciphertext) else {
        reject("encrypt", "could not encode", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("encrypt", "could not encrypt", nil)
    }
  }

  @objc(compareKey:withOtherId:withResolver:withRejecter:)
  func compareKey(id: String, otherId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let symKey: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: id)
      let otherSymKey: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: otherId)

      let symValue = symKey?.rawRepresentation.base64EncodedString()
      let otherSymValue = otherSymKey?.rawRepresentation.base64EncodedString()

      // We should probably do a slow compare here.
      resolve(symValue == otherSymValue)
    } catch {
      reject("compareKey", "could not compare", nil)
    }
  }

  @objc(generateConfirmationValue:withResolver:withRejecter:)
  func generateConfirmationValue(id: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let symKey: SymmetricKey? = try? store.get(account: "\(self.storePrefix)farcaster.symmetric", name: id)
      let result = try! SHA256.hash(data: symKey!.rawRepresentation).map { String(format: "%02hhx", $0) }.joined().prefix(6)

      resolve(result)
    } catch {
      reject("generateConfirmationValue", "could not generate confirmation value", nil)
    }
  }

  @objc(wrapSymmetricKey:withOtherId:withResolver:withRejecter:)
  func wrapSymmetricKey(id: String, otherId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let symKey: SymmetricKey = try store.get(account: "\(self.storePrefix)farcaster.symmetric", name: otherId) else {
        reject("wrapSymmetricKey", "could not get key to wrap (wrapSymmetricKey)", nil)
        return
      }

      let symValue = symKey.rawRepresentation.base64EncodedString()
      self.encrypt(id: id, base64Plaintext: symValue, aeadPrefixId: nil, base64AssociatedData: nil, resolve: resolve, reject: reject)
    } catch {
      reject("wrapSymmetricKey", "could not wrap key", nil)
    }
  }

  @objc(wrapEphemeralKey:withBase64PublicKey:withResolver:withRejecter:)
  func wrapEphemeralKey(id: String, base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let ephemeralKey: Curve25519.KeyAgreement.PrivateKey = try store.get(account: "\(self.storePrefix)farcaster.ephemeral", name: base64PublicKey) else {
        reject("wrapEphemeralKey", "could not get ephemeral key (wrapEphemeralKey)", nil)
        return
      }
      
      let value = ephemeralKey.rawRepresentation.base64EncodedString()

      self.encrypt(id: id, base64Plaintext: value, aeadPrefixId: nil, base64AssociatedData: nil, resolve: resolve, reject: reject)
    } catch {
      reject("wrapEphemeralKey", "could not wrap key", nil)
    }
  }

  @objc(wrapSignedPreKey:withBase64PublicKey:withResolver:withRejecter:)
  func wrapSignedPreKey(id: String, base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let signedPreKey: Curve25519.KeyAgreement.PrivateKey = try store.get(account: "\(self.storePrefix)farcaster.pre", name: base64PublicKey) else {
        reject("wrapSignedPreKey", "could not get signed pre key (wrapSignedPreKey)", nil)
        return
      }
      
      let value = signedPreKey.rawRepresentation.base64EncodedString()

      self.encrypt(id: id, base64Plaintext: value, aeadPrefixId: nil, base64AssociatedData: nil, resolve: resolve, reject: reject)
    } catch {
      reject("wrapSignedPreKey", "could not wrap key", nil)
    }
  }

  @objc(wrapIdentityKey:withBase64PublicKey:withResolver:withRejecter:)
  func wrapIdentityKey(id: String, base64PublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let identityKey: Curve25519.KeyAgreement.PrivateKey? = getIdentityWithFailover(base64PublicKey)
      
      if identityKey == nil {
        reject("wrapIdentityKey", "could not get identity key (wrapIdentityKey)", nil)
        return
      }
      
      let value = identityKey!.rawRepresentation.base64EncodedString()

      self.encrypt(id: id, base64Plaintext: value, aeadPrefixId: nil, base64AssociatedData: nil, resolve: resolve, reject: reject)
    } catch {
      reject("wrapIdentityKey", "could not wrap key", nil)
    }
  }

  @objc(unwrapSymmetricKey:withCiphertext:withResolver:withRejecter:)
  func unwrapSymmetricKey(id: String, ciphertext: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let result = try? JSONDecoder().decode(FarcasterCiphertext.self, from: Data(ciphertext.utf8)) else {
        reject("unwrapSymmetricKey", "could not decode ciphertext (unwrapSymmetricKey)", nil)
        return
      }

      let decrypted = try self.decryptInternal(id: id, base64IV: result.base64IV, base64Ciphertext: result.base64Ciphertext, base64AssociatedData: result.base64AssociatedData)
      if (decrypted == nil) {
        reject("unwrapSymmetricKey", "could not decrypt (unwrapSymmetricKey)", nil)
        return
      }

      let symKey = try! SymmetricKey(rawRepresentation: decrypted!)
      let id = UUID().uuidString

      try store.store(symKey, account: "\(self.storePrefix)farcaster.symmetric", name: id)
      let serializableSymKey = FarcasterSymmetricKey(id: id)

      guard let result = try? JSONEncoder().encode(serializableSymKey) else {
        reject("unwrapSymmetricKey", "could not encode (unwrapSymmetricKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("unwrapSymmetricKey", "could not unwrap key", nil)
    }
  }

  @objc(unwrapEphemeralKey:withCiphertext:withResolver:withRejecter:)
  func unwrapEphemeralKey(id: String, ciphertext: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let result = try? JSONDecoder().decode(FarcasterCiphertext.self, from: Data(ciphertext.utf8)) else {
        reject("unwrapEphemeralKey", "could not decode ciphertext (unwrapEphemeralKey)", nil)
        return
      }

      let decrypted = try self.decryptInternal(id: id, base64IV: result.base64IV, base64Ciphertext: result.base64Ciphertext, base64AssociatedData: result.base64AssociatedData)
      if (decrypted == nil) {
        reject("unwrapEphemeralKey", "could not decrypt (unwrapEphemeralKey)", nil)
        return
      }

      let ephemeralKey = try! Curve25519.KeyAgreement.PrivateKey(rawRepresentation: decrypted!)
      if (ephemeralKey == nil) {
        reject("unwrapEphemeralKey", "could not deserialize key (unwrapEphemeralKey)", nil)
        return
      }

      let base64PublicKey = ephemeralKey.publicKey.rawRepresentation.base64EncodedString()
      let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

      try store.store(ephemeralKey, account: "\(self.storePrefix)farcaster.ephemeral", name: base64PublicKey)

      guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
        reject("unwrapEphemeralKey", "could not encode (unwrapEphemeralKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("unwrapEphemeralKey", "could not unwrap key", nil)
    }
  }

  @objc(unwrapSignedPreKey:withCiphertext:withResolver:withRejecter:)
  func unwrapSignedPreKey(id: String, ciphertext: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let result = try? JSONDecoder().decode(FarcasterCiphertext.self, from: Data(ciphertext.utf8)) else {
        reject("unwrapSignedPreKey", "could not decode ciphertext (unwrapSignedPreKey)", nil)
        return
      }

      let decrypted = try self.decryptInternal(id: id, base64IV: result.base64IV, base64Ciphertext: result.base64Ciphertext, base64AssociatedData: result.base64AssociatedData)
      if (decrypted == nil) {
        reject("unwrapSignedPreKey", "could not decrypt (unwrapSignedPreKey)", nil)
        return
      }

      let preKey = try! Curve25519.KeyAgreement.PrivateKey(rawRepresentation: decrypted!)
      if (preKey == nil) {
        reject("unwrapSignedPreKey", "could not deserialize key (unwrapSignedPreKey)", nil)
        return
      }

      let base64PublicKey = preKey.publicKey.rawRepresentation.base64EncodedString()
      let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

      try store.store(preKey, account: "\(self.storePrefix)farcaster.pre", name: base64PublicKey)

      guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
        reject("unwrapSignedPreKey", "could not encode (unwrapSignedPreKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("unwrapSignedPreKey", "could not unwrap key", nil)
    }
  }

  @objc(unwrapIdentityKey:withCiphertext:withResolver:withRejecter:)
  func unwrapIdentityKey(id: String, ciphertext: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      guard let result = try? JSONDecoder().decode(FarcasterCiphertext.self, from: Data(ciphertext.utf8)) else {
        reject("unwrapIdentityKey", "could not decode ciphertext (unwrapIdentityKey)", nil)
        return
      }

      let decrypted = try self.decryptInternal(id: id, base64IV: result.base64IV, base64Ciphertext: result.base64Ciphertext, base64AssociatedData: result.base64AssociatedData)
      if (decrypted == nil) {
        reject("unwrapIdentityKey", "could not decrypt (unwrapIdentityKey)", nil)
        return
      }

      let identityKey = try! Curve25519.KeyAgreement.PrivateKey(rawRepresentation: decrypted!)
      if (identityKey == nil) {
        reject("unwrapIdentityKey", "could not deserialize key (unwrapIdentityKey)", nil)
        return
      }

      let base64PublicKey = identityKey.publicKey.rawRepresentation.base64EncodedString()
      let privateKeySerializable = FarcasterPrivateKey(base64PublicKey: base64PublicKey)

      try store.store(identityKey, account: "\(self.storePrefix)farcaster.identity", name: base64PublicKey)

      guard let result = try? JSONEncoder().encode(privateKeySerializable) else {
        reject("unwrapIdentityKey", "could not encode (unwrapIdentityKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("unwrapIdentityKey", "could not unwrap key", nil)
    }
  }

  @objc(verifySignature:withMessage:withSignature:withResolver:withRejecter:)
  func verifySignature(base64PublicKey: String, message: String, base64Signature: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: Data(base64Encoded: base64PublicKey)!)
      let signature = Data(base64Encoded: base64Signature)
      let messageData = message.data(using: .utf8)

      if (signature == nil) {
        reject("verifySignature", "could not get encoded signature", nil)
        return
      }

      if (messageData == nil) {
        reject("verifySignature", "could not get encoded message", nil)
        return
      }

      let valid = publicKey.isValidSignature(signature!, for: messageData!)
      resolve(valid)
    } catch {
      reject("verifySignature", "could not verify signature", nil)
    }
  }

  @objc(verifyPublicKey:withSignature:withSigningPublicKey:withResolver:withRejecter:)
  func verifyPublicKey(base64PubKey: String, base64Signature: String, base64SigningPublicKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: Data(base64Encoded: base64SigningPublicKey)!)
      let signature = Data(base64Encoded: base64Signature)
      let messageData = Data(base64Encoded: base64PubKey)

      if (signature == nil) {
        reject("verifyPublicKey", "could not get encoded signature", nil)
        return
      }

      if (messageData == nil) {
        reject("verifyPublicKey", "could not get encoded public key", nil)
        return
      }

      let valid = publicKey.isValidSignature(signature!, for: messageData!)
      resolve(valid)
    } catch {
      resolve(false)
    }
  }

  @objc(signWithIdentityKey:withMessage:withResolver:withRejecter:)
  func signWithIdentityKey(base64PublicKey: String, message: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let identityKey: Curve25519.Signing.PrivateKey? = getIdentityWithFailover(base64PublicKey)

      if (identityKey == nil) {
        reject("signWithIdentityKey", "could not get (signWithIdentityKey)", nil)
        return
      }

      let messageData = message.data(using: .utf8)
      
      if (messageData == nil) {
        reject("signWithIdentityKey", "could not get encoded message", nil)
        return
      }
      
      let signature = try identityKey!.signature(for: messageData!).base64EncodedString()
      let publicKey = try identityKey!.publicKey.rawRepresentation.base64EncodedString()
      
      guard let result = try? JSONEncoder().encode(FarcasterSignature(
        base64PublicKey: publicKey,
        base64Signature: signature
      )) else {
        reject("signWithIdentityKey", "could not encode (signWithIdentityKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("signWithIdentityKey", "could not sign message", nil)
    }
  }

  @objc(signWithSignedPreKey:withMessage:withResolver:withRejecter:)
  func signWithSignedPreKey(base64PublicKey: String, message: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let signedPreKey: Curve25519.Signing.PrivateKey? = try? store.get(account: "\(self.storePrefix)farcaster.pre", name: base64PublicKey)

      if (signedPreKey == nil) {
        reject("signWithSignedPreKey", "could not get (signWithSignedPreKey)", nil)
        return
      }

      let messageData = message.data(using: .utf8)
      
      if (messageData == nil) {
        reject("signWithSignedPreKey", "could not get encoded message", nil)
        return
      }
      
      let signature = try signedPreKey!.signature(for: messageData!).base64EncodedString()
      let publicKey = try signedPreKey!.publicKey.rawRepresentation.base64EncodedString()
      
      guard let result = try? JSONEncoder().encode(FarcasterSignature(
        base64PublicKey: publicKey,
        base64Signature: signature
      )) else {
        reject("signWithSignedPreKey", "could not encode (signWithSignedPreKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("signWithSignedPreKey", "could not sign message", nil)
    }
  }

  @objc(signWithEphemeralKey:withMessage:withResolver:withRejecter:)
  func signWithEphemeralKey(base64PublicKey: String, message: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    do {
      let ephemeralKey: Curve25519.Signing.PrivateKey? = try? store.get(account: "\(self.storePrefix)farcaster.ephemeral", name: base64PublicKey)

      if (ephemeralKey == nil) {
        reject("signWithEphemeralKey", "could not get (signWithEphemeralKey)", nil)
        return
      }

      let messageData = message.data(using: .utf8)
      
      if (messageData == nil) {
        reject("signWithEphemeralKey", "could not get encoded message", nil)
        return
      }
      
      let signature = try ephemeralKey!.signature(for: messageData!).base64EncodedString()
      let publicKey = try ephemeralKey!.publicKey.rawRepresentation.base64EncodedString()
      
      guard let result = try? JSONEncoder().encode(FarcasterSignature(
        base64PublicKey: publicKey,
        base64Signature: signature
      )) else {
        reject("signWithEphemeralKey", "could not encode (signWithEphemeralKey)", nil)
        return
      }

      resolve(String(data: result, encoding: .utf8)!)
    } catch {
      reject("signWithEphemeralKey", "could not sign message", nil)
    }
  }
}


enum PassKeyError: String, Error {
  case notSupported = "NotSupported"
  case requestFailed = "RequestFailed"
  case cancelled = "UserCancelled"
  case invalidChallenge = "InvalidChallenge"
  case notConfigured = "NotConfigured"
  case unknown = "UnknownError"
  case largeBlobMissing = "LargeBlobMissing"
}

struct AuthRegistrationResult {
  var passkey: PassKeyRegistrationResult
  var type: PasskeyOperation
}

struct AuthAssertionResult {
  var passkey: PassKeyAssertionResult
  var type: PasskeyOperation
}

struct PassKeyResult {
  var registrationResult: PassKeyRegistrationResult?
  var assertionResult: PassKeyAssertionResult?
}

struct PassKeyRegistrationResult {
  var credentialID: Data
  var rawAttestationObject: Data
  var rawClientDataJSON: Data
}

struct PassKeyAssertionResult {
  var credentialID: Data
  var rawAuthenticatorData: Data
  var rawClientDataJSON: Data
  var signature: Data
  var userID: Data
  var largeBlob: Data?
  var registeredLargeBlob: Bool
}

enum PasskeyOperation {
  case Registration
  case Assertion
}
