# Privacy Policy

**Last updated: November 23, 2026**

This policy describes how the current Kruzty Dynamics application handles information. Kruzty Dynamics is a local Android app that detects configured foreground applications and media, then can publish that activity to a Discord account selected by the user.

## Discord authorization and permissions

The Android account-linking flow requests the Discord OAuth scopes `identify`, `openid`, and `sdk.social_layer_presence`. Discord's Social SDK groups Rich Presence with broader social capabilities. As a result, Discord's authorization screen may say the integration can access or manage friends and blocked users, view friends' online status, or send and receive activity invites.

Those are real capabilities made available by the authorized Social SDK scope. Kruzty Dynamics discloses them here because the consent screen can look broader than the app's current features. In the current Kruzty Dynamics source, the Discord integration:

- Uses Discord's current-user endpoint to identify the account and show its username and avatar in the account list.
- Connects the Social SDK for the selected account and publishes or clears the configured Rich Presence.
- Does not call Social SDK APIs to read or change friend or blocked-user relationships, send or accept friend requests, send or accept activity invites, read messages, or use voice features.

The Discord Social SDK is a third-party binary and handles its own connection and network operations. The statements above describe the features Kruzty Dynamics itself invokes; they do not claim that Discord's SDK never internally processes information needed to establish or maintain its connection. Kruzty Dynamics does not use the broader friend, block, messaging, invite, or voice capabilities in its current features.

You can revoke the Discord authorization at any time in Discord under **User Settings > Authorized Apps**. Removing an account from Kruzty Dynamics removes its locally stored credentials, but does not itself revoke the authorization on Discord.

## Information handled on your device

Kruzty Dynamics stores application and media profiles, preferences, image-link/cache metadata, and linked-account display details in the app's local WebView storage. Android's native OAuth flow does not pass access tokens into the WebView. Access and refresh tokens for linked accounts are encrypted with AES-GCM using a key held by Android Keystore, and are stored in app-private storage on the device.

When the service is enabled, Android Usage Access is used to detect the foreground package. Notification access is used to read active media playback details such as the media title, artist, album, playback state, position, duration, and artwork. Kruzty Dynamics uses these details locally to resolve your configured templates, show the service notification and preview, and prepare the presence you asked it to publish. The service keeps a temporary current-status snapshot on the device and clears it when the service starts or stops.

The browser/development OAuth fallback may hold an access token in browser memory and store account data in browser local storage. The native Android flow uses the encrypted token storage described above.

## Information sent to third parties

### Discord

When you link an account, the app exchanges the authorization code with Discord and requests your current-user profile to identify the account. The Social SDK then receives the selected account's access token and the activity fields configured for Rich Presence, such as the detected or configured app/media name, details, state, timestamps, image references, and buttons. Discord processes this data under its own terms and privacy policy. Whether other people can see your activity also depends on your Discord activity-sharing settings.

### ImgBB

To display detected app icons, media artwork, or custom icon overrides in Discord Rich Presence, Kruzty Dynamics can upload those images to ImgBB and store the returned image URL locally. Detected app/media artwork may be uploaded automatically when the service reports an image that has not already been cached; custom icon uploads are initiated when you choose an image. The image and a generated image name are sent to ImgBB. ImgBB hosts the resulting image, so its own terms and privacy policy apply.

### Other network requests

Discord CDN is used to load linked accounts' avatars. Kruzty Dynamics does not operate a server that receives linked-account tokens, account profiles, detection history, or Rich Presence data. The current repository contains no first-party analytics or advertising integration.

## Your controls

- Stop the service to stop app/media detection and Rich Presence updates.
- Remove a linked account in Kruzty Dynamics to delete its local credentials, and revoke its authorization separately through Discord's **Authorized Apps** settings.
- Clear the app's local image cache from Settings. This removes cached URLs and may cause images to need re-uploading.
- Revoke Usage Access or Notification Access in Android settings to prevent the corresponding local detection.

## Contact

For privacy questions or corrections, contact the project through [Kruzty Dynamics on GitHub](https://github.com/LlanderSei/Kruzty-Dynamics).
