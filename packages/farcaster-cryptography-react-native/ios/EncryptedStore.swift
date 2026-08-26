//
//  EncryptedStore.swift
//

import Foundation
import SQLite
import CryptoKit
import CryptoSwift

struct Conversation: Encodable {
  let conversationId: String
  var lastFetchedAt: Int64
  var lastReadTime: Int64
  var conversationName: String
  var retentionTime: Int64
  var participants: [ConversationParticipantInfo]
  var lastMessage: ConversationMessage?
  var unreadCount: Int
}

struct ConversationParticipantInfo: Codable {
  let conversationId: String
  let inboxId: String
  let fid: Int64
  let address: String
  var userInfo: String
  let joinedAt: Int64
  var identityKey: String
  var signedPreKey: String
}

struct ConversationParticipant: Encodable {
  let conversationId: String
  let inboxId: String
  let fid: Int64
  let address: String
  var userInfo: String
  let joinedAt: Int64
  var identityKey: String
  var signedPreKey: String
  var rootKey: String
  var currentReceivingChainLength: Int64
  var previousChainLength: Int64
  var currentSendingChainLength: Int64
  var sendingEphemeralKey: String
  var receivingEphemeralKey: String
  var sendingChainKey: String
  var receivingChainKey: String
  var skippedReceivingKeysMap: String
}

struct ConversationMessage: Encodable {
  let conversationId: String
  let messageId: String
  var address: String
  let senderFid: Int64
  let previousChainLength: Int64
  let messageNumber: Int64
  let timestamp: Int64
  let message: String
  let messageType: String
  let noNotify: Bool
}

struct Key: Encodable {
  let publicKey: String
  let privateKey: String
  let keyType: String
}

struct EncryptedStore {
  private var masterKey: SymmetricKey? = nil
  static let db_prefix = "Warpcast"
  static let db_store = "warpcast.sqlite3"
  
  private let conversations = Table("conversations")
  private let conversationId = SQLite.Expression<String>("conversationId")
  private let lastFetchedAt = SQLite.Expression<Int64>("lastFetchedAt")
  private let lastReadTime = SQLite.Expression<Int64>("lastReadTime")
  private let conversationName = SQLite.Expression<String>("conversationName")
  private let retentionTime = SQLite.Expression<Int64>("retentionTime")
  
  private let conversationParticipants = Table("conversationparticipants")
//  private let conversationId = SQLite.Expression<String>("conversationId")
  private let inboxId = SQLite.Expression<String>("inboxId")
  private let fid = SQLite.Expression<Int64>("fid")
  private let address = SQLite.Expression<String>("address")
  private let userInfo = SQLite.Expression<String>("userInfo")
  private let joinedAt = SQLite.Expression<Int64>("joinedAt")
  private let identityKey = SQLite.Expression<String>("identityKey")
  private let signedPreKey = SQLite.Expression<String>("signedPreKey")
  private let rootKey = SQLite.Expression<String>("rootKey")
  private let currentReceivingChainLength = SQLite.Expression<Int64>("currentReceivingChainLength")
  private let previousChainLength = SQLite.Expression<Int64>("previousChainLength")
  private let currentSendingChainLength = SQLite.Expression<Int64>("currentSendingChainLength")
  private let sendingEphemeralKey = SQLite.Expression<String>("sendingEphemeralKey")
  private let receivingEphemeralKey = SQLite.Expression<String>("receivingEphemeralKey")
  private let sendingChainKey = SQLite.Expression<String>("sendingChainKey")
  private let receivingChainKey = SQLite.Expression<String>("receivingChainKey")
  private let skippedReceivingKeysMap = SQLite.Expression<String>("skippedReceivingKeysMap")
  
  private let conversationMessages = Table("conversationmessages")
//  private let conversationId = SQLite.Expression<String>("conversationId")
  private let messageId = SQLite.Expression<String>("messageId")
  private let senderFid = SQLite.Expression<Int64>("senderFid")
// private let previousChainLength = SQLite.Expression<Int64>("previousChainLength")
  private let messageNumber = SQLite.Expression<Int64>("messageNumber")
  private let timestamp = SQLite.Expression<Int64>("timestamp")
  private let message = SQLite.Expression<String>("message")
  private let messageType = SQLite.Expression<String>("messageType")
  private let noNotify = SQLite.Expression<Bool>("noNotify")
  
  private let keys = Table("keys")
  private let publicKey = SQLite.Expression<String>("publicKey")
  private let privateKey = SQLite.Expression<String>("privateKey")
  private let keyType = SQLite.Expression<String>("keyType")
  
  private var db: Connection? = nil
  
  init(_ namespace: String) throws {
    guard let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
      throw KeychainKeyStoreError("cannot obtain file")
    }
    let dbPath = directory.appendingPathComponent(EncryptedStore.db_prefix + namespace + EncryptedStore.db_store).path
    if !FileManager.default.fileExists(atPath: dbPath) {
      guard let db = try? Connection(dbPath) else {
        throw KeychainKeyStoreError("could not connect to new db")
      }
      
      self.masterKey = SymmetricKey(size: SymmetricKeySize(bitCount: 256))
      do {
        try self.store(self.masterKey!, account: namespace, name: "masterkey")
      } catch {
        throw KeychainKeyStoreError("could not store key")
      }
      
      do {
        try constructSchema(db)
      } catch {
        throw KeychainKeyStoreError("could not construct schema")
      }
      
      self.db = db
    } else {
      guard let db = try? Connection(dbPath) else {
        throw KeychainKeyStoreError("could not connect to existing db")
      }
      self.masterKey = try? self.get(account: namespace, name: "masterkey")
      
      if self.masterKey == nil {
        self.masterKey = SymmetricKey(size: SymmetricKeySize(bitCount: 256))
        do {
          try self.store(self.masterKey!, account: namespace, name: "masterkey")
        } catch {
          throw KeychainKeyStoreError("could not store key")
        }
        do {
          try db.run(conversationMessages.drop(ifExists: true))
          try db.run(conversationParticipants.drop(ifExists: true))
          try db.run(conversations.drop(ifExists: true))
          try db.run(keys.drop(ifExists: true))
          try constructSchema(db)
        } catch {
          throw KeychainKeyStoreError("could not rebuild schema")
        }
      }
      
      self.db = db
    }
  }
  
  func constructSchema(_ db: Connection) throws {
    do {
      try db.run(conversations.create { table in
        table.column(conversationId, primaryKey: true)
        table.column(lastFetchedAt)
        table.column(lastReadTime)
        table.column(conversationName)
        table.column(retentionTime)
      })
      
      try db.run(conversations.createIndex(lastFetchedAt))
      
      try db.run(conversationParticipants.create { table in
        table.column(conversationId)
        table.column(inboxId)
        table.column(fid)
        table.column(address)
        table.column(userInfo)
        table.column(joinedAt)
        table.column(identityKey)
        table.column(signedPreKey)
        table.column(rootKey)
        table.column(currentReceivingChainLength)
        table.column(previousChainLength)
        table.column(currentSendingChainLength)
        table.column(sendingEphemeralKey)
        table.column(receivingEphemeralKey)
        table.column(sendingChainKey)
        table.column(receivingChainKey)
        table.column(skippedReceivingKeysMap)
        table.primaryKey(conversationId, inboxId)
      })
      
      try db.run(conversationParticipants.createIndex(inboxId))
      try db.run(conversationParticipants.createIndex(address))
      
      try db.run(conversationMessages.create { table in
        table.column(conversationId)
        table.column(messageId)
        table.column(senderFid)
        table.column(previousChainLength)
        table.column(messageNumber)
        table.column(timestamp)
        table.column(message)
        table.column(messageType)
        table.column(noNotify)
        table.primaryKey(conversationId, messageId, senderFid)
      })
      
      try db.run(conversationMessages.createIndex(conversationId, timestamp))
      
      try db.run(keys.create { table in
        table.column(publicKey, primaryKey: true)
        table.column(privateKey)
        table.column(keyType)
      })
    } catch {
      throw KeychainKeyStoreError("could not create schema")
    }
  }

  public func clearOldMessages() throws -> Void {
    do {
      let deleteMessages = conversationMessages.filter(timestamp < ((Int64(Date().timeIntervalSince1970) * 1000) - (28*24*60*60*1000))).delete()
      try db!.run(deleteMessages)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func deleteAllMessagesForConversation(targetConversationId: String) throws -> Void {
    do {
      let deleteMessages = conversationMessages.filter(conversationId == targetConversationId).delete()
      try db!.run(deleteMessages)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }

  public func getAllConversations() throws -> [Conversation] {
    do {
      let query = conversations.order(conversations[lastFetchedAt].desc)

      var conversationsDict: [String: Conversation] = [:]

      for row in try db!.prepare(query) {
        let conversationIdVal = row[conversationId]

        var conversation = Conversation(
          conversationId: conversationIdVal,
          lastFetchedAt: row[lastFetchedAt],
          lastReadTime: row[lastReadTime],
          conversationName: row[conversationName],
          retentionTime: row[retentionTime],
          participants: [],
          lastMessage: nil,
          unreadCount: 0
        )
        conversationsDict[conversationIdVal] = conversation
        for _ in try db!.prepare(conversationMessages.filter(conversationId == conversationIdVal).where(timestamp > row[lastReadTime])) {
          // for the life of me, I tried to make this a count statement, but
          // sqlite.swift is actually so broken that it couldn't map a perfect
          // string match in names, so i had to resort to this shit.
          conversationsDict[conversationIdVal]!.unreadCount += 1
        }
        for messageRow in try db!.prepare(conversationMessages.filter(conversationId == conversationIdVal).order(conversationMessages[timestamp].desc).limit(1)) {
          let message = ConversationMessage(
            conversationId: messageRow[conversationId],
            messageId: messageRow[messageId],
            address: "",
            senderFid: messageRow[senderFid],
            previousChainLength: messageRow[previousChainLength],
            messageNumber: messageRow[messageNumber],
            timestamp: messageRow[timestamp],
            message: try self.decrypt(messageRow[message]),
            messageType: messageRow[messageType],
            noNotify: messageRow[noNotify]
          )
          conversationsDict[conversationIdVal]?.lastMessage = message
        }
          
        conversationsDict[conversationIdVal]?.participants = try self.getAllParticipantsInfoForConversation(conversationIdVal)
        
        if (conversationsDict[conversationIdVal]?.lastMessage != nil) {
          conversationsDict[conversationIdVal]!.lastMessage!.address = conversationsDict[conversationIdVal]?.participants.first(where: { $0.fid == conversationsDict[conversationIdVal]?.lastMessage?.senderFid})?.address ?? ""
        }
      }

      return Array(conversationsDict.values)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func getAllParticipantsForConversation(_ id: String) throws -> [ConversationParticipant] {
    do {
      let select = conversationParticipants.filter(conversationId==id)
      var conversationParticipants: [ConversationParticipant] = []
      for conversationParticipant in try self.db!.prepare(select) {
        conversationParticipants.append(ConversationParticipant(
          conversationId: conversationParticipant[conversationId],
          inboxId: conversationParticipant[inboxId],
          fid: conversationParticipant[fid],
          address: conversationParticipant[address],
          userInfo: conversationParticipant[userInfo],
          joinedAt: conversationParticipant[joinedAt],
          identityKey: conversationParticipant[identityKey],
          signedPreKey: conversationParticipant[signedPreKey],
          rootKey: try self.decrypt(conversationParticipant[rootKey]),
          currentReceivingChainLength: conversationParticipant[currentReceivingChainLength],
          previousChainLength: conversationParticipant[previousChainLength],
          currentSendingChainLength: conversationParticipant[currentSendingChainLength],
          sendingEphemeralKey: try self.decrypt(conversationParticipant[sendingEphemeralKey]),
          receivingEphemeralKey: conversationParticipant[receivingEphemeralKey],
          sendingChainKey: try self.decrypt(conversationParticipant[sendingChainKey]),
          receivingChainKey: try self.decrypt(conversationParticipant[receivingChainKey]),
          skippedReceivingKeysMap: try self.decrypt(conversationParticipant[skippedReceivingKeysMap])
        ))
      }
      return conversationParticipants.sorted(by: {$0.joinedAt > $1.joinedAt})
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }

  public func getAllParticipantsInfoForConversation(_ id: String) throws -> [ConversationParticipantInfo] {
    do {
      let select = conversationParticipants.filter(conversationId==id)
      var conversationParticipants: [ConversationParticipantInfo] = []
      for conversationParticipant in try self.db!.prepare(select) {
        conversationParticipants.append(ConversationParticipantInfo(
          conversationId: conversationParticipant[conversationId],
          inboxId: conversationParticipant[inboxId],
          fid: conversationParticipant[fid],
          address: conversationParticipant[address],
          userInfo: conversationParticipant[userInfo],
          joinedAt: conversationParticipant[joinedAt],
          identityKey: conversationParticipant[identityKey],
          signedPreKey: conversationParticipant[signedPreKey]
        ))
      }
      return conversationParticipants.sorted(by: {$0.joinedAt > $1.joinedAt})
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func getAllMessagesForConversation(_ id: String, pageSize: Int, before: Int64?, after: Int64?) throws -> [ConversationMessage] {
    if before != nil && after != nil {
      throw KeychainKeyStoreError("Both before and after were provided. Only one can be used at a time.")
    }
    
    do {
      let info = try getAllParticipantsInfoForConversation(id)
      var select = conversationMessages.filter(conversationId == id).order(timestamp.desc).limit(pageSize)
        
      if before != nil {
        select = select.filter(timestamp < before!)
      }
      
      if after != nil {
        select = select.filter(timestamp > after!)
      }

      var conversationMessages: [ConversationMessage] = []
        for conversationMessage in try self.db!.prepare(select) {
        conversationMessages.append(ConversationMessage(
          conversationId: conversationMessage[conversationId],
          messageId: conversationMessage[messageId],
          address: info.first(where: {$0.fid == conversationMessage[senderFid]})?.address ?? "",
          senderFid: conversationMessage[senderFid],
          previousChainLength: conversationMessage[previousChainLength],
          messageNumber: conversationMessage[messageNumber],
          timestamp: conversationMessage[timestamp],
          message: try self.decrypt(conversationMessage[message]),
          messageType: conversationMessage[messageType] == "text" ? "text-sent" : conversationMessage[messageType],
          noNotify: conversationMessage[noNotify]
        ))
      }
      return conversationMessages
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func getAllKeys() throws -> [Key] {
    do {
      let select = keys
      var keys: [Key] = []
      for key in try self.db!.prepare(select) {
        keys.append(Key(
          publicKey: key[publicKey],
          privateKey: try self.decrypt(key[privateKey]),
          keyType: key[keyType]
        ))
      }
      return keys
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }

  public func getConversation(_ id: String) throws -> Conversation? {
    for conversation in try self.db!.prepare(conversations.filter(conversationId == id)) {
      return Conversation(
        conversationId: id,
        lastFetchedAt: conversation[lastFetchedAt],
        lastReadTime: conversation[lastReadTime],
        conversationName: conversation[conversationName],
        retentionTime: conversation[retentionTime],
        participants: [],
        lastMessage: nil,
        unreadCount: 0
      )
    }
    return nil
  }
  
  public func addConversation(_ conversation: Conversation) throws {
    do {
      let insert = conversations.insert(
        conversationId <- conversation.conversationId,
        lastFetchedAt <- conversation.lastFetchedAt,
        lastReadTime <- conversation.lastReadTime,
        conversationName <- conversation.conversationName,
        retentionTime <- conversation.retentionTime
      )
      try self.db!.run(insert)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func updateConversation(_ conversation: Conversation) throws {
    do {
      let update = conversations.filter(conversationId == conversation.conversationId).update(
        lastFetchedAt <- conversation.lastFetchedAt,
        lastReadTime <- conversation.lastReadTime,
        conversationName <- conversation.conversationName,
        retentionTime <- conversation.retentionTime
      )
      try self.db!.run(update)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func deleteConversation(_ conversation: Conversation) throws {
    do {
      let delete = conversations.filter(conversationId == conversation.conversationId).delete()
      try self.db!.run(delete)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }

  public func getMessage(_ convId: String, msgId: String, fid: Int64) throws -> ConversationMessage? {
    for conversationMessage in try self.db!.prepare(conversationMessages.filter(conversationId == convId && messageId == msgId && senderFid == fid)) {
      return ConversationMessage(
        conversationId: conversationMessage[conversationId],
        messageId: conversationMessage[messageId],
        address: "",
        senderFid: conversationMessage[senderFid],
        previousChainLength: conversationMessage[previousChainLength],
        messageNumber: conversationMessage[messageNumber],
        timestamp: conversationMessage[timestamp],
        message: try self.decrypt(conversationMessage[message]),
        messageType: conversationMessage[messageType],
        noNotify: conversationMessage[noNotify]
      )
    }
    return nil
  }
  
  public func addMessage(_ conversationMessage: ConversationMessage) throws {
    do {
      let insert = conversationMessages.insert(
        conversationId <- conversationMessage.conversationId,
        messageId <- conversationMessage.messageId,
        senderFid <- conversationMessage.senderFid,
        previousChainLength <- conversationMessage.previousChainLength,
        messageNumber <- conversationMessage.messageNumber,
        timestamp <- conversationMessage.timestamp,
        message <- try self.encrypt(conversationMessage.message),
        messageType <- conversationMessage.messageType,
        noNotify <- conversationMessage.noNotify
      )
      try self.db!.run(insert)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func updateMessage(_ conversationMessage: ConversationMessage) throws {
    do {
      let update = conversationMessages.filter(
        conversationId == conversationMessage.conversationId &&
        messageId == conversationMessage.messageId &&
        senderFid == conversationMessage.senderFid
      ).update(
        previousChainLength <- conversationMessage.previousChainLength,
        messageNumber <- conversationMessage.messageNumber,
        timestamp <- conversationMessage.timestamp,
        message <- try self.encrypt(conversationMessage.message),
        messageType <- conversationMessage.messageType,
        noNotify <- conversationMessage.noNotify
      )
      try self.db!.run(update)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }

  public func setConversationsRead(_ info: [ConversationReadInfo]) throws {
    do {
      for readInfo in info {
        let filterQuery = conversationMessages.filter(conversationId == readInfo.conversationId && timestamp <= readInfo.lastReadTime)
        try self.db!.run(filterQuery.update(messageType <- "read"))
        let conversationsQuery = conversations.filter(conversationId == readInfo.conversationId)
        try self.db!.run(conversationsQuery.update(lastReadTime <- readInfo.lastReadTime))
      }
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }

  public func setMessageStatus(_ messageId: String, fid: Int64, status: String) throws {
    do {
      let update = conversationMessages.filter(
        messageId == messageId &&
        senderFid == fid
      ).update(
        messageType <- status
      )
      try self.db!.run(update)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func deleteMessage(_ conversationMessage: ConversationMessage) throws {
    do {
      let delete = conversationMessages.filter(
        conversationId == conversationMessage.conversationId &&
        messageId == conversationMessage.messageId &&
        senderFid == conversationMessage.senderFid
      ).delete()
      try self.db!.run(delete)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func addParticipant(_ conversationParticipant: ConversationParticipant) throws {
    do {
      let insert = conversationParticipants.insert(
        conversationId <- conversationParticipant.conversationId,
        inboxId <- conversationParticipant.inboxId,
        fid <- conversationParticipant.fid,
        address <- conversationParticipant.address,
        userInfo <- conversationParticipant.userInfo,
        joinedAt <- conversationParticipant.joinedAt,
        identityKey <- conversationParticipant.identityKey,
        signedPreKey <- conversationParticipant.signedPreKey,
        rootKey <- try self.encrypt(conversationParticipant.rootKey),
        currentReceivingChainLength <- conversationParticipant.currentReceivingChainLength,
        previousChainLength <- conversationParticipant.previousChainLength,
        currentSendingChainLength <- conversationParticipant.currentSendingChainLength,
        sendingEphemeralKey <- try self.encrypt(conversationParticipant.sendingEphemeralKey),
        receivingEphemeralKey <- conversationParticipant.receivingEphemeralKey,
        sendingChainKey <- try self.encrypt(conversationParticipant.sendingChainKey),
        receivingChainKey <- try self.encrypt(conversationParticipant.receivingChainKey),
        skippedReceivingKeysMap <- try self.encrypt(conversationParticipant.skippedReceivingKeysMap)
      )
      try self.db!.run(insert)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func updateParticipant(_ conversationParticipant: ConversationParticipant) throws {
    do {
      let update = conversationParticipants.filter(
        conversationId == conversationParticipant.conversationId &&
        inboxId == conversationParticipant.inboxId &&
        fid == conversationParticipant.fid &&
        address == conversationParticipant.address
      ).update(
        userInfo <- conversationParticipant.userInfo,
        joinedAt <- conversationParticipant.joinedAt,
        identityKey <- conversationParticipant.identityKey,
        signedPreKey <- conversationParticipant.signedPreKey,
        rootKey <- try self.encrypt(conversationParticipant.rootKey),
        currentReceivingChainLength <- conversationParticipant.currentReceivingChainLength,
        previousChainLength <- conversationParticipant.previousChainLength,
        currentSendingChainLength <- conversationParticipant.currentSendingChainLength,
        sendingEphemeralKey <- try self.encrypt(conversationParticipant.sendingEphemeralKey),
        receivingEphemeralKey <- conversationParticipant.receivingEphemeralKey,
        sendingChainKey <- try self.encrypt(conversationParticipant.sendingChainKey),
        receivingChainKey <- try self.encrypt(conversationParticipant.receivingChainKey),
        skippedReceivingKeysMap <- try self.encrypt(conversationParticipant.skippedReceivingKeysMap)
      )
      try self.db!.run(update)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func deleteParticipant(_ conversationParticipant: ConversationParticipant) throws {
    do {
      let delete = conversationParticipants.filter(
        conversationId == conversationParticipant.conversationId &&
        inboxId == conversationParticipant.inboxId &&
        fid == conversationParticipant.fid &&
        address == conversationParticipant.address
      ).delete()
      try self.db!.run(delete)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func addKey(_ key: Key) throws {
    do {
      let insert = keys.insert(
        publicKey <- key.publicKey,
        privateKey <- try self.encrypt(key.privateKey),
        keyType <- key.keyType
      )
      try self.db!.run(insert)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  public func deleteKey(_ key: Key) throws {
    do {
      let delete = keys.filter(
        publicKey == key.publicKey
      ).delete()
      try self.db!.run(delete)
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }

  public func wipeData() throws {
    do {
      try self.db!.run(keys.delete())
      try self.db!.run(conversationMessages.delete())
      try self.db!.run(conversationParticipants.delete())
      try self.db!.run(conversations.delete())
    } catch {
      throw KeychainKeyStoreError("error while handling query: \(error)")
    }
  }
  
  private func store<T: KeyStoreConvertible>(_ key: T, account: String, name: String) throws {
    let smallname = "\(name)".replacingOccurrences(of: "[^A-Za-z0-9]+", with: "", options: [.regularExpression])

    let query = [
      // Set as generic password
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // Only when unlocked
      kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock,
      // The raw data being stored
      kSecValueData: key.rawRepresentation] as [String: Any]

    var status = SecItemAdd(query as CFDictionary, nil)
    guard status == errSecSuccess else {
      do {
        try self.delete(account: account, name: name)
        let query = [
          // Set as generic password
          kSecClass: kSecClassGenericPassword,
          // Names it
          kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
          // Namespace it
          kSecAttrService: account,
          // Only when unlocked
          kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock,
          // The raw data being stored
          kSecValueData: key.rawRepresentation] as [String: Any]
        
        status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
          throw KeychainKeyStoreError("store: \(status.message)")
        }
      } catch {
        throw KeychainKeyStoreError("store: \(status.message)")
      }
      return
    }
  }

  private func get<T: KeyStoreConvertible>(account: String, name: String) throws -> T? {
    let smallname = "\(name)".replacingOccurrences(of: "[^A-Za-z0-9]+", with: "", options: [.regularExpression])
    
    let query = [
      // Match the type used in store()
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // Only one
      kSecMatchLimit: kSecMatchLimitOne,
      // Return the raw data
      kSecReturnData: true] as [String: Any]

    // Retrieve and convert
    var item: CFTypeRef?
    switch SecItemCopyMatching(query as CFDictionary, &item) {
      case errSecSuccess:
        guard let data = item as? Data else { throw KeychainKeyStoreError("read: corrupt") }
        return try T(rawRepresentation: data)
      case errSecItemNotFound: throw KeychainKeyStoreError("read: not found")
      case let status: throw KeychainKeyStoreError("read: \(status.message)")
    }
  }

  private func delete(account: String, name: String) throws {
    let smallname = "\(name)".replacingOccurrences(of: "[^A-Za-z0-9]+", with: "", options: [.regularExpression])
    
    let query = [
      // Match the type used in store()
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // Match the data protection level used in store()
      kSecUseDataProtectionKeychain: true] as [String: Any]

    // Attempt to delete, preserve idempotency
    switch SecItemDelete(query as CFDictionary) {
    case errSecItemNotFound, errSecSuccess: break
    case let status:
      throw KeychainKeyStoreError("delete: \(status.message)")
    }
  }

  private func encrypt(_ data: String) throws -> String {
    guard let masterKey = self.masterKey else {
      throw KeychainKeyStoreError("could not encrypt: missing master key")
    }

    let iv = AES.randomIV(12)
    let gcm = GCM(iv: iv, additionalAuthenticatedData: nil, mode: .detached)
    guard let aes = try? AES(key: Array(masterKey.rawRepresentation), blockMode: gcm, padding: .noPadding) else {
      throw KeychainKeyStoreError("could not encrypt")
    }

    guard let plaintextData = data.data(using: .utf8) else {
      throw KeychainKeyStoreError("could not encrypt: invalid utf8")
    }

    guard let encrypted = try? aes.encrypt(Array(plaintextData)) else {
      throw KeychainKeyStoreError("could not encrypt")
    }

    var encryptedPayload = Data(encrypted)
    guard let authenticationTag = gcm.authenticationTag else {
      throw KeychainKeyStoreError("could not encrypt: missing authentication tag")
    }
    encryptedPayload.append(Data(authenticationTag))

    var output = Data(iv)
    output.append(encryptedPayload)
    return output.base64EncodedString()
  }

  private func decrypt(_ data: String) throws -> String {
    guard let masterKey = self.masterKey else {
      throw KeychainKeyStoreError("could not decrypt: missing master key")
    }

    guard let input = Data(base64Encoded: data) else {
      throw KeychainKeyStoreError("could not decrypt: invalid base64")
    }

    // 12-byte IV + 16-byte auth tag are required.
    guard input.count >= 28 else {
      throw KeychainKeyStoreError("could not decrypt: payload too short")
    }

    let iv = input.subdata(in: 0..<12)
    let ciphertext = input.subdata(in: 12..<input.count-16)
    let tag = input.subdata(in: input.count-16..<input.count)

    let decGCM = GCM(iv: Array(iv), authenticationTag: Array(tag), additionalAuthenticatedData: nil, mode: .detached)
    do {
      let aes = try AES(key: Array(masterKey.rawRepresentation), blockMode: decGCM, padding: .noPadding)
      
      if (ciphertext.count > 0) {
        let decrypted = try aes.decrypt(Array(ciphertext))
        
        let result = Data(decrypted)
        guard let plaintext = String(data: result, encoding: .utf8) else {
          throw KeychainKeyStoreError("could not decrypt: invalid utf8")
        }
        return plaintext
      } else {
        return ""
      }
    } catch let error as KeychainKeyStoreError {
      throw error
    } catch {
      throw KeychainKeyStoreError("could not decrypt: \(error)")
    }
  }
}
