import { Node, mergeAttributes, type Editor, type JSONContent } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';

/** Layout presets (WordPress-style variations). Count must match number of `cmsColumn` children. */
export type CmsColumnsLayout = 'equal-2' | 'equal-3' | 'equal-4' | '30-70' | '70-30' | '25-50-25';

export const CMS_COLUMNS_LAYOUT_META: {
  id: CmsColumnsLayout;
  label: string;
  columns: number;
}[] = [
  { id: 'equal-2', label: 'Two columns (equal)', columns: 2 },
  { id: 'equal-3', label: 'Three columns (equal)', columns: 3 },
  { id: 'equal-4', label: 'Four columns (equal)', columns: 4 },
  { id: '30-70', label: '30% / 70%', columns: 2 },
  { id: '70-30', label: '70% / 30%', columns: 2 },
  { id: '25-50-25', label: '25% / 50% / 25%', columns: 3 },
];

export function layoutOptionsForColumnCount(count: number): typeof CMS_COLUMNS_LAYOUT_META {
  return CMS_COLUMNS_LAYOUT_META.filter((m) => m.columns === count);
}

/** One column inside a columns row; holds normal block content (paragraphs, lists, images, nested columns, …). */
export const CmsColumn = Node.create({
  name: 'cmsColumn',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-cms-column]', priority: 51 }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-cms-column': '' }), 0];
  },
});

/** Row of columns (WordPress “Columns” block). */
export const CmsColumns = Node.create({
  name: 'cmsColumns',
  group: 'block',
  content: 'cmsColumn+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      layout: {
        default: 'equal-2',
        parseHTML: (element) => (element.getAttribute('data-layout') as CmsColumnsLayout) || 'equal-2',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-cms-columns]',
        getAttrs: (element) => ({
          layout: (element.getAttribute('data-layout') as CmsColumnsLayout) || 'equal-2',
        }),
        priority: 51,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-cms-columns': '',
        'data-layout': node.attrs.layout as string,
      }),
      0,
    ];
  },
});

export function cmsColumnsDocJSON(layout: CmsColumnsLayout): JSONContent {
  const meta = CMS_COLUMNS_LAYOUT_META.find((m) => m.id === layout) ?? CMS_COLUMNS_LAYOUT_META[0];
  const n = meta.columns;
  const cols: JSONContent[] = [];
  for (let i = 0; i < n; i++) {
    cols.push({
      type: 'cmsColumn',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: `Column ${i + 1}` }],
        },
      ],
    });
  }
  return {
    type: 'cmsColumns',
    attrs: { layout },
    content: cols,
  };
}

export function findParentColumns(
  editor: Editor
): { pos: number; layout: CmsColumnsLayout; columnCount: number } | null {
  const { state } = editor;
  const sel = state.selection;
  if (sel instanceof NodeSelection && sel.node.type.name === 'cmsColumns') {
    const node = sel.node;
    return {
      pos: sel.from,
      layout: (node.attrs.layout as CmsColumnsLayout) || 'equal-2',
      columnCount: node.childCount,
    };
  }
  const { $from } = sel;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'cmsColumns') {
      return {
        pos: $from.before(d),
        layout: (node.attrs.layout as CmsColumnsLayout) || 'equal-2',
        columnCount: node.childCount,
      };
    }
  }
  return null;
}

/** Show columns block toolbar whenever the selection is inside this columns row (layout + remove). */
export function shouldShowColumnsLayoutBubble(editor: Editor): boolean {
  return findParentColumns(editor) != null;
}

/** Remove the whole Columns block (all inner columns and content). */
export function deleteParentColumnsBlock(editor: Editor): boolean {
  const info = findParentColumns(editor);
  if (!info) return false;
  const node = editor.state.doc.nodeAt(info.pos);
  if (!node || node.type.name !== 'cmsColumns') return false;
  const from = info.pos;
  const to = from + node.nodeSize;
  return editor.chain().focus().deleteRange({ from, to }).run();
}
