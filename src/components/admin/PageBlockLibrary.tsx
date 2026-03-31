'use client';

import React from 'react';
import {
  PAGE_EDITOR_BLOCK_COMMANDS,
  PAGE_EDITOR_PATTERNS,
  filterBlockCommands,
  type BlockCommandDef,
} from '@/lib/pageEditorBlocks';

export type BlockLibraryTab = 'blocks' | 'patterns' | 'media';

type Props = {
  open: boolean;
  tab: BlockLibraryTab;
  onTabChange: (t: BlockLibraryTab) => void;
  search: string;
  onSearchChange: (q: string) => void;
  onClose: () => void;
  onCommand: (id: string) => void;
  onInsertPatternHtml: (html: string) => void;
};

function BlockTile({ b, onPick }: { b: BlockCommandDef; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex flex-col items-center gap-1 rounded border border-gray-200 bg-white px-2 py-2.5 text-center text-[11px] font-medium text-gray-800 hover:border-gray-400 hover:bg-gray-50"
    >
      <span className="text-lg leading-none" aria-hidden>
        {b.icon}
      </span>
      <span className="line-clamp-2 leading-tight">{b.label}</span>
    </button>
  );
}

export default function PageBlockLibrary({
  open,
  tab,
  onTabChange,
  search,
  onSearchChange,
  onClose,
  onCommand,
  onInsertPatternHtml,
}: Props) {
  if (!open) return null;

  const filtered = filterBlockCommands(search);
  const textBlocks = filtered.filter((b) => b.category === 'text' || b.category === 'design');
  const mediaBlocks = filtered.filter((b) => b.category === 'media');

  return (
    <div className="flex h-full min-h-0 w-[min(100vw,280px)] shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm">
      <div className="flex shrink-0 border-b border-gray-200">
        {(['blocks', 'patterns', 'media'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTabChange(t)}
            className={`flex-1 px-2 py-2.5 text-xs font-semibold capitalize ${
              tab === t ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          title="Close block library"
          onClick={onClose}
          className="shrink-0 px-3 py-2 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          ×
        </button>
      </div>

      {tab === 'blocks' ? (
        <>
          <div className="shrink-0 border-b border-gray-100 p-2">
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search blocks"
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              autoComplete="off"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Text</p>
            <div className="grid grid-cols-2 gap-2">
              {textBlocks.map((b) => (
                <BlockTile key={b.id} b={b} onPick={() => onCommand(b.id)} />
              ))}
            </div>
            {textBlocks.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-gray-500">No blocks match “{search}”.</p>
            ) : null}

            <p className="mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Media</p>
            <div className="grid grid-cols-2 gap-2">
              {mediaBlocks.map((b) => (
                <BlockTile key={b.id} b={b} onPick={() => onCommand(b.id)} />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {tab === 'patterns' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <p className="mb-2 px-1 text-xs text-gray-500">Insert a preset group of blocks.</p>
          <ul className="space-y-2">
            {PAGE_EDITOR_PATTERNS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onInsertPatternHtml(p.html)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:border-gray-300 hover:bg-white"
                >
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{p.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === 'media' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Media</p>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_EDITOR_BLOCK_COMMANDS.filter((b) => b.category === 'media').map((b) => (
              <BlockTile key={b.id} b={b} onPick={() => onCommand(b.id)} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
