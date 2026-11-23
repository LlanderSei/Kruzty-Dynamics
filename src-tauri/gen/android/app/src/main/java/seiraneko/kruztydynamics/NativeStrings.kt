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
  private const val englishInsufficientPermissions = "Insufficient Permissions. Please check Settings & More > Check Permissions"
  private val insufficientPermissionMessages = mapOf(
    "English (US)" to englishInsufficientPermissions,
    "English (Shakespearean)" to "Thou lackest permissions. Prithee, check Settings & More > Check Permissions.",
    "Filipino / Tagalog" to "Hindi sapat na pahintulot. Mangyaring suriin ang Mga Setting at iba pa > Suriin ang mga pahintulot.",
    "Espa\u00f1ol" to "Permisos insuficientes. Por favor, comprueba \u00abConfiguraci\u00f3n y m\u00e1s\u00bb > \u00abComprobar permisos\u00bb.",
    "\u65e5\u672c\u8a9e (Japanese)" to "\u6A29\u9650\u304C\u4E0D\u5341\u5206\u3067\u3059\u3002\u300C\u8A2D\u5B9A\u3068\u305D\u306E\u4ED6\u300D\uFF1E\u300C\u6A29\u9650\u306E\u78BA\u8A8D\u300D\u3092\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002",
    "Deutsch" to "Unzureichende Berechtigungen. Bitte \u00fcberpr\u00fcfen Sie \u201eEinstellungen & Mehr\u201c > \u201eBerechtigungen pr\u00fcfen\u201c.",
    "Fran\u00e7ais" to "Autorisations insuffisantes. Veuillez consulter \u00ab Param\u00e8tres et plus \u00bb > \u00ab V\u00e9rifier les autorisations \u00bb.",
    "Chinese (\u7b80\u4f53\u4e2d\u6587)" to "\u6743\u9650\u4E0D\u8DB3\u3002\u8BF7\u524D\u5F80\u201C\u8BBE\u7F6E\u4E0E\u66F4\u591A\u201D>\u201C\u68C0\u67E5\u6743\u9650\u201D\u3002",
    "Bahasa Indonesia" to "Izin tidak mencukupi. Silakan periksa Pengaturan & Lainnya > Periksa Izin.",
    "\ud55c\uad6d\uc5b4" to "\uAD8C\uD55C\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. \u2018\uC124\uC815 \uBC0F \uAE30\uD0C0\u2019 > \u2018\uAD8C\uD55C \uD655\uC778\u2019\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
    "Nederlands" to "Onvoldoende rechten. Ga naar Instellingen & meer > Rechten controleren.",
    "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" to "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u044B\u0435 \u043F\u0440\u0430\u0432\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u0432 \u0440\u0430\u0437\u0434\u0435\u043B \u00AB\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u0434\u0440\u0443\u0433\u043E\u0435\u00BB > \u00AB\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043F\u0440\u0430\u0432\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430\u00BB.",
    "T\u00fcrk\u00e7e" to "Yeterli izin yok. L\u00fctfen Ayarlar ve Di\u011Fer > \u0130zinleri Kontrol Et se\u00e7ene\u011fine g\u00f6z at\u0131n.",
    "Alien (Zorblaxian)" to "Insufficient permissions, K'thun. Check Settings & More > Check Permissions.",
    "Pirate" to "Arrr, ye lack permissions. Check Settings & More > Check Permissions, matey.",
    "Alien (Unknown)" to "Discord \u20b3\u20b5\u20b5\u00d8\u2c64\u0110 \u20b6\u20a5\u20a6\u00d8\u00d8\u2c64\u0110 \u20a6\u00d8\u00d8\u2c64\u0110.",
    "UwU" to "Not enough pewmissions uwu. Pwease check Settings & More > Check Pewmissions.",
    "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" to "\u0627\u0644\u0623\u0630\u0648\u0646\u0627\u062A \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u00AB\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0632\u064A\u062F\u00BB > \u00AB\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0623\u0630\u0648\u0646\u0627\u062A\u00BB.",
    "\u1019\u103c\u1014\u103a\u1019\u102c\u1018\u102c\u101e\u102c" to "\u1001\u103D\u1004\u1037\u103A\u1015\u103C\u102F\u1001\u103B\u1000\u103A \u1019\u101C\u102F\u1036\u101C\u1031\u102C\u1000\u103A\u1015\u102B\u104B \u1005\u1000\u103A\u1006\u1000\u103A\u1010\u1004\u103A\u1019\u103B\u102C\u1038 > \u1015\u102D\u102F\u1019\u102D\u102F > \u1001\u103D\u1004\u1037\u103A\u1015\u103C\u102F\u1001\u103B\u1000\u103A\u1019\u103B\u102C\u1038\u1000\u102D\u102F \u1005\u1005\u103A\u1006\u1031\u1038\u1015\u102B\u104B",
    "Hrvatski" to "Nedovoljna dopu\u0161tenja. Molimo provjerite Postavke i jo\u0161 > Provjeri dopu\u0161tenja.",
    "\u05e2\u05d1\u05e8\u05d9\u05ea" to "\u05D4\u05E8\u05E9\u05D0\u05D5\u05EA \u05DC\u05D0 \u05DE\u05E1\u05E4\u05D9\u05E7\u05D5\u05EA. \u05D0\u05E0\u05D0 \u05D1\u05D3\u05D5\u05E7 \u05D0\u05EA '\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA \u05D5\u05E2\u05D5\u05D3' > '\u05D1\u05D3\u05D5\u05E7 \u05D4\u05E8\u05E9\u05D0\u05D5\u05EA'.",
    "\u0939\u093f\u0928\u094d\u0926\u0940" to "\u0905\u0928\u0941\u092A\u092F\u0941\u0915\u094D\u0924 \u0905\u0928\u0941\u092E\u0924\u093F\u092F\u093E\u0901\u0964 \u0915\u0943\u092A\u092F\u093E \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938 \u0914\u0930 \u0905\u0927\u093F\u0915 > \u0905\u0928\u0941\u092E\u0924\u093F\u092F\u093E\u0901 \u091C\u093E\u0902\u091A\u0947\u0902\u0964",
    "Italiano" to "Autorizzazioni insufficienti. Controlla in \"Impostazioni e altro\" > \"Verifica autorizzazioni\".",
    "\u0641\u0627\u0631\u0633\u06cc" to "\u0645\u062C\u0648\u0632\u0647\u0627 \u0646\u0627\u06A9\u0627\u0641\u06CC \u0647\u0633\u062A\u0646\u062F. \u0644\u0637\u0641\u0627\u064B \u0628\u0647 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0648 \u0645\u0648\u0627\u0631\u062F \u062F\u06CC\u06AF\u0631 > \u0628\u0631\u0631\u0633\u06CC \u0645\u062C\u0648\u0632\u0647\u0627 \u0628\u0631\u0648\u06CC\u062F.",
    "Polski" to "Brak odpowiednich uprawnie\u0144. Sprawd\u017A opcj\u0119 \u201EUstawienia i wi\u0119cej\u201D > \u201ESprawd\u017A uprawnienia\u201D.",
    "Portugu\u00eas Brasileiro" to "Permiss\u00f5es insuficientes. Verifique em \u201CConfigura\u00e7\u00f5es e mais\u201D > \u201CVerificar permiss\u00f5es\u201D.",
    "\u7e41\u9ad4\u4e2d\u6587" to "\u6B0A\u9650\u4E0D\u8DB3\u3002\u8ACB\u524D\u5F80\u300C\u8A2D\u5B9A\u8207\u66F4\u591A\u300D>\u300C\u6AA2\u67E5\u6B0A\u9650\u300D\u3002",
    "Ti\u1ebfng Vi\u1ec7t" to "Kh\u00f4ng \u0111\u1ee7 quy\u1ec1n. Vui l\u00f2ng ki\u1ec3m tra C\u00e0i \u0111\u1eb7t & Th\u00eam > Ki\u1ec3m tra quy\u1ec1n.",
    "\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22" to englishInsufficientPermissions,
  )

  fun text(context: Context, key: String): String {
    if (key == "insufficientPermissions") {
      val language = selectedLanguage(context)
      return insufficientPermissionMessages[language] ?: englishInsufficientPermissions
    }
    val index = indexes[key] ?: return key
    val language = selectedLanguage(context)
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

  private fun selectedLanguage(context: Context): String = runCatching {
    val config = JSONObject(
      context.getSharedPreferences("kd_presence_runtime", Context.MODE_PRIVATE)
        .getString("config", "{}") ?: "{}"
    )
    config.optString("language", "English (US)")
  }.getOrDefault("English (US)")
}
