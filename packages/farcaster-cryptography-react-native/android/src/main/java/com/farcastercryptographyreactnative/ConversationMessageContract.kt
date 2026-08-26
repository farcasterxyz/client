package com.farcastercryptographyreactnative

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import java.util.*
import kotlinx.serialization.Serializable

object ConversationMessagesContract {
  const val TABLE_NAME = "conversationmessages"
  const val COLUMN_CONVERSATION_ID = "conversationId"
  const val COLUMN_MESSAGE_ID = "messageId"
  const val COLUMN_SENDER_FID = "senderFid"
  const val COLUMN_PREVIOUS_CHAIN_LENGTH = "previousChainLength"
  const val COLUMN_MESSAGE_NUMBER = "messageNumber"
  const val COLUMN_TIMESTAMP = "timestamp"
  const val COLUMN_MESSAGE = "message"
  const val COLUMN_MESSAGE_TYPE = "messageType"
  const val COLUMN_NO_NOTIFY = "noNotify"

  fun toContentValues(message: ConversationMessage): ContentValues {
    return ContentValues().apply {
      put(COLUMN_CONVERSATION_ID, message.conversationId)
      put(COLUMN_MESSAGE_ID, message.messageId)
      put(COLUMN_SENDER_FID, message.senderFid)
      put(COLUMN_PREVIOUS_CHAIN_LENGTH, message.previousChainLength)
      put(COLUMN_MESSAGE_NUMBER, message.messageNumber)
      put(COLUMN_TIMESTAMP, message.timestamp)
      put(COLUMN_MESSAGE, message.message)
      put(COLUMN_MESSAGE_TYPE, message.messageType)
      put(COLUMN_NO_NOTIFY, message.noNotify)
    }
  }

  fun insert(db: SQLiteDatabase, message: ConversationMessage): Long {
    return db.insert(TABLE_NAME, null, toContentValues(message))
  }

  fun select(db: SQLiteDatabase, conversationId: String, messageId: String, fid: Int): Cursor {
    return db.query(TABLE_NAME, null, "$COLUMN_CONVERSATION_ID = ? AND $COLUMN_MESSAGE_ID = ? AND $COLUMN_SENDER_FID = ?", arrayOf(conversationId, messageId, fid.toString()), null, null, null)
  }


  fun selectAllForConversation(db: SQLiteDatabase, conversationId: String): Cursor {
    return db.query(TABLE_NAME, null, "$COLUMN_CONVERSATION_ID = ?", arrayOf(conversationId), null, null, null)
  }

  fun update(db: SQLiteDatabase, message: ConversationMessage): Int {
    return db.update(TABLE_NAME, toContentValues(message), "$COLUMN_CONVERSATION_ID = ? AND $COLUMN_MESSAGE_ID = ? AND $COLUMN_SENDER_FID = ?", arrayOf(message.conversationId, message.messageId, message.senderFid.toString()))
  }

  fun delete(db: SQLiteDatabase, conversationId: String, messageId: String, senderFid: Int): Int {
    return db.delete(TABLE_NAME, "$COLUMN_CONVERSATION_ID = ? AND $COLUMN_MESSAGE_ID = ? AND $COLUMN_SENDER_FID = ?", arrayOf(conversationId, messageId, senderFid.toString()))
  }
}

@Serializable
data class ConversationMessage(
  val conversationId: String,
  val messageId: String,
  var address: String,
  val senderFid: Int,
  val previousChainLength: Int,
  val messageNumber: Int,
  val timestamp: Long,
  val message: String,
  val messageType: String,
  val noNotify: Boolean
)
