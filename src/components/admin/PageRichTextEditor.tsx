'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { BubbleMenu, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { filterBlockCommands } from '@/lib/pageEditorBlocks';
import { runPageEditorLibraryCommand } from '@/lib/pageEditorCommands';
import { CmsFontSize } from '@/lib/tiptapFontSize';
import {
  CmsColumn,
  CmsColumns,
  deleteParentColumnsBlock,
  findParentColumns,
  layoutOptionsForColumnCount,
  shouldShowColumnsLayoutBubble,
  type CmsColumnsLayout,
} from '@/lib/tiptapColumns';
import { getTableEditCaps, shouldShowTableBubble } from '@/lib/tiptapTableToolbar';

const IMAGE_SIZE_STEPS = [null, 'sm', 'md', 'lg', 'full'] as const;
type ImageSizeStep = (typeof IMAGE_SIZE_STEPS)[number];

function imageSizeIndex(dataSize: string | null | undefined): number {
  if (dataSize == null || dataSize === '') {
    return 0;
  }
  const i = IMAGE_SIZE_STEPS.indexOf(dataSize as ImageSizeStep);
  return i === -1 ? 0 : i;
}

const IMAGE_SIZE_LABEL: Record<string, string> = {
  '': 'Auto',
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  full: 'Full width',
};

const TEXT_COLOR_PRESETS: { title: string; hex: string }[] = [
  { title: 'Gray', hex: '#4b5563' },
  { title: 'Mint', hex: '#0d9488' },
  { title: 'Blue', hex: '#2563eb' },
  { title: 'Red', hex: '#dc2626' },
  { title: 'Amber', hex: '#d97706' },
];

const CMS_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Default', value: '' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", Times, serif' },
  {
    label: 'Sans',
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  {
    label: 'Mono',
    value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
];

const FONT_SIZE_MIN_PX = 10;
const FONT_SIZE_MAX_PX = 96;
const FONT_SIZE_DEFAULT_PX = 16;
const FONT_SIZE_STEP = 2;

function parseFontSizeToPx(raw: string | null | undefined): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  const px = /^(\d+(?:\.\d+)?)px$/i.exec(s);
  if (px) return Math.round(parseFloat(px[1]));
  const rem = /^(\d+(?:\.\d+)?)rem$/i.exec(s);
  if (rem) return Math.round(parseFloat(rem[1]) * 16);
  const pt = /^(\d+(?:\.\d+)?)pt$/i.exec(s);
  if (pt) return Math.round((parseFloat(pt[1]) * 96) / 72);
  return null;
}

function clampFontSizePx(n: number): number {
  return Math.min(FONT_SIZE_MAX_PX, Math.max(FONT_SIZE_MIN_PX, n));
}

const ImageWithAlign = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      dataAlign: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes) => {
          if (!attributes.dataAlign) {
            return {};
          }
          return { 'data-align': attributes.dataAlign };
        },
      },
      dataSize: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute('data-size'),
        renderHTML: (attributes) => {
          if (!attributes.dataSize) {
            return {};
          }
          return { 'data-size': attributes.dataSize };
        },
      },
    };
  },
}).configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: {
    class: 'max-w-full h-auto rounded-lg border border-gray-100',
  },
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      {children}
    </button>
  );
}

export type PageRichTextEditorHandle = {
  getEditor: () => Editor | null;
  undo: () => void;
  redo: () => void;
  focus: () => void;
  insertParagraph: () => void;
  insertHeading: (level: 2 | 3 | 4) => void;
  insertBulletList: () => void;
  insertOrderedList: () => void;
  insertBlockquote: () => void;
  insertHorizontalRule: () => void;
  triggerImageUpload: () => void;
  insertImageFromUrl: () => void;
  setLink: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  getHeadingOutline: () => { pos: number; level: number; text: string }[];
  scrollToDocPos: (pos: number) => void;
  openBlockInserter: () => void;
  runLibraryCommand: (id: string) => void;
  insertPatternHtml: (html: string) => void;
};

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Full formatting toolbar (classic). Minimal = Gutenberg-style canvas + floating + inserter. */
  chrome?: 'full' | 'minimal';
  /** When true, hide the floating popover; parent shows the left block library. */
  useExternalBlockLibrary?: boolean;
  /** Toolbar / canvas + opens the parent block library. */
  onToggleBlockLibraryRequest?: () => void;
  uploadImageFile?: (file: File) => Promise<string>;
  onUseAsPageHero?: (imageUrl: string) => void;
};

function BlockInserterPanel({
  editor,
  onClose,
  expanded,
  onToggleExpanded,
  onTriggerUpload,
}: {
  editor: Editor;
  onClose: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onTriggerUpload: () => void;
}) {
  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  const insertImageUrl = () => {
    const url = window.prompt('Image URL', 'https://');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
    onClose();
  };

  const quick = (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 text-xs font-medium text-gray-800 hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().clearNodes().setParagraph().run())}
      >
        <span className="text-lg leading-none">¶</span>
        Paragraph
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 text-xs font-medium text-gray-800 hover:bg-gray-50"
        onClick={() => {
          onTriggerUpload();
          onClose();
        }}
      >
        <span className="text-lg leading-none">🖼</span>
        Image
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 text-xs font-medium text-gray-800 hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      >
        <span className="text-lg font-bold leading-none">H</span>
        Heading
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 text-xs font-medium text-gray-800 hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
      >
        <span className="text-lg leading-none">•</span>
        List
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 text-xs font-medium text-gray-800 hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
      >
        <span className="text-lg leading-none">❝</span>
        Quote
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-3 text-xs font-medium text-gray-800 hover:bg-gray-50"
        onClick={() => insertImageUrl()}
      >
        <span className="text-lg leading-none">⊞</span>
        Gallery
      </button>
    </div>
  );

  const extra = expanded ? (
    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
      <button
        type="button"
        className="rounded border border-gray-200 px-2 py-2 text-xs font-medium hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      >
        Heading 3
      </button>
      <button
        type="button"
        className="rounded border border-gray-200 px-2 py-2 text-xs font-medium hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 4 }).run())}
      >
        Heading 4
      </button>
      <button
        type="button"
        className="rounded border border-gray-200 px-2 py-2 text-xs font-medium hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
      >
        Numbered list
      </button>
      <button
        type="button"
        className="rounded border border-gray-200 px-2 py-2 text-xs font-medium hover:bg-gray-50"
        onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())}
      >
        Divider
      </button>
    </div>
  ) : null;

  return (
    <div
      className="w-[min(100vw-2rem,17.5rem)] rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Insert block"
    >
      <p className="mb-2 text-xs font-medium text-gray-500">Common blocks</p>
      {quick}
      {extra}
      <button
        type="button"
        className="mt-3 w-full rounded-md bg-gray-900 py-2 text-xs font-semibold text-white hover:bg-gray-800"
        onClick={onToggleExpanded}
      >
        {expanded ? 'Show fewer' : 'Browse all'}
      </button>
    </div>
  );
}

const PageRichTextEditor = forwardRef<PageRichTextEditorHandle, Props>(function PageRichTextEditor(
  {
    initialHtml,
    onChange,
    placeholder,
    chrome = 'full',
    useExternalBlockLibrary = false,
    onToggleBlockLibraryRequest,
    uploadImageFile,
    onUseAsPageHero,
  },
  ref
) {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [editorUploading, setEditorUploading] = useState(false);
  const [inserterOpen, setInserterOpen] = useState(false);
  const [inserterExpanded, setInserterExpanded] = useState(false);
  const inserterWrapRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const [slashMenu, setSlashMenu] = useState<{
    from: number;
    to: number;
    query: string;
    x: number;
    y: number;
  } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      FontFamily.configure({ types: ['textStyle'] }),
      CmsFontSize.configure({ types: ['textStyle'] }),
      CmsColumn,
      CmsColumns,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-mint underline underline-offset-2',
        },
      }),
      ImageWithAlign,
      Table.configure({
        resizable: false,
        allowTableNodeSelection: true,
        HTMLAttributes: { class: 'border-collapse border border-gray-200 w-full text-sm' },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: 'border border-gray-200 bg-gray-50 px-2 py-1 font-medium' },
      }),
      TableCell.configure({
        HTMLAttributes: { class: 'border border-gray-200 px-2 py-2 align-top min-w-[6rem]' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? (chrome === 'minimal' ? 'Type / to choose a block' : 'Start writing your page…'),
      }),
    ],
    content: initialHtml && initialHtml.trim() !== '' ? initialHtml : '<p></p>',
    editorProps: {
      attributes: {
        class:
          'cms-tiptap-body prose prose-sm sm:prose prose-gray max-w-none min-h-[min(420px,50vh)] px-4 py-6 focus:outline-none [&_img]:max-w-full',
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => {
    if (!inserterOpen || useExternalBlockLibrary) return;
    const onDoc = (e: MouseEvent) => {
      const el = inserterWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setInserterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [inserterOpen, useExternalBlockLibrary]);

  useEffect(() => {
    if (!editor || chrome !== 'minimal') {
      setSlashMenu(null);
      return;
    }
    const syncSlash = () => {
      const state = editor.state;
      const sel = state.selection;
      if (!sel.empty) {
        setSlashMenu(null);
        return;
      }
      const $from = sel.$from;
      const parent = $from.parent;
      if (parent.type.name !== 'paragraph' && parent.type.name !== 'heading') {
        setSlashMenu(null);
        return;
      }
      const start = $from.start();
      const offset = $from.parentOffset;
      const before = parent.textBetween(0, offset, '\ufffc');
      if (!/^\s*\//.test(before)) {
        setSlashMenu(null);
        return;
      }
      const slashIdx = before.indexOf('/');
      const from = start + slashIdx;
      const to = $from.pos;
      const query = before.slice(slashIdx + 1);
      try {
        const coords = editor.view.coordsAtPos(to);
        setSlashMenu({ from, to, query, x: coords.left, y: coords.bottom + 6 });
      } catch {
        setSlashMenu(null);
      }
    };
    editor.on('selectionUpdate', syncSlash);
    editor.on('update', syncSlash);
    syncSlash();
    return () => {
      editor.off('selectionUpdate', syncSlash);
      editor.off('update', syncSlash);
    };
  }, [editor, chrome]);

  useEffect(() => {
    if (!slashMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSlashMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slashMenu]);

  useEffect(() => {
    if (!slashMenu || !editor) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (slashMenuRef.current?.contains(t)) return;
      if (editor.view.dom.contains(t)) return;
      setSlashMenu(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [slashMenu, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImageFromUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Image URL', 'https://');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const bumpSelectedFontSize = useCallback(
    (delta: number) => {
      if (!editor) return;
      const attrs = editor.getAttributes('textStyle') as { fontSize?: string | null };
      const cur = parseFontSizeToPx(attrs.fontSize ?? null) ?? FONT_SIZE_DEFAULT_PX;
      const next = clampFontSizePx(cur + delta);
      editor.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).run();
    },
    [editor]
  );

  const unsetSelectedFontSize = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
  }, [editor]);

  const libCommandHelpers = useCallback(
    () => ({
      triggerImageUpload: () => imageFileRef.current?.click(),
      insertImageFromUrl: () => addImageFromUrl(),
    }),
    [addImageFromUrl]
  );

  const applySlashCommand = useCallback(
    (id: string) => {
      if (!editor || !slashMenu) return;
      const { from, to } = slashMenu;
      setSlashMenu(null);
      editor.chain().focus().deleteRange({ from, to }).run();
      runPageEditorLibraryCommand(editor, id, libCommandHelpers());
    },
    [editor, slashMenu, libCommandHelpers]
  );

  const onEditorImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor || !uploadImageFile) return;
    setEditorUploading(true);
    try {
      const url = await uploadImageFile(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setEditorUploading(false);
    }
  };

  const setImageAlign = (align: 'left' | 'center' | 'right' | null) => {
    if (!editor) return;
    if (align === null || align === 'left') {
      editor.chain().focus().updateAttributes('image', { dataAlign: null }).run();
      return;
    }
    editor.chain().focus().updateAttributes('image', { dataAlign: align }).run();
  };

  const bumpImageSize = (direction: -1 | 1) => {
    if (!editor) return;
    const { dataSize } = editor.getAttributes('image') as { dataSize?: string | null };
    const i = imageSizeIndex(dataSize);
    const next = Math.min(Math.max(i + direction, 0), IMAGE_SIZE_STEPS.length - 1);
    const value = IMAGE_SIZE_STEPS[next];
    editor.chain().focus().updateAttributes('image', { dataSize: value }).run();
  };

  const applyPageHeroFromSelection = () => {
    if (!editor || !onUseAsPageHero) return;
    const src = editor.getAttributes('image').src as string | undefined;
    if (!src || typeof src !== 'string' || src.trim() === '') {
      return;
    }
    onUseAsPageHero(src.trim());
  };

  const removeSelectedImage = () => {
    if (!editor) return;
    if (editor.can().deleteNode('image')) {
      editor.chain().focus().deleteNode('image').run();
      return;
    }
    editor.chain().focus().deleteSelection().run();
  };

  useImperativeHandle(
    ref,
    () => ({
      getEditor: () => editor ?? null,
      undo: () => {
        editor?.chain().focus().undo().run();
      },
      redo: () => {
        editor?.chain().focus().redo().run();
      },
      focus: () => {
        editor?.chain().focus().run();
      },
      insertParagraph: () => {
        editor?.chain().focus().clearNodes().setParagraph().run();
      },
      insertHeading: (level) => {
        editor?.chain().focus().toggleHeading({ level }).run();
      },
      insertBulletList: () => {
        editor?.chain().focus().toggleBulletList().run();
      },
      insertOrderedList: () => {
        editor?.chain().focus().toggleOrderedList().run();
      },
      insertBlockquote: () => {
        editor?.chain().focus().toggleBlockquote().run();
      },
      insertHorizontalRule: () => {
        editor?.chain().focus().setHorizontalRule().run();
      },
      triggerImageUpload: () => imageFileRef.current?.click(),
      insertImageFromUrl: () => {
        addImageFromUrl();
      },
      setLink: () => setLink(),
      toggleBold: () => {
        editor?.chain().focus().toggleBold().run();
      },
      toggleItalic: () => {
        editor?.chain().focus().toggleItalic().run();
      },
      toggleUnderline: () => {
        editor?.chain().focus().toggleUnderline().run();
      },
      getHeadingOutline: () => {
        if (!editor) return [];
        const out: { pos: number; level: number; text: string }[] = [];
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            const level = (node.attrs.level as number) ?? 2;
            out.push({ pos, level, text: node.textContent.slice(0, 120) });
          }
        });
        return out;
      },
      scrollToDocPos: (pos: number) => {
        if (!editor) return;
        const doc = editor.state.doc;
        const safe = Math.max(1, Math.min(pos + 1, doc.content.size));
        editor.chain().focus().setTextSelection(safe).run();
        requestAnimationFrame(() => {
          try {
            const coords = editor.view.coordsAtPos(Math.min(pos, doc.content.size));
            const y = coords.top;
            const block = document.elementFromPoint(coords.left, y)?.closest('.cms-tiptap-body');
            block?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } catch {
            editor.view.dom.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      },
      openBlockInserter: () => {
        if (useExternalBlockLibrary) {
          onToggleBlockLibraryRequest?.();
          return;
        }
        setInserterExpanded(false);
        setInserterOpen(true);
      },
      runLibraryCommand: (id: string) => {
        if (!editor) return;
        runPageEditorLibraryCommand(editor, id, {
          triggerImageUpload: () => imageFileRef.current?.click(),
          insertImageFromUrl: () => addImageFromUrl(),
        });
      },
      insertPatternHtml: (html: string) => {
        editor?.chain().focus().insertContent(html).run();
      },
    }),
    [editor, addImageFromUrl, setLink, useExternalBlockLibrary, onToggleBlockLibraryRequest]
  );

  const imageBubble = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) {
        return { label: 'Auto', canShrink: false, canGrow: false };
      }
      const sel = ed.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== 'image') {
        return { label: 'Auto', canShrink: false, canGrow: false };
      }
      const dataSize = sel.node.attrs.dataSize as string | null | undefined;
      const idx = imageSizeIndex(dataSize);
      const key = dataSize && dataSize !== '' ? dataSize : '';
      return {
        label: IMAGE_SIZE_LABEL[key] ?? 'Auto',
        canShrink: idx > 0,
        canGrow: idx < IMAGE_SIZE_STEPS.length - 1,
      };
    },
  });

  const columnsBubbleState = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null;
      return findParentColumns(ed);
    },
  });

  const tableEditState = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null;
      return getTableEditCaps(ed);
    },
  });

  const textStyleAttrs = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) {
        return { color: null as string | null, fontFamily: null as string | null, fontSize: null as string | null };
      }
      const a = ed.getAttributes('textStyle') as {
        color?: string | null;
        fontFamily?: string | null;
        fontSize?: string | null;
      };
      return {
        color: a.color ?? null,
        fontFamily: a.fontFamily ?? null,
        fontSize: a.fontSize ?? null,
      };
    },
  });

  const colorPickerValue =
    textStyleAttrs?.color && /^#[0-9A-Fa-f]{6}$/i.test(textStyleAttrs.color) ? textStyleAttrs.color : '#111827';
  const fontSelectValue =
    textStyleAttrs?.fontFamily && CMS_FONT_OPTIONS.some((o) => o.value === textStyleAttrs.fontFamily)
      ? textStyleAttrs.fontFamily
      : '';
  const fontSizePxResolved = parseFontSizeToPx(textStyleAttrs?.fontSize ?? null);
  const fontSizeBubbleLabel = fontSizePxResolved != null ? `${fontSizePxResolved}` : `${FONT_SIZE_DEFAULT_PX}`;
  const fontSizeEffectivePx = fontSizePxResolved ?? FONT_SIZE_DEFAULT_PX;

  if (!editor) {
    return <div className="min-h-[320px] animate-pulse rounded-lg border border-gray-200 bg-gray-50" aria-hidden />;
  }

  const showTextBubble = ({ editor: ed }: { editor: Editor }) => {
    const { selection } = ed.state;
    if (selection.empty) return false;
    if (selection instanceof NodeSelection && selection.node.type.name === 'image') return false;
    return true;
  };

  const slashCommandItems =
    chrome === 'minimal' && slashMenu ? filterBlockCommands(slashMenu.query).slice(0, 24) : [];

  return (
    <div
      className={`tiptap-editor overflow-hidden bg-white shadow-sm ${chrome === 'minimal' ? 'rounded-none border-0 border-t border-gray-200' : 'rounded-lg border border-gray-300'}`}
    >
      <input
        ref={imageFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(ev) => void onEditorImageFile(ev)}
      />

      <BubbleMenu
        editor={editor}
        pluginKey="cmsBubbleImage"
        tippyOptions={{
          duration: 120,
          placement: 'top',
          zIndex: 100,
          appendTo: () => document.body,
        }}
        shouldShow={({ state }) =>
          state.selection instanceof NodeSelection && state.selection.node.type.name === 'image'
        }
        className="flex max-w-[min(100vw-2rem,520px)] flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
      >
        <span className="px-1 text-xs font-medium text-gray-500">Image:</span>
        <ToolbarButton title="Align left" onClick={() => setImageAlign('left')}>
          L
        </ToolbarButton>
        <ToolbarButton title="Align center" onClick={() => setImageAlign('center')}>
          C
        </ToolbarButton>
        <ToolbarButton title="Align right" onClick={() => setImageAlign('right')}>
          R
        </ToolbarButton>
        <span className="mx-0.5 h-5 w-px bg-gray-200" />
        <ToolbarButton title="Smaller width" onClick={() => bumpImageSize(-1)} disabled={!imageBubble?.canShrink}>
          −
        </ToolbarButton>
        <span className="min-w-[4.5rem] px-0.5 text-center text-[11px] font-medium text-gray-600" title="Width in content">
          {imageBubble?.label ?? 'Auto'}
        </span>
        <ToolbarButton title="Larger width" onClick={() => bumpImageSize(1)} disabled={!imageBubble?.canGrow}>
          +
        </ToolbarButton>
        <span className="mx-0.5 h-5 w-px bg-gray-200" />
        {onUseAsPageHero ? (
          <button
            type="button"
            title="Use as featured image"
            onClick={applyPageHeroFromSelection}
            className="rounded px-2 py-1.5 text-xs font-semibold text-mint hover:bg-gray-100"
          >
            Featured
          </button>
        ) : null}
        <span className="mx-0.5 h-5 w-px bg-gray-200" />
        <button
          type="button"
          title="Remove image"
          onClick={removeSelectedImage}
          className="rounded px-2 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Remove
        </button>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        pluginKey="cmsBubbleColumns"
        tippyOptions={{
          duration: 100,
          placement: 'bottom',
          offset: [0, 8],
          zIndex: 100,
          appendTo: () => document.body,
        }}
        shouldShow={({ editor: ed }) => shouldShowColumnsLayoutBubble(ed)}
        className="flex max-w-[min(100vw-2rem,420px)] flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
      >
        <span className="px-1 text-xs font-medium text-gray-500">Columns</span>
        <select
          className="max-w-[15rem] rounded border border-gray-200 bg-white py-1 pl-1 pr-6 text-xs text-gray-800"
          title="Layout (same number of columns)"
          aria-label="Column layout"
          value={columnsBubbleState?.layout ?? 'equal-2'}
          onChange={(e) => {
            const layout = e.target.value as CmsColumnsLayout;
            editor.chain().focus().updateAttributes('cmsColumns', { layout }).run();
          }}
        >
          {layoutOptionsForColumnCount(columnsBubbleState?.columnCount ?? 2).map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-gray-400">
          {columnsBubbleState ? `${columnsBubbleState.columnCount} columns` : ''}
        </span>
        <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
        <button
          type="button"
          title="Remove columns block"
          className="rounded px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          onClick={() => {
            if (typeof window !== 'undefined' && !window.confirm('Remove this columns block and all of its content?')) return;
            deleteParentColumnsBlock(editor);
          }}
        >
          Remove columns
        </button>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        pluginKey="cmsBubbleTable"
        tippyOptions={{
          duration: 100,
          placement: 'bottom',
          offset: [0, 10],
          maxWidth: 720,
          zIndex: 100,
          appendTo: () => document.body,
        }}
        shouldShow={({ editor: ed }) => shouldShowTableBubble(ed)}
        className="flex max-w-[min(100vw-1rem,720px)] flex-wrap items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
      >
        <span className="px-1 text-xs font-semibold text-gray-700">Table</span>
        <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Rows</span>
        <ToolbarButton
          title="Insert row above"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!tableEditState?.addRowBefore}
        >
          +↑
        </ToolbarButton>
        <ToolbarButton
          title="Insert row below"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!tableEditState?.addRowAfter}
        >
          +↓
        </ToolbarButton>
        <ToolbarButton
          title="Delete row"
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!tableEditState?.deleteRow}
        >
          R−
        </ToolbarButton>
        <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Cols</span>
        <ToolbarButton
          title="Insert column before"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!tableEditState?.addColumnBefore}
        >
          +←
        </ToolbarButton>
        <ToolbarButton
          title="Insert column after"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!tableEditState?.addColumnAfter}
        >
          +→
        </ToolbarButton>
        <ToolbarButton
          title="Delete column"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!tableEditState?.deleteColumn}
        >
          C−
        </ToolbarButton>
        <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
        <ToolbarButton
          title="Merge selected cells"
          onClick={() => editor.chain().focus().mergeCells().run()}
          disabled={!tableEditState?.mergeCells}
        >
          Merge
        </ToolbarButton>
        <ToolbarButton
          title="Split cell"
          onClick={() => editor.chain().focus().splitCell().run()}
          disabled={!tableEditState?.splitCell}
        >
          Split
        </ToolbarButton>
        <ToolbarButton
          title="Toggle header row"
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          disabled={!tableEditState?.toggleHeaderRow}
        >
          Header
        </ToolbarButton>
        <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
        <button
          type="button"
          title="Delete entire table"
          disabled={!tableEditState?.deleteTable}
          onClick={() => {
            if (typeof window !== 'undefined' && !window.confirm('Delete this table?')) return;
            editor.chain().focus().deleteTable().run();
          }}
          className="rounded px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete table
        </button>
      </BubbleMenu>

      {chrome === 'minimal' ? (
        <BubbleMenu
          editor={editor}
          pluginKey="cmsBubbleText"
          tippyOptions={{
            duration: 100,
            placement: 'top',
            zIndex: 100,
            appendTo: () => document.body,
          }}
          shouldShow={showTextBubble}
          className="flex max-w-[min(100vw-1.5rem,32rem)] flex-wrap items-center gap-0.5 rounded-md border border-gray-200 bg-white p-1 shadow-lg"
        >
          <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <span className="font-mono text-xs">&lt;/&gt;</span>
          </ToolbarButton>
          <ToolbarButton title="Link" onClick={setLink} active={editor.isActive('link')}>
            Link
          </ToolbarButton>
          <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" aria-hidden />
          <label
            className="inline-flex shrink-0 cursor-pointer items-center rounded border border-gray-200 bg-white p-0.5 hover:bg-gray-50"
            title="Text color"
          >
            <span className="sr-only">Custom text color</span>
            <input
              type="color"
              className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
              value={colorPickerValue}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </label>
          {TEXT_COLOR_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              title={p.title}
              onClick={() => editor.chain().focus().setColor(p.hex).run()}
              className={`h-5 w-5 shrink-0 rounded border border-gray-200 shadow-sm ring-offset-1 hover:ring-2 hover:ring-gray-400 ${
                textStyleAttrs?.color?.toLowerCase() === p.hex.toLowerCase() ? 'ring-2 ring-gray-700' : ''
              }`}
              style={{ backgroundColor: p.hex }}
            />
          ))}
          <ToolbarButton title="Reset text color" onClick={() => editor.chain().focus().unsetColor().run()}>
            Clr
          </ToolbarButton>
          <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" aria-hidden />
          <label className="flex shrink-0 items-center gap-0.5">
            <span className="sr-only">Font</span>
            <select
              value={fontSelectValue}
              title="Font family"
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  editor.chain().focus().unsetFontFamily().run();
                } else {
                  editor.chain().focus().setFontFamily(v).run();
                }
              }}
              className="max-w-[6.75rem] rounded border border-gray-200 bg-white py-0.5 pl-1 pr-5 text-[11px] text-gray-800"
            >
              {CMS_FONT_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <ToolbarButton
            title="Smaller text"
            onClick={() => bumpSelectedFontSize(-FONT_SIZE_STEP)}
            disabled={fontSizeEffectivePx <= FONT_SIZE_MIN_PX}
          >
            A−
          </ToolbarButton>
          <span
            className="min-w-[1.25rem] shrink-0 text-center text-[10px] font-semibold tabular-nums text-gray-600"
            title="Approximate size (px)"
          >
            {fontSizeBubbleLabel}
          </span>
          <ToolbarButton
            title="Larger text"
            onClick={() => bumpSelectedFontSize(FONT_SIZE_STEP)}
            disabled={fontSizeEffectivePx >= FONT_SIZE_MAX_PX}
          >
            A+
          </ToolbarButton>
          <ToolbarButton title="Reset font size" onClick={unsetSelectedFontSize}>
            Sz
          </ToolbarButton>
          <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" aria-hidden />
          <ToolbarButton
            title="Align left"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
          >
            ⟸
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
          >
            ≡
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
          >
            ⟹
          </ToolbarButton>
          <ToolbarButton title="Clear alignment" onClick={() => editor.chain().focus().unsetTextAlign().run()}>
            <span className="text-[10px]">Clr</span>
          </ToolbarButton>
        </BubbleMenu>
      ) : null}

      {chrome === 'full' ? (
        <>
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2">
          <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
            H2
          </ToolbarButton>
          <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
            H3
          </ToolbarButton>
          <span className="mx-1 h-6 w-px bg-gray-300" />
          <ToolbarButton title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
            ⟸
          </ToolbarButton>
          <ToolbarButton title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
            ≡
          </ToolbarButton>
          <ToolbarButton title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
            ⟹
          </ToolbarButton>
          <ToolbarButton title="Clear alignment" onClick={() => editor.chain().focus().unsetTextAlign().run()}>
            Clear
          </ToolbarButton>
          <span className="mx-1 h-6 w-px bg-gray-300" />
          <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <span className="font-mono text-xs">&lt;/&gt;</span>
          </ToolbarButton>
          <span className="mx-1 h-6 w-px bg-gray-300" />
          <span className="text-xs font-medium text-gray-500">Color</span>
          <label className="inline-flex cursor-pointer items-center rounded border border-gray-300 bg-white p-0.5 hover:bg-gray-50">
            <span className="sr-only">Custom text color</span>
            <input
              type="color"
              className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0"
              value={colorPickerValue}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              title="Custom color"
            />
          </label>
          {TEXT_COLOR_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              title={p.title}
              onClick={() => editor.chain().focus().setColor(p.hex).run()}
              className="h-6 w-6 rounded border border-gray-200 shadow-sm ring-offset-1 hover:ring-2 hover:ring-gray-400"
              style={{ backgroundColor: p.hex }}
            />
          ))}
          <ToolbarButton title="Reset text color" onClick={() => editor.chain().focus().unsetColor().run()}>
            Clr
          </ToolbarButton>
          <label className="ml-1 flex items-center gap-1 text-xs text-gray-600">
            <span className="font-medium text-gray-500">Font</span>
            <select
              value={fontSelectValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  editor.chain().focus().unsetFontFamily().run();
                } else {
                  editor.chain().focus().setFontFamily(v).run();
                }
              }}
              className="max-w-[9.5rem] rounded border border-gray-300 bg-white py-1 pl-1 pr-6 text-xs text-gray-800"
            >
              {CMS_FONT_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs font-medium text-gray-500">Size</span>
          <ToolbarButton
            title="Smaller text"
            onClick={() => bumpSelectedFontSize(-FONT_SIZE_STEP)}
            disabled={fontSizeEffectivePx <= FONT_SIZE_MIN_PX}
          >
            A−
          </ToolbarButton>
          <span className="min-w-[1.5rem] text-center text-[11px] font-semibold tabular-nums text-gray-600" title="px">
            {fontSizeBubbleLabel}
          </span>
          <ToolbarButton
            title="Larger text"
            onClick={() => bumpSelectedFontSize(FONT_SIZE_STEP)}
            disabled={fontSizeEffectivePx >= FONT_SIZE_MAX_PX}
          >
            A+
          </ToolbarButton>
          <ToolbarButton title="Reset font size" onClick={unsetSelectedFontSize}>
            Sz
          </ToolbarButton>
          <span className="mx-1 h-6 w-px bg-gray-300" />
          <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            • List
          </ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            1. List
          </ToolbarButton>
          <ToolbarButton title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            “ ”
          </ToolbarButton>
          <span className="mx-1 h-6 w-px bg-gray-300" />
          <ToolbarButton title="Link" onClick={setLink} active={editor.isActive('link')}>
            Link
          </ToolbarButton>
          {uploadImageFile ? (
            <ToolbarButton
              title="Upload image"
              onClick={() => imageFileRef.current?.click()}
              disabled={editorUploading}
            >
              {editorUploading ? '…' : 'Upload img'}
            </ToolbarButton>
          ) : null}
          <ToolbarButton title="Insert image from URL" onClick={addImageFromUrl}>
            Img URL
          </ToolbarButton>
          <span className="mx-1 h-6 w-px bg-gray-300" />
          <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            Undo
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            Redo
          </ToolbarButton>
        </div>
        {tableEditState ? (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-teal-50/60 px-2 py-1.5">
            <span className="px-1 text-xs font-semibold text-gray-700">Table</span>
            <span className="mx-0.5 h-4 w-px bg-gray-300" aria-hidden />
            <ToolbarButton
              title="Insert row above"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!tableEditState.addRowBefore}
            >
              +↑
            </ToolbarButton>
            <ToolbarButton
              title="Insert row below"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!tableEditState.addRowAfter}
            >
              +↓
            </ToolbarButton>
            <ToolbarButton title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!tableEditState.deleteRow}>
              R−
            </ToolbarButton>
            <span className="mx-0.5 h-4 w-px bg-gray-300" aria-hidden />
            <ToolbarButton
              title="Insert column before"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!tableEditState.addColumnBefore}
            >
              +←
            </ToolbarButton>
            <ToolbarButton
              title="Insert column after"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!tableEditState.addColumnAfter}
            >
              +→
            </ToolbarButton>
            <ToolbarButton
              title="Delete column"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!tableEditState.deleteColumn}
            >
              C−
            </ToolbarButton>
            <span className="mx-0.5 h-4 w-px bg-gray-300" aria-hidden />
            <ToolbarButton
              title="Merge cells"
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!tableEditState.mergeCells}
            >
              Merge
            </ToolbarButton>
            <ToolbarButton
              title="Split cell"
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!tableEditState.splitCell}
            >
              Split
            </ToolbarButton>
            <ToolbarButton
              title="Toggle header row"
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              disabled={!tableEditState.toggleHeaderRow}
            >
              Header
            </ToolbarButton>
            <ToolbarButton
              title="Delete table"
              onClick={() => {
                if (typeof window !== 'undefined' && !window.confirm('Delete this table?')) return;
                editor.chain().focus().deleteTable().run();
              }}
              disabled={!tableEditState.deleteTable}
            >
              Del
            </ToolbarButton>
          </div>
        ) : null}
        </>
      ) : null}

      <div className="relative">
        {chrome === 'minimal' ? (
          <div ref={inserterWrapRef} className="absolute right-3 top-3 z-20">
            <button
              type="button"
              title="Add block"
              aria-expanded={useExternalBlockLibrary ? undefined : inserterOpen}
              onClick={() => {
                if (useExternalBlockLibrary) {
                  onToggleBlockLibraryRequest?.();
                  return;
                }
                setInserterExpanded(false);
                setInserterOpen((v) => !v);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-xl font-light text-gray-700 shadow-sm hover:bg-gray-50"
            >
              +
            </button>
            {inserterOpen && !useExternalBlockLibrary ? (
              <div className="absolute right-0 top-11 z-30">
                <BlockInserterPanel
                  editor={editor}
                  onClose={() => setInserterOpen(false)}
                  expanded={inserterExpanded}
                  onToggleExpanded={() => setInserterExpanded((e) => !e)}
                  onTriggerUpload={() => imageFileRef.current?.click()}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        <EditorContent editor={editor} />
        {chrome === 'minimal' && slashMenu ? (
          <div
            ref={slashMenuRef}
            role="listbox"
            aria-label="Insert block"
            className="fixed z-[100] w-[min(100vw-2rem,280px)] max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
            style={{
              left:
                typeof window !== 'undefined'
                  ? Math.min(Math.max(8, slashMenu.x), window.innerWidth - 288)
                  : slashMenu.x,
              top: slashMenu.y,
            }}
          >
            {slashCommandItems.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">No blocks match.</p>
            ) : (
              slashCommandItems.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySlashCommand(b.id)}
                  >
                    <span className="text-base" aria-hidden>
                      {b.icon}
                    </span>
                    <span>{b.label}</span>
                  </button>
                ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
});

PageRichTextEditor.displayName = 'PageRichTextEditor';

export default PageRichTextEditor;
