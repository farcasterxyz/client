package com.farcastercryptographyreactnative

import android.annotation.SuppressLint
import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import java.text.SimpleDateFormat
import java.util.*
import kotlinx.serialization.Serializable

object ConversationsContract {
  const val TABLE_NAME = "conversations"
  const val COLUMN_CONVERSATION_ID = "conversationId"
  const val COLUMN_LAST_FETCHED_AT = "lastFetchedAt"
  const val COLUMN_LAST_READ_TIME = "lastReadTime"
  const val COLUMN_CONVERSATION_NAME = "conversationName"
  const val COLUMN_RETENTION_TIME = "retentionTime"

  fun toContentValues(conversation: Conversation): ContentValues {
    return ContentValues().apply {
      put(COLUMN_CONVERSATION_ID, conversation.conversationId)
      put(COLUMN_LAST_FETCHED_AT, conversation.lastFetchedAt)
      put(COLUMN_LAST_READ_TIME, conversation.lastReadTime)
      put(COLUMN_CONVERSATION_NAME, conversation.conversationName)
      put(COLUMN_RETENTION_TIME, conversation.retentionTime)
    }
  }

  fun insert(db: SQLiteDatabase, conversation: Conversation): Long {
    return db.insert(TABLE_NAME, null, toContentValues(conversation))
  }

  @SuppressLint("Range")
  fun selectAll(db: SQLiteDatabase, decryptStore: (string: String) -> String?): List<Conversation> {
    val conversations = mutableListOf<Conversation>()

    val query = "SELECT * FROM ${ConversationsContract.TABLE_NAME} ORDER BY ${ConversationsContract.COLUMN_LAST_FETCHED_AT} DESC"
    
    val cursor = db.rawQuery(query, null)

    var activeConversation: Conversation? = null
    while (cursor.moveToNext()) {
      val conversationId = cursor.getString(cursor.getColumnIndex(ConversationsContract.COLUMN_CONVERSATION_ID))
      if (activeConversation == null || activeConversation.conversationId != conversationId) {
        val lastFetchedAt =
          cursor.getLong(cursor.getColumnIndex(ConversationsContract.COLUMN_LAST_FETCHED_AT))
        val lastReadTime =
          cursor.getLong(cursor.getColumnIndex(ConversationsContract.COLUMN_LAST_READ_TIME))
        val conversationName =
          cursor.getString(cursor.getColumnIndex(ConversationsContract.COLUMN_CONVERSATION_NAME))
        val retentionTime =
          cursor.getLong(cursor.getColumnIndex(ConversationsContract.COLUMN_RETENTION_TIME))

        activeConversation = Conversation(
          conversationId,
          lastFetchedAt,
          lastReadTime,
          conversationName,
          retentionTime,
          emptyArray(),
          null,
          0
        )
      }

      var participantAddress = ""
      val pcursor = ConversationParticipantsContract.selectAllForConversation(db, conversationId)
      while (pcursor.moveToNext()) {
        participantAddress = pcursor.getString(pcursor.getColumnIndex(ConversationParticipantsContract.COLUMN_ADDRESS))
        val participant = ConversationParticipantInfo(
          conversationId,
          pcursor.getString(pcursor.getColumnIndex(ConversationParticipantsContract.COLUMN_INBOX_ID)),
          pcursor.getInt(pcursor.getColumnIndex(ConversationParticipantsContract.COLUMN_FID)),
          participantAddress,
          pcursor.getString(pcursor.getColumnIndex(ConversationParticipantsContract.COLUMN_USER_INFO)),
          pcursor.getLong(pcursor.getColumnIndex(ConversationParticipantsContract.COLUMN_JOINED_AT)),
          pcursor.getString(pcursor.getColumnIndex(ConversationParticipantsContract.COLUMN_IDENTITY_KEY)),
          pcursor.getString(pcursor.getColumnIndex(ConversationParticipantsContract.COLUMN_SIGNED_PRE_KEY)),
        )
        activeConversation.participants += participant
      }
      pcursor.close()
      val uc = db.rawQuery("SELECT COUNT(${ConversationMessagesContract.COLUMN_MESSAGE_ID}) as unreadcount FROM ${ConversationMessagesContract.TABLE_NAME} WHERE ${ConversationMessagesContract.COLUMN_CONVERSATION_ID} = ? AND ${ConversationMessagesContract.COLUMN_TIMESTAMP} > ?", arrayOf(conversationId, activeConversation.lastReadTime.toString()))
      uc.moveToNext()

      val mcursor = db.query(ConversationMessagesContract.TABLE_NAME, null, "$COLUMN_CONVERSATION_ID = ?", arrayOf(conversationId), null, null, ConversationMessagesContract.COLUMN_TIMESTAMP + " DESC")
      while (mcursor.moveToNext()) {
        val messageId = mcursor.getString(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_ID))
        val senderFid = mcursor.getInt(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_SENDER_FID))
        val previousChainLength = mcursor.getInt(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_PREVIOUS_CHAIN_LENGTH))
        val messageNumber = mcursor.getInt(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_NUMBER))
        val timestamp = mcursor.getLong(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_TIMESTAMP))
        val messageContent = decryptStore(mcursor.getString(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE)))
        val messageType = mcursor.getString(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_TYPE))
        val noNotify = mcursor.getInt(mcursor.getColumnIndex(ConversationMessagesContract.COLUMN_NO_NOTIFY)) == 1  
        activeConversation.lastMessage = ConversationMessage(
          conversationId,
          messageId,
          participantAddress,
          senderFid,
          previousChainLength,
          messageNumber,
          timestamp,
          messageContent ?: "",
          messageType,
          noNotify
        )
        break
      }
      mcursor.close()

      activeConversation.unreadCount = uc.getInt(uc.getColumnIndex("unreadcount"))
      uc.close()

      if (conversations.size == 0 || conversations.last().conversationId != conversationId) {
        conversations.add(activeConversation)
      }
    }

    cursor.close()
    for (conversation in conversations) {
      conversation.participants.sortWith(compareByDescending {it.joinedAt})
    }
    return conversations
  }

  fun select(db: SQLiteDatabase, conversationId: String): Cursor {
    return db.query(TABLE_NAME, null, "$COLUMN_CONVERSATION_ID = ?", arrayOf(conversationId), null, null, null)
  }

  fun update(db: SQLiteDatabase, conversation: Conversation): Int {
    return db.update(TABLE_NAME, toContentValues(conversation), "$COLUMN_CONVERSATION_ID = ?", arrayOf(conversation.conversationId))
  }

  fun delete(db: SQLiteDatabase, conversationId: String): Int {
    return db.delete(TABLE_NAME, "$COLUMN_CONVERSATION_ID = ?", arrayOf(conversationId))
  }
}

@Serializable
data class Conversation(
  val conversationId: String,
  val lastFetchedAt: Long,
  val lastReadTime: Long,
  val conversationName: String,
  val retentionTime: Long,
  var participants: Array<ConversationParticipantInfo>,
  var lastMessage: ConversationMessage?,
  var unreadCount: Int,
)