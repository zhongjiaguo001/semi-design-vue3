import { defineComponent, h, ref, isVNode } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/image/constants';
import { IconClose } from '../icons/generated';
import { normalizeNode } from '../_utils';
import { usePreviewContext } from './previewContext';

const prefixCls = `${cssClasses.PREFIX}-preview-header`;

export const previewHeaderProps = {
  titleStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  closable: { type: Boolean, default: true },
  renderHeader: { type: Function as PropType<(title?: any) => VNodeChild>, default: undefined },
  renderCloseIcon: { type: [Function, Object] as PropType<any>, default: undefined },
  onClose: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
};

const PreviewHeader = defineComponent({
  name: 'ImagePreviewHeader',
  inheritAttrs: false,
  props: previewHeaderProps,
  setup(props, { attrs, slots, expose }) {
    const context = usePreviewContext();
    const rootRef = ref<HTMLElement | null>(null);
    expose({ getElement: () => rootRef.value });
    return () => {
      const { currentIndex, titles } = context;
      let title: any;
      if (titles && typeof currentIndex === 'number') {
        title = titles[currentIndex];
      }
      let closeIcon: any = slots.closeIcon ? slots.closeIcon() : typeof props.renderCloseIcon === 'function' ? props.renderCloseIcon() : props.renderCloseIcon;
      if (Array.isArray(closeIcon)) closeIcon = closeIcon[0];
      closeIcon = normalizeNode(closeIcon);
      if (typeof closeIcon !== 'undefined' && closeIcon !== null && !isVNode(closeIcon)) {
        console.warn('[Semi ImagePreview] RenderCloseIcon should be a valid react element or a function that returns a react element');
      }
      const headerContent = slots.header ? slots.header(title) : props.renderHeader ? props.renderHeader(title) : title;
      return h('section', { ref: rootRef, class: cls(prefixCls, props.className, attrs.class as any) }, [
        h('section', { class: `${prefixCls}-title`, style: props.titleStyle }, [headerContent]),
        props.closable
          ? h('section', { class: `${prefixCls}-close`, onMouseup: (e: MouseEvent) => props.onClose && props.onClose(e) }, [isVNode(closeIcon) ? closeIcon : h(IconClose)])
          : null,
      ]);
    };
  },
});

export default PreviewHeader;
