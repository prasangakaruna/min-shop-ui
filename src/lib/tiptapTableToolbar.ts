import type { Editor } from '@tiptap/core';
import { isInTable } from '@tiptap/pm/tables';
import { NodeSelection } from '@tiptap/pm/state';

/** Floating table toolbar: any selection inside a table (reliable vs `isActive('table')` for cell / CellSelection). */
export function shouldShowTableBubble(editor: Editor): boolean {
  if (!isInTable(editor.state)) return false;
  const sel = editor.state.selection;
  if (sel instanceof NodeSelection && sel.node.type.name === 'image') return false;
  return true;
}

export type TableEditCaps = {
  addRowBefore: boolean;
  addRowAfter: boolean;
  deleteRow: boolean;
  addColumnBefore: boolean;
  addColumnAfter: boolean;
  deleteColumn: boolean;
  mergeCells: boolean;
  splitCell: boolean;
  toggleHeaderRow: boolean;
  deleteTable: boolean;
};

export function getTableEditCaps(editor: Editor): TableEditCaps | null {
  if (!isInTable(editor.state)) return null;
  return {
    addRowBefore: editor.can().addRowBefore(),
    addRowAfter: editor.can().addRowAfter(),
    deleteRow: editor.can().deleteRow(),
    addColumnBefore: editor.can().addColumnBefore(),
    addColumnAfter: editor.can().addColumnAfter(),
    deleteColumn: editor.can().deleteColumn(),
    mergeCells: editor.can().mergeCells(),
    splitCell: editor.can().splitCell(),
    toggleHeaderRow: editor.can().toggleHeaderRow(),
    deleteTable: editor.can().deleteTable(),
  };
}
