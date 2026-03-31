import { Extension } from '@tiptap/core';

/**
 * Inline font-size on the textStyle mark (same pattern as @tiptap/extension-color).
 * Use editor.chain().setMark('textStyle', { fontSize: '18px' }) to apply; merges with color/fontFamily.
 */
export const CmsFontSize = Extension.create({
  name: 'cmsFontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null as string | null,
            parseHTML: (element) => {
              const raw = element.style.fontSize?.replace(/['"]+/g, '')?.trim();
              return raw || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});
