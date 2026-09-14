import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/typography/constants';
import FormatNumeral from '@douyinfe/semi-foundation/lib/es/typography/formatNumeral';
import '@douyinfe/semi-foundation/lib/es/typography/typography.css';
import { flattenChildren } from '../_utils';
import type { VNode } from 'vue';
import { Text as TextSymbol, Fragment, cloneVNode, isVNode } from 'vue';
import Base, { baseTypographyProps, baseTypographyEmits } from './Base';
import type { TypographyBaseRule, TypographyBaseTruncate } from './Base';

const prefixCls = cssClasses.PREFIX;

/* ------------------------------------------------------------------ */
/* Typography (root container, React typography/typography.js)         */
/* ------------------------------------------------------------------ */
export const typographyProps = {
  component: { type: String, default: 'article' },
};

const TypographyRoot = defineComponent({
  name: 'Typography',
  inheritAttrs: false,
  props: typographyProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { class: className, ...rest } = attrs as any;
      return h(props.component, { ...rest, class: cls(prefixCls, className) }, slots.default?.());
    };
  },
});

/* ------------------------------------------------------------------ */
/* Text                                                                 */
/* ------------------------------------------------------------------ */
export const textProps = {
  ...baseTypographyProps,
  component: { type: String, default: 'span' },
};

export const Text = defineComponent({
  name: 'TypographyText',
  inheritAttrs: false,
  props: textProps,
  emits: baseTypographyEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const baseRef = { value: null as any };
    expose({
      getElement: () => baseRef.value?.getElement(),
      toggleOverflow: (e?: any) => baseRef.value?.toggleOverflow(e),
    });
    return () =>
      h(
        Base,
        {
          ...attrs,
          ...props,
          ref: (r: any) => (baseRef.value = r),
          onExpand: (...args: any[]) => emit('expand', ...args),
          onCopy: (...args: any[]) => emit('copy', ...args),
        },
        slots
      );
  },
});
(Text as any).elementType = 'Typography.Text';

/* ------------------------------------------------------------------ */
/* Title                                                                */
/* ------------------------------------------------------------------ */
export const titleProps = {
  ...baseTypographyProps,
  heading: { type: [Number, String] as PropType<number | string>, default: 1 },
  component: { type: String, default: undefined },
};

export const Title = defineComponent({
  name: 'TypographyTitle',
  inheritAttrs: false,
  props: titleProps,
  emits: baseTypographyEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const baseRef = { value: null as any };
    expose({
      getElement: () => baseRef.value?.getElement(),
      toggleOverflow: (e?: any) => baseRef.value?.toggleOverflow(e),
    });
    return () => {
      const { heading, component, ...rest } = props;
      const hComponent = (strings.HEADING as readonly number[]).indexOf(Number(heading)) !== -1 ? `h${heading}` : 'h1';
      // Passing headings to support custom components
      return h(
        Base,
        {
          ...attrs,
          ...rest,
          component: component || hComponent,
          heading: hComponent,
          ref: (r: any) => (baseRef.value = r),
          onExpand: (...args: any[]) => emit('expand', ...args),
          onCopy: (...args: any[]) => emit('copy', ...args),
        },
        slots
      );
    };
  },
});
(Title as any).elementType = 'Typography.Title';

/* ------------------------------------------------------------------ */
/* Paragraph                                                            */
/* ------------------------------------------------------------------ */
export const paragraphProps = {
  ...baseTypographyProps,
  component: { type: String, default: 'p' },
};

export const Paragraph = defineComponent({
  name: 'TypographyParagraph',
  inheritAttrs: false,
  props: paragraphProps,
  emits: baseTypographyEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const baseRef = { value: null as any };
    expose({
      getElement: () => baseRef.value?.getElement(),
      toggleOverflow: (e?: any) => baseRef.value?.toggleOverflow(e),
    });
    return () => {
      const { class: className, ...rest } = attrs as any;
      return h(
        Base,
        {
          ...rest,
          ...props,
          class: cls(className, `${prefixCls}-paragraph`),
          ref: (r: any) => (baseRef.value = r),
          onExpand: (...args: any[]) => emit('expand', ...args),
          onCopy: (...args: any[]) => emit('copy', ...args),
        },
        slots
      );
    };
  },
});
(Paragraph as any).elementType = 'Typography.Paragraph';

/* ------------------------------------------------------------------ */
/* Numeral                                                              */
/* ------------------------------------------------------------------ */
export const numeralProps = {
  ...baseTypographyProps,
  component: { type: String, default: 'span' },
  rule: { type: String as PropType<TypographyBaseRule>, default: 'text' },
  precision: { type: Number, default: 0 },
  truncate: { type: String as PropType<TypographyBaseTruncate>, default: 'round' },
  parser: { type: Function as PropType<(value: string) => string>, default: undefined },
};

export const Numeral = defineComponent({
  name: 'TypographyNumeral',
  inheritAttrs: false,
  props: numeralProps,
  emits: baseTypographyEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const baseRef = { value: null as any };
    expose({
      getElement: () => baseRef.value?.getElement(),
      toggleOverflow: (e?: any) => baseRef.value?.toggleOverflow(e),
    });
    const format = (text: string) => new (FormatNumeral as any)(String(text), props.rule, props.precision, props.truncate, props.parser).format();
    // Traverse the vnode tree depth-first and format every piece of text
    // (React formatNodeDFS walks `props.children`; here we walk vnode children, Fragments and component default slots)
    const formatNodeDFS = (node: any): any => {
      if (node === null || node === undefined || typeof node === 'boolean') return node;
      if (Array.isArray(node)) return node.map(formatNodeDFS);
      if (typeof node === 'string' || typeof node === 'number') return format(String(node));
      if (typeof node === 'function') return formatNodeDFS(node());
      if (isVNode(node)) {
        const vnode = node as VNode;
        if (vnode.type === TextSymbol && typeof vnode.children === 'string') {
          const cloned = cloneVNode(vnode);
          (cloned as any).children = format(vnode.children);
          return cloned;
        }
        if (typeof vnode.type === 'string' || vnode.type === Fragment) {
          if (Array.isArray(vnode.children)) {
            const cloned = cloneVNode(vnode);
            (cloned as any).children = formatNodeDFS(vnode.children);
            return cloned;
          }
          if (typeof vnode.children === 'string') {
            const cloned = cloneVNode(vnode);
            (cloned as any).children = format(vnode.children);
            return cloned;
          }
          return vnode;
        }
        // component vnode: format the content of its default slot
        const slotsObj = vnode.children as any;
        if (slotsObj && typeof slotsObj === 'object' && typeof slotsObj.default === 'function') {
          const cloned = cloneVNode(vnode);
          const originalDefault = slotsObj.default;
          (cloned as any).children = { ...slotsObj, default: (...args: any[]) => formatNodeDFS(originalDefault(...args)) };
          return cloned;
        }
        return vnode;
      }
      return node;
    };
    const formatChildren = () => {
      const children = flattenChildren(slots.default?.());
      return children.map((child) => {
        if (child.type === TextSymbol && typeof child.children === 'string') {
          return h(TextSymbol, format(child.children));
        }
        return formatNodeDFS(child);
      });
    };
    return () => {
      const { rule: _r, parser: _p, precision: _pr, truncate: _t, ...rest } = props;
      return h(
        Base,
        {
          ...attrs,
          ...rest,
          ref: (r: any) => (baseRef.value = r),
          onExpand: (...args: any[]) => emit('expand', ...args),
          onCopy: (...args: any[]) => emit('copy', ...args),
        },
        { ...slots, default: () => formatChildren() }
      );
    };
  },
});
(Numeral as any).elementType = 'Typography.Numeral';

const Typography = TypographyRoot as typeof TypographyRoot & {
  Text: typeof Text;
  Title: typeof Title;
  Paragraph: typeof Paragraph;
  Numeral: typeof Numeral;
};
Typography.Text = Text;
Typography.Title = Title;
Typography.Paragraph = Paragraph;
Typography.Numeral = Numeral;
(Typography as any).elementType = 'Typography';

export default Typography;
