import { h, defineComponent } from 'vue';
import { omit, nth } from 'lodash';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/markdownRender/constants';
import { Title, Text, Paragraph } from '../typography';
import CodeHighlight from '../codeHighlight/CodeHighlight';
import Image from '../image/Image';
import Table from '../table/Table';
import { IconUploadError } from '../icons/generated';
import { flattenChildren, normalizeNode } from '../_utils';

const prefix = cssClasses.PREFIX;

function heading(level: number) {
  return defineComponent({
    name: `MarkdownH${level}`,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      return () => h(Title, { heading: level, class: `${prefix}-component-header`, ...attrs }, slots);
    },
  });
}

export const h1 = heading(1);
export const h2 = heading(2);
export const h3 = heading(3);
export const h4 = heading(4);
export const h5 = heading(5);
export const h6 = heading(6);

export const p = defineComponent({
  name: 'MarkdownP',
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () => h(Paragraph, { class: `${prefix}-component-p`, ...attrs }, slots);
  },
});

export const a = defineComponent({
  name: 'MarkdownA',
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () => h(Text, { link: { ...attrs }, ...attrs }, slots);
  },
});

export const img = defineComponent({
  name: 'MarkdownImg',
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () =>
      h('div', { class: `${prefix}-component-image` }, [
        h(Image, { fallback: IconUploadError, width: '100%', ...omit(attrs, 'children') } as any),
        h('div', { class: `${prefix}-component-image-alt` }, attrs.alt as any),
      ]);
  },
});

export const code = defineComponent({
  name: 'MarkdownCode',
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () => {
      const children = flattenChildren(slots.default?.());
      const text = children.map((c: any) => (typeof c.children === 'string' ? c.children : c.children || '')).join('') || (attrs.children as string);
      const language = nth(String(attrs.class || attrs.className || '').split('-'), -1);
      if (language) {
        return h(CodeHighlight, { code: text, language, lineNumber: true });
      }
      return h('span', { class: `${prefix}-simple-code` }, children.length ? children : normalizeNode(text));
    };
  },
});

export const table = defineComponent({
  name: 'MarkdownTable',
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () => {
      const children = flattenChildren(slots.default?.());
      const thead = children.find((n: any) => n.type === 'thead') ?? children[0];
      const tbody = children.find((n: any) => n.type === 'tbody') ?? children[1];
      const headTrChildren = flattenChildren((thead as any)?.children || (thead as any)?.props?.children);
      const headTr = headTrChildren.find((n: any) => n.type === 'tr') ?? headTrChildren[0];
      const columnsFiber = flattenChildren((headTr as any)?.children || (headTr as any)?.props?.children);
      const titlesColumns = columnsFiber.map((column: any, i: number) => ({
        dataIndex: String(i),
        title: flattenChildren(column.children || column.props?.children),
      }));
      const dataFiber = flattenChildren((tbody as any)?.children || (tbody as any)?.props?.children);
      const tableDataSource = dataFiber.map((row: any, i: number) => {
        const item: Record<string, any> = { key: String(i) };
        flattenChildren(row.children || row.props?.children).forEach((child: any, index: number) => {
          item[String(index)] = flattenChildren(child.children || child.props?.children);
        });
        return item;
      });
      return h(Table, { dataSource: tableDataSource, columns: titlesColumns, ...omit(attrs, 'children') } as any);
    };
  },
});

export const defaultMarkdownComponents = { h1, h2, h3, h4, h5, h6, a, img, table, p, code };
