@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "INPUT_APK=%ROOT%\src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk"
set "OUTPUT_APK=%ROOT%\src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"
set "KEYSTORE=%USERPROFILE%\kruzty-dynamics-release.jks"
set "KEY_ALIAS=kruzty-dynamics"

if not exist "%INPUT_APK%" (
  echo Unsigned universal release APK not found:
  echo   %INPUT_APK%
  echo Build it first with: npm run tauri android build -- --target all --apk
  exit /b 1
)

if not defined ANDROID_SDK_ROOT if defined ANDROID_HOME set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not defined ANDROID_SDK_ROOT if defined LOCALAPPDATA set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
if not defined ANDROID_SDK_ROOT if exist "D:\Android\android-sdk\build-tools" set "ANDROID_SDK_ROOT=D:\Android\android-sdk"

if not defined ANDROID_SDK_ROOT (
  echo Android SDK not found. Set ANDROID_SDK_ROOT or ANDROID_HOME and retry.
  exit /b 1
)

set "APKSIGNER="
for /f "delims=" %%D in ('dir /b /ad /o-n "%ANDROID_SDK_ROOT%\build-tools" 2^>nul') do (
  if not defined APKSIGNER if exist "%ANDROID_SDK_ROOT%\build-tools\%%D\apksigner.bat" set "APKSIGNER=%ANDROID_SDK_ROOT%\build-tools\%%D\apksigner.bat"
)

if not defined APKSIGNER (
  echo apksigner.bat was not found under:
  echo   %ANDROID_SDK_ROOT%\build-tools
  exit /b 1
)

if not exist "%KEYSTORE%" (
  where keytool.exe >nul 2>nul
  if errorlevel 1 (
    echo keytool.exe was not found on PATH. Install a JDK or add its bin folder to PATH.
    exit /b 1
  )
  echo Creating your release signing key at:
  echo   %KEYSTORE%
  echo Keep this keystore and its passwords safe. You need the same key for future app updates.
  keytool -genkeypair -v -keystore "%KEYSTORE%" -alias "%KEY_ALIAS%" -keyalg RSA -keysize 2048 -validity 10000
  if errorlevel 1 exit /b 1
)

echo Signing universal release APK...
call "%APKSIGNER%" sign --ks "%KEYSTORE%" --ks-key-alias "%KEY_ALIAS%" --out "%OUTPUT_APK%" "%INPUT_APK%"
if errorlevel 1 exit /b 1

call "%APKSIGNER%" verify --verbose "%OUTPUT_APK%"
if errorlevel 1 exit /b 1

echo.
echo Signed APK:
echo   %OUTPUT_APK%
exit /b 0
