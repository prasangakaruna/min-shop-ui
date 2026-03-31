import type { Editor } from '@tiptap/core';
import { CMS_COLUMNS_LAYOUT_META, cmsColumnsDocJSON } from '@/lib/tiptapColumns';

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export type LibraryCommandHelpers = {
  triggerImageUpload: () => void;
  insertImageFromUrl: () => void;
};

/** Returns true if the editor ran or started an action (e.g. file picker). */
export function runPageEditorLibraryCommand(editor: Editor, cmd: string, h: LibraryCommandHelpers): boolean {
  const chain = () => editor.chain().focus();

  switch (cmd) {
    case 'paragraph':
      chain().clearNodes().setParagraph().run();
      return true;
    case 'heading':
      chain().toggleHeading({ level: 2 }).run();
      return true;
    case 'heading3':
      chain().toggleHeading({ level: 3 }).run();
      return true;
    case 'heading4':
      chain().toggleHeading({ level: 4 }).run();
      return true;
    case 'list':
      chain().toggleBulletList().run();
      return true;
    case 'orderedList':
      chain().toggleOrderedList().run();
      return true;
    case 'quote':
      chain().toggleBlockquote().run();
      return true;
    case 'code':
      chain().toggleCode().run();
      return true;
    case 'codeBlock':
      chain().toggleCodeBlock().run();
      return true;
    case 'preformatted':
      chain().clearNodes().toggleCodeBlock().run();
      return true;
    case 'details':
      chain()
        .insertContent(
          '<blockquote><h4>Details</h4><p>Replace with summary content. In WordPress this would be a collapsible block.</p></blockquote>'
        )
        .run();
      return true;
    case 'math': {
      const f = window.prompt('Formula (plain text)', 'E = mc²');
      if (f === null) return false;
      chain().insertContent(`<p><em>${escapeText(f)}</em></p>`).run();
      return true;
    }
    case 'pullquote':
      chain()
        .insertContent(
          '<blockquote><p><em>Pullquote — replace this highlighted statement.</em></p></blockquote>'
        )
        .run();
      return true;
    case 'table':
      chain().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
      return true;
    case 'columns': {
      const lines = CMS_COLUMNS_LAYOUT_META.map((l, i) => `${i + 1}. ${l.label}`).join('\n');
      const raw = window.prompt(`Columns — WordPress-style layout\n${lines}\n\nEnter 1–6:`, '1');
      if (raw === null) return false;
      const n = parseInt(raw.trim(), 10);
      const picked = Number.isFinite(n) ? CMS_COLUMNS_LAYOUT_META[n - 1] : undefined;
      const layout = picked?.id ?? 'equal-2';
      chain().insertContent(cmsColumnsDocJSON(layout)).run();
      return true;
    }
    case 'verse':
      chain()
        .insertContent(
          '<blockquote><p>Line one of verse<br />Line two of verse<br />Line three</p></blockquote>'
        )
        .run();
      return true;
    case 'classic':
      chain()
        .insertContent(
          '<p>Classic block: use headings, lists, and images freely. This mirrors the WordPress “Classic” block as rich text.</p>'
        )
        .run();
      return true;
    case 'horizontalRule':
      chain().setHorizontalRule().run();
      return true;
    case 'stretchyParagraph':
      chain().clearNodes().setParagraph().setTextAlign('center').run();
      return true;
    case 'stretchyHeading':
      chain().toggleHeading({ level: 2 }).setTextAlign('center').run();
      return true;
    case 'image':
      h.triggerImageUpload();
      return true;
    case 'gallery': {
      const u1 = window.prompt('First image URL', 'https://');
      if (!u1) return false;
      const u2 = window.prompt('Second image URL (optional)', '');
      chain().setImage({ src: u1.trim() }).run();
      if (u2 && u2.trim()) {
        editor.chain().focus().insertContent('<p></p>').setImage({ src: u2.trim() }).run();
      }
      return true;
    }
    case 'video': {
      const url = window.prompt('Video or embed page URL (saved as a link)', 'https://');
      if (!url) return false;
      const u = url.trim();
      chain()
        .insertContent(
          `<p><a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">Watch video</a></p>`
        )
        .run();
      return true;
    }
    case 'audio': {
      const url = window.prompt('Audio file or page URL (saved as a link)', 'https://');
      if (!url) return false;
      const u = url.trim();
      chain()
        .insertContent(
          `<p><a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">Listen / download audio</a></p>`
        )
        .run();
      return true;
    }
    case 'file': {
      const url = window.prompt('File URL', 'https://');
      if (!url) return false;
      const label = window.prompt('Link label', 'Download file') || 'Download file';
      const u = url.trim();
      chain()
        .insertContent(
          `<p><a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">${escapeAttr(label)}</a></p>`
        )
        .run();
      return true;
    }
    default:
      return false;
  }
}
