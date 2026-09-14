import { defineComponent, h, watch, onMounted, Fragment } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import MarkdownRenderFoundation from '@douyinfe/semi-foundation/lib/es/markdownRender/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/markdownRender/constants';
import '@douyinfe/semi-foundation/lib/es/markdownRender/markdownRender.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';
import { defaultMarkdownComponents } from './components';

export const markdownRenderProps = {
  raw: { type: String, default: '' },
  format: { type: String as PropType<'md' | 'mdx'>, default: 'mdx' },
  components: { type: Object as PropType<Record<string, any>>, default: undefined },
  remarkPlugins: { type: Array as PropType<any[]>, default: undefined },
  rehypePlugins: { type: Array as PropType<any[]>, default: undefined },
  remarkGfm: { type: Boolean, default: true },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const markdownRenderEmits = ['error'];

const MarkdownRender = defineComponent({
  name: 'MarkdownRender',
  inheritAttrs: false,
  props: markdownRenderProps,
  emits: markdownRenderEmits,
  setup(props, { attrs, emit }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      MDXContentComponent: null as any,
    });

    const jsx = (type: any, jsxProps: any, key?: any) => {
      const { children, ...rest } = jsxProps || {};
      const vnodeProps = { ...rest, key };
      if (children === undefined || children === null) return h(type, vnodeProps);
      const childList = Array.isArray(children) ? children : [children];
      if (typeof type === 'string' || type === Fragment) return h(type, vnodeProps, childList);
      return h(type, vnodeProps, { default: () => childList });
    };

    const adapter = {
      ...baseAdapter,
      getRuntime: () => ({
        jsx,
        jsxs: jsx,
        jsxDEV: jsx,
        Fragment,
      }),
    };
    const foundation = new (MarkdownRenderFoundation as any)(adapter);

    const evaluateRaw = async (raw: string) => {
      if (!raw) {
        state.MDXContentComponent = null;
        return;
      }
      try {
        state.MDXContentComponent = await foundation.evaluate(raw);
      } catch (err) {
        state.MDXContentComponent = null;
        emit('error', err);
      }
    };

    onMounted(() => evaluateRaw(props.raw));
    watch(
      () => [props.raw, props.format, props.remarkGfm, props.remarkPlugins, props.rehypePlugins] as const,
      () => evaluateRaw(props.raw)
    );

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const ComponentConstructor = state.MDXContentComponent;
      const components = { ...defaultMarkdownComponents, ...(props.components || {}) };
      return h('div', { class: cls(cssClasses.PREFIX, props.className, attrClass), style: [props.style, attrStyle], ...getDataAttr(rest) }, [
        ComponentConstructor
          ? h(ComponentConstructor, { components })
          : props.raw
            ? h('pre', { class: `${cssClasses.PREFIX}-fallback` }, normalizeNode(props.raw))
            : null,
      ]);
    };
  },
});

(MarkdownRender as any).defaultComponents = defaultMarkdownComponents;
(MarkdownRender as any).elementType = 'MarkdownRender';
export default MarkdownRender;
