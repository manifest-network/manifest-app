let runtimeConfig: Record<string, string> | null = null;

export async function getRuntimeConfig(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') {
    return {};
  }

  if (runtimeConfig) {
    return runtimeConfig;
  }

  try {
    const res = await fetch('/api/config');
    runtimeConfig = await res.json();
    return runtimeConfig || {};
  } catch (error) {
    console.error('Failed to fetch runtime config:', error);
    return {};
  }
}

export function getEnv(key: string, defaultValue: string = ''): string {
  if (typeof window === 'undefined') {
    return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  }
  return runtimeConfig?.[key] || defaultValue;
}
