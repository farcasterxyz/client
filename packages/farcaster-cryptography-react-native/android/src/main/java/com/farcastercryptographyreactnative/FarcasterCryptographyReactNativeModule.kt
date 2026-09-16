package com.farcastercryptographyreactnative

import LocalKeyStore
import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.content.SharedPreferences
import android.database.sqlite.SQLiteDatabase
import android.net.Uri
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.annotation.RequiresApi
import androidx.credentials.CreateCredentialResponse
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.Credential
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.CreateCredentialCancellationException
import androidx.credentials.exceptions.CreateCredentialCustomException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.CreateCredentialInterruptedException
import androidx.credentials.exceptions.CreateCredentialProviderConfigurationException
import androidx.credentials.exceptions.CreateCredentialUnknownException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialCustomException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.GetCredentialInterruptedException
import androidx.credentials.exceptions.GetCredentialProviderConfigurationException
import androidx.credentials.exceptions.GetCredentialUnknownException
import androidx.credentials.exceptions.NoCredentialException
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.google.crypto.tink.subtle.Hkdf
import com.google.crypto.tink.subtle.X25519
import kotlin.collections.MutableMap
import kotlinx.coroutines.*
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.json.JSONArray
import org.json.JSONObject
import java.lang.Exception
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.time.format.DateTimeFormatter
import java.io.ByteArrayOutputStream
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.*
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import com.google.android.gms.auth.blockstore.Blockstore
import com.google.android.gms.auth.blockstore.BlockstoreClient
import com.google.android.gms.auth.blockstore.StoreBytesData
import com.google.android.gms.auth.blockstore.RetrieveBytesRequest
import com.google.android.gms.tasks.Task
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

private const val TAG = "PasskeyModule"
// Domain separator for WebAuthn PRF extension key derivation. Not a secret —
// security comes from platform-managed authenticator key material.
// Must be identical at enrollment and authentication.
private const val PRF_EVAL_SALT = "ERERERERERERERERERERERERERERERERERERERERERE="

class FarcasterCryptographyReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  var storeName: String = "main"
  val reactContext = reactContext
  var store: LocalKeyStore? = null
  var db: SQLiteDatabase? = null
  val format = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
  var masterKey: FarcasterSymmetricKey? = null
  private val storePrefix = "farcaster."
  private val passkeyLock = Any()
  private val credentialManager: CredentialManager by lazy { CredentialManager.create(reactContext) }
  private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
  private val blockStoreClient: BlockstoreClient? by lazy {
    try {
      Blockstore.getClient(reactContext)
    } catch (e: Exception) {
      Log.e(TAG, "Block Store unavailable", e)
      null
    }
  }

  override fun getName(): String {
    return "FarcasterCryptographyReactNative";
  }

  override fun invalidate() {
    moduleScope.cancel()
    super.invalidate()
  }

  @SuppressLint("Range")
  @RequiresApi(Build.VERSION_CODES.O)
  fun getConversation(conversationId: String): Conversation? {
    var conversation: Conversation? = null
    this.db?.let {
      val cursor = ConversationsContract.select(it, conversationId)
      if (cursor.moveToFirst()) {
        while (!cursor.isAfterLast) {
          val conversationId = cursor.getString(cursor.getColumnIndex(ConversationsContract.COLUMN_CONVERSATION_ID))
          val lastFetchedAt =
            cursor.getLong(cursor.getColumnIndex(ConversationsContract.COLUMN_LAST_FETCHED_AT))
          val lastReadTime =
            cursor.getLong(cursor.getColumnIndex(ConversationsContract.COLUMN_LAST_READ_TIME))
          val conversationName =
            cursor.getString(cursor.getColumnIndex(ConversationsContract.COLUMN_CONVERSATION_NAME))
          val retentionTime =
            cursor.getLong(cursor.getColumnIndex(ConversationsContract.COLUMN_RETENTION_TIME))

          conversation = Conversation(
            conversationId,
            lastFetchedAt,
            lastReadTime,
            conversationName,
            retentionTime,
            emptyArray(),
            null,
            0
          )

          cursor.moveToNext()
        }
      }

      cursor.close()
    }

    return conversation
  }
  @SuppressLint("Range")
  @RequiresApi(Build.VERSION_CODES.O)
  fun getMessage(conversationId: String, messageId: String, fid: Int): ConversationMessage? {
    var conversationMessage: ConversationMessage? = null
    this.db?.let {
      val cursor = ConversationMessagesContract.select(it, conversationId, messageId, fid)
      if (cursor.moveToFirst()) {
        while (!cursor.isAfterLast) {
          val conversationId =
            cursor.getString(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_CONVERSATION_ID))
          val messageId =
            cursor.getString(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_ID))
          val senderFid =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_SENDER_FID))
          val previousChainLength =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_PREVIOUS_CHAIN_LENGTH))
          val messageNumber =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_NUMBER))
          val timestamp =
            cursor.getLong(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_TIMESTAMP))
          val messageContent =
            this.decryptStore(cursor.getString(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE)))
          val messageType =
            cursor.getString(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_TYPE))
          val noNotify =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_NO_NOTIFY)) == 1

          conversationMessage = ConversationMessage(
            conversationId,
            messageId,
            "",
            senderFid,
            previousChainLength,
            messageNumber,
            timestamp,
            messageContent ?: "",
            messageType,
            noNotify
          )

          cursor.moveToNext()
        }
      }

      cursor.close()
    }

    return conversationMessage
  }

  @SuppressLint("Range")
  @RequiresApi(Build.VERSION_CODES.O)
  fun getAllParticipantsForConversation(conversationId: String): ArrayList<ConversationParticipant> {
    val participants = ArrayList<ConversationParticipant>()
    this.db?.let {
      val cursor = ConversationParticipantsContract.selectAllForConversation(it, conversationId)
      if (cursor.moveToFirst()) {
        while (!cursor.isAfterLast) {
          val inboxId =
            cursor.getString(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_INBOX_ID))
          val fid =
            cursor.getInt(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_FID))
          val address =
            cursor.getString(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_ADDRESS))
          val userInfo =
            cursor.getString(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_USER_INFO))
          val joinedAt =
            cursor.getLong(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_JOINED_AT))
          val identityKey =
            cursor.getString(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_IDENTITY_KEY))
          val signedPreKey =
            cursor.getString(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_SIGNED_PRE_KEY))
          val rootKey = this.decryptStore(
            cursor.getString(
              cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_ROOT_KEY)
            )
          )
          val currentReceivingChainLength = cursor.getInt(
            cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_CURRENT_RECEIVING_CHAIN_LENGTH))
          val previousChainLength = cursor.getInt(
            cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_PREVIOUS_CHAIN_LENGTH))
          val currentSendingChainLength = cursor.getInt(
            cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_CURRENT_SENDING_CHAIN_LENGTH))
          val sendingEphemeralKey = this.decryptStore(
            cursor.getString(
              cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_SENDING_EPHEMERAL_KEY)
            )
          )
          val receivingEphemeralKey =
            cursor.getString(cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_RECEIVING_EPHEMERAL_KEY))
          val sendingChainKey = this.decryptStore(
            cursor.getString(
              cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_SENDING_CHAIN_KEY)
            )
          )
          val receivingChainKey = this.decryptStore(
            cursor.getString(
              cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_RECEIVING_CHAIN_KEY)
            )
          )
          val skippedReceivingKeysMap = this.decryptStore(
            cursor.getString(
              cursor.getColumnIndex(ConversationParticipantsContract.COLUMN_SKIPPED_RECEIVING_KEYS_MAP)
            )
          )

          participants.add(
            ConversationParticipant(
              conversationId,
              inboxId,
              fid,
              address,
              userInfo,
              joinedAt,
              identityKey,
              signedPreKey,
              rootKey ?: "",
              currentReceivingChainLength,
              previousChainLength,
              currentSendingChainLength,
              sendingEphemeralKey ?: "",
              receivingEphemeralKey,
              sendingChainKey ?: "",
              receivingChainKey ?: "",
              skippedReceivingKeysMap
            )
          )
          cursor.moveToNext()
        }
      }
      cursor.close()
    }

    participants.sortWith(compareByDescending {it.joinedAt})
    return participants
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @SuppressLint("Range")
  fun getMessagesForConversation(
    conversationId: String,
    pageSize: Int,
    cursor: Double,
    direction: String
  ): ArrayList<ConversationMessage> {
    val messages = ArrayList<ConversationMessage>()
    val limit = pageSize
    val sortOrder = "${ConversationMessagesContract.COLUMN_TIMESTAMP} DESC"
    val directionCmp = if (direction == "before") { "<" } else { ">" }
    val participants = this.getAllParticipantsForConversation(conversationId)
    this.db?.let {
      val time = cursor.toLong()
      val cursor = it.query(
        ConversationMessagesContract.TABLE_NAME,
        null,
        "${ConversationMessagesContract.COLUMN_CONVERSATION_ID} = ? AND ${ConversationMessagesContract.COLUMN_TIMESTAMP} ${directionCmp} ${time}",
        arrayOf(conversationId),
        null,
        null,
        sortOrder,
        "0, $limit"
      )
      if (cursor.moveToFirst()) {
        while (!cursor.isAfterLast) {
          val messageId =
            cursor.getString(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_ID))
          val senderFid =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_SENDER_FID))
          val previousChainLength =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_PREVIOUS_CHAIN_LENGTH))
          val messageNumber =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_NUMBER))
          val timestamp =
            cursor.getLong(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_TIMESTAMP))
          val messageContent =
            this.decryptStore(cursor.getString(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE)))
          val messageType =
            cursor.getString(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_MESSAGE_TYPE))
          val noNotify =
            cursor.getInt(cursor.getColumnIndex(ConversationMessagesContract.COLUMN_NO_NOTIFY)) == 1

          messages.add(
            ConversationMessage(
              conversationId,
              messageId,
              participants.first { it.fid == senderFid }.address,
              senderFid,
              previousChainLength,
              messageNumber,
              timestamp,
              messageContent ?: "",
              messageType,
              noNotify
            )
          )
          cursor.moveToNext()
        }
      }
      cursor.close()
    }
    return messages
  }

  @SuppressLint("Range")
  fun getAllKeys(): ArrayList<Key> {
    val keys = ArrayList<Key>()

    this.db?.let {
      val cursor = KeysContract.selectAll(it)
      if (cursor.moveToFirst()) {
        while (!cursor.isAfterLast) {
          val publicKey = cursor.getString(cursor.getColumnIndex(KeysContract.COLUMN_PUBLIC_KEY))
          val privateKey =
            this.decryptStore(cursor.getString(cursor.getColumnIndex(KeysContract.COLUMN_PRIVATE_KEY)))
          val keyType = cursor.getString(cursor.getColumnIndex(KeysContract.COLUMN_KEY_TYPE))

          keys.add(Key(publicKey, privateKey ?: "", keyType))
          cursor.moveToNext()
        }
      }
      cursor.close()
    }
    return keys
  }

  fun addConversation(conversation: Conversation) {
    this.db?.let {
      ConversationsContract.insert(it, conversation)
    }
  }

  fun updateConversation(conversation: Conversation) {
    this.db?.let {
      ConversationsContract.update(it, conversation)
    }
  }

  fun deleteConversation(conversation: Conversation) {
    this.db?.let {
      ConversationsContract.delete(it, conversation.conversationId)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun addMessage(message: ConversationMessage) {
    this.db?.let {
      var encryptedMessage = ConversationMessage(
        message.conversationId,
        message.messageId,
        "",
        message.senderFid,
        message.previousChainLength,
        message.messageNumber,
        message.timestamp - 3000,
        this.encryptStore(message.message) ?: "",
        message.messageType,
        message.noNotify
      )

      ConversationMessagesContract.insert(it, encryptedMessage)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun updateMessage(message: ConversationMessage) {
    this.db?.let {
      var encryptedMessage = ConversationMessage(
        message.conversationId,
        message.messageId,
        "",
        message.senderFid,
        message.previousChainLength,
        message.messageNumber,
        message.timestamp,
        this.encryptStore(message.message) ?: "",
        message.messageType,
        message.noNotify
      )
      ConversationMessagesContract.update(it, encryptedMessage)
    }
  }

  fun deleteMessage(message: ConversationMessage) {
    this.db?.let {
      ConversationMessagesContract.delete(
        it,
        message.conversationId,
        message.messageId,
        message.senderFid
      )
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun addParticipant(participant: ConversationParticipant) {
    this.db?.let {
      var encryptedParticipant = ConversationParticipant(
        participant.conversationId,
        participant.inboxId,
        participant.fid,
        participant.address,
        participant.userInfo,
        participant.joinedAt,
        participant.identityKey,
        participant.signedPreKey,
        this.encryptStore(participant.rootKey) ?: "",
        participant.currentReceivingChainLength,
        participant.previousChainLength,
        participant.currentSendingChainLength,
        this.encryptStore(participant.sendingEphemeralKey) ?: "",
        participant.receivingEphemeralKey,
        this.encryptStore(participant.sendingChainKey) ?: "",
        this.encryptStore(participant.receivingChainKey) ?: "",
        this.encryptStore(participant.skippedReceivingKeysMap ?: ""),
      )
      ConversationParticipantsContract.insert(it, encryptedParticipant)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun updateParticipant(participant: ConversationParticipant) {
    this.db?.let {
      var encryptedParticipant = ConversationParticipant(
        participant.conversationId,
        participant.inboxId,
        participant.fid,
        participant.address,
        participant.userInfo,
        participant.joinedAt,
        participant.identityKey,
        participant.signedPreKey,
        this.encryptStore(participant.rootKey) ?: "",
        participant.currentReceivingChainLength,
        participant.previousChainLength,
        participant.currentSendingChainLength,
        this.encryptStore(participant.sendingEphemeralKey) ?: "",
        participant.receivingEphemeralKey,
        this.encryptStore(participant.sendingChainKey) ?: "",
        this.encryptStore(participant.receivingChainKey) ?: "",
        this.encryptStore(participant.skippedReceivingKeysMap ?: ""),
      )

      ConversationParticipantsContract.update(it, encryptedParticipant)
    }
  }

  fun deleteParticipant(participant: ConversationParticipant) {
    this.db?.let {
      ConversationParticipantsContract.delete(it, participant.conversationId, participant.inboxId)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun addKey(key: Key) {
    this.db?.let {
      var encryptedKey = Key(
        key.publicKey,
        this.encryptStore(key.privateKey) ?: "",
        key.keyType
      )
      KeysContract.insert(it, encryptedKey)
    }
  }

  fun deleteKey(key: Key) {
    this.db?.let {
      KeysContract.delete(it, key.publicKey)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun decryptStore(data: String): String? {
    val ciphertext = Json.decodeFromString<FarcasterCiphertext>(data)
    val b64 =
      this.store?.decrypt(
        "master",
        ciphertext.base64IV,
        ciphertext.base64Ciphertext,
        ciphertext.base64AssociatedData
      )
        ?: return null

    return String(Base64.getDecoder().decode(b64), Charsets.UTF_8)
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun encryptStore(data: String): String? {
    val ciphertext = this.store?.encrypt(
      "master",
      Base64.getEncoder().encodeToString(data.toByteArray(Charsets.UTF_8)),
      null,
      null
    )
    return Json.encodeToString(ciphertext)
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun getInbox(promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
      this.db?.let {
        val conversations = ConversationsContract.selectAll(it, this::decryptStore)
        promise.resolve(Json.encodeToString(conversations))
      }
    } catch (e: Exception) {
      promise.reject("getInbox", "failed to get: ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun getInboxId(promise: Promise) {
     try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      var keys = this.getAllKeys()

      if (keys.size == 0) {
        val idk = X25519.generatePrivateKey()
        val spk = X25519.generatePrivateKey()
        val ibx = X25519.generatePrivateKey()
        val idkPublicKey = X25519.publicFromPrivate(idk)
        val spkPublicKey = X25519.publicFromPrivate(spk)
        val ibxPublicKey = X25519.publicFromPrivate(ibx)
        this.addKey(Key(
          Base64.getEncoder().encodeToString(idkPublicKey),
          Base64.getEncoder().encodeToString(idk),
          "idk"
        ))
        this.addKey(Key(
          Base64.getEncoder().encodeToString(spkPublicKey),
          Base64.getEncoder().encodeToString(spk),
          "spk"
        ))
        this.addKey(Key(
          Base64.getEncoder().encodeToString(ibxPublicKey),
          Base64.getEncoder().encodeToString(ibx),
          "ibx"
        ))
        
        promise.resolve(Base64.getEncoder().encodeToString(ibxPublicKey))
      } else {
        val ibxRecord = keys.first { it.keyType == "ibx" }
        val idkRecord = keys.first { it.keyType == "idk" }
        val spkRecord = keys.first { it.keyType == "spk" }
        if (ibxRecord == null) {
          val ibx = X25519.generatePrivateKey()
          val ibxPublicKey = X25519.publicFromPrivate(ibx)
          this.addKey(Key(
            Base64.getEncoder().encodeToString(ibxPublicKey),
            Base64.getEncoder().encodeToString(ibx),
            "ibx"
          ))
        }
        if (idkRecord == null) {
          val idk = X25519.generatePrivateKey()
          val idkPublicKey = X25519.publicFromPrivate(idk)
          this.addKey(Key(
            Base64.getEncoder().encodeToString(idkPublicKey),
            Base64.getEncoder().encodeToString(idk),
            "idk"
          ))
        }
        if (spkRecord == null) {
          val spk = X25519.generatePrivateKey()
          val spkPublicKey = X25519.publicFromPrivate(spk)
          this.addKey(Key(
            Base64.getEncoder().encodeToString(spkPublicKey),
            Base64.getEncoder().encodeToString(spk),
            "spk"
          ))
        }
        keys = this.getAllKeys()
      }

      val inbox = keys.first { it.keyType == "ibx" }
      var inboxId = inbox?.publicKey

      promise.resolve(inboxId)
    } catch (e: java.security.InvalidKeyException) {
      promise.reject("getInboxId", "embargoed")
    } catch (e: java.lang.SecurityException) {
      promise.reject("getInboxId", "embargoed")
    } catch (e: Exception) {
      promise.reject("getInboxId", e.message)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun getConversationPage(
    conversationId: String,
    pageSize: Int,
    cursor: Double,
    direction: String,
    promise: Promise
  ) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      val messages = this.getMessagesForConversation(conversationId, pageSize, cursor, direction)
      promise.resolve(Json.encodeToString(messages))
    } catch (e: Exception) {
      promise.reject("getConversationPage", "failed to get: ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun getConversationParticipants(conversationId: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
      
      val participants = this.getAllParticipantsForConversation(conversationId)
      promise.resolve(Json.encodeToString(participants))
    } catch (e: Exception) {
      promise.reject("getConversationParticipants", "failed to get: ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun decryptInternalSym(messageKey: ByteArray, ciphertext: ApiDirectCastCiphertext): String {
    val spec = SecretKeySpec(messageKey, "AES");
    val iv = Base64.getDecoder().decode(ciphertext.base64IV);
    val cipher = Cipher.getInstance("AES/GCM/NoPadding");
    val gcmSpec = GCMParameterSpec(16 * 8, iv);
    val os = ByteArrayOutputStream();
    cipher.init(Cipher.DECRYPT_MODE, spec, gcmSpec);
    val a = Base64.getDecoder().decode(ciphertext.base64AssociatedData);
    cipher.updateAAD(a);
    val c = Base64.getDecoder().decode(ciphertext.base64Ciphertext);
    val output = cipher.update(c)

    if (output != null && output.isNotEmpty()) {
      os.write(output);
    }

    val fin = cipher.doFinal();

    if (fin != null && fin.isNotEmpty()) {
      os.write(fin);
    }

    return os.toByteArray().toString(Charsets.UTF_8);
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun encryptInternalSym(messageKey: ByteArray, associatedData: ByteArray, plaintext: String): ApiDirectCastCiphertext {
    val spec = SecretKeySpec(messageKey, "AES");
    val rand = SecureRandom()
    val secureRandom = SecureRandom()
    val iv = ByteArray(12)
    secureRandom.nextBytes(iv)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding");
    val gcmSpec = GCMParameterSpec(16 * 8, iv);
    cipher.init(Cipher.ENCRYPT_MODE, spec, gcmSpec);
    cipher.update(plaintext.toByteArray(Charsets.UTF_8));
    cipher.updateAAD(associatedData);
    var output = cipher.doFinal();

    return ApiDirectCastCiphertext(
      Base64.getEncoder().encodeToString(iv),
      Base64.getEncoder().encodeToString(output),
      Base64.getEncoder().encodeToString(associatedData))
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun trySkippedKeys(
    participant: ConversationParticipant,
    message: ApiDirectCastMessage): ConversationMessage? {
    if (participant.skippedReceivingKeysMap == "") {
      return null
    }

    try {
      var skippedKeys: MutableMap<String, MutableMap<Int, SkippedKeyTuple>> = Json{
        explicitNulls = false
      }.decodeFromString(participant.skippedReceivingKeysMap!!)
      var applicableSet = skippedKeys.get(message.header.base64EphemeralKey)
      if (applicableSet != null) {
        val pair = applicableSet.get(message.header.messageNumber)
        if (pair == null) {
          return null
        }

        val plaintext =
          this.decryptInternalSym(Base64.getDecoder().decode(pair.messageKey), message.ciphertext)

        applicableSet.remove(message.header.messageNumber)
        skippedKeys.set(message.header.base64EphemeralKey, applicableSet)

        if (skippedKeys.get(message.header.base64EphemeralKey)!!.size == 0) {
          skippedKeys.remove(message.header.base64EphemeralKey)
        }

        participant.skippedReceivingKeysMap = Json.encodeToString(skippedKeys)
        val outputMessage = ConversationMessage(
          message.conversationId,
          message.messageId,
          message.account,
          message.fid,
          message.header.previousChainLength,
          message.header.messageNumber,
          message.serverTimestamp,
          plaintext,
          "text-sent",
          message.noNotify
        )

        this.addMessage(outputMessage)
        this.updateParticipant(participant)
        return outputMessage
      } else {
        return null
      }
    } catch (e: Exception) {
      return null
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun hmacKDF(result: DeriveKeyOptions, key: ByteArray): ByteArray? {
    val derivationMode = result.derivationMode
    val base64Salt = result.base64Salt
    val saltKeyId = result.saltKeyId
    val base64Prefix = result.base64Prefix
    val outputLength = result.outputLength
    val outputKeyLengths = result.outputKeyLengths

    // key + custom salt
    var salt = Base64.getDecoder().decode(base64Salt)
    var info = ByteArray(0)

    if (result.info != null) {
      info += result.info.toByteArray(Charsets.UTF_8)
    }

    val mac = javax.crypto.Mac.getInstance("HMACSHA256")
    val secret = SecretKeySpec(key, "HmacSHA256")
    mac.init(secret)
    val output = mac.doFinal(salt)

    return output
  }
  @RequiresApi(Build.VERSION_CODES.O)
  fun skipKeys(participant: ConversationParticipant, limit: Int) {
    if (participant.currentReceivingChainLength + 30 < limit) {
      throw Exception("skip length too high")
    }

    if (participant.receivingChainKey != "") {
      val key = Base64.getDecoder().decode(participant.receivingChainKey)
      while (participant.currentReceivingChainLength < limit) {
        val messageKey = this.hmacKDF(
          DeriveKeyOptions(
            "hmacsha256",
            "AQ==",
            null,
            null,
            emptyArray(),
            null,
            32,
            null),
          key)
        val nextReceivingChainKey = this.hmacKDF(
          DeriveKeyOptions(
            "hmacsha256",
            "Ag==",
            null,
            null,
            emptyArray(),
            null,
            32,
            null),
          key)
        val aeadPrefix = this.hmacKDF(
          DeriveKeyOptions(
            "hmacsha256",
            "Aw==",
            null,
            null,
            emptyArray(),
            null,
            32,
            null),
          key)

        if (participant.skippedReceivingKeysMap == "") {
          participant.skippedReceivingKeysMap = "{}"
        }

        if (messageKey == null || nextReceivingChainKey == null || aeadPrefix == null) {
          throw Exception("could not derive")
        }

        var skippedKeys: MutableMap<String, MutableMap<Int, SkippedKeyTuple>> = Json.decodeFromString(participant.skippedReceivingKeysMap!!)
        if (skippedKeys == null) {
          throw Exception("could not decode")
        }

        if (skippedKeys.get(participant.receivingEphemeralKey) == null) {
          skippedKeys.set(participant.receivingEphemeralKey, mutableMapOf<Int, SkippedKeyTuple>())
        }

        var map = skippedKeys.get(participant.receivingEphemeralKey)
        if (map != null) {
          map.set(participant.currentReceivingChainLength, SkippedKeyTuple(
            Base64.getEncoder().encodeToString(messageKey!!),
            Base64.getEncoder().encodeToString(aeadPrefix!!)))
          skippedKeys.set(participant.receivingEphemeralKey, map)
        }

        participant.receivingChainKey = Base64.getEncoder().encodeToString(nextReceivingChainKey!!)
        participant.currentReceivingChainLength += 1
      }
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun advanceSendingRatchet(participant: ConversationParticipant, header: ApiDirectCastHeader) {
    val sepk = X25519.generatePrivateKey()
    val base64PrivateKey = Base64.getEncoder().encodeToString(sepk)
    val base64PublicKey = Base64.getEncoder().encodeToString(X25519.publicFromPrivate(sepk))
    val receivingPublicKey = header.base64EphemeralKey
    val cepkData = Base64.getDecoder().decode(receivingPublicKey)

    val dh = X25519.computeSharedSecret(sepk, cepkData)
    val sha256 = MessageDigest.getInstance("SHA-256")
    val dhKey = sha256.digest(dh)

    val base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
    val info = "farcaster"
    val outputLength = 64

    var key = Base64.getDecoder().decode("//////////////////////////////////////////8=")
    key += Base64.getDecoder().decode(participant.rootKey)

    val salt = Base64.getDecoder().decode(base64Salt) + dhKey

    val derived = Hkdf.computeHkdf(
      "HmacSha256",
      key,
      salt,
      info.toByteArray(Charsets.UTF_8),
      outputLength
    )

    val results = mutableListOf<ByteArray>()
    for (i in 0 until outputLength step 32) {
      results.add(derived.copyOfRange(i, kotlin.math.min(i + 32, outputLength)))
    }

    participant.rootKey = Base64.getEncoder().encodeToString(results[0])
    participant.sendingChainKey = Base64.getEncoder().encodeToString(results[1])
    participant.sendingEphemeralKey = base64PrivateKey
    participant.previousChainLength = participant.currentSendingChainLength
    participant.currentReceivingChainLength = 0
    participant.currentSendingChainLength = 0
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun advanceReceiverRatchet(participant: ConversationParticipant, header: ApiDirectCastHeader) {
    val receivingPublicKey = header.base64EphemeralKey
    val cepkData = Base64.getDecoder().decode(receivingPublicKey)
    val sepkData = Base64.getDecoder().decode(participant.sendingEphemeralKey)

    val dh = X25519.computeSharedSecret(sepkData, cepkData)
    val sha256 = MessageDigest.getInstance("SHA-256")
    val dhKey = sha256.digest(dh)

    val base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
    val info = "farcaster"
    val outputLength = 64

    var key = Base64.getDecoder().decode("//////////////////////////////////////////8=")
    key += Base64.getDecoder().decode(participant.rootKey)

    val salt = Base64.getDecoder().decode(base64Salt) + dhKey

    val derived = Hkdf.computeHkdf(
      "HmacSha256",
      key,
      salt,
      info.toByteArray(Charsets.UTF_8),
      outputLength
    )

    val results = mutableListOf<ByteArray>()
    for (i in 0 until outputLength step 32) {
      results.add(derived.copyOfRange(i, kotlin.math.min(i + 32, outputLength)))
    }

    participant.rootKey = Base64.getEncoder().encodeToString(results[0])
    participant.receivingChainKey = Base64.getEncoder().encodeToString(results[1])
    participant.receivingEphemeralKey = receivingPublicKey
    this.advanceSendingRatchet(participant, header)
  }
  
  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun bulkRatchetDecrypt(participantsJson: String, messagesJson: String, promise: Promise) {
    val participantsReq: ArrayList<ApiDirectCastKeysByAccount>?
    val req: ArrayList<ApiDirectCastMessage>?

    try {
      participantsReq = Json{explicitNulls = false; ignoreUnknownKeys = true}.decodeFromString<ArrayList<ApiDirectCastKeysByAccount>>(participantsJson)
    } catch (e: Exception) {
      promise.reject("ratchetDecrypt", "bad json participants ${e.message}")
      return
    }
    try {
      req = Json{explicitNulls = false; ignoreUnknownKeys = true}.decodeFromString<ArrayList<ApiDirectCastMessage>>(messagesJson)
    } catch (e: Exception) {
      promise.reject("ratchetDecrypt", "bad json messages ${e.message}")
      return
    }

    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("ratchetDecrypt", "could not load keystore ${e.message}")
      return
    }

    data class GroupingKey(val base64IdentityKey: String, val conversationId: String)

    val groupedByIDKAndConversation = req.groupBy { GroupingKey(it.header.base64IdentityKey!!, it.conversationId) }
    val keys = this.getAllKeys() ?: run {
      promise.reject("ratchetDecrypt", "cannot find keys")
      return
    }

    val keysGroupedByFid = participantsReq.groupBy { it.user.fid }

    val idkRecord = keys.first { it.keyType == "idk" }
    val spkRecord = keys.first { it.keyType == "spk" }
    val idk = Base64.getDecoder().decode(idkRecord.privateKey)
    val spk = Base64.getDecoder().decode(spkRecord.privateKey)

    val idkPublicKey = X25519.publicFromPrivate(idk)
    val spkPublicKey = X25519.publicFromPrivate(spk)

    GlobalScope.launch {
      var errors: MutableList<String?> = mutableListOf()

      val jobs = mutableListOf<Job>()
      groupedByIDKAndConversation?.forEach { (key, messages) ->
        val base64IdentityKey = key.base64IdentityKey
        val conversationId = key.conversationId

        val existingConversation = this@FarcasterCryptographyReactNativeModule.getConversation(conversationId)
        if (existingConversation == null) {
          try {
            this@FarcasterCryptographyReactNativeModule.addConversation(
              Conversation(
                conversationId,
                System.currentTimeMillis(),
                0L,
                "",
                60L * 24 * 60 * 60 * 1000,
                emptyArray(),
                null,
                0))
          } catch (e: Exception) {
            errors = mutableListOf("could not create conversation: ${e.message}")
            return@launch
          }
        }

        val knownParticipants = try {
          this@FarcasterCryptographyReactNativeModule.getAllParticipantsForConversation(conversationId)
        } catch (e: Exception) {
          errors = mutableListOf("could not get participants")
          return@launch
        }
        val job = launch {
          val userAndKeys = keysGroupedByFid[messages[0].fid]?.get(0)
          val user = userAndKeys?.user
          val userJson = try {
            Json{explicitNulls = false; ignoreUnknownKeys = true}.encodeToString(user)
          } catch (e: Exception) {
            errors.add("could not encode user json for ${messages[0].fid}")
            return@launch
          }

          val inboxId = userAndKeys?.keys?.idk?.firstOrNull { it.base64PublicKey == base64IdentityKey }?.inboxId
          if (inboxId == null) {
            errors.add("could not find inbox id for idk $base64IdentityKey")
            return@launch
          }

          if (knownParticipants.firstOrNull { it.identityKey == idkRecord.publicKey } == null) {
            val ownUser = participantsReq.firstOrNull {
              it.keys.idk.firstOrNull { it.base64PublicKey == idkRecord.publicKey } != null
            }
            val ownIdk = ownUser?.keys?.idk?.firstOrNull { it.base64PublicKey == idkRecord.publicKey }
            val ownUserJson = try {
              Json{explicitNulls = false; ignoreUnknownKeys = true}.encodeToString(ownUser?.user)
            } catch (e: Exception) {
              errors.add("could not encode user json for ${ownUser?.user?.fid}")
              return@launch
            }
            val participant = ConversationParticipant(
              conversationId = conversationId,
              inboxId = ownIdk!!.inboxId,
              fid = ownUser!!.user.fid,
              address = ownIdk.account,
              userInfo = ownUserJson,
              joinedAt = System.currentTimeMillis(),
              identityKey = idkRecord.publicKey,
              signedPreKey = spkRecord.publicKey,
              rootKey = "",
              currentReceivingChainLength = 0,
              previousChainLength = 0,
              currentSendingChainLength = 0,
              sendingEphemeralKey = "",
              receivingEphemeralKey = "",
              sendingChainKey = "",
              receivingChainKey = "",
              skippedReceivingKeysMap = ""
            )
            try {
              this@FarcasterCryptographyReactNativeModule.addParticipant(participant)
            } catch (e: Exception) {
              return@launch
            }
          }
          var maybeKnownParticipant = knownParticipants.firstOrNull { it.identityKey == base64IdentityKey }
          if (maybeKnownParticipant == null) {
            val cepk = Base64.getDecoder().decode(messages[0].header.base64EphemeralKey)
            val cidk = Base64.getDecoder().decode(messages[0].header.base64IdentityKey!!)
            val cspk = Base64.getDecoder().decode(messages[0].header.base64SignedPreKey!!)
            val hash1 = MessageDigest.getInstance("SHA-256")
            val dh1 = spk?.let { X25519.computeSharedSecret(it, cidk) }
            val dh1Key = hash1.digest(dh1)
            val hash2 = MessageDigest.getInstance("SHA-256")
            val dh2 = idk?.let { X25519.computeSharedSecret(it, cepk) }
            val dh2Key = hash2.digest(dh2)
            val hash3 = MessageDigest.getInstance("SHA-256")
            val dh3 = spk?.let { X25519.computeSharedSecret(it, cepk) }
            val dh3Key = hash3.digest(dh3)

            val base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

            val info = "farcaster"
            val outputLength = 32

            var key = Base64.getDecoder().decode("//////////////////////////////////////////8=")

            for (dhKey in listOf(dh1Key, dh2Key, dh3Key)) {
              key += dhKey
            }

            val salt = Base64.getDecoder().decode(base64Salt)

            val sessionKey = Hkdf.computeHkdf(
              "HmacSha256",
              key,
              salt,
              info.toByteArray(Charsets.UTF_8),
              outputLength
            )

            maybeKnownParticipant = ConversationParticipant(
              conversationId = conversationId,
              inboxId = inboxId!!,
              fid = messages[0].fid,
              address = messages[0].account,
              userInfo = userJson,
              joinedAt = messages[0].serverTimestamp,
              identityKey = messages[0].header.base64IdentityKey!!,
              signedPreKey = messages[0].header.base64SignedPreKey!!,
              rootKey = Base64.getEncoder().encodeToString(sessionKey),
              currentReceivingChainLength = 0,
              previousChainLength = 0,
              currentSendingChainLength = 0,
              sendingEphemeralKey = spkRecord.privateKey,
              receivingEphemeralKey = "",
              sendingChainKey = "",
              receivingChainKey = "",
              skippedReceivingKeysMap = ""
            )
            try {
              this@FarcasterCryptographyReactNativeModule.addParticipant(maybeKnownParticipant)
            } catch (e: Exception) {
              errors.add("could not add participant to store: $e")
              return@launch
            }
          }
          val knownParticipant = maybeKnownParticipant!!
          for (message in messages) {
            try {
              val existingMessage = this@FarcasterCryptographyReactNativeModule.getMessage(conversationId, message.messageId, message.fid)
              if (existingMessage != null) {
                continue
              }

              val skippedMessage = this@FarcasterCryptographyReactNativeModule.trySkippedKeys(knownParticipant, message)
              if (skippedMessage != null) {
                continue
              }

              if (knownParticipant.receivingEphemeralKey != message.header.base64EphemeralKey) {
                this@FarcasterCryptographyReactNativeModule.skipKeys(knownParticipant, message.header.previousChainLength)
                this@FarcasterCryptographyReactNativeModule.advanceReceiverRatchet(knownParticipant, message.header)
              }

              this@FarcasterCryptographyReactNativeModule.skipKeys(knownParticipant, message.header.messageNumber)
              val key = Base64.getDecoder().decode(knownParticipant.receivingChainKey)
              val messageKey = this@FarcasterCryptographyReactNativeModule.hmacKDF(
                DeriveKeyOptions(
                  derivationMode = "hmacsha256",
                  base64Salt = "AQ==",
                  saltKeyId = null,
                  base64Prefix = null,
                  inputKeyIds = emptyArray(),
                  info = null,
                  outputLength = 32,
                  outputKeyLengths = null
                ), key)
              val nextReceivingChainKey = this@FarcasterCryptographyReactNativeModule.hmacKDF(
                DeriveKeyOptions(
                  derivationMode = "hmacsha256",
                  base64Salt = "Ag==",
                  saltKeyId = null,
                  base64Prefix = null,
                  inputKeyIds = emptyArray(),
                  info = null,
                  outputLength = 32,
                  outputKeyLengths = null
                ), key)
              val aeadPrefix = this@FarcasterCryptographyReactNativeModule.hmacKDF(
                DeriveKeyOptions(
                  derivationMode = "hmacsha256",
                  base64Salt = "Aw==",
                  saltKeyId = null,
                  base64Prefix = null,
                  inputKeyIds = emptyArray(),
                  info = null,
                  outputLength = 32,
                  outputKeyLengths = null
                ), key)

              val plaintext = this@FarcasterCryptographyReactNativeModule.decryptInternalSym(messageKey!!, message.ciphertext)

              knownParticipant.userInfo = userJson
              knownParticipant.currentReceivingChainLength += 1
              knownParticipant.receivingChainKey = Base64.getEncoder().encodeToString(nextReceivingChainKey)
              this@FarcasterCryptographyReactNativeModule.addMessage(
                ConversationMessage(
                  conversationId = message.conversationId,
                  messageId = message.messageId,
                  address = message.account,
                  senderFid = message.fid,
                  previousChainLength = message.header.previousChainLength,
                  messageNumber = message.header.messageNumber,
                  timestamp = message.serverTimestamp,
                  message = plaintext,
                  messageType = "text-sent",
                  noNotify = message.noNotify
                )
              )
              this@FarcasterCryptographyReactNativeModule.updateParticipant(knownParticipant)
            } catch (e: Exception) {
              errors.add("could not decrypt: $e")
              this@FarcasterCryptographyReactNativeModule.deleteParticipant(knownParticipant)
            }
          }
        }
        jobs.add(job)
      }

      jobs.forEach { it.join() } // Wait for all coroutines to finish

      val resolvedErrors = errors.filterNotNull()
      if (resolvedErrors.isNotEmpty()) {
        promise.reject("ratchetDecrypt", "errors while decrypting: $resolvedErrors")
      } else {
        promise.resolve("true")
      }
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun bulkRatchetEncrypt(participantsJson: String, requestJson: String, promise: Promise) {
    val participantsReq: ArrayList<ApiDirectCastKeysByAccount> = try {
      Json{explicitNulls = false; ignoreUnknownKeys = true}.decodeFromString(participantsJson)
    } catch (e: Exception) {
      promise.reject("ratchetEncrypt", "bad json participants ${e.message}")
      return
    }

    val req: RatchetEncryptRequest = try {
      Json{explicitNulls = false; ignoreUnknownKeys = true}.decodeFromString(requestJson)
    } catch (e: Exception) {
      promise.reject("ratchetEncrypt", "bad json ratchet encrypt request ${e.message}")
      return
    }

    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("ratchetEncrypt", "could not load keystore ${e.message}")
      return
    }

    val knownParticipants = try {
      this.getAllParticipantsForConversation(req.conversationId)
    } catch (e: Exception) {
      promise.reject("ratchetEncrypt", "could not get participants")
      return
    }

    val keys = try {
      this.getAllKeys()
    } catch (e: Exception) {
      promise.reject("ratchetEncrypt", "could not get keys")
      return
    }

    val keysGroupedByFid = participantsReq.groupBy { it.user.fid }
    // some androids are slower than others, let's capture this time at onset
    // so the backstamping at add time lines up with expectations
    val initiatingTime = System.currentTimeMillis()

    val idkRecord = keys.first { it.keyType == "idk" }
    val spkRecord = keys.first { it.keyType == "spk" }
    val idk = Base64.getDecoder().decode(idkRecord.privateKey)
    val spk = Base64.getDecoder().decode(spkRecord.privateKey)

    val messageId = req.messageId ?: UUID.randomUUID().toString()
    val base64MessageId = Base64.getEncoder().encodeToString(messageId.toByteArray())
    try {
      val existingConversation = this.getConversation(req.conversationId)
      if (existingConversation == null) {
        val currentTimeMillis = System.currentTimeMillis()
        this.addConversation(
          Conversation(
            req.conversationId,
            currentTimeMillis,
            currentTimeMillis + 1000,
            "",
            60L * 24 * 60 * 60 * 1000, // Assuming retention time is 60 days in milliseconds
            arrayOf(),
            null,
            0
          )
        )
      }
    } catch (error: Exception) {
      promise.reject("ratchetEncrypt", "could not create conversation: $error")
      return
    }

    val messages: MutableList<ApiDirectCastMessage?> = mutableListOf()

    GlobalScope.launch {
      val jobs = mutableListOf<Job>()
      val idkDict = mutableMapOf<String, Pair<Int, ApiDirectCastKey>>()
      val spkDict = mutableMapOf<String, Pair<Int, ApiDirectCastKey>>()

      for (participant in participantsReq) {
        for (i in participant.keys.idk) {
          idkDict[i.inboxId] = Pair(participant.user.fid, i)
        }
        for (i in participant.keys.spk) {
          spkDict[i.inboxId] = Pair(participant.user.fid, i)
        }
      }

      for ((inboxId, pair) in idkDict) {
        val fid = pair.first
        val inboxIdk = pair.second
        val userAndKeys = keysGroupedByFid[fid]?.get(0)
        val user = userAndKeys?.user
        val userJson = Json{explicitNulls = false; ignoreUnknownKeys = true}.encodeToString(user)

        var knownParticipant = knownParticipants.firstOrNull { it.inboxId == inboxId }
        if (knownParticipant == null) {
          val sepk = X25519.generatePrivateKey()
          val base64PrivateKey = Base64.getEncoder().encodeToString(sepk)
          val base64PublicKey = Base64.getEncoder().encodeToString(X25519.publicFromPrivate(sepk))

          val cidk = Base64.getDecoder().decode(inboxIdk.base64PublicKey)
          val cspk = Base64.getDecoder().decode(spkDict[inboxId]!!.second.base64PublicKey)
          val hash1 = MessageDigest.getInstance("SHA-256")
          val dh1 = idk?.let { X25519.computeSharedSecret(it, cspk!!) }
          val dh1Key = hash1.digest(dh1)
          val hash2 = MessageDigest.getInstance("SHA-256")
          val dh2 = sepk?.let { X25519.computeSharedSecret(it, cidk!!) }
          val dh2Key = hash2.digest(dh2)
          val hash3 = MessageDigest.getInstance("SHA-256")
          val dh3 = sepk?.let { X25519.computeSharedSecret(it, cspk!!) }
          val dh3Key = hash3.digest(dh3)

          val base64Salt = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

          val info = "farcaster"
          var outputLength = 32

          var key = ByteArray(0)
          key += Base64.getDecoder().decode("//////////////////////////////////////////8=")

          for (dhKey in listOf(dh1Key, dh2Key, dh3Key)) {
            key += dhKey
          }

          var salt = Base64.getDecoder().decode(base64Salt)

          val sessionKey = Hkdf.computeHkdf(
            "HmacSha256",
            key,
            salt,
            info.toByteArray(Charsets.UTF_8),
            outputLength
          )

          key = Base64.getDecoder().decode("//////////////////////////////////////////8=")
          key += sessionKey!!

          salt = Base64.getDecoder().decode(base64Salt)!!
          salt += dh3Key

          var results: MutableList<ByteArray> = mutableListOf()

          outputLength = 64
          var derivedKey = Hkdf.computeHkdf(
            "HmacSha256",
            key,
            salt,
            info.toByteArray(Charsets.UTF_8),
            outputLength
          )

          results = (0 until outputLength step 32).map {
            derivedKey.sliceArray(it until minOf(it + 32, outputLength))
          }.toMutableList()

          knownParticipant = ConversationParticipant(
            conversationId = req.conversationId,
            inboxId = inboxId,
            fid = fid,
            address = inboxIdk.account,
            userInfo = userJson,
            joinedAt = (Date().time * 1000),
            identityKey = inboxIdk.base64PublicKey,
            signedPreKey = spkDict[inboxId]!!.second.base64PublicKey,
            rootKey = Base64.getEncoder().encodeToString(results[0]),
            currentReceivingChainLength = 0,
            previousChainLength = 0,
            currentSendingChainLength = 0,
            sendingEphemeralKey = base64PrivateKey,
            receivingEphemeralKey = Base64.getEncoder().encodeToString(cspk),
            sendingChainKey = Base64.getEncoder().encodeToString(results[1]),
            receivingChainKey = "",
            skippedReceivingKeysMap = ""
          )

          try {
            this@FarcasterCryptographyReactNativeModule.addParticipant(knownParticipant)
          } catch (e: Exception) {
            return@launch
          }
        }

        val key = Base64.getDecoder().decode(knownParticipant.sendingChainKey)
        try {
          val messageKey = this@FarcasterCryptographyReactNativeModule.hmacKDF(
            DeriveKeyOptions(
              derivationMode = "hmacsha256",
              base64Salt = "AQ==",
              saltKeyId = null,
              base64Prefix = null,
              inputKeyIds = emptyArray(),
              info = null,
              outputLength = 32
            ), key
          )

          val nextSendingChainKey = this@FarcasterCryptographyReactNativeModule.hmacKDF(
            DeriveKeyOptions(
              derivationMode = "hmacsha256",
              base64Salt = "Ag==",
              saltKeyId = null,
              base64Prefix = null,
              inputKeyIds = emptyArray(),
              info = null,
              outputLength = 32
            ), key
          )

          val aeadPrefix = this@FarcasterCryptographyReactNativeModule.hmacKDF(
            DeriveKeyOptions(
              derivationMode = "hmacsha256",
              base64Salt = "Aw==",
              saltKeyId = null,
              base64Prefix = null,
              inputKeyIds = emptyArray(),
              info = null,
              outputLength = 32
            ), key
          )

          val ciphertext = this@FarcasterCryptographyReactNativeModule.encryptInternalSym(messageKey!!, aeadPrefix!!, req.message)

          val message = ApiDirectCastMessage(
            conversationId = req.conversationId,
            inboxId = knownParticipant?.inboxId ?: "",
            messageId = messageId,
            account = req.account,
            fid = req.fid,
            base64Identifier = base64MessageId,
            reinit = false,
            noNotify = false,
            serverTimestamp = 0,
            header = ApiDirectCastHeader(
              base64IdentityKey = idkRecord.publicKey,
              base64SignedPreKey = spkRecord.publicKey,
              base64EphemeralKey = Base64.getEncoder().encodeToString(X25519.publicFromPrivate(Base64.getDecoder().decode(knownParticipant?.sendingEphemeralKey))) ?: "",
              previousChainLength = knownParticipant?.previousChainLength ?: 0,
              messageNumber = knownParticipant?.currentSendingChainLength ?: 0
            ),
            ciphertext = ciphertext
          )

          knownParticipant?.let {
            it.userInfo = userJson
            it.sendingChainKey = Base64.getEncoder().encodeToString(nextSendingChainKey)
            it.currentSendingChainLength++
            this@FarcasterCryptographyReactNativeModule.updateParticipant(it)
          }

          messages.add(message)
        } catch (error: Exception) {
          continue
        }
      }

      jobs.forEach { it.join() }

      val storedMessage = ConversationMessage(
        conversationId = req.conversationId,
        messageId = messageId,
        address = req.account,
        senderFid = req.fid,
        previousChainLength = 0,
        messageNumber = 0,
        timestamp = initiatingTime,
        message = req.message,
        messageType = "text-sending",
        noNotify = false
      )
      this@FarcasterCryptographyReactNativeModule.addMessage(storedMessage)

      val response = try {
        Json{explicitNulls = false; ignoreUnknownKeys = true}.encodeToString(messages)
      } catch (e: Exception) {
        promise.reject("encrypt", "could not encode")
        return@launch
      }

      promise.resolve(response)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun getPublicInboxKeys(promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      val keys = this.getAllKeys()
      if (keys.size == 0) {
        promise.reject("getPublicInboxKeys", "could not find keys")
        return
      }

      val idkRecord = keys?.first { it.keyType == "idk" }
      val spkRecord = keys?.first { it.keyType == "spk" }
      val ibxRecord = keys?.first { it.keyType == "ibx" }

      val strings = listOf(
        idkRecord!!.publicKey,
        spkRecord!!.publicKey,
        ibxRecord!!.publicKey
      )

      val json = Json{explicitNulls = false}.encodeToString(strings)
      if (json == null) {
        promise.reject("getPublicInboxKeys", "could not encode")
        return
      }

      promise.resolve(json)
    } catch (e: Exception) {
      promise.reject("getPublicInboxKeys", e.message)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun clearOldMessages(promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      this.db?.let {
        val cursor = it.execSQL(
          "DELETE FROM ${ConversationMessagesContract.TABLE_NAME} WHERE ${ConversationMessagesContract.COLUMN_TIMESTAMP} < ?;",
          arrayOf((28*24*60*60*1000L)))
      }

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("clearOldMessages", "error ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun deleteConversation(conversationId: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      this.db?.let {
        val cursor = it.execSQL(
          "DELETE FROM ${ConversationMessagesContract.TABLE_NAME} WHERE ${ConversationMessagesContract.COLUMN_CONVERSATION_ID} = ?;",
          arrayOf(conversationId))
      }

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("deleteConversation", "error ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun setMessageStatus(messageId: String, fid: Int, status: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

     this.db?.let {
        val cursor = it.execSQL(
          "UPDATE ${ConversationMessagesContract.TABLE_NAME} SET ${ConversationMessagesContract.COLUMN_MESSAGE_TYPE} = ? WHERE ${ConversationMessagesContract.COLUMN_MESSAGE_ID} = ? AND ${ConversationMessagesContract.COLUMN_SENDER_FID} = ?;",
          arrayOf(status, messageId, fid.toString()))
      }

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("setMessageStatus", "error ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun setConversationsRead(info: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      val json: ArrayList<ConversationReadInfo> = Json{explicitNulls = false}.decodeFromString(info)
      // skew it ahead 30s to catch up on bad cell tower time sync
      this.db?.let {
        for (info in json) {
          val skewedTimestamp = info.lastReadTime + 30000
          it.execSQL(
            "UPDATE ${ConversationMessagesContract.TABLE_NAME} SET ${ConversationMessagesContract.COLUMN_MESSAGE_TYPE} = ? WHERE ${ConversationMessagesContract.COLUMN_CONVERSATION_ID} = ? AND ${ConversationMessagesContract.COLUMN_TIMESTAMP} <= ?;",
            arrayOf("read", info.conversationId, skewedTimestamp))
          it.execSQL(
            "UPDATE ${ConversationsContract.TABLE_NAME} SET ${ConversationsContract.COLUMN_LAST_READ_TIME} = ? WHERE ${ConversationsContract.COLUMN_CONVERSATION_ID} = ?;",
            arrayOf(skewedTimestamp, info.conversationId))
        }
      }

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("setConversationsRead", "error ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun wipeData(promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      this.db?.let {
        it.execSQL(
          "DELETE FROM ${ConversationMessagesContract.TABLE_NAME};",
          arrayOf())
        it.execSQL(
          "DELETE FROM ${ConversationParticipantsContract.TABLE_NAME};",
          arrayOf())
        it.execSQL(
          "DELETE FROM ${ConversationsContract.TABLE_NAME};",
          arrayOf())
        it.execSQL(
          "DELETE FROM ${KeysContract.TABLE_NAME};",
          arrayOf())
      }

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("wipeData", "error ${e.message}")
    }
  }

  @RequiresApi(Build.VERSION_CODES.M)
  @ReactMethod
  fun initializeWithName(name: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }

      format.timeZone = TimeZone.getTimeZone("UTC")
      val dbHelper = EncryptedStoreUpgradeHelper(reactContext, name);
      this.db = dbHelper.writableDatabase
      this.masterKey = this.store?.getSymmetricKey("master")
      if (this.masterKey == null) {
        this.masterKey = this.store?.createMasterSymmetricKey()
        if (this.masterKey == null) {
          promise.reject("initializeWithName", "failed to initialize: could not get master key")
          return
        }
      }
      promise.resolve(true);
    } catch (e: Exception) {
      promise.reject("initializeWithName", "failed to initialize: ${e.message}")
    }
  }

  @ReactMethod
  fun name(promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
      promise.resolve(this.storeName);
    } catch (e: Exception) {
      promise.reject("name", "could not load keystore ${e.message}")
      return
    }
  }

  @ReactMethod
  fun getSignedPreKey(base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("getSignedPreKey", "could not load keystore ${e.message}")
      return
    }

    val spk = this.store?.getSignedPreKey(base64PublicKey)
    if (spk != null) {
      promise.resolve(Json.encodeToString(spk))
    } else {
      promise.reject("getSignedPreKey", "could not get signed pre key", null)
    }
  }

  @ReactMethod
  fun getIdentityKey(base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("getIdentityKey", "could not load keystore ${e.message}")
      return
    }

    val idk = this.store?.getIdentityKey(base64PublicKey)
    if (idk != null) {
      promise.resolve(Json.encodeToString(idk))
    } else {
      promise.reject("getIdentityKey", "could not get identity key", null)
    }
  }

  @ReactMethod
  fun getEphemeralKey(base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("getEphemeralKey", "could not load keystore ${e.message}")
      return
    }

    val epk = this.store?.getEphemeralKey(base64PublicKey)
    if (epk != null) {
      promise.resolve(Json.encodeToString(epk))
    } else {
      promise.reject("getEphemeralKey", "could not get ephemeral key", null)
    }
  }

  @ReactMethod
  fun getSymmetricKey(id: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("getSymmetricKey", "could not load keystore ${e.message}")
      return
    }

    val symKey = this.store?.getSymmetricKey(id)
    if (symKey != null) {
      promise.resolve(Json.encodeToString(symKey))
    } else {
      promise.reject("getSymmetricKey", "could not get symmetric key", null)
    }
  }

  @ReactMethod
  fun createIdentityKey(promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("createIdentityKey", "could not load keystore ${e.message}")
      return
    }

    val idk = this.store?.createIdentityKey();
    if (idk != null) {
      promise.resolve(Json.encodeToString(idk))
    } else {
      promise.reject("createIdentityKey", "could not create", null)
    }
  }

  @ReactMethod
  fun createSignedPreKey(identityBase64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("createSignedPreKey", "could not load keystore ${e.message}")
      return
    }

    val spk = this.store?.createSignedPreKey(identityBase64PublicKey);
    if (spk != null) {
      promise.resolve(Json.encodeToString(spk))
    } else {
      promise.reject("createSignedPreKey", "could not create", null)
    }
  }

  @ReactMethod
  fun createEphemeralKey(promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("createEphemeralKey", "could not load keystore ${e.message}")
      return
    }

    val epk = this.store?.createEphemeralKey();
    if (epk != null) {
      promise.resolve(Json.encodeToString(epk))
    } else {
      promise.reject("createEphemeralKey", "could not create", null)
    }
  }

  @ReactMethod
  fun deleteSignedPreKey(base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("deleteSignedPreKey", "could not load keystore ${e.message}")
      return
    }

    if (this.store?.deleteSignedPreKey(base64PublicKey) ?: false) {
      promise.resolve(true);
    } else {
      promise.reject("deleteSignedPreKey", "could not delete", null)
    }
  }

  @ReactMethod
  fun deleteEphemeralKey(base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("deleteEphemeralKey", "could not load keystore ${e.message}")
      return
    }

    if (this.store?.deleteEphemeralKey(base64PublicKey) ?: false) {
      promise.resolve(true);
    } else {
      promise.reject("deleteEphemeralKey", "could not delete", null)
    }
  }

  @ReactMethod
  fun deleteSymmetricKey(id: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("deleteSymmetricKey", "could not load keystore ${e.message}")
      return
    }

    if (this.store?.deleteSymmetricKey(id) ?: false) {
      promise.resolve(true);
    } else {
      promise.reject("deleteSymmetricKey", "could not delete", null)
    }
  }

  @ReactMethod
  fun parsePublicKey(base64PublicKey: String, promise: Promise) {
    promise.resolve(Json.encodeToString(FarcasterPublicKey(base64PublicKey)))
  }

  @ReactMethod
  fun deriveKey(options: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("deriveKey", "could not load keystore ${e.message}")
      return
    }

    val keys = this.store?.deriveKey(Json{
        explicitNulls = false
      }.decodeFromString(options))
    if (keys != null) {
      promise.resolve(Json.encodeToString(keys))
    } else {
      promise.reject("deriveKey", "could not derive", null)
    }
  }

  @ReactMethod
  fun agreeWithEphemeralKey(base64EphemeralPublicKey: String, base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("agreeWithEphemeralKey", "could not load keystore ${e.message}")
      return
    }

    val symKey = this.store?.agreeWithEphemeralKey(base64EphemeralPublicKey, base64PublicKey)
    if (symKey != null) {
      promise.resolve(Json.encodeToString(symKey))
    } else {
      promise.reject("agreeWithEphemeralKey", "could not derive", null)
    }
  }

  @ReactMethod
  fun agreeWithSignedPreKey(base64SignedPrePublicKey: String, base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("agreeWithSignedPreKey", "could not load keystore ${e.message}")
      return
    }

    val symKey = this.store?.agreeWithSignedPreKey(base64SignedPrePublicKey, base64PublicKey)
    if (symKey != null) {
      promise.resolve(Json.encodeToString(symKey))
    } else {
      promise.reject("agreeWithSignedPreKey", "could not derive", null)
    }
  }

  @ReactMethod
  fun agreeWithIdentityKey(base64IdentityPublicKey: String, base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("agreeWithIdentityKey", "could not load keystore ${e.message}")
      return
    }

    val symKey = this.store?.agreeWithIdentityKey(base64IdentityPublicKey, base64PublicKey)
    if (symKey != null) {
      promise.resolve(Json.encodeToString(symKey))
    } else {
      promise.reject("agreeWithIdentityKey", "could not derive", null)
    }
  }

  @ReactMethod
  fun decrypt(id: String, base64IV: String, base64Ciphertext: String, base64AssociatedData: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("decrypt", "could not load keystore ${e.message}")
      return
    }

    val output = this.store?.decrypt(id, base64IV, base64Ciphertext, base64AssociatedData)
    if (output != null) {
      promise.resolve(Json.encodeToString(output))
    } else {
      promise.reject("decrypt", "could not decrypt", null)
    }
  }

  @ReactMethod
  fun encrypt(id: String, base64Plaintext: String, aeadPrefixId: String?, base64AssociatedData: String?, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("encrypt", "could not load keystore ${e.message}")
      return
    }

    val output = this.store?.encrypt(id, base64Plaintext, aeadPrefixId, base64AssociatedData)
    if (output != null) {
      promise.resolve(Json.encodeToString(output))
    } else {
      promise.reject("encrypt", "could not encrypt", null)
    }
  }

  @ReactMethod
  fun compareKey(id: String, otherId: String, promise: Promise) {
    promise.reject("compareKey", "not supported", null);
  }

  @ReactMethod
  fun generateConfirmationValue(id: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("generateConfirmationValue", "could not load keystore ${e.message}")
      return
    }

    val confirmationValue = this.store?.generateConfirmationValue(id);
    if (confirmationValue != null) {
      promise.resolve(Json.encodeToString(confirmationValue));
    } else {
      promise.reject("generateConfirmationValue", "could not generate confirmation value", null);
    }
  }

  @ReactMethod
  fun wrapSymmetricKey(id: String, otherId: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("wrapSymmetricKey", "could not load keystore ${e.message}")
      return
    }

    val key = this.store?.encryptKey(id, otherId, "symmetric");
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("wrapSymmetricKey", "could not wrap symmetric key", null);
    }
  }

  @ReactMethod
  fun wrapEphemeralKey(id: String, base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("wrapEphemeralKey", "could not load keystore ${e.message}")
      return
    }

    val key = this.store?.encryptKey(id, base64PublicKey, "symmetric");
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("wrapEphemeralKey", "could not wrap ephemeral key", null);
    }
  }

  @ReactMethod
  fun wrapSignedPreKey(id: String, base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("wrapSignedPreKey", "could not load keystore ${e.message}")
      return
    }

    val key = this.store?.encryptKey(id, base64PublicKey, "pre");
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("wrapSignedPreKey", "could not wrap signed pre key", null);
    }
  }

  @ReactMethod
  fun wrapIdentityKey(id: String, base64PublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("wrapIdentityKey", "could not load keystore ${e.message}")
      return
    }

    val key = this.store?.encryptKey(id, base64PublicKey, "identity");
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("wrapIdentityKey", "could not wrap identity key", null);
    }
  }

  @ReactMethod
  fun unwrapSymmetricKey(id: String, ciphertext: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("unwrapSymmetricKey", "could not load keystore ${e.message}")
      return
    }

    val ciphertextJson: FarcasterCiphertext = Json{
        explicitNulls = false
      }.decodeFromString(ciphertext);
    val key = this.store?.decryptSymmetricKey(
      id,
      ciphertextJson.base64IV,
      ciphertextJson.base64Ciphertext,
      ciphertextJson.base64AssociatedData);
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("unwrapSymmetricKey", "could not unwrap symmetric key", null);
    }
  }

  @ReactMethod
  fun unwrapEphemeralKey(id: String, ciphertext: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("unwrapEphemeralKey", "could not load keystore ${e.message}")
      return
    }

    val ciphertextJson: FarcasterCiphertext = Json{
        explicitNulls = false
      }.decodeFromString(ciphertext);
    val key = this.store?.decryptPrivateKey(
      id,
      ciphertextJson.base64IV,
      ciphertextJson.base64Ciphertext,
      ciphertextJson.base64AssociatedData,
      "ephemeral");
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("unwrapEphemeralKey", "could not unwrap ephemeral key", null);
    }
  }

  @ReactMethod
  fun unwrapSignedPreKey(id: String, ciphertext: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("unwrapSignedPreKey", "could not load keystore ${e.message}")
      return
    }

    val ciphertextJson: FarcasterCiphertext = Json{
        explicitNulls = false
      }.decodeFromString(ciphertext);
    val key = this.store?.decryptPrivateKey(
      id,
      ciphertextJson.base64IV,
      ciphertextJson.base64Ciphertext,
      ciphertextJson.base64AssociatedData,
      "pre");
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("unwrapSignedPreKey", "could not unwrap signed pre key", null);
    }
  }

  @ReactMethod
  fun unwrapIdentityKey(id: String, ciphertext: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("unwrapIdentityKey", "could not load keystore ${e.message}")
      return
    }

    val ciphertextJson: FarcasterCiphertext = Json{
        explicitNulls = false
      }.decodeFromString(ciphertext);
    val key = this.store?.decryptPrivateKey(
      id,
      ciphertextJson.base64IV,
      ciphertextJson.base64Ciphertext,
      ciphertextJson.base64AssociatedData,
      "identity");
    if (key != null) {
      promise.resolve(Json.encodeToString(key));
    } else {
      promise.reject("unwrapIdentityKey", "could not unwrap identity key", null);
    }
  }

  @ReactMethod
  fun verifySignature(base64PublicKey: String, message: String, base64Signature: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("verifySignature", "could not load keystore ${e.message}")
      return
    }

    val verify = this.store?.verifySignature(base64PublicKey, message, base64Signature);
    if (verify != null) {
      promise.resolve(verify);
    } else {
      promise.reject("verifySignature", "could not verify signature", null);
    }
  }

  @ReactMethod
  fun verifyPublicKey(base64PublicKey: String, base64Signature: String, base64SigningPublicKey: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("verifyPublicKey", "could not load keystore ${e.message}")
      return
    }

    val verify = this.store?.verifyPublicKey(base64PublicKey, base64Signature, base64SigningPublicKey);
    if (verify != null) {
      promise.resolve(verify);
    } else {
      promise.reject("verifyPublicKey", "could not verify signature", null);
    }
  }

  @ReactMethod
  fun signWithIdentityKey(base64PublicKey: String, message: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("signWithIdentityKey", "could not load keystore ${e.message}")
      return
    }

    val signature = this.store?.signWithPrivateKey(base64PublicKey, message, "identity");
    if (signature != null) {
      promise.resolve(signature);
    } else {
      promise.reject("signWithIdentityKey", "could not sign with identity key", null);
    }
  }

  @ReactMethod
  fun signWithSignedPreKey(base64PublicKey: String, message: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("signWithSignedPreKey", "could not load keystore ${e.message}")
      return
    }

    val signature = this.store?.signWithPrivateKey(base64PublicKey, message, "pre");
    if (signature != null) {
      promise.resolve(signature);
    } else {
      promise.reject("signWithSignedPreKey", "could not sign with signed pre key", null);
    }
  }

  @ReactMethod
  fun signWithEphemeralKey(base64PublicKey: String, message: String, promise: Promise) {
    try {
      if (this.store == null) {
        this.store = LocalKeyStore(this.storeName, reactContext);
      }
    } catch (e: Exception) {
      promise.reject("signWithEphemeralKey", "could not load keystore ${e.message}")
      return
    }

    val signature = this.store?.signWithPrivateKey(base64PublicKey, message, "ephemeral");
    if (signature != null) {
      promise.resolve(signature);
    } else {
      promise.reject("signWithEphemeralKey", "could not sign with ephemeral key", null);
    }
  }

  private fun mapErrorCode(error: Exception): PassKeyError {
    return when (error) {
      is CreateCredentialCancellationException, is GetCredentialCancellationException -> PassKeyError.USER_CANCELED
      is NoCredentialException -> PassKeyError.NO_CREDENTIAL
      is CreateCredentialInterruptedException, is GetCredentialInterruptedException -> PassKeyError.REQUEST_FAILED
      is CreateCredentialProviderConfigurationException, is GetCredentialProviderConfigurationException -> PassKeyError.NOT_SUPPORTED
      is CreateCredentialCustomException, is GetCredentialCustomException -> PassKeyError.REQUEST_FAILED
      is CreateCredentialUnknownException, is GetCredentialUnknownException -> PassKeyError.REQUEST_FAILED
      is CreatePublicKeyCredentialDomException -> PassKeyError.REQUEST_FAILED
      else -> PassKeyError.REQUEST_FAILED
    }
  }
  
  /**
   * Maps IllegalStateException from passkey assertion/decryption flows to the
   * appropriate PassKeyError code. A "not_supported" prefix (thrown by
   * processAssertionResponse when the PRF key is missing) maps to NOT_SUPPORTED;
   * all other IllegalStateExceptions (including decryption failures) map to
   * REQUEST_FAILED.
   */
  private fun mapIllegalStateToPassKeyError(e: IllegalStateException): PassKeyError {
    return if (e.message?.startsWith("not_supported") == true) {
      PassKeyError.NOT_SUPPORTED
    } else {
      PassKeyError.REQUEST_FAILED
    }
  }

  /**
   * Builds the WebAuthn PRF eval extension JSON and attaches it to the given request object.
   * Used by both authenticate and addMnemonicToCredential.
   */
  private fun attachPrfExtension(jsonObject: JSONObject) {
    jsonObject.put("extensions", JSONObject().apply {
      put("prf", JSONObject().apply {
        put("eval", JSONObject().apply {
          put("first", PRF_EVAL_SALT)
        })
      })
    })
  }

  private fun encryptMnemonic(mnemonic: String, prfKey: ByteArray): String {
    try {
      val iv = ByteArray(16)
      SecureRandom().nextBytes(iv)

      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      val secretKey = SecretKeySpec(prfKey, 0, 32, "AES")
      val paramSpec = GCMParameterSpec(128, iv)
      cipher.init(Cipher.ENCRYPT_MODE, secretKey, paramSpec)

      val encryptedBytes = cipher.doFinal(mnemonic.toByteArray(Charsets.UTF_8))

      val combined = ByteArray(iv.size + encryptedBytes.size)
      System.arraycopy(iv, 0, combined, 0, iv.size)
      System.arraycopy(encryptedBytes, 0, combined, iv.size, encryptedBytes.size)

      return Base64.getEncoder().encodeToString(combined)
    } catch (e: Exception) {
      Log.e(TAG, "encryptMnemonic failed", e)
      throw IllegalStateException("Failed to encrypt mnemonic", e)
    }
  }
  
  private fun decryptMnemonic(encryptedData: String, prfKey: ByteArray): String {
    try {
      val combined = Base64.getDecoder().decode(encryptedData)

      val iv = ByteArray(16)
      val ciphertext = ByteArray(combined.size - 16)
      System.arraycopy(combined, 0, iv, 0, iv.size)
      System.arraycopy(combined, iv.size, ciphertext, 0, ciphertext.size)

      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      val secretKey = SecretKeySpec(prfKey, 0, 32, "AES")
      val paramSpec = GCMParameterSpec(128, iv)
      cipher.init(Cipher.DECRYPT_MODE, secretKey, paramSpec)

      val decryptedBytes = cipher.doFinal(ciphertext)
      return String(decryptedBytes, Charsets.UTF_8)
    } catch (e: Exception) {
      Log.e(TAG, "decryptMnemonic failed", e)
      throw IllegalStateException("Failed to decrypt mnemonic", e)
    }
  }

  private suspend fun <T> Task<T>.awaitResult(): T =
    suspendCancellableCoroutine { cont ->
      addOnSuccessListener { if (!cont.isCancelled) cont.resume(it) }
      addOnFailureListener { if (!cont.isCancelled) cont.resumeWithException(it) }
    }

  /**
   * Block Store Integration — Security Profile
   *
   * Stores PRF-encrypted mnemonics in Google Block Store as a backup that survives
   * app uninstall. This supplements SharedPreferences (primary, fast) with cloud-backed
   * storage that persists when app data is wiped.
   *
   * ENCRYPTION MODEL:
   * The mnemonic is AES-256-GCM encrypted BEFORE reaching Block Store. The encryption
   * key is the raw output of the WebAuthn PRF extension — a PRF evaluated by the
   * authenticator using internal platform-managed key material and PRF_EVAL_SALT.
   * This 32-byte output is used as the AES-256-GCM key (the PRF extension
   * returns exactly 256 bits). The key material is
   * platform-managed and requires biometric/PIN authentication to use. Without the
   * passkey, the stored blob is protected by AES-256-GCM keyed from a
   * platform-managed PRF output, making decryption computationally infeasible.
   *
   * WHY THIS IS SAFE TO STORE IN BLOCK STORE:
   * - Block Store's own E2EE is conditional (requires Android 9+ with screen lock).
   *   When E2EE is unavailable, Google holds the transport encryption keys.
   * - However, our data is PRF-encrypted at the application layer. Even if Block Store's
   *   encryption were fully compromised, an attacker would still need the user's passkey
   *   (platform-managed, biometric-protected) to derive the PRF key and decrypt the mnemonic.
   * - This is analogous to how iOS stores the mnemonic in iCloud Keychain — both use
   *   cloud-backed storage to survive app reinstall. The difference is that iOS relies on
   *   iCloud Keychain's platform-level encryption, while Android adds application-layer
   *   PRF encryption because Block Store's E2EE guarantees are weaker.
   * - The primary security boundary is the PRF encryption, not the storage layer.
   *
   * IMPORTANT: Every storeBytes() call MUST include setShouldBackupToCloud(true).
   * Omitting this flag causes Block Store to DELETE previously cloud-backed data
   * on the next periodic sync (verified behavior per Google docs).
   *
   * References:
   * - WebAuthn PRF extension: https://w3c.github.io/webauthn/#prf-extension
   * - Block Store API: https://developers.google.com/identity/blockstore
   * - AES-GCM (NIST SP 800-38D): https://csrc.nist.gov/publications/detail/sp/800-38d/final
   *   Note: the implementation uses a 128-bit IV; Java's GCM handles this via
   *   internal GHASH per SP 800-38D section 7.1 (the spec recommends 96-bit).
   * - Block Store backup behavior: https://developer.android.com/identity/blockstore
   */

  private suspend fun storeToBlockStore(credentialId: String, encryptedMnemonic: String) {
    val client = blockStoreClient ?: return
    try {
      // Read existing map from Block Store (may be empty on first write)
      val existingMap = try {
        val request = RetrieveBytesRequest.Builder()
          .setKeys(listOf("fc_mnemonics"))
          .build()
        val response = client.retrieveBytes(request).awaitResult()
        val existing = response.blockstoreDataMap["fc_mnemonics"]
        if (existing != null) {
          JSONObject(String(existing.bytes, Charsets.UTF_8))
        } else {
          JSONObject()
        }
      } catch (e: Exception) {
        Log.e(TAG, "Block Store read before write failed, skipping write to avoid overwriting other credentials", e)
        return
      }

      existingMap.put(credentialId, encryptedMnemonic)

      val data = StoreBytesData.Builder()
        .setKey("fc_mnemonics")
        .setBytes(existingMap.toString().toByteArray(Charsets.UTF_8))
        .setShouldBackupToCloud(true)
        .build()
      client.storeBytes(data).awaitResult()
      Log.d(TAG, "Block Store write succeeded for credential $credentialId")
    } catch (e: Exception) {
      Log.e(TAG, "Block Store write failed (non-fatal, primary storage succeeded)", e)
    }
  }

  private suspend fun retrieveFromBlockStore(credentialId: String): String? {
    val client = blockStoreClient ?: return null
    return try {
      val request = RetrieveBytesRequest.Builder()
        .setKeys(listOf("fc_mnemonics"))
        .build()
      val response = client.retrieveBytes(request).awaitResult()
      val entry = response.blockstoreDataMap["fc_mnemonics"] ?: return null
      val map = JSONObject(String(entry.bytes, Charsets.UTF_8))
      val value = map.optString(credentialId, "")
      if (value.isNotEmpty()) {
        Log.d(TAG, "Block Store read succeeded for credential $credentialId")
        value
      } else {
        null
      }
    } catch (e: Exception) {
      Log.e(TAG, "Block Store read failed (non-fatal, mnemonic recovery unavailable)", e)
      null
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun base64UrlDecode(base64UrlEncoded: String): ByteArray {
    var modifiedBase64 = base64UrlEncoded
      .replace('-', '+')
      .replace('_', '/')

    while (modifiedBase64.length % 4 != 0) {
      modifiedBase64 += '='
    }

    return Base64.getDecoder().decode(modifiedBase64)
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private fun extractPrfKey(credentialString: String): ByteArray? {
    try {
      try {
        val json = JSONObject(credentialString)
        val clientExtResults = json.optJSONObject("clientExtensionResults")
        Log.d(TAG, "extractPrfKey - clientExtensionResults present: ${clientExtResults != null}")
        if (clientExtResults != null) {
          val prfObj = clientExtResults.optJSONObject("prf")
          Log.d(TAG, "extractPrfKey - prf present: ${prfObj != null}")
          if (prfObj != null) {
            val resultsObj = prfObj.optJSONObject("results")
            Log.d(TAG, "extractPrfKey - results present: ${resultsObj != null}")
            if (resultsObj != null) {
              val firstValue = resultsObj.optString("first")
              Log.d(TAG, "extractPrfKey - first value empty: ${firstValue.isEmpty()}")
              if (firstValue.isNotEmpty()) {
                return base64UrlDecode(firstValue)
              }
            }
          }
        }
      } catch (e: Exception) {
        Log.d(TAG, "extractPrfKey - JSON parse failed, trying regex: ${e.message}")
        // Not valid JSON, try regex
      }

      val prfMatch = Regex("prf=\\{([^}]+)\\}").find(credentialString)
      if (prfMatch != null) {
        val prfContent = prfMatch.groupValues[1]
        val firstMatch = Regex("first=([^,\\s]+)").find(prfContent)
        if (firstMatch != null) {
          val base64Value = firstMatch.groupValues[1]
          return base64UrlDecode(base64Value)
        }
      }

      Log.e(TAG, "extractPrfKey - PRF key extraction failed, no PRF data found")
      return null
    } catch (e: Exception) {
      Log.e(TAG, "extractPrfKey - unexpected error", e)
      return null
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private fun processRegistrationResponse(responseJson: String): WritableMap {
    val jsonObject = JSONObject(responseJson)
    val rawId = jsonObject.optString("rawId", "")
    val response = jsonObject.optJSONObject("response")
    val attestationObject = response?.optString("attestationObject", "") ?: ""
    val clientDataJSON = response?.optString("clientDataJSON", "") ?: ""
    
    val authResponse = WritableNativeMap().apply {
      putString("rawAttestationObject", attestationObject)
      putString("rawClientDataJSON", clientDataJSON)
    }
    
    return WritableNativeMap().apply {
      putString("credentialID", rawId)
      putMap("response", authResponse)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private suspend fun processAssertionResponse(responseJson: String, credentialId: String): WritableMap {
    val jsonObject = JSONObject(responseJson)
    val rawId = jsonObject.optString("rawId", "")
    val response = jsonObject.optJSONObject("response")
    val authenticatorData = response?.optString("authenticatorData", "") ?: ""
    val clientDataJSON = response?.optString("clientDataJSON", "") ?: ""
    val signature = response?.optString("signature", "") ?: ""
    val userHandle = response?.optString("userHandle", "") ?: ""

    val prfKey = extractPrfKey(responseJson)
    val sharedPreferences = reactContext.getSharedPreferences("${storePrefix}${storeName}.passkeyMnemonics", Context.MODE_PRIVATE)
    val lookupId = credentialId.ifEmpty { rawId }
    var encryptedMnemonic = sharedPreferences.getString(lookupId, "")

    // Fallback: if SharedPreferences is empty (e.g. after reinstall), try Block Store
    if (encryptedMnemonic.isNullOrEmpty()) {
      val fromBlockStore = retrieveFromBlockStore(lookupId)
      if (!fromBlockStore.isNullOrEmpty()) {
        Log.d(TAG, "processAssertionResponse - recovered mnemonic from Block Store for $lookupId")
        encryptedMnemonic = fromBlockStore
        // Re-populate SharedPreferences for fast access next time
        sharedPreferences.edit().putString(lookupId, fromBlockStore).apply()
      }
    } else {
      // Opportunistic backfill: ensure existing mnemonics are in Block Store
      // so pre-update users are protected on their next sign-in
      storeToBlockStore(lookupId, encryptedMnemonic)
    }

    Log.d(TAG, "processAssertionResponse - prfKey present: ${prfKey != null}, encryptedMnemonic present: ${!encryptedMnemonic.isNullOrEmpty()}")

    val decryptedMnemonic = if (!encryptedMnemonic.isNullOrEmpty()) {
      // A mnemonic was previously stored for this credential, so PRF support and
      // successful decryption are required. Treat missing PRF data or decryption
      // failure as hard errors instead of silently omitting largeBlob.
      if (prfKey == null) {
        Log.e(TAG, "processAssertionResponse - PRF key missing for stored mnemonic")
        // Keep the JS-facing message stable ("not_supported") so React can
        // reliably match on it; detailed reason is logged above.
        throw IllegalStateException("not_supported")
      }

      val result = decryptMnemonic(encryptedMnemonic, prfKey)
      if (result.isEmpty()) {
        Log.e(TAG, "processAssertionResponse - decrypted mnemonic is empty despite encrypted data existing")
        throw IllegalStateException("request_failed: decrypted mnemonic is empty")
      }
      Log.d(TAG, "processAssertionResponse - decryption succeeded")
      result
    } else null
    
    val authResponse = WritableNativeMap().apply {
      putString("rawAuthenticatorData", authenticatorData)
      putString("rawClientDataJSON", clientDataJSON)
      putString("signature", signature)
    }
    
    return WritableNativeMap().apply {
      putString("credentialID", rawId)
      putString("userID", userHandle)
      putMap("response", authResponse)
      if (decryptedMnemonic != null) {
        putString("largeBlob", decryptedMnemonic)
      }
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private fun getStoredPasskeys(): List<StoredPasskey> {
    val sharedPreferences = reactContext.getSharedPreferences("$storePrefix$storeName", Context.MODE_PRIVATE)
    val rawJson = sharedPreferences.getString("passkeys", "[]") ?: "[]"
    
    return try {
      Json.decodeFromString<List<StoredPasskey>>(rawJson)
    } catch (e: Exception) {
      Log.e(TAG, "getStoredPasskeys - failed to parse stored passkeys JSON: $rawJson", e)
      throw e
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private fun saveStoredPasskeys(passkeys: List<StoredPasskey>) {
    val rawJson = Json.encodeToString(passkeys)
    val sharedPreferences = reactContext.getSharedPreferences("$storePrefix$storeName", Context.MODE_PRIVATE)
    sharedPreferences.edit().putString("passkeys", rawJson).apply()
  }

  @ReactMethod
  fun getStoredPasskeys(promise: Promise) {
    try {
      // Read under passkeyLock for consistency with updateStoredPasskeys/deleteStoredPasskey
      val passkeys = synchronized(passkeyLock) { getStoredPasskeys() }
      promise.resolve(Json.encodeToString(passkeys))
    } catch (e: Exception) {
      promise.reject("getStoredPasskeys", "Failed to get stored passkeys: ${e.message}", e)
    }
  }

  @ReactMethod
  fun updateStoredPasskeys(credentialId: String, passkey: String, promise: Promise) {
    try {
      synchronized(passkeyLock) {
        val storedPasskeys = getStoredPasskeys().toMutableList()
        val updatedPasskey = Json.decodeFromString<StoredPasskey>(passkey)

        var found = false
        val newPasskeys = storedPasskeys.map { existingPasskey ->
          if (existingPasskey.credentialId == credentialId) {
            found = true
            updatedPasskey
          } else {
            existingPasskey
          }
        }.toMutableList()

        if (!found) {
          newPasskeys.add(updatedPasskey)
        }

        saveStoredPasskeys(newPasskeys)
      }
      promise.resolve("true")
    } catch (e: Exception) {
      promise.reject("updateStoredPasskeys", "Failed to update stored passkeys: ${e.message}", e)
    }
  }

  @ReactMethod
  fun deleteStoredPasskey(credentialId: String, promise: Promise) {
    try {
      synchronized(passkeyLock) {
        val storedPasskeys = getStoredPasskeys().toMutableList()
        val newPasskeys = storedPasskeys.filter { it.credentialId != credentialId }
        saveStoredPasskeys(newPasskeys)
      }
      promise.resolve("true")
    } catch (e: Exception) {
      promise.reject("deleteStoredPasskey", "Failed to delete stored passkey: ${e.message}", e)
    }
  }

  @ReactMethod
  fun hasRecoveryData(credentialId: String, promise: Promise) {
    try {
      val sharedPreferences = reactContext.getSharedPreferences(
        "${storePrefix}${storeName}.passkeyMnemonics",
        Context.MODE_PRIVATE
      )
      val mnemonic = sharedPreferences.getString(credentialId, "")
      if (!mnemonic.isNullOrEmpty()) {
        promise.resolve(true)
        return
      }

      // Fallback: check Block Store
      moduleScope.launch {
        try {
          val fromBlockStore = retrieveFromBlockStore(credentialId)
          promise.resolve(!fromBlockStore.isNullOrEmpty())
        } catch (e: Exception) {
          Log.e(TAG, "hasRecoveryData - Block Store check failed", e)
          promise.resolve(false)
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "hasRecoveryData - check failed", e)
      promise.resolve(false)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun register(identifier: String, challenge: String, displayName: String, userId: String, promise: Promise) {
    Log.d(TAG, "register - rpId: $identifier, displayName: $displayName")
    val challengeData: ByteArray
    try {
      challengeData = Base64.getDecoder().decode(challenge)
    } catch (e: IllegalArgumentException) {
      return promise.reject(PassKeyError.INVALID_CHALLENGE.rawValue, PassKeyError.INVALID_CHALLENGE.rawValue, e)
    }
    try {
      
      val userIdData = Base64.getDecoder().decode(userId)

      val jsonString = JSONObject().apply {
        put("rp", JSONObject().apply {
          put("id", identifier)
          put("name", displayName)
        })
        put("user", JSONObject().apply {
          put("id", Base64.getUrlEncoder().withoutPadding().encodeToString(userIdData))
          put("name", displayName)
          put("displayName", displayName)
        })
        put("challenge", Base64.getUrlEncoder().withoutPadding().encodeToString(challengeData))
        put("pubKeyCredParams", JSONArray().apply {
          put(JSONObject().apply {
            put("type", "public-key")
            put("alg", -7)
          })
        })
        put("timeout", 60000)
        put("attestation", "direct")
        put("authenticatorSelection", JSONObject().apply {
          put("authenticatorAttachment", "platform")
          put("requireResidentKey", true)
          put("residentKey", "required")
          put("userVerification", "required")
        })
        put("extensions", JSONObject().apply {
          put("prf", JSONObject().apply {
            put("eval", JSONObject().apply {
              put("first", PRF_EVAL_SALT)
            })
          })
        })
      }.toString()
      
      // Fail fast if no on-device credential provider (e.g., Google Password
      // Manager) is available, rather than showing the cross-device fallback
      // UI (QR code, NFC, USB).
      val request = CreatePublicKeyCredentialRequest(
        requestJson = jsonString,
        preferImmediatelyAvailableCredentials = true
      )
      
      val activity = reactContext.currentActivity as? ComponentActivity
      if (activity == null) {
        Log.e(TAG, "register - no active ComponentActivity")
        return promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "No active activity", null)
      }

      moduleScope.launch {
        try {
          val result = credentialManager.createCredential(
            activity,
            request
          )
          
          if (result is CreatePublicKeyCredentialResponse) {
            try {
              val credString = result.registrationResponseJson
              Log.d(TAG, "register - credential created successfully")
              val authResult = processRegistrationResponse(credString)
              promise.resolve(authResult)
            } catch (e: Exception) {
              Log.e(TAG, "register - processRegistrationResponse failed", e)
              promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Failed to process registration response: ${e.message}", e)
            }
          } else {
            promise.reject(PassKeyError.REQUEST_FAILED.rawValue, PassKeyError.REQUEST_FAILED.rawValue, null)
          }
        } catch (e: CreateCredentialException) {
          val passkeyError = mapErrorCode(e)
          Log.e(TAG, "register - CreateCredentialException: ${e.type}", e)
          promise.reject(passkeyError.rawValue, passkeyError.rawValue, e)
        } catch (e: Exception) {
          Log.e(TAG, "register - unexpected error", e)
          promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Unexpected error: ${e.message}", e)
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "register - setup error", e)
      promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Error setting up request: ${e.message}", e)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun authenticate(identifier: String, challenge: String, credentialId: String, promise: Promise) {
    Log.d(TAG, "authenticate - rpId: $identifier")

    val challengeData: ByteArray
    try {
      challengeData = Base64.getDecoder().decode(challenge)
    } catch (e: IllegalArgumentException) {
      return promise.reject(PassKeyError.INVALID_CHALLENGE.rawValue, PassKeyError.INVALID_CHALLENGE.rawValue, e)
    }

    try {
      // Convert standard base64 challenge to base64url (no padding)
      val base64UrlChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(challengeData)
      val jsonObject = JSONObject().apply {
        put("rpId", identifier)
        put("challenge", base64UrlChallenge)
        if (credentialId.isNotEmpty()) {
          put("allowCredentials", JSONArray().apply {
            put(JSONObject().apply {
              put("type", "public-key")
              put("id", credentialId)
            })
          })
        }
        put("userVerification", "required")
        put("timeout", 60000)
      }
      attachPrfExtension(jsonObject)

      // Fail fast if no matching on-device credential is found, rather than
      // showing the cross-device fallback UI (QR code, NFC, USB).
      val getCredRequest = GetCredentialRequest(
        listOf(
          GetPublicKeyCredentialOption(
            requestJson = jsonObject.toString()
          )
        ),
        preferImmediatelyAvailableCredentials = true
      )

      val activity = reactContext.currentActivity as? ComponentActivity
      if (activity == null) {
        Log.e(TAG, "authenticate - no active ComponentActivity")
        return promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "No active activity", null)
      }

      moduleScope.launch {
        try {
          val result = credentialManager.getCredential(
            activity,
            getCredRequest
          )

          try {
            val credential = result.credential
            if (credential is PublicKeyCredential) {
              Log.d(TAG, "authenticate - credential received, processing response")
              val authResult = processAssertionResponse(credential.authenticationResponseJson, credentialId)
              promise.resolve(authResult)
            } else {
              Log.e(TAG, "authenticate - unexpected credential type: ${credential.javaClass.simpleName}")
              promise.reject(PassKeyError.REQUEST_FAILED.rawValue, PassKeyError.REQUEST_FAILED.rawValue, null)
            }
          } catch (e: IllegalStateException) {
            val errorCode = mapIllegalStateToPassKeyError(e)
            Log.e(TAG, "authenticate - assertion processing failed", e)
            promise.reject(errorCode.rawValue, e.message, e)
          } catch (e: Exception) {
            Log.e(TAG, "authenticate - error processing response", e)
            promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Unexpected error: ${e.message}", e)
          }
        } catch (e: GetCredentialException) {
          val passkeyError = mapErrorCode(e)
          Log.e(TAG, "authenticate - GetCredentialException: ${e.type}", e)
          promise.reject(passkeyError.rawValue, passkeyError.rawValue, e)
        } catch (e: Exception) {
          Log.e(TAG, "authenticate - unexpected error", e)
          promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Unexpected error: ${e.message}", e)
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "authenticate - setup error", e)
      promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Error setting up request: ${e.message}", e)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun addMnemonicToCredential(identifier: String, challenge: String, credentialId: String, mnemonic: String, promise: Promise) {
    Log.d(TAG, "addMnemonicToCredential - rpId: $identifier")
    if (mnemonic.isBlank()) {
      Log.e(TAG, "addMnemonicToCredential - mnemonic is empty or blank")
      return promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Mnemonic cannot be empty", null)
    }
    val challengeData: ByteArray
    try {
      challengeData = Base64.getDecoder().decode(challenge)
    } catch (e: IllegalArgumentException) {
      return promise.reject(PassKeyError.INVALID_CHALLENGE.rawValue, PassKeyError.INVALID_CHALLENGE.rawValue, e)
    }
    try {

      val jsonObject = JSONObject().apply {
        put("rpId", identifier)
        put("challenge", Base64.getUrlEncoder().withoutPadding().encodeToString(challengeData))
        put("allowCredentials", JSONArray().apply {
          put(JSONObject().apply {
            put("type", "public-key")
            put("id", credentialId)
          })
        })
        put("userVerification", "required")
        put("timeout", 60000)
      }
      attachPrfExtension(jsonObject)

      // Fail fast if no matching on-device credential is found, rather than
      // showing the cross-device fallback UI (QR code, NFC, USB).
      // Note: the retry loop below handles indexing latency separately.
      val getCredRequest = GetCredentialRequest(
        listOf(
          GetPublicKeyCredentialOption(
            requestJson = jsonObject.toString()
          )
        ),
        preferImmediatelyAvailableCredentials = true
      )

      moduleScope.launch {
        try {
          val activity = reactContext.currentActivity as? ComponentActivity
          if (activity == null) {
            Log.e(TAG, "addMnemonicToCredential - no active ComponentActivity")
            promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "No active activity", null)
            return@launch
          }

          // Google Password Manager may not have indexed a newly created passkey yet.
          // Poll every 500ms until the credential is discoverable (~5s).
          val maxAttempts = 11 // 1 immediate + 10 retries
          var result: GetCredentialResponse? = null
          for (attempt in 1..maxAttempts) {
            try {
              result = credentialManager.getCredential(activity, getCredRequest)
              break
            } catch (e: NoCredentialException) {
              Log.d(TAG, "addMnemonicToCredential - credential not indexed yet, attempt $attempt/$maxAttempts")
              if (attempt == maxAttempts) throw e
              delay(500)
            }
          }

          val credentialResponse = result ?: run {
            Log.e(TAG, "addMnemonicToCredential - getCredential returned null unexpectedly")
            promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "No credential result", null)
            return@launch
          }
          Log.d(TAG, "addMnemonicToCredential - getCredential returned: ${credentialResponse.javaClass.simpleName}")

          try {
            val credential = credentialResponse.credential
            if (credential is PublicKeyCredential) {
              Log.d(TAG, "addMnemonicToCredential - credential received, extracting PRF key")
              val prfKey = extractPrfKey(credential.authenticationResponseJson)
              if (prfKey == null) {
                Log.e(TAG, "addMnemonicToCredential - PRF key extraction failed, extension not supported by credential provider")
                promise.reject(PassKeyError.NOT_SUPPORTED.rawValue, "PRF extension not supported", null)
                return@launch
              }

              val encryptedMnemonic = encryptMnemonic(mnemonic, prfKey)

              val sharedPreferences = reactContext.getSharedPreferences(
                "${storePrefix}${storeName}.passkeyMnemonics",
                Context.MODE_PRIVATE
              )
              val committed = sharedPreferences.edit().putString(credentialId, encryptedMnemonic).commit()
              if (!committed) {
                Log.e(TAG, "addMnemonicToCredential - SharedPreferences commit failed for credential $credentialId")
                promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Failed to persist encrypted mnemonic", null)
                return@launch
              }
              Log.d(TAG, "addMnemonicToCredential - mnemonic stored successfully")

              storeToBlockStore(credentialId, encryptedMnemonic)

              val authResult = processAssertionResponse(credential.authenticationResponseJson, credentialId)
              (authResult as WritableNativeMap).putString("largeBlob", mnemonic)
              promise.resolve(authResult)
            } else {
              Log.e(TAG, "addMnemonicToCredential - unexpected credential type: ${credential.javaClass.simpleName}")
              promise.reject(PassKeyError.REQUEST_FAILED.rawValue, PassKeyError.REQUEST_FAILED.rawValue, null)
            }
          } catch (e: IllegalStateException) {
            val errorCode = mapIllegalStateToPassKeyError(e)
            Log.e(TAG, "addMnemonicToCredential - assertion processing failed", e)
            promise.reject(errorCode.rawValue, e.message, e)
          } catch (e: Exception) {
            Log.e(TAG, "addMnemonicToCredential - error processing credential", e)
            promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Unexpected error: ${e.message}", e)
          }
        } catch (e: GetCredentialException) {
          val passkeyError = mapErrorCode(e)
          Log.e(TAG, "addMnemonicToCredential - GetCredentialException: ${e.type}", e)
          promise.reject(passkeyError.rawValue, passkeyError.rawValue, e)
        } catch (e: Exception) {
          Log.e(TAG, "addMnemonicToCredential - unexpected error", e)
          promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Unexpected error: ${e.message}", e)
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "addMnemonicToCredential - setup error", e)
      promise.reject(PassKeyError.REQUEST_FAILED.rawValue, "Error setting up request: ${e.message}", e)
    }
  }
}
