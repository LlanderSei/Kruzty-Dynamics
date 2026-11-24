package seiraneko.kruztydynamics

import android.Manifest
import android.annotation.SuppressLint
import android.app.AppOpsManager
import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.view.Gravity
import android.view.ViewGroup
import android.view.Window
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.util.Base64
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import org.json.JSONObject
import org.json.JSONArray
import java.io.ByteArrayOutputStream
import java.io.OutputStream

class MainActivity : TauriActivity() {
  var webViewRef: WebView? = null
  var backCallback: OnBackPressedCallback? = null
  private var pendingLogExport: String? = null
  private var discordLoginDialog: Dialog? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    val callback = object : OnBackPressedCallback(false) {
      override fun handleOnBackPressed() {
        webViewRef?.evaluateJavascript(
          "window.dispatchEvent(new CustomEvent('androidBack'));",
          null
        )
      }
    }
    backCallback = callback
    onBackPressedDispatcher.addCallback(this, callback)
    current = this
    updateServiceShortcut(this)
    runCatching {
      Class.forName("com.discord.socialsdk.DiscordSocialSdkInit")
        .getMethod("setEngineActivity", android.app.Activity::class.java)
        .invoke(null, this)
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    intent.data?.let { handleDiscordAuthCallback(it) }
  }

  private fun handleDiscordAuthCallback(uri: Uri) {
    if (!DiscordSocialAuth.isCallback(uri)) return
    DiscordSocialAuth.handleCallback(this, uri) { profile, error ->
      if (profile != null) {
        dispatchServiceEvent("discordSocialAccountLinked", profile)
      } else {
        dispatchServiceEvent("discordSocialLoginError", JSONObject().put("message", error ?: "Discord account linking failed"))
      }
      runOnUiThread { discordLoginDialog?.dismiss() }
    }
  }

  override fun onResume() {
    super.onResume()
    webViewRef?.evaluateJavascript(
      "window.dispatchEvent(new CustomEvent('androidPermissionsUpdated'));",
      null
    )
  }

  override fun onDestroy() {
    if (current === this) current = null
    super.onDestroy()
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode == LOG_EXPORT_REQUEST && resultCode == RESULT_OK) {
      val content = pendingLogExport
      val uri = data?.data
      if (content != null && uri != null) {
        runCatching { contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(content) } }
        dispatchServiceEvent("dynamicsLogExported", JSONObject().put("success", true))
      }
    }
    pendingLogExport = null
  }

  companion object {
    @Volatile private var current: MainActivity? = null

    fun dispatchServiceEvent(name: String, payload: JSONObject) {
      val activity = current ?: return
      val script = "window.dispatchEvent(new CustomEvent(${JSONObject.quote(name)}, { detail: ${payload} }));"
      activity.runOnUiThread { activity.webViewRef?.evaluateJavascript(script, null) }
    }

    @JvmStatic
    fun dispatchSdkLog(level: String, message: String) {
      dispatchServiceEvent("dynamicsLog", JSONObject().put("level", level).put("message", message))
    }

    private const val LOG_EXPORT_REQUEST = 2207
    fun updateServiceShortcut(context: Context) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) return
      val manager = context.getSystemService(ShortcutManager::class.java) ?: return
      val running = KruztyDynamicsService.isRunning
      val shortcut = ShortcutInfo.Builder(context, "kd_service_toggle")
        .setShortLabel(NativeStrings.text(context, if (running) "stopShort" else "startShort"))
        .setLongLabel(NativeStrings.text(context, if (running) "stopLong" else "startLong"))
        .setIcon(Icon.createWithResource(context, if (running) R.drawable.kd_service_stop else R.drawable.kd_service_start))
        .setIntent(Intent(context, ServiceShortcutActivity::class.java)
          .setAction(ServiceShortcutActivity.ACTION_TOGGLE))
        .build()
      if (manager.dynamicShortcuts.any { it.id == shortcut.id }) {
        manager.updateShortcuts(listOf(shortcut))
      } else {
        manager.setDynamicShortcuts(listOf(shortcut))
      }
    }
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    this.webViewRef = webView
    val bridge = AndroidNativeBridge(this)
    webView.addJavascriptInterface(bridge, "AndroidNativeBridge")
    webView.addJavascriptInterface(bridge, "AndroidThemeBridge")
  }

  fun checkUsageStatsPermission(): Boolean {
    return ServicePermissionChecks.hasUsageStats(this)
  }

  fun checkNotificationListenerPermission(): Boolean {
    return ServicePermissionChecks.hasNotificationListener(this)
  }

  fun checkBatteryOptimizationPermission(): Boolean {
    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    return powerManager.isIgnoringBatteryOptimizations(packageName)
  }

  fun checkPostNotificationPermission(): Boolean {
    return ServicePermissionChecks.hasPostNotifications(this)
  }

  class AndroidNativeBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun startPresenceService(config: String) {
      activity.getSharedPreferences("kd_presence_runtime", Context.MODE_PRIVATE)
        .edit().putString(KruztyDynamicsService.EXTRA_CONFIG, config).apply()
      val intent = Intent(activity, KruztyDynamicsService::class.java).apply {
        action = KruztyDynamicsService.ACTION_START
        putExtra(KruztyDynamicsService.EXTRA_CONFIG, config)
      }
      ContextCompat.startForegroundService(activity, intent)
    }

    @JavascriptInterface
    fun stopPresenceService() {
      activity.stopService(Intent(activity, KruztyDynamicsService::class.java))
    }

    @JavascriptInterface
    fun removeDiscordSocialAccount(accountId: String) {
      DiscordSocialAuth.removeAccount(activity, accountId)
    }

    @JavascriptInterface
    fun exportLogs(filename: String, content: String) {
      activity.pendingLogExport = content
      val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "text/plain"
        putExtra(Intent.EXTRA_TITLE, filename)
      }
      activity.startActivityForResult(intent, LOG_EXPORT_REQUEST)
    }

    @JavascriptInterface
    fun isPresenceServiceRunning(): Boolean = KruztyDynamicsService.isRunning

    @JavascriptInterface
    fun getPresenceServiceStatus(): String {
      if (!KruztyDynamicsService.isRunning) return "{}"
      return activity.getSharedPreferences("kd_presence_runtime", Context.MODE_PRIVATE)
        .getString(KruztyDynamicsService.LAST_STATUS, "{}") ?: "{}"
    }

    @JavascriptInterface
    fun getInstalledAppsAsync(requestId: String) {
      Thread({
        val payload = try {
          loadInstalledApps()
        } catch (error: Exception) {
          JSONObject().put("error", error.message ?: "Unable to load installed apps").toString()
        }
        val script = "window.dispatchEvent(new CustomEvent('installedAppsLoaded', { detail: { requestId: ${JSONObject.quote(requestId)}, payload: ${JSONObject.quote(payload)} } }));"
        activity.runOnUiThread {
          activity.webViewRef?.evaluateJavascript(script, null)
        }
      }, "installed-apps-loader").start()
    }

    private fun loadInstalledApps(): String {
      val packageManager = activity.packageManager
      val apps = JSONArray()
      packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
        .asSequence()
        .filter { it.enabled }
        .filter { packageManager.getLaunchIntentForPackage(it.packageName) != null }
        .map { info ->
          packageManager.getApplicationLabel(info).toString() to info.packageName
        }
        .sortedBy { it.first.lowercase() }
        .forEach { (label, packageName) ->
          val app = JSONObject()
            .put("systemLabel", label)
            .put("packageName", packageName)
          getAppIconBase64(packageName)?.let { app.put("iconBase64", it) }
          apps.put(app)
        }
      return apps.toString()
    }

    private fun getAppIconBase64(packageName: String): String? {
      return try {
        val icon = activity.packageManager.getApplicationIcon(packageName)
        val bitmap = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888)
        icon.setBounds(0, 0, bitmap.width, bitmap.height)
        icon.draw(Canvas(bitmap))
        val encoded = ByteArrayOutputStream().use { output ->
          bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
          Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
        }
        bitmap.recycle()
        encoded
      } catch (_: Exception) {
        null
      }
    }

    @JavascriptInterface
    fun setStatusBarTheme(mode: String) {
      activity.runOnUiThread {
        val isLight = mode.equals("light", ignoreCase = true)
        val insetsController = WindowCompat.getInsetsController(activity.window, activity.window.decorView)
        insetsController.isAppearanceLightStatusBars = isLight
        insetsController.isAppearanceLightNavigationBars = isLight
      }
    }

    @JavascriptInterface
    fun setCanGoBack(canGoBack: Boolean) {
      activity.runOnUiThread {
        activity.backCallback?.isEnabled = canGoBack
      }
    }

    @JavascriptInterface
    fun openExternalUrl(url: String) {
      activity.runOnUiThread {
        try {
          val intent = if (url.startsWith("intent:")) {
            Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
          } else {
            Intent(Intent.ACTION_VIEW, Uri.parse(url))
          }
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          activity.startActivity(intent)
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }

    @JavascriptInterface
    fun checkAllPermissions(): String {
      val json = JSONObject()
      json.put("usageStats", activity.checkUsageStatsPermission())
      json.put("notificationListener", activity.checkNotificationListenerPermission())
      json.put("batteryOptimizationsIgnored", activity.checkBatteryOptimizationPermission())
      json.put("postNotifications", activity.checkPostNotificationPermission())
      return json.toString()
    }

    @JavascriptInterface
    fun requestPermission(key: String) {
      activity.runOnUiThread {
        when (key) {
          "usageStats" -> {
            try {
              val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                data = Uri.parse("package:" + activity.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              }
              activity.startActivity(intent)
            } catch (e: Exception) {
              val fallback = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              }
              activity.startActivity(fallback)
            }
          }
          "notificationListener" -> {
            try {
              val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              }
              activity.startActivity(intent)
            } catch (e: Exception) {
              e.printStackTrace()
            }
          }
          "batteryOptimizationsIgnored" -> {
            try {
              val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:" + activity.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              }
              activity.startActivity(intent)
            } catch (e: Exception) {
              e.printStackTrace()
            }
          }
          "postNotifications" -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                1001
              )
            } else {
              try {
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                  putExtra(Settings.EXTRA_APP_PACKAGE, activity.packageName)
                  addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(intent)
              } catch (e: Exception) {
                e.printStackTrace()
              }
            }
          }
        }
      }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @JavascriptInterface
    fun openDiscordLoginPortal() {
      activity.runOnUiThread {
        try {
          val dialog = Dialog(activity, android.R.style.Theme_DeviceDefault_NoActionBar_Fullscreen)
          activity.discordLoginDialog = dialog
          dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)

          val root = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0e0e11"))
            layoutParams = ViewGroup.LayoutParams(
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT
            )
          }

          // Top action bar
          val header = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(32, 32, 32, 24)
            setBackgroundColor(Color.parseColor("#18181b"))
          }

          val titleLayout = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
          }

          val titleText = TextView(activity).apply {
            text = "Discord Login Portal"
            setTextColor(Color.WHITE)
            textSize = 15f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
          }

          val subText = TextView(activity).apply {
            text = "Sign in to connect Discord Rich Presence"
            setTextColor(Color.parseColor("#a1a1aa"))
            textSize = 11f
          }

          titleLayout.addView(titleText)
          titleLayout.addView(subText)

          val closeBtn = TextView(activity).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            textSize = 18f
            setPadding(24, 12, 12, 12)
            setOnClickListener { dialog.dismiss() }
          }

          header.addView(titleLayout)
          header.addView(closeBtn)
          root.addView(header)

          val progressBar = ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = true
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 8)
          }
          root.addView(progressBar)

          val portalWebView = WebView(activity).apply {
            layoutParams = LinearLayout.LayoutParams(
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT
            )
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          }

          val oauthUrl = DiscordSocialAuth.createAuthorizationUrl(activity)

          portalWebView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
              val uri = request?.url ?: return false
              if (DiscordSocialAuth.isCallback(uri)) {
                activity.handleDiscordAuthCallback(uri)
                return true
              }
              return false
            }
          }

          portalWebView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
              if (newProgress >= 100) {
                progressBar.visibility = android.view.View.GONE
              } else {
                progressBar.visibility = android.view.View.VISIBLE
              }
            }
          }

          portalWebView.loadUrl(oauthUrl)
          root.addView(portalWebView)

          dialog.setContentView(root)
          dialog.setOnDismissListener { activity.discordLoginDialog = null }
          dialog.show()
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }
  }
}
