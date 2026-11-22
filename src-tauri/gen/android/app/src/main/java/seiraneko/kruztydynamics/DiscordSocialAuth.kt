package seiraneko.kruztydynamics

import android.content.Context
import android.net.Uri
import android.util.Base64
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.security.SecureRandom

internal object DiscordSocialAuth {
  const val APPLICATION_ID = "1572590527562391713"
  private const val OAUTH_PREFS = "kd_discord_social_oauth"
  private const val OAUTH_STATE = "state"
  private const val OAUTH_VERIFIER = "verifier"
  private const val REDIRECT_URI = "discord-$APPLICATION_ID:/authorize/callback"
  private const val TOKEN_URL = "https://discord.com/api/oauth2/token"
  private const val USER_URL = "https://discord.com/api/v10/users/@me"
  private const val SCOPE = "identify openid sdk.social_layer_presence"

  fun createAuthorizationUrl(context: Context): String {
    val verifier = randomUrlSafe(64)
    val state = randomUrlSafe(32)
    context.getSharedPreferences(OAUTH_PREFS, Context.MODE_PRIVATE).edit()
      .putString(OAUTH_VERIFIER, verifier)
      .putString(OAUTH_STATE, state)
      .apply()

    val challenge = Base64.encodeToString(
      MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII)),
      Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING,
    )
    return Uri.parse("https://discord.com/oauth2/authorize").buildUpon()
      .appendQueryParameter("client_id", APPLICATION_ID)
      .appendQueryParameter("redirect_uri", REDIRECT_URI)
      .appendQueryParameter("response_type", "code")
      .appendQueryParameter("scope", SCOPE)
      .appendQueryParameter("prompt", "consent")
      .appendQueryParameter("state", state)
      .appendQueryParameter("code_challenge", challenge)
      .appendQueryParameter("code_challenge_method", "S256")
      .build()
      .toString()
  }

  fun isCallback(uri: Uri): Boolean =
    uri.scheme == "discord-$APPLICATION_ID" && uri.path == "/authorize/callback"

  fun handleCallback(
    context: Context,
    uri: Uri,
    completion: (JSONObject?, String?) -> Unit,
  ) {
    if (!isCallback(uri)) {
      completion(null, "Discord returned to an unexpected callback URL")
      return
    }

    val prefs = context.getSharedPreferences(OAUTH_PREFS, Context.MODE_PRIVATE)
    val returnedState = uri.getQueryParameter("state")
    val expectedState = prefs.getString(OAUTH_STATE, null)
    val verifier = prefs.getString(OAUTH_VERIFIER, null)
    prefs.edit().remove(OAUTH_STATE).remove(OAUTH_VERIFIER).apply()

    if (uri.getQueryParameter("error") != null) {
      completion(null, "Discord authorization was cancelled or denied")
      return
    }
    if (returnedState.isNullOrBlank() || returnedState != expectedState || verifier.isNullOrBlank()) {
      completion(null, "Discord authorization session could not be verified")
      return
    }
    val code = uri.getQueryParameter("code")
    if (code.isNullOrBlank()) {
      completion(null, "Discord did not return an authorization code")
      return
    }

    Thread({
      try {
        val tokenResponse = exchangeCode(code, verifier)
        val accessToken = tokenResponse.getString("access_token")
        val refreshToken = tokenResponse.optString("refresh_token")
        val expiresAt = System.currentTimeMillis() + tokenResponse.optLong("expires_in", 3600L) * 1000L
        val user = fetchCurrentUser(accessToken)
        val accountId = user.optString("id")
        if (accountId.isBlank()) throw IllegalStateException("Discord did not return an account ID")

        DiscordSocialTokenStore.save(
          context.applicationContext,
          accountId,
          accessToken,
          refreshToken,
          expiresAt,
        )
        val avatarHash = user.optString("avatar")
        val avatarUrl = if (avatarHash.isNotBlank() && avatarHash != "null") {
          "https://cdn.discordapp.com/avatars/$accountId/$avatarHash.png?size=128"
        } else {
          val discriminator = user.optString("discriminator", "0").toIntOrNull() ?: 0
          "https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png"
        }
        val username = user.optString("username", "Discord user")
        val displayName = user.optString("global_name").takeIf { it.isNotBlank() && it != "null" } ?: username
        val profile = JSONObject()
          .put("id", accountId)
          .put("username", username)
          .put("displayName", displayName)
          .put("avatarUrl", avatarUrl)
          .put("isActive", false)
          .put("socialSdkLinked", true)
        completion(profile, null)
      } catch (error: Exception) {
        completion(null, error.message ?: "Discord account linking failed")
      }
    }, "discord-social-oauth").start()
  }

  fun removeAccount(context: Context, accountId: String) {
    if (accountId.isNotBlank()) DiscordSocialTokenStore.remove(context.applicationContext, accountId)
  }

  internal fun getFreshAccessToken(context: Context, accountId: String): String? {
    val validUntil = DiscordSocialTokenStore.expiresAt(context, accountId)
    if (validUntil > System.currentTimeMillis() + TOKEN_REFRESH_MARGIN_MS) {
      DiscordSocialTokenStore.readAccessToken(context, accountId)?.let { return it }
    }

    val refreshToken = DiscordSocialTokenStore.readRefreshToken(context, accountId) ?: return null
    val response = postForm(
      TOKEN_URL,
      linkedMapOf(
        "client_id" to APPLICATION_ID,
        "grant_type" to "refresh_token",
        "refresh_token" to refreshToken,
      ),
    )
    val accessToken = response.getString("access_token")
    val nextRefreshToken = response.optString("refresh_token").ifBlank { refreshToken }
    val expiresAt = System.currentTimeMillis() + response.optLong("expires_in", 3600L) * 1000L
    DiscordSocialTokenStore.save(context, accountId, accessToken, nextRefreshToken, expiresAt)
    return accessToken
  }

  private fun exchangeCode(code: String, verifier: String): JSONObject = postForm(
    TOKEN_URL,
    linkedMapOf(
      "client_id" to APPLICATION_ID,
      "grant_type" to "authorization_code",
      "code" to code,
      "redirect_uri" to REDIRECT_URI,
      "code_verifier" to verifier,
    ),
  )

  private fun fetchCurrentUser(accessToken: String): JSONObject {
    val connection = URL(USER_URL).openConnection() as HttpURLConnection
    connection.connectTimeout = HTTP_TIMEOUT_MS
    connection.readTimeout = HTTP_TIMEOUT_MS
    connection.setRequestProperty("Authorization", "Bearer $accessToken")
    return connection.useResponse { JSONObject(it) }
  }

  private fun postForm(url: String, values: Map<String, String>): JSONObject {
    val body = values.entries.joinToString("&") { (key, value) ->
      "${encode(key)}=${encode(value)}"
    }
    val connection = URL(url).openConnection() as HttpURLConnection
    connection.requestMethod = "POST"
    connection.connectTimeout = HTTP_TIMEOUT_MS
    connection.readTimeout = HTTP_TIMEOUT_MS
    connection.doOutput = true
    connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
    connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
    return connection.useResponse { response ->
      JSONObject(response)
    }
  }

  private inline fun <T> HttpURLConnection.useResponse(block: (String) -> T): T {
    try {
      val status = responseCode
      val stream = if (status in 200..299) inputStream else errorStream
      val response = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
      if (status !in 200..299) {
        throw IllegalStateException("Discord OAuth request failed (HTTP $status)")
      }
      return block(response)
    } finally {
      disconnect()
    }
  }

  private fun encode(value: String): String = URLEncoder.encode(value, Charsets.UTF_8.name())

  private fun randomUrlSafe(size: Int): String {
    val bytes = ByteArray(size)
    SecureRandom().nextBytes(bytes)
    return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
  }

  private const val HTTP_TIMEOUT_MS = 15000
  private const val TOKEN_REFRESH_MARGIN_MS = 60000L
}
