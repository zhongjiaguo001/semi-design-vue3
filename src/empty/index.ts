import { defineComponent, h, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/empty/constants';
import '@douyinfe/semi-foundation/lib/es/empty/empty.css';
import { getDataAttr, normalizeNode, flattenChildren } from '../_utils';
import { useConfigContext } from '../configProvider/context';

const prefixCls = cssClasses.PREFIX;

export const emptyProps = {
  layout: { type: String as PropType<'vertical' | 'horizontal'>, default: 'vertical' },
  image: { type: [String, Object, Function] as PropType<any>, default: undefined },
  darkModeImage: { type: [String, Object, Function] as PropType<any>, default: undefined },
  imageStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  title: { type: [String, Object, Function] as PropType<any>, default: undefined },
  description: { type: [String, Object, Function] as PropType<any>, default: undefined },
};

const Empty = defineComponent({
  name: 'Empty',
  inheritAttrs: false,
  props: emptyProps,
  setup(props, { slots, attrs }) {
    const context = useConfigContext();
    const mode = ref<string | null>(null);
    let observer: MutationObserver | null = null;
    const updateMode = () => {
      const val = document.body.getAttribute('theme-mode');
      if (val !== mode.value) mode.value = val;
    };
    onMounted(() => {
      if (props.darkModeImage && typeof MutationObserver !== 'undefined') {
        updateMode();
        observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'theme-mode') updateMode();
          }
        });
        observer.observe(document.body, { attributes: true, childList: false, subtree: false });
      }
    });
    onBeforeUnmount(() => observer?.disconnect());

    return () => {
      const { layout, imageStyle, darkModeImage } = props;
      const image = slots.image ? slots.image() : props.image;
      const description = slots.description ? slots.description() : props.description;
      const title = slots.title ? slots.title() : props.title;
      const children = flattenChildren(slots.default?.());
      const alt = typeof description === 'string' ? description : 'empty';
      const isDark = mode.value === 'dark' || context.themeDark;
      const imgSrc = isDark && darkModeImage ? darkModeImage : image;
      let imageNode: any = null;
      if (typeof imgSrc === 'string') {
        imageNode = h('img', { alt, src: imgSrc });
      } else if (imgSrc && typeof imgSrc === 'object' && 'id' in imgSrc && !('setup' in imgSrc) && !('render' in imgSrc)) {
        imageNode = h('svg', { 'aria-hidden': 'true' }, [h('use', { 'xlink:href': `#${imgSrc.id}` })]);
      } else {
        imageNode = normalizeNode(imgSrc);
      }
      const { class: className, style, ...rest } = attrs as any;
      const wrapperCls = cls(className, prefixCls, { [`${prefixCls}-${layout}`]: layout });
      const titleNode = title
        ? imageNode
          ? h('h4', { class: cls('semi-typography', 'semi-typography-primary', `${prefixCls}-title`), 'x-semi-prop': 'title' }, [normalizeNode(title)])
          : h('h6', { class: cls('semi-typography', 'semi-typography-primary', `${prefixCls}-title`), style: { fontWeight: 400 }, 'x-semi-prop': 'title' }, [normalizeNode(title)])
        : null;
      return h('div', { class: wrapperCls, style, ...getDataAttr(rest) }, [
        h('div', { class: `${prefixCls}-image`, style: imageStyle, 'x-semi-prop': 'image,darkModeImage' }, [imageNode]),
        h('div', { class: `${prefixCls}-content` }, [
          titleNode,
          description ? h('div', { class: `${prefixCls}-description`, 'x-semi-prop': 'description' }, [normalizeNode(description)]) : null,
          children.length ? h('div', { class: `${prefixCls}-footer`, 'x-semi-prop': 'children' }, children) : null,
        ]),
      ]);
    };
  },
});

export { Empty, Empty as default };
