package seiraneko.kruztydynamics

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.core.content.ContextCompat

class ServiceShortcutActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (intent?.action != ACTION_TOGGLE) {
      finish()
      return
    }

    if (KruztyDynamicsService.isRunning) {
      stopService(Intent(this, KruztyDynamicsService::class.java))
      Toast.makeText(this, NativeStrings.text(this, "stopped"), Toast.LENGTH_SHORT).show()
    } else {
      if (!ServicePermissionChecks.hasRequired(this)) {
        Toast.makeText(
          this,
          NativeStrings.text(this, "insufficientPermissions"),
          Toast.LENGTH_LONG
        ).show()
        MainActivity.updateServiceShortcut(this)
        finish()
        return
      }

      val startIntent = Intent(this, KruztyDynamicsService::class.java)
        .setAction(KruztyDynamicsService.ACTION_START)
        .putExtra(KruztyDynamicsService.EXTRA_SHOW_SHORTCUT_TOAST, true)
      try {
        ContextCompat.startForegroundService(this, startIntent)
      } catch (_: SecurityException) {
        Toast.makeText(this, NativeStrings.text(this, "startFailed"), Toast.LENGTH_LONG).show()
      } catch (_: IllegalStateException) {
        Toast.makeText(this, NativeStrings.text(this, "startFailed"), Toast.LENGTH_LONG).show()
      }
    }

    MainActivity.updateServiceShortcut(this)
    finish()
  }

  companion object {
    const val ACTION_TOGGLE = "seiraneko.kruztydynamics.SHORTCUT_TOGGLE"
  }
}
