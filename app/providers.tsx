"use client";

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { logStartup } from '@/lib/startupDebug';
import {
  applyThemeToDocument,
  mergeAppSettings,
  readGuestSettings,
  writeGuestSettings,
} from '@/lib/settings';

function SessionDebugProbe() {
  const { status, data } = useSession();

  useEffect(() => {
    logStartup('client', 'auth', 'session:status', {
      status,
      userId: data?.user?.id ?? null,
      email: data?.user?.email ?? null,
    });
  }, [data?.user?.email, data?.user?.id, status]);

  return null;
}

function ThemeBootstrap() {
  const { status } = useSession();

  useEffect(() => {
    const local = mergeAppSettings(readGuestSettings());
    applyThemeToDocument(local.theme);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let cancelled = false;
    const syncFromServer = async () => {
      const response = await fetch('/api/settings');
      if (!response.ok || cancelled) return;
      const data = (await response.json().catch(() => null)) as {
        settings?: ReturnType<typeof mergeAppSettings>;
      } | null;
      if (!data?.settings || cancelled) return;

      const merged = mergeAppSettings(data.settings);
      writeGuestSettings(merged);
      applyThemeToDocument(merged.theme);
    };

    void syncFromServer();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionDebugProbe />
      <ThemeBootstrap />
      {children}
    </SessionProvider>
  );
}
