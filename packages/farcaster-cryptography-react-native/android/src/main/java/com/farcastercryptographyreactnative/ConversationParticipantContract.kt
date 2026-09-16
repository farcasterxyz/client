package com.farcastercryptographyreactnative

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import java.util.*
import kotlinx.serialization.Serializable

object ConversationParticipantsContract {
  const val TABLE_NAME = "conversationparticipants"
  const val COLUMN_CONVERSATION_ID = "conversationId"
  const val COLUMN_INBOX_ID = "inboxId"
  const val COLUMN_FID = "fid"
  const val COLUMN_ADDRESS = "address"
  const val COLUMN_USER_INFO = "userInfo"
  const val COLUMN_JOINED_AT = "joinedAt"
  const val COLUMN_IDENTITY_KEY = "identityKey"
  const val COLUMN_SIGNED_PRE_KEY = "signedPreKey"
  const val COLUMN_ROOT_KEY = "rootKey"
  const val COLUMN_CURRENT_RECEIVING_CHAIN_LENGTH = "currentReceivingChainLength"
  const val COLUMN_PREVIOUS_CHAIN_LENGTH = "previousChainLength"
  const val COLUMN_CURRENT_SENDING_CHAIN_LENGTH = "currentSendingChainLength"
  const val COLUMN_SENDING_EPHEMERAL_KEY = "sendingEphemeralKey"
  const val COLUMN_RECEIVING_EPHEMERAL_KEY = "receivingEphemeralKey"
  const val COLUMN_SENDING_CHAIN_KEY = "sendingChainKey"
  const val COLUMN_RECEIVING_CHAIN_KEY = "receivingChainKey"
  const val COLUMN_SKIPPED_RECEIVING_KEYS_MAP = "skippedReceivingKeysMap"

  fun toContentValues(participant: ConversationParticipant): ContentValues {
    return ContentValues().apply {
      put(COLUMN_CONVERSATION_ID, participant.conversationId)
      put(COLUMN_INBOX_ID, participant.inboxId)
      put(COLUMN_FID, participant.fid)
      put(COLUMN_ADDRESS, participant.address)
      put(COLUMN_USER_INFO, participant.userInfo)
      put(COLUMN_JOINED_AT, participant.joinedAt.toString())
      put(COLUMN_IDENTITY_KEY, participant.identityKey)
      put(COLUMN_SIGNED_PRE_KEY, participant.signedPreKey)
      put(COLUMN_ROOT_KEY, participant.rootKey)
      put(COLUMN_CURRENT_RECEIVING_CHAIN_LENGTH, participant.currentReceivingChainLength)
      put(COLUMN_PREVIOUS_CHAIN_LENGTH, participant.previousChainLength)
      put(COLUMN_CURRENT_SENDING_CHAIN_LENGTH, participant.currentSendingChainLength)
      put(COLUMN_SENDING_EPHEMERAL_KEY, participant.sendingEphemeralKey)
      put(COLUMN_RECEIVING_EPHEMERAL_KEY, participant.receivingEphemeralKey)
      put(COLUMN_SENDING_CHAIN_KEY, participant.sendingChainKey)
      put(COLUMN_RECEIVING_CHAIN_KEY, participant.receivingChainKey)
      put(COLUMN_SKIPPED_RECEIVING_KEYS_MAP, participant.skippedReceivingKeysMap)
    }
  }

  fun insert(db: SQLiteDatabase, participant: ConversationParticipant): Long {
    return db.insert(TABLE_NAME, null, toContentValues(participant))
  }

  fun selectAllForConversation(db: SQLiteDatabase, conversationId: String): Cursor {
    return db.query(TABLE_NAME, null, "$COLUMN_CONVERSATION_ID = ?", arrayOf(conversationId), null, null, null)
  }

  fun update(db: SQLiteDatabase, participant: ConversationParticipant): Int {
    return db.update(TABLE_NAME, toContentValues(participant), "$COLUMN_CONVERSATION_ID = ? AND $COLUMN_INBOX_ID = ?", arrayOf(participant.conversationId, participant.inboxId))
  }

  fun delete(db: SQLiteDatabase, conversationId: String, inboxId: String): Int {
    return db.delete(TABLE_NAME, "$COLUMN_CONVERSATION_ID = ? AND $COLUMN_INBOX_ID = ?", arrayOf(conversationId, inboxId))
  }
}

@Serializable
data class ConversationParticipant(
  val conversationId: String,
  val inboxId: String,
  val fid: Int,
  val address: String,
  var userInfo: String,
  val joinedAt: Long,
  var identityKey: String,
  var signedPreKey: String,
  var rootKey: String,
  var currentReceivingChainLength: Int,
  var previousChainLength: Int,
  var currentSendingChainLength: Int,
  var sendingEphemeralKey: String,
  var receivingEphemeralKey: String,
  var sendingChainKey: String,
  var receivingChainKey: String,
  var skippedReceivingKeysMap: String? = null
)

@Serializable
data class ConversationParticipantInfo(
  val conversationId: String,
  val inboxId: String,
  val fid: Int,
  val address: String,
  var userInfo: String,
  val joinedAt: Long,
  var identityKey: String,
  var signedPreKey: String
)
