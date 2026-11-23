package seiraneko.kruztydynamics

import android.content.Context
import org.json.JSONObject

object NativeStrings {
  private val values = mapOf(
    "English (US)" to listOf("Kruzty Dynamics Service", "Restart", "Stop", "Dynamics RPC Service Started", "Dynamics RPC Service Stopped", "Unable to start Dynamics RPC Service", "Start Dynamics", "Stop Dynamics", "Start Kruzty Dynamics", "Stop Kruzty Dynamics", "Kruzty Dynamics Service is running"),
    "Filipino / Tagalog" to listOf("Serbisyo ng Kruzty Dynamics", "I-restart", "Ihinto", "Sinimulan ang Dynamics RPC Service", "Itinigil ang Dynamics RPC Service", "Hindi masimulan ang Dynamics RPC Service", "Simulan ang Dynamics", "Ihinto ang Dynamics", "Simulan ang Kruzty Dynamics", "Ihinto ang Kruzty Dynamics", "Tumatakbo ang serbisyo ng Kruzty Dynamics"),
    "Español" to listOf("Servicio de Kruzty Dynamics", "Reiniciar", "Detener", "Servicio Dynamics RPC iniciado", "Servicio Dynamics RPC detenido", "No se pudo iniciar el servicio Dynamics RPC", "Iniciar Dynamics", "Detener Dynamics", "Iniciar Kruzty Dynamics", "Detener Kruzty Dynamics", "El servicio de Kruzty Dynamics está en ejecución"),
    "日本語 (Japanese)" to listOf("Kruzty Dynamics サービス", "再起動", "停止", "Dynamics RPC サービスを開始しました", "Dynamics RPC サービスを停止しました", "Dynamics RPC サービスを開始できません", "Dynamics を開始", "Dynamics を停止", "Kruzty Dynamics を開始", "Kruzty Dynamics を停止", "Kruzty Dynamics サービスを実行中"),
    "Deutsch" to listOf("Kruzty-Dynamics-Dienst", "Neustarten", "Stoppen", "Dynamics-RPC-Dienst gestartet", "Dynamics-RPC-Dienst gestoppt", "Dynamics-RPC-Dienst konnte nicht gestartet werden", "Dynamics starten", "Dynamics stoppen", "Kruzty Dynamics starten", "Kruzty Dynamics stoppen", "Kruzty-Dynamics-Dienst läuft"),
    "Français" to listOf("Service Kruzty Dynamics", "Redémarrer", "Arrêter", "Service Dynamics RPC démarré", "Service Dynamics RPC arrêté", "Impossible de démarrer le service Dynamics RPC", "Démarrer Dynamics", "Arrêter Dynamics", "Démarrer Kruzty Dynamics", "Arrêter Kruzty Dynamics", "Le service Kruzty Dynamics est en cours d’exécution"),
    "Chinese (简体中文)" to listOf("Kruzty Dynamics 服务", "重启", "停止", "Dynamics RPC 服务已启动", "Dynamics RPC 服务已停止", "无法启动 Dynamics RPC 服务", "启动 Dynamics", "停止 Dynamics", "启动 Kruzty Dynamics", "停止 Kruzty Dynamics", "Kruzty Dynamics 服务正在运行"),
    "Bahasa Indonesia" to listOf("Layanan Kruzty Dynamics", "Mulai Ulang", "Berhenti", "Layanan RPC Dynamics Telah Dimulai", "Layanan RPC Dynamics Telah Berhenti", "Tidak dapat memulai Layanan RPC Dynamics", "Mulai Dynamics", "Hentikan Dynamics", "Mulai Kruzty Dynamics", "Hentikan Kruzty Dynamics", "Layanan Kruzty Dynamics sedang berjalan."),
    "한국어" to listOf("크루즈티 다이내믹스 서비스", "다시 시작", "중지", "Dynamics RPC 서비스가 시작되었습니다.", "Dynamics RPC 서비스가 중지되었습니다", "Dynamics RPC 서비스를 시작할 수 없습니다.", "Dynamics 시작", "Dynamics 중지", "Kruzty Dynamics 시작", "Kruzty Dynamics 중지", "Kruzty Dynamics 서비스가 실행 중입니다."),
    "Nederlands" to listOf("Kruzty Dynamics Service", "Opnieuw starten", "Stop", "Dynamics RPC-service gestart", "De Dynamics RPC-service is gestopt", "De Dynamics RPC-service kan niet worden gestart", "Start Dynamics", "Stop Dynamics", "Start Kruzty Dynamics", "Stop Kruzty Dynamics", "Kruzty Dynamics Service is actief."),
    "Русский" to listOf("Сервис «Kruzty Dynamics»", "Перезапуск", "Стоп", "Служба Dynamics RPC запущена", "Служба Dynamics RPC остановлена", "Не удалось запустить службу Dynamics RPC", "Запустить Dynamics", "Остановить Dynamics", "Запустить Kruzty Dynamics", "Остановить Kruzty Dynamics", "Служба «Kruzty Dynamics» запущена."),
    "Türkçe" to listOf("Kruzty Dynamics Hizmeti", "Yeniden başlat", "Durdur", "Dynamics RPC Hizmeti Başlatıldı", "Dynamics RPC Hizmeti Durduruldu", "Dynamics RPC Hizmeti başlatılamıyor", "Dynamics'i Başlat", "Dynamics'i Durdur", "Kruzty Dynamics'i başlat", "Kruzty Dynamics'i durdur", "Kruzty Dynamics Hizmeti çalışıyor."),
  )
  private val english = values.getValue("English (US)")
  private val indexes = mapOf("channel" to 0, "restart" to 1, "stop" to 2, "started" to 3, "stopped" to 4, "startFailed" to 5, "startShort" to 6, "stopShort" to 7, "startLong" to 8, "stopLong" to 9, "running" to 10)

  fun text(context: Context, key: String): String {
    val index = indexes[key] ?: return key
    val language = runCatching {
      val config = JSONObject(context.getSharedPreferences("kd_presence_runtime", Context.MODE_PRIVATE)
        .getString("config", "{}") ?: "{}")
      config.optString("language", "English (US)")
    }.getOrDefault("English (US)")
    val strings = values[language] ?: when {
      language == "English (Shakespearean)" -> english
      language in setOf("Alien (Zorblaxian)", "Pirate", "Alien (Unknown)", "UwU", "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", "\u1019\u103c\u1014\u103a\u1019\u102c\u1018\u102c\u101e\u102c", "Hrvatski", "\u05e2\u05d1\u05e8\u05d9\u05ea", "\u0939\u093f\u0928\u094d\u0926\u0940", "Italiano", "\u0641\u0627\u0631\u0633\u06cc", "Polski", "Portugu\u00eas Brasileiro", "\u7e41\u9ad4\u4e2d\u6587", "Ti\u1ebfng Vi\u1ec7t", "\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22") -> english
      language.startsWith("ja") -> values["日本語 (Japanese)"]!!
      language.startsWith("es") -> values["Español"]!!
      language.startsWith("fil") || language.startsWith("tl") -> values["Filipino / Tagalog"]!!
      language.startsWith("de") -> values["Deutsch"]!!
      language.startsWith("fr") -> values["Français"]!!
      language.startsWith("zh") -> values["Chinese (简体中文)"]!!
      else -> english
    }
    return strings[index]
  }
}
