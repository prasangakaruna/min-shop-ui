/** Block inserter + slash palette (WordPress-like). IDs map to editor `runLibraryCommand`. */

export type BlockCategory = 'text' | 'media' | 'design';

export type BlockCommandDef = {
  id: string;
  label: string;
  category: BlockCategory;
  /** Search / slash filter */
  keywords: string[];
  icon: string;
};

export const PAGE_EDITOR_BLOCK_COMMANDS: BlockCommandDef[] = [
  { id: 'paragraph', label: 'Paragraph', category: 'text', keywords: ['paragraph', 'text', 'p'], icon: '¶' },
  { id: 'heading', label: 'Heading', category: 'text', keywords: ['heading', 'title', 'h2'], icon: 'H' },
  { id: 'heading3', label: 'Heading 3', category: 'text', keywords: ['h3', 'subheading'], icon: 'H₃' },
  { id: 'heading4', label: 'Heading 4', category: 'text', keywords: ['h4'], icon: 'H₄' },
  { id: 'list', label: 'List', category: 'text', keywords: ['list', 'bullet', 'ul'], icon: '•' },
  { id: 'orderedList', label: 'Ordered list', category: 'text', keywords: ['ordered', 'numbered', 'ol'], icon: '1.' },
  { id: 'quote', label: 'Quote', category: 'text', keywords: ['quote', 'blockquote'], icon: '❝' },
  { id: 'code', label: 'Code', category: 'text', keywords: ['code', 'inline'], icon: '</>' },
  { id: 'codeBlock', label: 'Code block', category: 'text', keywords: ['codeblock', 'fence'], icon: '{ }' },
  { id: 'preformatted', label: 'Preformatted', category: 'text', keywords: ['pre', 'preformatted'], icon: 'pre' },
  { id: 'details', label: 'Details', category: 'text', keywords: ['details', 'accordion'], icon: '▸' },
  { id: 'math', label: 'Math', category: 'text', keywords: ['math', 'formula'], icon: '∑' },
  { id: 'pullquote', label: 'Pullquote', category: 'text', keywords: ['pullquote', 'highlight'], icon: '“' },
  { id: 'table', label: 'Table', category: 'text', keywords: ['table', 'grid'], icon: '▦' },
  {
    id: 'columns',
    label: 'Columns',
    category: 'design',
    keywords: ['columns', 'column', 'co', 'layout', 'grid', 'split', 'row'],
    icon: '▥',
  },
  { id: 'verse', label: 'Verse', category: 'text', keywords: ['verse', 'poetry'], icon: '✦' },
  { id: 'classic', label: 'Classic', category: 'text', keywords: ['classic', 'legacy'], icon: 'C' },
  { id: 'horizontalRule', label: 'Divider', category: 'design', keywords: ['divider', 'hr', 'separator'], icon: '—' },
  { id: 'stretchyParagraph', label: 'Stretchy Paragraph', category: 'design', keywords: ['stretchy', 'wide', 'paragraph'], icon: '↔' },
  { id: 'stretchyHeading', label: 'Stretchy Heading', category: 'design', keywords: ['stretchy', 'heading'], icon: 'H↔' },
  { id: 'image', label: 'Image', category: 'media', keywords: ['image', 'photo', 'img'], icon: '🖼' },
  { id: 'gallery', label: 'Gallery', category: 'media', keywords: ['gallery', 'images'], icon: '⊞' },
  { id: 'video', label: 'Video', category: 'media', keywords: ['video', 'youtube', 'vimeo'], icon: '▶' },
  { id: 'audio', label: 'Audio', category: 'media', keywords: ['audio', 'podcast'], icon: '♪' },
  { id: 'file', label: 'File', category: 'media', keywords: ['file', 'download', 'pdf'], icon: '📎' },
];

export type PatternDef = {
  id: string;
  name: string;
  description: string;
  html: string;
};

export const PAGE_EDITOR_PATTERNS: PatternDef[] = [
  {
    id: 'hero',
    name: 'Intro section',
    description: 'Heading, lead text, and divider',
    html: '<h2>Section title</h2><p>Add an introduction or value proposition here.</p><hr />',
  },
  {
    id: 'callout',
    name: 'Callout',
    description: 'Bordered quote style',
    html: '<blockquote><p><strong>Note:</strong> Important information for readers.</p></blockquote>',
  },
  {
    id: 'twoColText',
    name: 'Two columns (table)',
    description: 'Simple two-cell layout',
    html: '<table class="w-full border-collapse border border-gray-200"><tbody><tr><td class="border border-gray-200 p-3 align-top"><p>Column one</p></td><td class="border border-gray-200 p-3 align-top"><p>Column two</p></td></tr></tbody></table>',
  },
  {
    id: 'wpColumns2',
    name: 'Columns (2 equal)',
    description: 'WordPress-style row; add blocks inside each column',
    html: '<div data-cms-columns data-layout="equal-2"><div data-cms-column><p>Column 1</p></div><div data-cms-column><p>Column 2</p></div></div>',
  },
  {
    id: 'wpColumns3',
    name: 'Columns (3 equal)',
    description: 'Three equal columns',
    html: '<div data-cms-columns data-layout="equal-3"><div data-cms-column><p>Column 1</p></div><div data-cms-column><p>Column 2</p></div><div data-cms-column><p>Column 3</p></div></div>',
  },
  {
    id: 'wpColumns3070',
    name: 'Columns (30 / 70)',
    description: 'Narrow + wide (two columns)',
    html: '<div data-cms-columns data-layout="30-70"><div data-cms-column><p>Narrow</p></div><div data-cms-column><p>Wide</p></div></div>',
  },
  {
    id: 'faq',
    name: 'FAQ item',
    description: 'Question and answer',
    html: '<h3>Question goes here?</h3><p>Answer text goes here.</p>',
  },
];

export function filterBlockCommands(query: string): BlockCommandDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return PAGE_EDITOR_BLOCK_COMMANDS;
  return PAGE_EDITOR_BLOCK_COMMANDS.filter((b) => {
    if (b.label.toLowerCase().includes(q)) return true;
    if (b.id.toLowerCase().includes(q)) return true;
    return b.keywords.some((k) => k.includes(q) || q.includes(k));
  });
}
