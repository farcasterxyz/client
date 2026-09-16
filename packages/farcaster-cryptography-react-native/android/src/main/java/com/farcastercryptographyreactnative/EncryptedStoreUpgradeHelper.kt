package com.farcastercryptographyreactnative

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class EncryptedStoreUpgradeHelper(context: Context, name: String): SQLiteOpenHelper(context,
  "Warpcast$name", null, 1) {
  val CREATE_CONVERSATIONS_SQL =
  "CREATE TABLE conversations (" +
  "  conversationId VARCHAR(255) PRIMARY KEY," +
  "  lastFetchedAt INTEGER NOT NULL," +
  "  lastReadTime INTEGER NOT NULL," +
  "  conversationName VARCHAR(255) NOT NULL," +
  "  retentionTime INTEGER NOT NULL" +
  ");\n" +
  "CREATE INDEX IF NOT EXISTS \"conversations_ix_lastfetched\" ON conversations (lastFetchedAt);";

  val CREATE_CONVERSATIONPARTICIPANTS_SQL =
  "CREATE TABLE conversationparticipants (" +
  "  conversationId VARCHAR(36) NOT NULL," +
  "  inboxId VARCHAR(1024) NOT NULL," +
  "  fid INTEGER NOT NULL," +
  "  address VARCHAR(255) NOT NULL," +
  "  userInfo TEXT NOT NULL," +
  "  joinedAt INTEGER NOT NULL," +
  "  identityKey VARCHAR(1024) NOT NULL," +
  "  signedPreKey VARCHAR(1024) NOT NULL," +
  "  rootKey VARCHAR(1024) NOT NULL," +
  "  currentReceivingChainLength INTEGER NOT NULL," +
  "  previousChainLength INTEGER NOT NULL," +
  "  currentSendingChainLength INTEGER NOT NULL," +
  "  sendingEphemeralKey VARCHAR(1024) NOT NULL," +
  "  receivingEphemeralKey VARCHAR(1024) NOT NULL," +
  "  sendingChainKey VARCHAR(1024) NOT NULL," +
  "  receivingChainKey VARCHAR(1024) NOT NULL," +
  "  skippedReceivingKeysMap TEXT," +
  "  PRIMARY KEY (conversationId, inboxId)," +
  "  FOREIGN KEY (conversationId) REFERENCES conversations (conversationId) ON UPDATE CASCADE ON DELETE CASCADE" +
  ");\n" +
  "CREATE INDEX IF NOT EXISTS \"conversationparticipants_ix_address\" ON conversationparticipants (address);\n" +
  "CREATE INDEX IF NOT EXISTS \"conversationparticipants_ix_inboxid\" ON conversationparticipants (inboxId);";

  val CREATE_CONVERSATIONMESSAGES_SQL =
  "CREATE TABLE conversationmessages (" +
  "  conversationId VARCHAR(36) NOT NULL," +
  "  messageId VARCHAR(36) NOT NULL," +
  "  senderFid INTEGER NOT NULL," +
  "  previousChainLength INTEGER NOT NULL," +
  "  messageNumber INTEGER NOT NULL," +
  "  timestamp INTEGER NOT NULL," +
  "  message TEXT NOT NULL," +
  "  messageType TEXT NOT NULL," +
  "  noNotify INTEGER NOT NULL," +
  "  PRIMARY KEY (conversationId, messageId, senderFid)," +
  "  FOREIGN KEY (conversationId) REFERENCES conversations (conversationId) ON UPDATE CASCADE ON DELETE CASCADE" +
  ");\n" +
  "CREATE INDEX IF NOT EXISTS \"conversationmessages_ix_timestamp\" ON conversationmessages (conversationId, timestamp);";

  val CREATE_KEYS_SQL =
  "CREATE TABLE keys (" +
  "  publicKey VARCHAR(1024) NOT NULL," +
  "  privateKey VARCHAR(1024) NOT NULL," +
  "  keyType VARCHAR(4) NOT NULL," +
  "  PRIMARY KEY (publicKey)" +
  ");";

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(CREATE_CONVERSATIONS_SQL)
    db.execSQL(CREATE_CONVERSATIONPARTICIPANTS_SQL)
    db.execSQL(CREATE_CONVERSATIONMESSAGES_SQL)
    db.execSQL(CREATE_KEYS_SQL)
  }

  override fun onUpgrade(db: SQLiteDatabase?, oldVersion: Int, newVersion: Int) {
    // nothing to do here
  }
}
