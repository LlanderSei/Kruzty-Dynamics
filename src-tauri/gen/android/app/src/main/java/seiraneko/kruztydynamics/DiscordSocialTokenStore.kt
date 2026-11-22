package seiraneko.kruztydynamics

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

internal object DiscordSocialTokenStore {
  private const val PREFS = "kd_discord_social_credentials"
  private const val KEY_ALIAS = "kruzty_dynamics_discord_social"

  fun save(
    context: Context,
    accountId: String,
    accessToken: String,
    refreshToken: String,
    expiresAt: Long,
  ) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit()
      .putString(key(accountId, "access"), encrypt(accessToken))
      .putString(key(accountId, "refresh"), encrypt(refreshToken))
      .putLong(key(accountId, "expires"), expiresAt)
      .apply()
  }

  fun readAccessToken(context: Context, accountId: String): String? {
    val encrypted = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(key(accountId, "access"), null) ?: return null
    return runCatching { decrypt(encrypted) }.getOrNull()
  }

  fun readRefreshToken(context: Context, accountId: String): String? {
    val encrypted = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(key(accountId, "refresh"), null) ?: return null
    return runCatching { decrypt(encrypted) }.getOrNull()
  }

  fun expiresAt(context: Context, accountId: String): Long =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getLong(key(accountId, "expires"), 0L)

  fun remove(context: Context, accountId: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .remove(key(accountId, "access"))
      .remove(key(accountId, "refresh"))
      .remove(key(accountId, "expires"))
      .apply()
  }

  private fun key(accountId: String, kind: String) = "$kind:$accountId"

  private fun encrypt(value: String): String {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
    val ciphertext = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
    return Base64.encodeToString(cipher.iv + ciphertext, Base64.NO_WRAP)
  }

  private fun decrypt(encoded: String): String {
    val input = Base64.decode(encoded, Base64.NO_WRAP)
    require(input.size > GCM_IV_BYTES) { "Invalid encrypted Discord credential" }
    val iv = input.copyOfRange(0, GCM_IV_BYTES)
    val ciphertext = input.copyOfRange(GCM_IV_BYTES, input.size)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
    return cipher.doFinal(ciphertext).toString(Charsets.UTF_8)
  }

  private fun getOrCreateKey(): SecretKey {
    val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(
      KeyGenParameterSpec.Builder(
        KEY_ALIAS,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
      )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setRandomizedEncryptionRequired(true)
        .build(),
    )
    return generator.generateKey()
  }

  private const val GCM_IV_BYTES = 12
  private const val GCM_TAG_BITS = 128
}
