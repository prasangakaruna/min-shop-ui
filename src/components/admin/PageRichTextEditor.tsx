'use client';

import React, { useCallback, useRef, useState } from 'react';
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

/** Block images: alignment + width presets (data-* survives save + sanitizer). */
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

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Upload to content library (same as Content → Files; S3 when API disk is S3). Returns public URL. */
  uploadImageFile?: (file: File) => Promise<string>;
  /** Sets sidebar “Featured image” (page hero) to this URL — same as storefront hero strip. */
  onUseAsPageHero?: (imageUrl: string) => void;
};

export default function PageRichTextEditor({ initialHtml, onChange, placeholder, uploadImageFile, onUseAsPageHero }: Props) {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [editorUploading, setEditorUploading] = useState(false);

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
      Placeholder.configure({
        placeholder: placeholder ?? 'Start writing your page…',
      }),
    ],
    content: initialHtml && initialHtml.trim() !== '' ? initialHtml : '<p></p>',
    editorProps: {
      attributes: {
        class:
          'cms-tiptap-body prose prose-sm sm:prose prose-gray max-w-none min-h-[min(420px,50vh)] px-4 py-4 focus:outline-none [&_img]:max-w-full',
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

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

  const textStyleAttrs = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) {
        return { color: null as string | null, fontFamily: null as string | null };
      }
      const a = ed.getAttributes('textStyle') as { color?: string | null; fontFamily?: string | null };
      return {
        color: a.color ?? null,
        fontFamily: a.fontFamily ?? null,
      };
    },
  });

  const colorPickerValue =
    textStyleAttrs?.color && /^#[0-9A-Fa-f]{6}$/i.test(textStyleAttrs.color) ? textStyleAttrs.color : '#111827';
  const fontSelectValue =
    textStyleAttrs?.fontFamily &&
    CMS_FONT_OPTIONS.some((o) => o.value === textStyleAttrs.fontFamily)
      ? textStyleAttrs.fontFamily
      : '';

  if (!editor) {
    return <div className="min-h-[320px] animate-pulse rounded-lg border border-gray-200 bg-gray-50" aria-hidden />;
  }

  return (
    <div className="tiptap-editor overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
      <input
        ref={imageFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(ev) => void onEditorImageFile(ev)}
      />
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 120, placement: 'top' }}
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
            title="Use this image as the page hero (featured image at top of the page)"
            onClick={applyPageHeroFromSelection}
            className="rounded px-2 py-1.5 text-xs font-semibold text-mint hover:bg-gray-100"
          >
            Page hero
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
            title="Upload image to library (S3 when configured)"
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
      <EditorContent editor={editor} />
    </div>
  );
}
