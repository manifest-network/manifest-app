'use client';

import { useEffect, useState } from 'react';
import { getRuntimeConfig } from '@/lib/runtime-env';

export default function RuntimeConfigLoader({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getRuntimeConfig().then(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
}
