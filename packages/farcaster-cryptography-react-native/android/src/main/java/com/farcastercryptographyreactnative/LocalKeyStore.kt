import android.content.Context
import android.content.Context.MODE_PRIVATE
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.ReactContext
import com.farcastercryptographyreactnative.*
import com.google.crypto.tink.Aead
import com.google.crypto.tink.Config
import com.google.crypto.tink.KeysetHandle
import com.google.crypto.tink.aead.AeadKeyTemplates
import com.google.crypto.tink.config.TinkConfig
import com.google.crypto.tink.integration.android.AndroidKeysetManager
import com.google.crypto.tink.subtle.Ed25519Sign
import com.google.crypto.tink.subtle.Ed25519Verify
import com.google.crypto.tink.subtle.Hkdf
import com.google.crypto.tink.subtle.X25519
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.ByteArrayOutputStream
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.*
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec


private const val TAG = "LocalKeyStore"

@RequiresApi(Build.VERSION_CODES.M)
class LocalKeyStore {
    lateinit var uri: String;
    lateinit var appContext: Context;
    lateinit var store: KeysetHandle;
    lateinit var aead: Aead

    constructor(name: String, reactContext: ReactContext) {
        this.uri = "android-keystore://farcaster_crypto_master_key_$name";
        this.appContext = reactContext.applicationContext;
        Config.register(TinkConfig.LATEST);
        this.initOrRepairStore(name, reactContext);
        this.aead = this.store.getPrimitive(Aead::class.java);
    }

    private fun initOrRepairStore(name: String, reactContext: ReactContext) {
        // Retry up to 5 times for transient Android Keystore failures
        // (https://issuetracker.google.com/issues/176215143#comment91)
        val maxAttempts = 5
        repeat(maxAttempts) { attempt ->
            runCatching {
                this.store = AndroidKeysetManager.Builder()
                    .withSharedPref(reactContext.applicationContext, name, "xyz.farcaster.crypto.master")
                    .withKeyTemplate(AeadKeyTemplates.AES256_GCM)
                    .withMasterKeyUri(this.uri)
                    .build()
                    .getKeysetHandle();
            }.onSuccess {
                return;
            }.onFailure { error ->
                if (attempt < maxAttempts - 1) {
                    Log.w(TAG, "initOrRepairStore - attempt ${attempt + 1}/$maxAttempts failed, retrying", error)
                    return@repeat
                }

                // Final attempt failed. The keystore state is unrecoverable (e.g.
                // stale SharedPreferences restored from backup without the matching
                // Android Keystore master key). Delete everything and recreate.
                Log.e(TAG, "initOrRepairStore - all $maxAttempts attempts failed, nuking keystore and recreating", error)
                try {
                    KeyStore.getInstance("AndroidKeyStore").apply {
                        load(null)
                        deleteEntry("farcaster_crypto_master_key_$name")
                    }
                    reactContext.deleteSharedPreferences("xyz.farcaster.crypto.master")

                    this.store = AndroidKeysetManager.Builder()
                        .withSharedPref(reactContext.applicationContext, name, "xyz.farcaster.crypto.master")
                        .withKeyTemplate(AeadKeyTemplates.AES256_GCM)
                        .withMasterKeyUri(this.uri)
                        .build()
                        .getKeysetHandle()
                    Log.w(TAG, "initOrRepairStore - recovery successful, keystore recreated")
                } catch (e: Exception) {
                    Log.e(TAG, "initOrRepairStore - recovery failed, keystore is unusable", e)
                    throw IllegalStateException(
                        "Android Keystore unrecoverable after $maxAttempts attempts and recovery failure", e
                    )
                }
            }
        }
    }

    private fun getKey(prefix: String, name: String): ByteArray? {
        val pref = this.appContext.getSharedPreferences("$prefix", MODE_PRIVATE);
        val base64Ciphertext = pref.getString(name, null) ?: return null;
        val rawBytes = Base64.getDecoder().decode(base64Ciphertext);
        return this.aead.decrypt(rawBytes, null);
    }

    private fun setKey(prefix: String, name: String, rawBytes: ByteArray): Boolean {
        val pref = this.appContext.getSharedPreferences("$prefix", MODE_PRIVATE);
        val ciphertext = this.aead.encrypt(rawBytes, null);
        val base64Ciphertext = Base64.getEncoder().encodeToString(ciphertext);
        return pref.edit().putString(name, base64Ciphertext).commit();
    }

    private fun deleteKey(prefix: String, name: String): Boolean {
        val pref = this.appContext.getSharedPreferences("$prefix", MODE_PRIVATE);
        return pref.edit().remove(name).commit();
    }

    fun getIdentityKey(base64PublicKey: String): FarcasterPrivateKey? {
        val keyBytes = this.getKey(
            "xyz.farcaster.crypto.identity",
            base64PublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('=')) ?: this.getKey(
            "xyz.farcaster.crypto.identity",
            "identity") ?: return null;

        val pubKey = X25519.publicFromPrivate(keyBytes);
        return FarcasterPrivateKey(Base64.getEncoder().encodeToString(pubKey));
    }

    fun getSignedPreKey(base64PublicKey: String): FarcasterPrivateKey? {
        val keyBytes = this.getKey(
            "xyz.farcaster.crypto.pre",
            base64PublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('=')) ?: return null;

        val pubKey = X25519.publicFromPrivate(keyBytes);
        if (Base64.getEncoder().encodeToString(pubKey) == base64PublicKey) {
            return FarcasterPrivateKey(base64PublicKey);
        }

        return null;
    }

    fun getEphemeralKey(base64PublicKey: String): FarcasterPrivateKey? {
        val keyBytes = this.getKey(
            "xyz.farcaster.crypto.ephemeral",
            base64PublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('=')) ?: return null;

        val pubKey = X25519.publicFromPrivate(keyBytes);
        if (Base64.getEncoder().encodeToString(pubKey) == base64PublicKey) {
            return FarcasterPrivateKey(base64PublicKey);
        }

        return null;
    }

    fun getSymmetricKey(id: String): FarcasterSymmetricKey? {
        val keyBytes = this.getKey(
            "xyz.farcaster.crypto.symmetric",
            id) ?: return null;

        return FarcasterSymmetricKey(id);
    }

    fun createIdentityKey(): FarcasterPrivateKey? {
        val keyBytes = X25519.generatePrivateKey();
        val pubKey = X25519.publicFromPrivate(keyBytes);
        val base64PublicKey = Base64.getEncoder().encodeToString(pubKey);
        return if (this.setKey("xyz.farcaster.crypto.identity",
            base64PublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('='), keyBytes)) {
            FarcasterPrivateKey(base64PublicKey);
        } else {
            null;
        }
    }

    fun createMasterSymmetricKey(): FarcasterSymmetricKey? {
        val key = ByteArray(32)
        val secureRandom = SecureRandom()
        secureRandom.nextBytes(key)
        this.setKey("xyz.farcaster.crypto.symmetric", "master", key) || return null;
        return FarcasterSymmetricKey("master")
    }

    fun createSignedPreKey(identityBase64PublicKey: String): FarcasterSignedPublicKey? {
        val identityKeyBytes = this.getKey(
            "xyz.farcaster.crypto.identity",
            identityBase64PublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('=')) ?: this.getKey(
            "xyz.farcaster.crypto.identity",
            "identity") ?: return null;

        val keyBytes = X25519.generatePrivateKey();
        val pubKey = X25519.publicFromPrivate(keyBytes);
        val base64PublicKey = Base64.getEncoder().encodeToString(pubKey);
        val base64Signature = Base64.getEncoder().encodeToString(
            Ed25519Sign(identityKeyBytes).sign(pubKey))

        return if (this.setKey("xyz.farcaster.crypto.pre", base64PublicKey
            .replace('+', '-')
            .replace('/', '_')
            .trimEnd('='), keyBytes)) {
            return FarcasterSignedPublicKey(base64PublicKey, base64Signature);
        } else {
            null;
        }
    }

    fun createEphemeralKey(): FarcasterPrivateKey? {
        val keyBytes = X25519.generatePrivateKey();
        val pubKey = X25519.publicFromPrivate(keyBytes);
        val base64PublicKey = Base64.getEncoder().encodeToString(pubKey);

        return if (this.setKey("xyz.farcaster.crypto.ephemeral", base64PublicKey
                .replace('+', '-')
                .replace('/', '_')
                .trimEnd('='), keyBytes)) {
            return FarcasterPrivateKey(base64PublicKey);
        } else {
            null;
        }
    }

    fun deleteSignedPreKey(base64PublicKey: String): Boolean {
        return this.deleteKey("xyz.farcaster.crypto.pre", base64PublicKey
            .replace('+', '-')
            .replace('/', '_')
            .trimEnd('='));
    }

    fun deleteEphemeralKey(base64PublicKey: String): Boolean {
        return this.deleteKey("xyz.farcaster.crypto.ephemeral", base64PublicKey
            .replace('+', '-')
            .replace('/', '_')
            .trimEnd('='));
    }

    fun deleteSymmetricKey(id: String): Boolean {
        return this.deleteKey("xyz.farcaster.crypto.symmetric", id);
    }

    fun deriveKey(options: DeriveKeyOptions): Array<FarcasterSymmetricKey>? {
        var key = ByteArray(0);

        if (options.base64Prefix != null) {
            key += Base64.getDecoder().decode(options.base64Prefix);
        }

        for (keyId in options.inputKeyIds) {
            key += this.getKey("xyz.farcaster.crypto.symmetric", keyId) ?: return null;
        }

        var salt = ByteArray(0);

        if (options.saltKeyId != null) {
            salt += this.getKey("xyz.farcaster.crypto.symmetric", options.saltKeyId) ?: return null;
        }

        if (options.base64Salt != null) {
            salt += Base64.getDecoder().decode(options.base64Salt);
        }

        if (options.derivationMode == "hmacsha256") {
            val mac = javax.crypto.Mac.getInstance("HMACSHA256");
            val secret = SecretKeySpec(key, "HmacSHA256");
            mac.init(secret);
            val output = mac.doFinal(salt);
            val uuid = UUID.randomUUID().toString();
            this.setKey("xyz.farcaster.crypto.symmetric", uuid, output) || return null;
            return arrayOf(FarcasterSymmetricKey(uuid));
        } else if (options.derivationMode == "hkdfsha256") {
            var info = ByteArray(0);

            if (options.info != null) {
                info += options.info.toByteArray(Charsets.UTF_8);
            }

            var output = Hkdf.computeHkdf("HMACSHA256", key, salt, info, options.outputLength);
            var keys = ArrayList<FarcasterSymmetricKey>()

            if (options.outputKeyLengths != null && options.outputKeyLengths < options.outputLength) {
                for (i in 0..(options.outputLength - 1) step options.outputKeyLengths) {
                    val bound = if ((i + options.outputKeyLengths - 1) < options.outputLength)
                        (i + options.outputKeyLengths - 1) else (options.outputLength - 1);

                    val uuid = UUID.randomUUID().toString();
                    this.setKey(
                        "xyz.farcaster.crypto.symmetric",
                        uuid,
                        output.slice(i..bound).toByteArray()) || return null;

                    keys.add(FarcasterSymmetricKey(uuid));
                }
            } else {
                val uuid = UUID.randomUUID().toString();
                this.setKey(
                    "xyz.farcaster.crypto.symmetric",
                    uuid,
                    output) || return null;

                keys.add(FarcasterSymmetricKey(uuid));
            }

            return keys.toTypedArray();
        }

        return null;
    }

    fun agreeWithEphemeralKey(base64EphemeralPublicKey: String, base64PublicKey: String): FarcasterSymmetricKey? {
        val keyBytes = this.getKey(
            "xyz.farcaster.crypto.ephemeral",
            base64EphemeralPublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('=')) ?: return null;

        val symKey = X25519.computeSharedSecret(keyBytes, Base64.getDecoder().decode(base64PublicKey));
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(symKey);
        val uuid = UUID.randomUUID().toString();
        this.setKey(
            "xyz.farcaster.crypto.symmetric",
            uuid,
            hash) || return null;

        return FarcasterSymmetricKey(uuid);
    }

    fun agreeWithSignedPreKey(base64SignedPrePublicKey: String, base64PublicKey: String): FarcasterSymmetricKey? {
        val keyBytes = this.getKey(
            "xyz.farcaster.crypto.pre",
            base64SignedPrePublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('=')) ?: return null;

        val symKey = X25519.computeSharedSecret(keyBytes, Base64.getDecoder().decode(base64PublicKey));
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(symKey);
        val uuid = UUID.randomUUID().toString();
        this.setKey(
            "xyz.farcaster.crypto.symmetric",
            uuid,
            hash) || return null;

        return FarcasterSymmetricKey(uuid);
    }

    fun agreeWithIdentityKey(base64IdentityPublicKey: String, base64PublicKey: String): FarcasterSymmetricKey? {
        val keyBytes = this.getKey(
            "xyz.farcaster.crypto.identity",
            base64IdentityPublicKey.replace('+', '-')
                .replace('/', '_')
                .trimEnd('=')) ?: this.getKey(
            "xyz.farcaster.crypto.identity",
            "identity") ?: return null;

        val symKey = X25519.computeSharedSecret(keyBytes, Base64.getDecoder().decode(base64PublicKey));
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(symKey);
        val uuid = UUID.randomUUID().toString();
        this.setKey(
            "xyz.farcaster.crypto.symmetric",
            uuid,
            hash) || return null;

        return FarcasterSymmetricKey(uuid);
    }

    fun decrypt(id: String, base64IV: String, base64Ciphertext: String, base64AssociatedData: String): String? {
        try {
            val key = this.getKey("xyz.farcaster.crypto.symmetric", id) ?: return null;
            val spec = SecretKeySpec(key, "AES");
            val iv = Base64.getDecoder().decode(base64IV);
            val cipher = Cipher.getInstance("AES/GCM/NoPadding");
            val gcmSpec = GCMParameterSpec(16 * 8, iv);
            val os = ByteArrayOutputStream();
            cipher.init(Cipher.DECRYPT_MODE, spec, gcmSpec);
            val a = Base64.getDecoder().decode(base64AssociatedData);
            cipher.updateAAD(a);
            val c = Base64.getDecoder().decode(base64Ciphertext);
            val output = cipher.update(c)

            if (output != null && output.isNotEmpty()) {
                os.write(output);
            }

            val fin = cipher.doFinal();

            if (fin != null && fin.isNotEmpty()) {
                os.write(fin);
            }

            return Base64.getEncoder().encodeToString(os.toByteArray());
        } catch (e: Exception) {
            return null;
        }
    }

    fun encrypt(id: String, base64Plaintext: String, aeadPrefixId: String?, base64AssociatedData: String?): FarcasterCiphertext? {
        try {
            val key = this.getKey("xyz.farcaster.crypto.symmetric", id) ?: return null;
            val spec = SecretKeySpec(key, "AES");
            val random = SecureRandom()
            val iv = ByteArray(12);
            random.nextBytes(iv);
            val cipher = Cipher.getInstance("AES/GCM/NoPadding");
            val gcmSpec = GCMParameterSpec(16 * 8, iv);
            var aeadData = if (aeadPrefixId != null) {
                this.getKey("xyz.farcaster.crypto.symmetric", id);
            } else {
                ByteArray(0)
            } ?: ByteArray(0)

            if (base64AssociatedData != null) {
                aeadData += Base64.getDecoder().decode(base64AssociatedData);
            }

            cipher.init(Cipher.ENCRYPT_MODE, spec, gcmSpec)
            cipher.update(Base64.getDecoder().decode(base64Plaintext));
            cipher.updateAAD(aeadData);
            var output = cipher.doFinal();
            return FarcasterCiphertext(
                Base64.getEncoder().encodeToString(iv),
                Base64.getEncoder().encodeToString(output),
                Base64.getEncoder().encodeToString(aeadData));
        } catch (e: Exception) {
            return null;
        }
    }

    fun encryptKey(id: String, otherId: String, type: String): FarcasterCiphertext? {
        try {
            val otherKey = this.getKey(
                "xyz.farcaster.crypto.$type",
                if (type == "symmetric") { otherId } else { otherId.replace('+', '-')
                    .replace('/', '_')
                    .trimEnd('=') }) ?: return null;
            return encrypt(
                id,
                Base64.getEncoder().encodeToString(otherKey),
                null,
                null);
        } catch (e: Exception) {
            return null;
        }
    }

    fun decryptSymmetricKey(id: String, base64IV: String, base64Ciphertext: String, base64AssociatedData: String): FarcasterSymmetricKey? {
        try {
            val rawSymKeyString = this.decrypt(id, base64IV, base64Ciphertext, base64AssociatedData);
            val rawSymKey = Base64.getDecoder().decode(rawSymKeyString);
            val uuid = UUID.randomUUID().toString();
            this.setKey(
                "xyz.farcaster.crypto.symmetric",
                uuid,
                rawSymKey) || return null;
            return FarcasterSymmetricKey(uuid);
        } catch (e: Exception) {
            return null;
        }
    }

    fun decryptPrivateKey(id: String, base64IV: String, base64Ciphertext: String, base64AssociatedData: String, type: String): FarcasterPrivateKey? {
        try {
            val rawPrivKeyString = this.decrypt(id, base64IV, base64Ciphertext, base64AssociatedData);
            val rawPrivKey = Base64.getDecoder().decode(rawPrivKeyString);
            val pubKey = X25519.publicFromPrivate(rawPrivKey);
            val base64PublicKey = Base64.getEncoder().encodeToString(pubKey);
            val name = base64PublicKey
                .replace('+', '-')
                .replace('/', '_')
                .trimEnd('=');
            return if (this.setKey("xyz.farcaster.crypto.$type", name, rawPrivKey)) {
                FarcasterPrivateKey(base64PublicKey);
            } else {
                null;
            }
        } catch (e: Exception) {
            return null;
        }
    }

    fun generateConfirmationValue(id: String): String? {
        try {
            val key = this.getKey("xyz.farcaster.crypto.symmetric", id) ?: return null;
            val digest = MessageDigest.getInstance("SHA-256");
            val hash = digest.digest(key);
            val outputString = hash.joinToString(separator = "") { eachByte -> "%02x".format(eachByte) };
            return outputString.substring(0, 6);
        } catch (e: Exception) {
            return null;
        }
    }

    fun verifySignature(base64PublicKey: String, message: String, base64Signature: String): Boolean {
        try {
            Ed25519Verify(Base64.getDecoder().decode(base64PublicKey)).verify(
                Base64.getDecoder().decode(base64Signature),
                message.toByteArray());
            return true;
        } catch (e: Exception) {
            return false;
        }
    }

    fun verifyPublicKey(base64PublicKey: String, base64Signature: String, base64SigningPublicKey: String): Boolean {
        try {
            Ed25519Verify(Base64.getDecoder().decode(base64SigningPublicKey)).verify(
                Base64.getDecoder().decode(base64Signature),
                Base64.getDecoder().decode(base64PublicKey));
            return true;
        } catch (e: Exception) {
            return false;
        }
    }

    fun signWithPrivateKey(base64PublicKey: String, message: String, type: String): String? {
        try {
            val name = base64PublicKey
                .replace('+', '-')
                .replace('/', '_')
                .trimEnd('=');
            val privKey = if (type == "identity") {
                this.getKey("xyz.farcaster.crypto." + type, name) ?:
                this.getKey("xyz.farcaster.crypto." + type, "identity")
            } else {
                this.getKey("xyz.farcaster.crypto." + type, name)
            };
            val pair = Ed25519Sign.KeyPair.newKeyPairFromSeed(privKey)
            val base64Signature = Base64.getEncoder().encodeToString(Ed25519Sign(privKey).sign(message.toByteArray()));
            val base64PublicKey = Base64.getEncoder().encodeToString(pair.publicKey);
            return Json.encodeToString(FarcasterSignature(base64PublicKey, base64Signature))
        } catch (e: Exception) {
            return null;
        }
    }
}