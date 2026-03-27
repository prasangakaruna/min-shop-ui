'use client';

import Script from 'next/script';
import type { StorefrontAppEmbed } from '@/lib/api';

function normalizeHttpsUrl(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  if (!/^https:\/\//i.test(t)) return null;
  return t;
}

export default function StorefrontAppEmbedScripts({ embeds }: { embeds: StorefrontAppEmbed[] | null | undefined }) {
  const list = (embeds ?? []).filter((e) => e.enabled !== false);
  return (
    <>
      {list.map((e) => {
        const url = normalizeHttpsUrl(e.script_url ?? null);
        if (!url) return null;
        return <Script key={e.id} src={url} strategy="afterInteractive" />;
      })}
    </>
  );
}
