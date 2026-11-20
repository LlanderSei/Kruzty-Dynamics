export type SupportedLanguage =
  | 'System Default'
  | 'English (US)'
  | 'Filipino / Tagalog'
  | 'Español'
  | '日本語 (Japanese)'
  | 'Deutsch'
  | 'Français'
  | 'Chinese (简体中文)'

export interface TranslationDictionary {
  onboarding: {
    title: string
    subtitle: string
    privacyNotice: string
    permissionsSection: string
    permissionsRequired: string
    notificationTitle: string
    notificationDesc: string
    notificationCrucial: string
    usageTitle: string
    usageDesc: string
    batteryTitle: string
    batteryDesc: string
    postNotificationTitle: string
    postNotificationDesc: string
    grant: string
    granted: string
    userControlSection: string
    userControlDesc: string
    discordLoginTitle: string
    discordLoginDesc: string
    accountsConnected: string
    themeTitle: string
    languageTitle: string
    finishSetup: string
    continueForNow: string
    skipForNow: string
    allSet: string
    readyWhenYouAre: string
  }
  nav: {
    service: string
    accounts: string
    settings: string
  }
  header: {
    serviceActive: string
    serviceInactive: string
    serviceStarting: string
    serviceStopped: string
  }
  accounts: {
    title: string
    subtitle: string
    loginPortal: string
    loginWithToken: string
    addAccount: string
    activeIdentity: string
    stored: string
    remove: string
    noAccounts: string
    noAccountsDesc: string
  }
  settings: {
    title: string
    subtitle: string
    appPreferences: string
    themes: string
    themesDesc: string
    language: string
    languageDesc: string
    globalDefaults: string
    globalDefaultsDesc: string
    imgbbKey: string
    imgbbKeyDesc: string
    discordAppId: string
    discordAppIdDesc: string
    checkPermissions: string
    checkPermissionsDesc: string
    deleteCache: string
    deleteCacheDesc: string
  }
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  'English (US)': {
    onboarding: {
      title: 'First Time Setup',
      subtitle: 'Configure necessary permissions and accounts to enable dynamic Discord Rich Presence.',
      privacyNotice: 'This app does not collect or transmit user data.',
      permissionsSection: 'Permissions Control',
      permissionsRequired: 'Required for detection',
      notificationTitle: 'Notification Access',
      notificationDesc: 'Special App Access needed to detect media & playback',
      notificationCrucial: 'Crucial',
      usageTitle: 'Usage Access',
      usageDesc: 'Required to detect current running foreground application or game',
      batteryTitle: 'Battery Optimization',
      batteryDesc: 'Exempt app to prevent background service from sleeping',
      postNotificationTitle: 'Foreground Notification',
      postNotificationDesc: 'Android 13+ permission for persistent service notification',
      grant: 'Grant',
      granted: 'Granted',
      userControlSection: 'User Control',
      userControlDesc: 'Customization & Account',
      discordLoginTitle: 'Discord Login',
      discordLoginDesc: 'Connect your Discord account to project Rich Presence',
      accountsConnected: 'account logged in.',
      themeTitle: 'Theme',
      languageTitle: 'Language',
      finishSetup: 'Finish Setup',
      continueForNow: 'Continue for Now',
      skipForNow: 'Skip for Now',
      allSet: 'All set! Ready to project',
      readyWhenYouAre: 'Ready when you are',
    },
    nav: {
      service: 'Service',
      accounts: 'Accounts',
      settings: 'Settings & More',
    },
    header: {
      serviceActive: 'Active',
      serviceInactive: 'Inactive',
      serviceStarting: 'Starting',
      serviceStopped: 'Stopped',
    },
    accounts: {
      title: 'Discord Accounts',
      subtitle: 'Manage tokens and identities',
      loginPortal: 'Login via Discord Portal',
      loginWithToken: 'Add Account via Token',
      addAccount: 'Add Account',
      activeIdentity: 'Active Identity',
      stored: 'Stored',
      remove: 'Remove',
      noAccounts: 'No Discord Accounts',
      noAccountsDesc: 'Add your Discord account using the portal or a user token to start projecting rich presence.',
    },
    settings: {
      title: 'Settings and More',
      subtitle: 'App preferences & diagnostics',
      appPreferences: 'App Preferences',
      themes: 'Themes and Display',
      themesDesc: 'Set your theme and accent color.',
      language: 'Language',
      languageDesc: 'Currently Set:',
      globalDefaults: 'Global Defaults',
      globalDefaultsDesc: 'Activity type & status for unconfigured apps',
      imgbbKey: 'Set ImgBB API Key',
      imgbbKeyDesc: 'Set your own ImgBB API Key. Visit: api.imgbb.com',
      discordAppId: 'Set Discord Application ID',
      discordAppIdDesc: 'Set your own Discord Application ID. Visit: discord.com/developers',
      checkPermissions: 'Check Permissions',
      checkPermissionsDesc: 'Review granted and optional system access permissions',
      deleteCache: 'Delete Linked Image URLs',
      deleteCacheDesc: 'Clears associated URLs of uploaded images used on app or media status',
    },
  },
  'System Default': {
    onboarding: {
      title: 'First Time Setup',
      subtitle: 'Configure necessary permissions and accounts to enable dynamic Discord Rich Presence.',
      privacyNotice: 'This app does not collect or transmit user data.',
      permissionsSection: 'Permissions Control',
      permissionsRequired: 'Required for detection',
      notificationTitle: 'Notification Access',
      notificationDesc: 'Special App Access needed to detect media & playback',
      notificationCrucial: 'Crucial',
      usageTitle: 'Usage Access',
      usageDesc: 'Required to detect current running foreground application or game',
      batteryTitle: 'Battery Optimization',
      batteryDesc: 'Exempt app to prevent background service from sleeping',
      postNotificationTitle: 'Foreground Notification',
      postNotificationDesc: 'Android 13+ permission for persistent service notification',
      grant: 'Grant',
      granted: 'Granted',
      userControlSection: 'User Control',
      userControlDesc: 'Customization & Account',
      discordLoginTitle: 'Discord Login',
      discordLoginDesc: 'Connect your Discord account to project Rich Presence',
      accountsConnected: 'account logged in.',
      themeTitle: 'Theme',
      languageTitle: 'Language',
      finishSetup: 'Finish Setup',
      continueForNow: 'Continue for Now',
      skipForNow: 'Skip for Now',
      allSet: 'All set! Ready to project',
      readyWhenYouAre: 'Ready when you are',
    },
    nav: {
      service: 'Service',
      accounts: 'Accounts',
      settings: 'Settings & More',
    },
    header: {
      serviceActive: 'Active',
      serviceInactive: 'Inactive',
      serviceStarting: 'Starting',
      serviceStopped: 'Stopped',
    },
    accounts: {
      title: 'Discord Accounts',
      subtitle: 'Manage tokens and identities',
      loginPortal: 'Login via Discord Portal',
      loginWithToken: 'Add Account via Token',
      addAccount: 'Add Account',
      activeIdentity: 'Active Identity',
      stored: 'Stored',
      remove: 'Remove',
      noAccounts: 'No Discord Accounts',
      noAccountsDesc: 'Add your Discord account using the portal or a user token to start projecting rich presence.',
    },
    settings: {
      title: 'Settings and More',
      subtitle: 'App preferences & diagnostics',
      appPreferences: 'App Preferences',
      themes: 'Themes and Display',
      themesDesc: 'Set your theme and accent color.',
      language: 'Language',
      languageDesc: 'Currently Set:',
      globalDefaults: 'Global Defaults',
      globalDefaultsDesc: 'Activity type & status for unconfigured apps',
      imgbbKey: 'Set ImgBB API Key',
      imgbbKeyDesc: 'Set your own ImgBB API Key. Visit: api.imgbb.com',
      discordAppId: 'Set Discord Application ID',
      discordAppIdDesc: 'Set your own Discord Application ID. Visit: discord.com/developers',
      checkPermissions: 'Check Permissions',
      checkPermissionsDesc: 'Review granted and optional system access permissions',
      deleteCache: 'Delete Linked Image URLs',
      deleteCacheDesc: 'Clears associated URLs of uploaded images used on app or media status',
    },
  },
  'Filipino / Tagalog': {
    onboarding: {
      title: 'Unang Setup',
      subtitle: 'I-configure ang mga kinakailangang pahintulot at account para paganahin ang Discord Rich Presence.',
      privacyNotice: 'Hindi kumukuha o nagpapadala ng impormasyon ang app na ito.',
      permissionsSection: 'Pamamahala ng Pahintulot',
      permissionsRequired: 'Kailangan para sa pagtukoy',
      notificationTitle: 'Pahintulot sa Notipikasyon',
      notificationDesc: 'Kailangan para matukoy ang tumutugtog na kanta o video',
      notificationCrucial: 'Kritikal',
      usageTitle: 'Paggamit ng Access (Usage)',
      usageDesc: 'Kailangan para matukoy ang kasalukuyang binubuksang laro o app',
      batteryTitle: 'Optimisasyon ng Baterya',
      batteryDesc: 'I-exempt ang app upang hindi matulog sa background',
      postNotificationTitle: 'Notipikasyon sa Foreground',
      postNotificationDesc: 'Pahintulot ng Android 13+ para sa tuloy-tuloy na serbisyo',
      grant: 'Ibigay',
      granted: 'Naibigay na',
      userControlSection: 'Kontrol ng Gumagamit',
      userControlDesc: 'Pag-customize at Account',
      discordLoginTitle: 'Pag-login sa Discord',
      discordLoginDesc: 'Ikonekta ang iyong Discord account para sa Rich Presence',
      accountsConnected: 'account ang naka-login.',
      themeTitle: 'Tema',
      languageTitle: 'Wika',
      finishSetup: 'Tapusin ang Setup',
      continueForNow: 'Magpatuloy muna',
      skipForNow: 'Laktawan muna',
      allSet: 'Handa na ang lahat!',
      readyWhenYouAre: 'Handa na kahit kailan',
    },
    nav: {
      service: 'Serbisyo',
      accounts: 'Mga Account',
      settings: 'Mga Setting',
    },
    header: {
      serviceActive: 'Aktibo',
      serviceInactive: 'Hindi Aktibo',
      serviceStarting: 'Nagsisimula',
      serviceStopped: 'Nakahinto',
    },
    accounts: {
      title: 'Mga Discord Account',
      subtitle: 'Pamahalaan ang mga token at pagkakakilanlan',
      loginPortal: 'Mag-login gamit ang Discord Portal',
      loginWithToken: 'Magdagdag gamit ang Token',
      addAccount: 'Magdagdag ng Account',
      activeIdentity: 'Aktibong Identity',
      stored: 'Nakatago',
      remove: 'Tanggalin',
      noAccounts: 'Walang Discord Account',
      noAccountsDesc: 'Magdagdag ng iyong Discord account gamit ang portal o token upang simulan ang rich presence.',
    },
    settings: {
      title: 'Mga Setting at Iba Pa',
      subtitle: 'Mga kagustuhan at diagnostic ng app',
      appPreferences: 'Mga Kagustuhan',
      themes: 'Tema at Display',
      themesDesc: 'I-set ang iyong tema at kulay ng accent.',
      language: 'Wika',
      languageDesc: 'Kasalukuyang Naka-set:',
      globalDefaults: 'Mga Pangkalahatang Default',
      globalDefaultsDesc: 'Uri ng aktibidad at estado para sa mga app',
      imgbbKey: 'I-set ang ImgBB API Key',
      imgbbKeyDesc: 'I-set ang iyong sariling ImgBB API Key.',
      discordAppId: 'I-set ang Discord App ID',
      discordAppIdDesc: 'I-set ang sariling Discord Application ID.',
      checkPermissions: 'Suriin ang mga Pahintulot',
      checkPermissionsDesc: 'Suriin ang mga ibinigay na pahintulot sa system',
      deleteCache: 'Burahin ang Nakakonektang URL ng Larawan',
      deleteCacheDesc: 'Nililinis ang mga nai-upload na larawan sa cache',
    },
  },
  'Español': {
    onboarding: {
      title: 'Configuración Inicial',
      subtitle: 'Configura los permisos necesarios y cuentas para activar Discord Rich Presence.',
      privacyNotice: 'Esta aplicación no recopila ni transmite datos del usuario.',
      permissionsSection: 'Control de Permisos',
      permissionsRequired: 'Requerido para la detección',
      notificationTitle: 'Acceso a Notificaciones',
      notificationDesc: 'Acceso especial necesario para detectar medios y reproducción',
      notificationCrucial: 'Crucial',
      usageTitle: 'Acceso de Uso',
      usageDesc: 'Requerido para detectar aplicaciones o juegos en primer plano',
      batteryTitle: 'Optimización de Batería',
      batteryDesc: 'Exime la app para evitar que se detenga en segundo plano',
      postNotificationTitle: 'Notificación de Servicio',
      postNotificationDesc: 'Permiso de Android 13+ para la notificación del servicio',
      grant: 'Conceder',
      granted: 'Concedido',
      userControlSection: 'Control de Usuario',
      userControlDesc: 'Personalización y Cuenta',
      discordLoginTitle: 'Iniciar Sesión en Discord',
      discordLoginDesc: 'Conecta tu cuenta de Discord para mostrar Rich Presence',
      accountsConnected: 'cuenta conectada.',
      themeTitle: 'Tema',
      languageTitle: 'Idioma',
      finishSetup: 'Terminar Configuración',
      continueForNow: 'Continuar por Ahora',
      skipForNow: 'Omitir por Ahora',
      allSet: '¡Todo listo para proyectar!',
      readyWhenYouAre: 'Listo cuando quieras',
    },
    nav: {
      service: 'Servicio',
      accounts: 'Cuentas',
      settings: 'Ajustes',
    },
    header: {
      serviceActive: 'Activo',
      serviceInactive: 'Inactivo',
      serviceStarting: 'Iniciando',
      serviceStopped: 'Detenido',
    },
    accounts: {
      title: 'Cuentas de Discord',
      subtitle: 'Gestiona tokens e identidades',
      loginPortal: 'Iniciar sesión con Portal Discord',
      loginWithToken: 'Añadir cuenta con Token',
      addAccount: 'Añadir Cuenta',
      activeIdentity: 'Identidad Activa',
      stored: 'Guardada',
      remove: 'Eliminar',
      noAccounts: 'Sin cuentas de Discord',
      noAccountsDesc: 'Añade tu cuenta de Discord usando el portal o token para proyectar presencia.',
    },
    settings: {
      title: 'Ajustes y Más',
      subtitle: 'Preferencias y diagnósticos de la app',
      appPreferences: 'Preferencias de la App',
      themes: 'Temas y Pantalla',
      themesDesc: 'Configura tu tema y color de énfasis.',
      language: 'Idioma',
      languageDesc: 'Establecido en:',
      globalDefaults: 'Valores Globales por Defecto',
      globalDefaultsDesc: 'Tipo de actividad y estado para apps no configuradas',
      imgbbKey: 'Clave de API de ImgBB',
      imgbbKeyDesc: 'Configura tu propia clave de API de ImgBB.',
      discordAppId: 'ID de Aplicación de Discord',
      discordAppIdDesc: 'Configura tu ID de Aplicación de Discord.',
      checkPermissions: 'Comprobar Permisos',
      checkPermissionsDesc: 'Revisa los permisos de acceso concedidos',
      deleteCache: 'Eliminar URLs de Imágenes',
      deleteCacheDesc: 'Borra las imágenes asociadas en caché',
    },
  },
  '日本語 (Japanese)': {
    onboarding: {
      title: '初期設定',
      subtitle: 'Discord Rich Presenceを有効にするため、必要な権限とアカウントを設定します。',
      privacyNotice: 'このアプリはユーザーデータを収集・送信しません。',
      permissionsSection: '権限コントロール',
      permissionsRequired: '検知に必要です',
      notificationTitle: '通知へのアクセス',
      notificationDesc: 'メディアや再生中の楽曲を検知するために必要です',
      notificationCrucial: '必須',
      usageTitle: '使用状況へのアクセス',
      usageDesc: '実行中のゲームやアプリを検知するために必要です',
      batteryTitle: 'バッテリー最適化の解除',
      batteryDesc: 'バックグラウンドでサービスが停止するのを防ぎます',
      postNotificationTitle: '通知の許可',
      postNotificationDesc: '常駐フォアグラウンドサービス通知のためのAndroid 13+権限です',
      grant: '許可する',
      granted: '許可済み',
      userControlSection: 'ユーザー設定',
      userControlDesc: 'カスタマイズとアカウント',
      discordLoginTitle: 'Discord ログイン',
      discordLoginDesc: 'Rich Presenceを表示するためDiscordアカウントを接続します',
      accountsConnected: '件のアカウントがログイン中',
      themeTitle: 'テーマ',
      languageTitle: '言語',
      finishSetup: '設定を完了',
      continueForNow: '今は続行する',
      skipForNow: 'スキップする',
      allSet: '準備完了！Rich Presenceを開始できます',
      readyWhenYouAre: 'いつでも開始可能',
    },
    nav: {
      service: 'サービス',
      accounts: 'アカウント',
      settings: '設定・その他',
    },
    header: {
      serviceActive: '稼働中',
      serviceInactive: '停止中',
      serviceStarting: '開始中',
      serviceStopped: '停止中',
    },
    accounts: {
      title: 'Discord アカウント',
      subtitle: 'トークンとアイデンティティの管理',
      loginPortal: 'Discordポータルでログイン',
      loginWithToken: 'トークンで追加',
      addAccount: 'アカウントを追加',
      activeIdentity: '有効なアイデンティティ',
      stored: '保存済み',
      remove: '削除',
      noAccounts: 'Discordアカウントがありません',
      noAccountsDesc: 'ポータルまたはトークンを使用してアカウントを追加し、Rich Presenceを開始します。',
    },
    settings: {
      title: '設定・その他',
      subtitle: 'アプリの設定と診断',
      appPreferences: 'アプリ設定',
      themes: 'テーマと表示',
      themesDesc: 'テーマとアクセントカラーを設定します。',
      language: '言語',
      languageDesc: '現在の設定:',
      globalDefaults: 'グローバルデフォルト',
      globalDefaultsDesc: '未設定アプリのアクティビティタイプとステータス',
      imgbbKey: 'ImgBB APIキー設定',
      imgbbKeyDesc: '独自のImgBB APIキーを設定します。',
      discordAppId: 'Discord アプリケーションID',
      discordAppIdDesc: '独自のDiscord App IDを設定します。',
      checkPermissions: '権限を確認',
      checkPermissionsDesc: 'システムアクセス権限の付与状況を確認します',
      deleteCache: '画像URLキャッシュを削除',
      deleteCacheDesc: 'キャッシュされたアップロード済み画像URLをクリアします',
    },
  },
  'Deutsch': {
    onboarding: {
      title: 'Ersteinrichtung',
      subtitle: 'Konfigurieren Sie Berechtigungen und Konten für Discord Rich Presence.',
      privacyNotice: 'Diese App sammelt oder überträgt keine Benutzerdaten.',
      permissionsSection: 'Berechtigungssteuerung',
      permissionsRequired: 'Erforderlich für Erkennung',
      notificationTitle: 'Benachrichtigungszugriff',
      notificationDesc: 'Erforderlich, um Medienwiedergabe zu erkennen',
      notificationCrucial: 'Wichtig',
      usageTitle: 'Nutzungsdatenzugriff',
      usageDesc: 'Erforderlich, um laufende Apps oder Spiele zu erkennen',
      batteryTitle: 'Akku-Optimierung',
      batteryDesc: 'App ausnehmen, um Hintergrundschlaf zu verhindern',
      postNotificationTitle: 'Vordergrund-Benachrichtigung',
      postNotificationDesc: 'Android 13+ Berechtigung für dauerhafte Statusbenachrichtigung',
      grant: 'Erteilen',
      granted: 'Erteilt',
      userControlSection: 'Benutzersteuerung',
      userControlDesc: 'Anpassung & Konto',
      discordLoginTitle: 'Discord-Login',
      discordLoginDesc: 'Verbinden Sie Ihr Discord-Konto für Rich Presence',
      accountsConnected: 'Konto angemeldet.',
      themeTitle: 'Design',
      languageTitle: 'Sprache',
      finishSetup: 'Einrichtung abschließen',
      continueForNow: 'Vorläufig fortfahren',
      skipForNow: 'Vorläufig überspringen',
      allSet: 'Alles bereit!',
      readyWhenYouAre: 'Bereit, wenn Sie es sind',
    },
    nav: {
      service: 'Dienst',
      accounts: 'Konten',
      settings: 'Einstellungen',
    },
    header: {
      serviceActive: 'Aktiv',
      serviceInactive: 'Inaktiv',
      serviceStarting: 'Startet',
      serviceStopped: 'Gestoppt',
    },
    accounts: {
      title: 'Discord-Konten',
      subtitle: 'Tokens und Identitäten verwalten',
      loginPortal: 'Über Discord-Portal anmelden',
      loginWithToken: 'Konto über Token hinzufügen',
      addAccount: 'Konto hinzufügen',
      activeIdentity: 'Aktive Identität',
      stored: 'Gespeichert',
      remove: 'Entfernen',
      noAccounts: 'Keine Discord-Konten',
      noAccountsDesc: 'Fügen Sie Ihr Discord-Konto hinzu, um Rich Presence zu starten.',
    },
    settings: {
      title: 'Einstellungen & Mehr',
      subtitle: 'App-Einstellungen & Diagnose',
      appPreferences: 'App-Einstellungen',
      themes: 'Designs & Anzeige',
      themesDesc: 'Design und Akzentfarbe festlegen.',
      language: 'Sprache',
      languageDesc: 'Aktuell eingestellt:',
      globalDefaults: 'Globale Standards',
      globalDefaultsDesc: 'Aktivitätstyp und Status für nicht konfigurierte Apps',
      imgbbKey: 'ImgBB API-Schlüssel',
      imgbbKeyDesc: 'Eigenen ImgBB API-Schlüssel festlegen.',
      discordAppId: 'Discord-Anwendungs-ID',
      discordAppIdDesc: 'Eigene Discord-Anwendungs-ID festlegen.',
      checkPermissions: 'Berechtigungen prüfen',
      checkPermissionsDesc: 'Erteilte Systemzugriffsberechtigungen prüfen',
      deleteCache: 'Verknüpfte Bild-URLs löschen',
      deleteCacheDesc: 'Hochgeladene Bild-URLs im Cache leeren',
    },
  },
  'Français': {
    onboarding: {
      title: 'Première Configuration',
      subtitle: 'Configurez les autorisations et les comptes nécessaires pour activer Discord Rich Presence.',
      privacyNotice: 'Cette application ne collecte ni ne transmet de données utilisateur.',
      permissionsSection: 'Contrôle des Autorisations',
      permissionsRequired: 'Requis pour la détection',
      notificationTitle: 'Accès aux Notifications',
      notificationDesc: 'Accès spécial requis pour détecter la lecture multimédia',
      notificationCrucial: 'Crucial',
      usageTitle: 'Accès à l’Utilisation',
      usageDesc: 'Requis pour détecter l’application ou le jeu au premier plan',
      batteryTitle: 'Optimisation de la Batterie',
      batteryDesc: 'Exempter l’application pour éviter la mise en veille en arrière-plan',
      postNotificationTitle: 'Notification de Service',
      postNotificationDesc: 'Autorisation Android 13+ pour la notification du service',
      grant: 'Autoriser',
      granted: 'Autorisé',
      userControlSection: 'Contrôle Utilisateur',
      userControlDesc: 'Personnalisation & Compte',
      discordLoginTitle: 'Connexion Discord',
      discordLoginDesc: 'Connectez votre compte Discord pour projeter la Rich Presence',
      accountsConnected: 'compte connecté.',
      themeTitle: 'Thème',
      languageTitle: 'Langue',
      finishSetup: 'Terminer la Configuration',
      continueForNow: 'Continuer pour l’instant',
      skipForNow: 'Ignorer pour l’instant',
      allSet: 'Tout est prêt pour la Rich Presence !',
      readyWhenYouAre: 'Prêt quand vous l’êtes',
    },
    nav: {
      service: 'Service',
      accounts: 'Comptes',
      settings: 'Paramètres',
    },
    header: {
      serviceActive: 'Actif',
      serviceInactive: 'Inactif',
      serviceStarting: 'Démarrage',
      serviceStopped: 'Arrêté',
    },
    accounts: {
      title: 'Comptes Discord',
      subtitle: 'Gérer les jetons et identités',
      loginPortal: 'Connexion via le portail Discord',
      loginWithToken: 'Ajouter un compte via jeton',
      addAccount: 'Ajouter un Compte',
      activeIdentity: 'Identité Active',
      stored: 'Enregistré',
      remove: 'Supprimer',
      noAccounts: 'Aucun compte Discord',
      noAccountsDesc: 'Ajoutez votre compte Discord pour commencer à projeter la présence.',
    },
    settings: {
      title: 'Paramètres et Plus',
      subtitle: 'Préférences et diagnostics de l’application',
      appPreferences: 'Préférences de l’Application',
      themes: 'Thèmes et Affichage',
      themesDesc: 'Définissez votre thème et couleur d’accent.',
      language: 'Langue',
      languageDesc: 'Actuellement défini sur :',
      globalDefaults: 'Valeurs par Défaut Globales',
      globalDefaultsDesc: 'Type d’activité et statut pour les apps non configurées',
      imgbbKey: 'Clé API ImgBB',
      imgbbKeyDesc: 'Définissez votre propre clé API ImgBB.',
      discordAppId: 'ID d’Application Discord',
      discordAppIdDesc: 'Définissez votre propre ID d’Application Discord.',
      checkPermissions: 'Vérifier les Autorisations',
      checkPermissionsDesc: 'Examiner les autorisations accordées',
      deleteCache: 'Supprimer les URLs d’Images',
      deleteCacheDesc: 'Efface les URLs d’images mises en cache',
    },
  },
  'Chinese (简体中文)': {
    onboarding: {
      title: '首次设置',
      subtitle: '配置必要权限与账号，启用动态 Discord Rich Presence。',
      privacyNotice: '本应用绝不收集或上传任何个人数据。',
      permissionsSection: '权限控制',
      permissionsRequired: '状态检测所需',
      notificationTitle: '通知使用权',
      notificationDesc: '用于检测正在播放的音乐与视频会话',
      notificationCrucial: '关键',
      usageTitle: '应用使用情况访问权',
      usageDesc: '用于检测当前正在运行的前台应用或游戏',
      batteryTitle: '电池优化白名单',
      batteryDesc: '将应用加入白名单，防止后台被系统杀死',
      postNotificationTitle: '前台服务通知',
      postNotificationDesc: 'Android 13+ 常驻服务通知权限',
      grant: '授权',
      granted: '已授权',
      userControlSection: '偏好与账号',
      userControlDesc: '个性化外观与登录',
      discordLoginTitle: 'Discord 登录',
      discordLoginDesc: '连接您的 Discord 账号以展示富状态',
      accountsConnected: '个账号已登录。',
      themeTitle: '主题',
      languageTitle: '语言',
      finishSetup: '完成设置',
      continueForNow: '暂且继续',
      skipForNow: '先跳过',
      allSet: '一切就绪！随时可以展示状态',
      readyWhenYouAre: '随时准备启动',
    },
    nav: {
      service: '服务',
      accounts: '账号',
      settings: '设置与更多',
    },
    header: {
      serviceActive: '运行中',
      serviceInactive: '未运行',
      serviceStarting: '启动中',
      serviceStopped: '已停止',
    },
    accounts: {
      title: 'Discord 账号',
      subtitle: '管理令牌与身份',
      loginPortal: '通过 Discord 门户登录',
      loginWithToken: '通过 Token 添加',
      addAccount: '添加账号',
      activeIdentity: '当前活动身份',
      stored: '已保存',
      remove: '移除',
      noAccounts: '暂无 Discord 账号',
      noAccountsDesc: '通过门户或 Token 添加您的 Discord 账号以开始展示状态。',
    },
    settings: {
      title: '设置与更多',
      subtitle: '应用偏好与诊断',
      appPreferences: '应用偏好',
      themes: '主题与显示',
      themesDesc: '设置主题模式与强调色。',
      language: '语言',
      languageDesc: '当前设置：',
      globalDefaults: '全局默认值',
      globalDefaultsDesc: '未单独配置应用的活动类型与在线状态',
      imgbbKey: '设置 ImgBB API 密钥',
      imgbbKeyDesc: '配置您自己的 ImgBB API Key。',
      discordAppId: '设置 Discord Application ID',
      discordAppIdDesc: '配置您自己的 Discord 应用 ID。',
      checkPermissions: '检查系统权限',
      checkPermissionsDesc: '查看已授予和可选的系统访问权限',
      deleteCache: '清理关联图片 URL',
      deleteCacheDesc: '清理已缓存的上传图片 URL',
    },
  },
}
