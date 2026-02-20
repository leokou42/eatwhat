"use client";

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { logStartup } from '@/lib/startupDebug';

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

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionDebugProbe />
      {children}
    </SessionProvider>
  );
}
