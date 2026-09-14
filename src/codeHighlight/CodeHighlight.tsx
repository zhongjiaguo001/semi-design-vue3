import { defineComponent, h, ref, watch, onMounted } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import CodeHighlightFoundation from '@douyinfe/semi-foundation/lib/es/codeHighlight';
import '@douyinfe/semi-foundation/lib/es/codeHighlight/codeHighlight.css';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/codeHighlight/constants';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr } from '../_utils';

export const codeHighlightProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  code: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  lineNumber: { type: Boolean, default: true },
  defaultTheme: { type: Boolean, default: true },
};

const CodeHighlight = defineComponent({
  name: 'CodeHighlight',
  inheritAttrs: false,
  props: codeHighlightProps,
  setup(props, { attrs }) {
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const foundation = new (CodeHighlightFoundation as any)(baseAdapter);
    const codeRef = ref<HTMLElement | null>(null);

    onMounted(() => {
      if (codeRef.value) {
        foundation.highlightCode(codeRef.value, props.language);
      }
    });
    // componentDidUpdate (the React condition is buggy; highlight on code/language/lineNumber change)
    watch(
      () => [props.code, props.language, props.lineNumber],
      () => {
        if (codeRef.value) {
          foundation.highlightCode(codeRef.value, props.language);
        }
      },
      { flush: 'post' }
    );

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      return h(
        'div',
        {
          class: cls(props.className, cssClasses.PREFIX, 'semi-light-scrollbar', { [`${cssClasses.PREFIX}-defaultTheme`]: props.defaultTheme }, attrClass),
          style: [props.style, attrStyle],
          ...getDataAttr(rest),
        },
        [
          h('pre', null, [
            // keyed by code so Vue replaces the element instead of patching over prism's spans
            h('code', { ref: codeRef, key: props.code }, props.code),
          ]),
        ]
      );
    };
  },
});
(CodeHighlight as any).__SemiComponentName__ = 'CodeHighlight';
(CodeHighlight as any).elementType = 'CodeHighlight';

export default CodeHighlight;
