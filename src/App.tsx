import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type {
  DynamicsConfig,
  PriorityMode,
  OutsideAppBehavior,
  AppTimestampMode,
  ThemeConfig,
} from './types'

export default function App() {
  const [platformInfo, setPlatformInfo] = useState<string>('Detecting...')
  const [isTauriRunning, setIsTauriRunning] = useState<boolean>(false)
  const [activeTemplateTab, setActiveTemplateTab] = useState<'app' | 'media'>('app')

  const [theme, setTheme] = useState<ThemeConfig>({
    mode: 'dark',
    customAccentColor: '#8b5cf6', // Violet
  })

  // Dynamics Active Configuration with Separate App and Media Field Templates
  const [dynamicsConfig, setDynamicsConfig] = useState<DynamicsConfig>({
    enabled: true,
    priorityMode: 'priority-media',
    mediaScope: 'all',
    outsideBehavior: 'custom',
    customFallback: {
      name: 'Browsing Phone',
      details: 'Chilling on Android',
      state: 'Away from Games',
    },
    timestampMode: 'persistent',
    mediaActivityTypeMode: 'auto-adaptive',
    appFields: {
      title: '{{AppName}}',
      line1: '',
      line2: '',
      smallText: '',
      smallImage: '',
      bigText: '{{AppName}}',
      bigImage: '{{AppImageLink}}',
    },
    mediaFields: {
      title: '{{MediaTitle ?? AppName}}',
      line1: '{{MediaArtist ?? MediaDescription}}',
      line2: '{{MediaAlbum ?? MediaDescription}}',
      smallText: '{{PlaybackState}}',
      smallImage: '{{HasDetectablePlaybackState ?? PlaybackStateImageLink : AppImageLink}}',
      bigText: '{{MediaAlbum}}',
      bigImage: '{{HasMediaImage ?? MediaImageLink : AppImageLink}}',
    },
  })

  useEffect(() => {
    async function checkBackend() {
      try {
        const info = await invoke<string>('get_platform_info')
        setPlatformInfo(info)
        setIsTauriRunning(true)
      } catch {
        setPlatformInfo('Web Preview (Tauri IPC not connected)')
        setIsTauriRunning(false)
      }
    }
    checkBackend()
  }, [])

  const setPriority = (mode: PriorityMode) =>
    setDynamicsConfig((prev) => ({ ...prev, priorityMode: mode }))

  const setOutsideBehavior = (mode: OutsideAppBehavior) =>
    setDynamicsConfig((prev) => ({ ...prev, outsideBehavior: mode }))

  const setTimestampMode = (mode: AppTimestampMode) =>
    setDynamicsConfig((prev) => ({ ...prev, timestampMode: mode }))

  return (
    <main
      className={`min-h-screen ${
        theme.mode === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
      } flex flex-col font-sans transition-colors duration-200`}
    >
      {/* Top Header */}
      <header
        className={`border-b ${
          theme.mode === 'light'
            ? 'border-slate-200 bg-white/80'
            : 'border-slate-800/80 bg-slate-900/70'
        } backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-20`}
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: theme.customAccentColor }}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-sm tracking-wider"
          >
            KD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight">Kruzty Dynamics</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Dynamics Core
              </span>
            </div>
            <p className="text-xs text-slate-400">Next-gen intelligent Discord presence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher preview */}
          <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setTheme((t) => ({ ...t, mode: 'dark' }))}
              className={`px-2 py-0.5 rounded ${
                theme.mode === 'dark' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme((t) => ({ ...t, mode: 'light' }))}
              className={`px-2 py-0.5 rounded ${
                theme.mode === 'light' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              Light
            </button>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isTauriRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium text-slate-300">{platformInfo}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-5 md:p-8 space-y-6">
        {/* Banner with Special App Access Alert */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs flex items-start gap-3">
          <span className="text-base">🔔</span>
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-300">
              Special App Access &gt; Notification Access Guard
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Required for media session listening. Kruzty Dynamics uses an interactive modal guard
              with direct system shortcuts instead of abruptly crashing when this permission is
              unnoticed.
            </p>
          </div>
        </div>

        {/* Priority & Media Scope Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Priority Strategy */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                App & Media Priority
              </h3>
              <span className="text-[11px] text-slate-400">State Resolution</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">Priority Strategy</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPriority('priority-media')}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    dynamicsConfig.priorityMode === 'priority-media'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-white mb-0.5">Priority Playing Media</div>
                  <div className="text-[11px] text-slate-400">Always prioritize media when active</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('switches-between')}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    dynamicsConfig.priorityMode === 'switches-between'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-white mb-0.5">Switches Between</div>
                  <div className="text-[11px] text-slate-400">Media only active inside its app</div>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs text-slate-400 block font-medium mb-1.5">
                Media Detection Scope
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDynamicsConfig((p) => ({ ...p, mediaScope: 'all' }))}
                  className={`flex-1 py-1.5 px-3 rounded-lg border transition ${
                    dynamicsConfig.mediaScope === 'all'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-medium'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  All Media Sessions
                </button>
                <button
                  type="button"
                  onClick={() => setDynamicsConfig((p) => ({ ...p, mediaScope: 'enabled-only' }))}
                  className={`flex-1 py-1.5 px-3 rounded-lg border transition ${
                    dynamicsConfig.mediaScope === 'enabled-only'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-medium'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  Only Enabled Apps
                </button>
              </div>
            </div>
          </div>

          {/* Outside App Behavior & Timestamps */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                Outside App Behavior
              </h3>
              <span className="text-[11px] text-slate-400">Unmonitored State</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">When Leaving Enabled Apps</label>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {(['freeze', 'custom', 'drop'] as OutsideAppBehavior[]).map((behavior) => (
                  <button
                    key={behavior}
                    type="button"
                    onClick={() => setOutsideBehavior(behavior)}
                    className={`py-2 px-2 rounded-lg border capitalize transition ${
                      dynamicsConfig.outsideBehavior === behavior
                        ? 'border-pink-500 bg-pink-500/10 text-pink-300 font-semibold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {behavior}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs text-slate-400 block font-medium mb-1.5">App Timestamp Mode</label>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {(['persistent', 'reset', 'custom'] as AppTimestampMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTimestampMode(mode)}
                    className={`py-1.5 px-2 rounded-lg border capitalize transition ${
                      dynamicsConfig.timestampMode === mode
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Separate Customizable Status Fields for App and Media */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Customizable Presence Fields</h3>
              <p className="text-xs text-slate-400">
                Separate expression configurations for App detection and Media playback
              </p>
            </div>
            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTemplateTab('app')}
                className={`px-3 py-1 rounded font-medium transition ${
                  activeTemplateTab === 'app'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                App Fields
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('media')}
                className={`px-3 py-1 rounded font-medium transition ${
                  activeTemplateTab === 'media'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Media Fields
              </button>
            </div>
          </div>

          {activeTemplateTab === 'app' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Title</span>
                <span className="text-purple-300">{dynamicsConfig.appFields.title}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Big Text</span>
                <span className="text-purple-300">{dynamicsConfig.appFields.bigText}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 sm:col-span-2">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Big Image</span>
                <span className="text-purple-300">{dynamicsConfig.appFields.bigImage}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Title</span>
                <span className="text-purple-300">{dynamicsConfig.mediaFields.title}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Line 1 (Details)</span>
                <span className="text-purple-300">{dynamicsConfig.mediaFields.line1}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Line 2 (State)</span>
                <span className="text-purple-300">{dynamicsConfig.mediaFields.line2}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Small Text</span>
                <span className="text-purple-300">{dynamicsConfig.mediaFields.smallText}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 sm:col-span-2">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Small Image (Fallback Exp)</span>
                <span className="text-purple-300">{dynamicsConfig.mediaFields.smallImage}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 sm:col-span-2">
                <span className="text-slate-400 block text-[11px] font-sans mb-1">Big Image (Fallback Exp)</span>
                <span className="text-purple-300">{dynamicsConfig.mediaFields.bigImage}</span>
              </div>
            </div>
          )}
        </div>

        {/* ImgBB Asset Cache & Async Architecture Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>🖼️</span> ImgBB Secure Asset Caching
            </div>
            <p className="text-slate-400 leading-relaxed">
              Extracted app icons and media album art are SHA-256 hashed and cached locally. Only
              new or modified artwork is uploaded to ImgBB. The app key is securely bundled in the
              Rust core and never exposed in the UI.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>⚡</span> Fully Asynchronous Pipeline
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every scope leverages async architecture: Tokio async WebSocket &amp; HTTP uploads in
              Rust, Android coroutine event bridges, and non-blocking React hooks.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 mt-auto">
        Kruzty Dynamics • Powered by Tauri v2 + React 19 + Tailwind CSS v4
      </footer>
    </main>
  )
}
