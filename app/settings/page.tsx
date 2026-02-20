"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  SETTINGS_UPDATED_EVENT,
  applyThemeToDocument,
  clearGuestSettings,
  mergeAppSettings,
  readGuestSettings,
  writeGuestSettings,
} from '@/lib/settings';

export default function SettingsPage() {
  const { status } = useSession();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notifySettingsUpdated = () => {
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const local = mergeAppSettings(readGuestSettings());
        setSettings(local);
        applyThemeToDocument(local.theme);
        setError(null);

        if (status === 'authenticated') {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const data = (await response.json()) as { settings: AppSettings };
            const merged = mergeAppSettings(data.settings);
            setSettings(merged);
            writeGuestSettings(merged);
            applyThemeToDocument(merged.theme);
          } else {
            const data = (await response.json().catch(() => ({}))) as { code?: string };
            if (data.code === 'SETTINGS_STORAGE_UNAVAILABLE') {
              setError('目前無法讀取雲端設定，已改用本機設定');
            }
          }
        }
      } catch {
        setError('讀取設定失敗，已改用本機設定');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [status]);

  const updateSettings = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'theme') {
        applyThemeToDocument(next.theme);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      let nextSettings = settings;
      if (status === 'authenticated') {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { code?: string };
          if (data.code === 'SETTINGS_STORAGE_UNAVAILABLE') {
            setError('雲端設定暫時不可用，僅保留本機設定');
          } else {
            setError('儲存失敗');
          }
          return;
        }

        const data = (await response.json().catch(() => ({}))) as { settings?: AppSettings };
        if (data.settings) {
          nextSettings = mergeAppSettings(data.settings);
          setSettings(nextSettings);
        }
      }

      writeGuestSettings(nextSettings);
      notifySettingsUpdated();
      setMessage('已儲存設定');
    } catch {
      setError('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    clearGuestSettings();
    setSettings(DEFAULT_APP_SETTINGS);
    applyThemeToDocument(DEFAULT_APP_SETTINGS.theme);
    notifySettingsUpdated();
    setMessage('已清除本機設定');
    setError(null);
  };

  return (
    <main className="h-full w-full bg-slate-50 p-6 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">設定</h1>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500">
          <ArrowLeft size={14} />
          回首頁
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">載入中...</p>
      ) : (
        <div className="space-y-4 pb-6">
          <section className="rounded-xl border border-gray-100 bg-white p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(event) => updateSettings('theme', event.target.value as AppSettings['theme'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select
              value={settings.modelPreset}
              onChange={(event) => updateSettings('modelPreset', event.target.value as AppSettings['modelPreset'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="default">Default</option>
              <option value="fast">Fast</option>
              <option value="quality">Quality</option>
            </select>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Length</label>
            <select
              value={settings.questionLength}
              onChange={(event) => updateSettings('questionLength', event.target.value as AppSettings['questionLength'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="short">Short</option>
              <option value="standard">Standard</option>
              <option value="long">Long</option>
            </select>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Radius</label>
            <select
              value={String(settings.searchRadiusM)}
              onChange={(event) => updateSettings('searchRadiusM', Number(event.target.value) as AppSettings['searchRadiusM'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="1000">1 km</option>
              <option value="2000">2 km</option>
              <option value="3000">3 km</option>
            </select>
          </section>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gray-900 text-white py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? '儲存中...' : '儲存設定'}
          </button>

          <button
            type="button"
            onClick={handleClearCache}
            className="w-full border border-gray-200 bg-white py-2 rounded-lg text-gray-700"
          >
            Clear local cache
          </button>

          {status === 'authenticated' && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full border border-red-100 bg-red-50 text-red-600 py-2 rounded-lg"
            >
              Sign out
            </button>
          )}

          {message && <p className="text-sm text-gray-500 text-center">{message}</p>}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
      )}
    </main>
  );
}
