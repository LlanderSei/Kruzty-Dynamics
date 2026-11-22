# Discord Social SDK Android dependency

Place the Android SDK package downloaded from the Discord Developer Portal at:

`src-tauri/gen/android/app/libs/discord_partner_sdk.aar`

The Android build enables the JNI rich presence bridge only when this file exists. The binary is intentionally not committed because Discord distributes it through the app's Developer Portal.

For the native Authorization Code + PKCE flow, configure the Discord application as a public OAuth2 client and register this redirect URI in the OAuth2 redirect list:

`discord-1572590527562391713:/authorize/callback`

The requested scopes are `identify openid sdk.social_layer_presence`. Access and refresh tokens are stored in an Android Keystore encrypted store and are not passed into the WebView.

Discord Social SDK assigns the registered application name to the activity's first line. The detected app or media title is sent in the activity details field; configured template lines follow in the state field.
