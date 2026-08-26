package com.farcastercryptographyreactnative

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import kotlinx.serialization.Serializable

object KeysContract {
  const val TABLE_NAME = "keys"
  const val COLUMN_PUBLIC_KEY = "publicKey"
  const val COLUMN_PRIVATE_KEY = "privateKey"
  const val COLUMN_KEY_TYPE = "keyType"

  fun toContentValues(key: Key): ContentValues {
    return ContentValues().apply {
      put(COLUMN_PUBLIC_KEY, key.publicKey)
      put(COLUMN_PRIVATE_KEY, key.privateKey)
      put(COLUMN_KEY_TYPE, key.keyType)
    }
  }

  fun insert(db: SQLiteDatabase, key: Key): Long {
    return db.insert(TABLE_NAME, null, toContentValues(key))
  }

  fun selectAll(db: SQLiteDatabase): Cursor {
    return db.query(TABLE_NAME, null, null, null, null, null, null)
  }

  fun select(db: SQLiteDatabase, publicKey: String): Cursor {
    return db.query(TABLE_NAME, null, "$COLUMN_PUBLIC_KEY = ?", arrayOf(publicKey), null, null, null)
  }

  fun update(db: SQLiteDatabase, key: Key): Int {
    return db.update(TABLE_NAME, toContentValues(key), "$COLUMN_PUBLIC_KEY = ?", arrayOf(key.publicKey))
  }

  fun delete(db: SQLiteDatabase, publicKey: String): Int {
    return db.delete(TABLE_NAME, "$COLUMN_PUBLIC_KEY = ?", arrayOf(publicKey))
  }
}

@Serializable
data class Key(
  val publicKey: String,
  val privateKey: String,
  val keyType: String
)
