package seiraneko.kruztydynamics

import android.Manifest
import android.annotation.SuppressLint
import android.app.AppOpsManager
import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
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
import android.webkit.WebView
import android.webkit.WebViewClient
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

class MainActivity : TauriActivity() {
  var webViewRef: WebView? = null
  var backCallback: OnBackPressedCallback? = null

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
  }

  override fun onResume() {
    super.onResume()
    webViewRef?.evaluateJavascript(
      "window.dispatchEvent(new CustomEvent('androidPermissionsUpdated'));",
      null
    )
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    this.webViewRef = webView
    val bridge = AndroidNativeBridge(this)
    webView.addJavascriptInterface(bridge, "AndroidNativeBridge")
    webView.addJavascriptInterface(bridge, "AndroidThemeBridge")
  }

  fun checkUsageStatsPermission(): Boolean {
    val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        packageName
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        packageName
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  fun checkNotificationListenerPermission(): Boolean {
    val enabledListeners = NotificationManagerCompat.getEnabledListenerPackages(this)
    return enabledListeners.contains(packageName)
  }

  fun checkBatteryOptimizationPermission(): Boolean {
    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    return powerManager.isIgnoringBatteryOptimizations(packageName)
  }

  fun checkPostNotificationPermission(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      ContextCompat.checkSelfPermission(
        this,
        Manifest.permission.POST_NOTIFICATIONS
      ) == PackageManager.PERMISSION_GRANTED
    } else {
      NotificationManagerCompat.from(this).areNotificationsEnabled()
    }
  }

  class AndroidNativeBridge(private val activity: MainActivity) {
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

          fun pollToken() {
            portalWebView.evaluateJavascript(
              """
              (function() {
                try {
                  var t = window.localStorage.getItem('token') || window.sessionStorage.getItem('token');
                  if (t) return t.replace(/^"(.*)"$/, '$1');
                } catch(e) {}
                return "";
              })();
              """.trimIndent()
            ) { value ->
              val clean = value?.trim('"', ' ', '\n')
              if (!clean.isNullOrEmpty() && clean != "null" && clean.length > 20) {
                activity.webViewRef?.evaluateJavascript(
                  "window.dispatchEvent(new CustomEvent('discordTokenCaptured', { detail: { token: '${clean}' } }));",
                  null
                )
                dialog.dismiss()
              }
            }
          }

          portalWebView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
              if (newProgress >= 100) {
                progressBar.visibility = android.view.View.GONE
                pollToken()
              } else {
                progressBar.visibility = android.view.View.VISIBLE
              }
            }
          }

          portalWebView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
              super.onPageFinished(view, url)
              pollToken()
            }
          }

          portalWebView.loadUrl("https://discord.com/login")
          root.addView(portalWebView)

          dialog.setContentView(root)
          dialog.show()
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }
  }
}
