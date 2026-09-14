import { defineComponent, h, ref, onBeforeUnmount, cloneVNode } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/typography/constants';
import isEnterPress from '@douyinfe/semi-foundation/lib/es/utils/isEnterPress';
import Tooltip from '../tooltip/Tooltip';
import { useLocale } from '../locale';
import { IconCopy, IconTick } from '../icons/generated';
import { flattenChildren, normalizeNode, isVNode } from '../_utils';
import { copyTextToClipboard } from './util';

const prefixCls = cssClasses.PREFIX;

export type CopyableRender = (copied: boolean, doCopy: (e?: any) => void, config: Record<string, any>) => VNodeChild;

export const copyableProps = {
  content: { type: String, default: '' },
  duration: { type: Number, default: 3 },
  successTip: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  copyTip: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  icon: { type: [Object, Function] as PropType<any>, default: undefined },
  render: { type: Function as PropType<CopyableRender>, default: undefined },
  className: { type: String, default: '' },
  style: { type: Object as PropType<CSSProperties>, default: () => ({}) },
};

/**
 * Copy button used by Typography `copyable` (React typography/copyable.js).
 * Emits `copy(event, content, success)` (React `onCopy`).
 */
const Copyable = defineComponent({
  name: 'TypographyCopyable',
  inheritAttrs: false,
  props: copyableProps,
  emits: ['copy'],
  setup(props, { slots, attrs, emit, expose }) {
    const { locale } = useLocale('Typography');
    const copied = ref(false);
    const item = ref('');
    const rootRef = ref<HTMLElement | null>(null);
    let timeId: any = null;

    const resetCopied = () => {
      if (timeId) {
        clearTimeout(timeId);
        timeId = null;
        copied.value = false;
        item.value = '';
      }
    };
    const setCopied = (value: string, timer: number) => {
      copied.value = true;
      item.value = value;
      timeId = setTimeout(() => resetCopied(), timer * 1000);
    };
    const copy = (e?: any) => {
      const { content, duration } = props;
      const res = copyTextToClipboard(content);
      emit('copy', e, content, res);
      setCopied(content, duration);
    };
    onBeforeUnmount(() => {
      if (timeId) {
        clearTimeout(timeId);
        timeId = null;
      }
    });

    const renderSuccessTip = () => {
      if (slots.successTip) return slots.successTip();
      if (typeof props.successTip !== 'undefined') return normalizeNode(props.successTip);
      return h('span', null, [h(IconTick), locale.value.copied]);
    };

    const renderCopyIcon = () => {
      const copyProps = {
        role: 'button',
        tabindex: 0,
        onClick: copy,
        onKeypress: (e: KeyboardEvent) => isEnterPress(e) && copy(e),
      };
      const iconNode = slots.icon ? flattenChildren(slots.icon())[0] : normalizeNode(props.icon);
      if (iconNode && isVNode(iconNode)) {
        return cloneVNode(iconNode, copyProps, true);
      }
      // TODO(semi): replace `a` tag with `span` in next major version
      return h('a', { class: `${prefixCls}-action-copy-icon` }, [h(IconCopy, { ...copyProps })]);
    };

    expose({ copy, getElement: () => rootRef.value, rootRef });

    return () => {
      const { className, copyTip, render } = props;
      const isCopied = copied.value;
      const finalCls = cls(className, attrs.class as any, {
        [`${prefixCls}-action-copy`]: !isCopied,
        [`${prefixCls}-action-copied`]: isCopied,
      });
      const renderFn = render || (slots.default ? (c: boolean, d: (e?: any) => void, p: any) => slots.default!({ copied: c, copy: d, config: p }) : undefined);
      if (renderFn) {
        return renderFn(isCopied, copy, { ...props, ...attrs });
      }
      const tipContent = slots.copyTip ? slots.copyTip() : typeof copyTip !== 'undefined' ? normalizeNode(copyTip) : locale.value.copy;
      const { class: _c, style: attrStyle, ...rest } = attrs as any;
      return h(
        'span',
        { ...rest, style: { marginLeft: '4px', ...props.style, ...(attrStyle || {}) }, class: finalCls, ref: rootRef },
        [isCopied ? renderSuccessTip() : h(Tooltip, { content: tipContent }, { default: () => renderCopyIcon() })]
      );
    };
  },
});

export default Copyable;
