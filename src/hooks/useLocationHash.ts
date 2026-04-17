'use client';

import { useEffect, useState } from 'react';

/** Client-only document hash for anchor-based nav highlighting. */
export function useLocationHash(): string {
  const [hash, setHash] = useState('');

  useEffect(() => {
    const sync = () => setHash(typeof window !== 'undefined' ? window.location.hash || '' : '');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return hash;
}
