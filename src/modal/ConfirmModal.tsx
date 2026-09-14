import { defineComponent, h, ref, computed } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/modal/constants';
import '@douyinfe/semi-foundation/lib/es/modal/modal.css';
import Modal, { modalProps } from './Modal';
import { isSemiIcon, normalizeNode, cloneVNode } from '../_utils';
import { useBaseComponent } from '../_base/useBaseComponent';

export type ConfirmType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

export const confirmModalProps = {
  ...modalProps,
  /** undefined = uncontrolled (managed internally, starts visible) */
  visible: { type: Boolean, default: undefined },
  type: { type: String as PropType<ConfirmType>, default: undefined },
  content: { type: [String, Number, Object, Array, Function] as PropType<any>, default: undefined },
};

/**
 * The React `ConfirmModal`: a Modal that manages its own `visible` and turns promise-returning
 * `onOk` / `onCancel` into loading buttons. Used by `Modal.info/...` and `useModal()`.
 */
const ConfirmModal = defineComponent({
  name: 'ConfirmModal',
  inheritAttrs: false,
  props: confirmModalProps,
  emits: ['afterClose'],
  setup(props, { attrs, slots, emit }) {
    const { propsView } = useBaseComponent(props as any, {});
    const innerVisible = ref(true);
    const confirmLoading = ref<boolean | undefined>(undefined);
    const cancelLoading = ref<boolean | undefined>(undefined);

    const visible = computed(() => (props.visible !== undefined ? props.visible : innerVisible.value));

    const handleOk = (e: any) => {
      const res = props.onOk && props.onOk(e);
      if (res && (res as any).then) {
        confirmLoading.value = true;
        (res as Promise<any>).then(
          () => {
            innerVisible.value = false;
            confirmLoading.value = false;
          },
          () => {
            confirmLoading.value = false;
          }
        );
      } else {
        innerVisible.value = false;
      }
    };
    const handleCancel = (e: any) => {
      const res = props.onCancel && props.onCancel(e);
      if (res && (res as any).then) {
        cancelLoading.value = true;
        (res as Promise<any>).then(
          () => {
            innerVisible.value = false;
            cancelLoading.value = false;
          },
          () => {
            cancelLoading.value = false;
          }
        );
      } else {
        innerVisible.value = false;
      }
    };

    return () => {
      const { title, content, icon, type, className, direction, onCancel: _oc, onOk: _ok, visible: _v, confirmLoading: _cl, cancelLoading: _cll, ...rest } = props as any;
      const confirmCls = `${cssClasses.DIALOG}-confirm`;
      const wrapperCls = cls(className, attrs.class as any, confirmCls, { [`${confirmCls}-rtl`]: direction === 'rtl' });
      const typeCls = cls(`${cssClasses.DIALOG}-${type}`);
      const iconVNode: any = slots.icon ? slots.icon() : normalizeNode(icon);
      const iconNode = isSemiIcon(iconVNode) ? cloneVNode(iconVNode, { class: `${confirmCls}-icon ${typeCls}-icon`, size: 'extra-large' }) : iconVNode;
      const titleContent = slots.title ? slots.title() : normalizeNode(title);
      const titleNode = titleContent == null ? null : h('span', { class: `${confirmCls}-title-text` }, [titleContent]);
      const contentCls = cls(`${confirmCls}-content`, { [`${confirmCls}-content-withIcon`]: Boolean(iconNode) });
      const contentNode = slots.default ? slots.default() : normalizeNode(content);
      const { class: _c, ...restAttrs } = attrs as any;
      // only forward props that were actually given, so Modal's `'footer' in props` checks keep React semantics
      const passed: Record<string, any> = {};
      for (const key of Object.keys(rest)) {
        if (key in propsView) passed[key] = rest[key];
      }
      return h(
        Modal,
        {
          ...restAttrs,
          ...passed,
          direction,
          class: wrapperCls,
          title: titleNode,
          confirmLoading: confirmLoading.value,
          cancelLoading: cancelLoading.value,
          onOk: handleOk,
          onCancel: handleCancel,
          icon: iconNode,
          visible: visible.value,
          onAfterClose: () => emit('afterClose'),
        },
        {
          default: () => h('div', { class: contentCls, 'x-semi-prop': 'content' }, [contentNode]),
          footer: slots.footer,
          header: slots.header,
          closeIcon: slots.closeIcon,
        }
      );
    };
  },
});

export default ConfirmModal;
