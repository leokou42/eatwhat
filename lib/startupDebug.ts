type StartupScope = 'client' | 'server';

function shouldLogStartup() {
  return process.env.STARTUP_DEBUG === '1' || process.env.NEXT_PUBLIC_STARTUP_DEBUG === '1';
}

export function logStartup(
  scope: StartupScope,
  channel: string,
  phase: string,
  payload?: Record<string, unknown>
) {
  if (!shouldLogStartup()) return;
  const prefix = `[startup][${scope}][${channel}] ${phase}`;
  if (!payload) {
    console.log(prefix);
    return;
  }
  console.log(prefix, payload);
}

export function logStartupError(
  scope: StartupScope,
  channel: string,
  phase: string,
  error: unknown,
  payload?: Record<string, unknown>
) {
  if (!shouldLogStartup()) return;
  const prefix = `[startup][${scope}][${channel}] ${phase}`;
  if (!payload) {
    console.error(prefix, error);
    return;
  }
  console.error(prefix, { ...payload, error });
}

export function msSince(startedAtMs: number) {
  return Date.now() - startedAtMs;
}
