'use client';

import React from 'react';

type Props = {
  text?: string | null;
};

export default function AnnouncementBar({ text }: Props) {
  const t =
    text?.trim() ||
    'FREE SHIPPING ON ALL ORDERS OVER $150 • LIMITED TIME OFFER';
  return (
    <div
      className="w-full py-2.5 px-4 text-center text-xs sm:text-sm font-medium"
      style={{
        backgroundColor: 'var(--sf-color-accent, #ccfbf1)',
        color: 'var(--sf-color-secondary, #334155)',
        fontFamily: 'var(--sf-font-body, inherit)',
      }}
    >
      {t}
    </div>
  );
}
