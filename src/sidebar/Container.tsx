import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, onUpdated } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/sidebar/constants';
import ContainerFoundation from '@douyinfe/semi-foundation/lib/es/sidebar/containerFoundation';
import '@douyinfe/semi-foundation/lib/es/sidebar/sidebar.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import CSSAnimation from '../_cssAnimation';
import { IconClose } from '../icons/generated';
import Button from '../button/Button';
import { normalizeNode, toPx } from '../_utils';

const prefixCls = cssClasses.SIDEBAR;

export interface ResizableSize {
  width?: string | number;
  height?: string | number;
}

export const sidebarContainerProps = {
  title: { type: [Object, Function, String] as PropType<any>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  visible: { type: Boolean, default: false },
  motion: { type: Boolean, default: true },
  minWidth: { type: [String, Number] as PropType<string | number>, default: 150 },
  maxWidth: { type: [String, Number] as PropType<string | number>, default: undefined },
  closeOnEsc: { type: Boolean, default: true },
  resizable: { type: Boolean, default: true },
  defaultSize: { type: Object as PropType<ResizableSize>, default: undefined },
  className: { type: String, default: undefined },
  renderHeader: { type: Function as PropType<() => VNodeChild>, default: undefined },
  showClose: { type: Boolean, default: true },
};

export const sidebarContainerEmits = ['cancel', 'afterVisibleChange'];

const SidebarContainer = defineComponent({
  name: 'SidebarContainer',
  inheritAttrs: false,
  props: sidebarContainerProps,
  emits: sidebarContainerEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent<any, { displayNone: boolean; width: string | number | undefined }>(props as any, {
      displayNone: !props.visible,
      width: props.defaultSize?.width,
    });
    const containerRef = ref<HTMLElement | null>(null);
    let resizing = false;
    let startX = 0;
    let startWidth = 0;

    const handleKeyDown = (e: KeyboardEvent) => foundation.handleKeyDown(e);
    const adapter = {
      ...baseAdapter,
      notifyCancel: (e: MouseEvent | KeyboardEvent) => emit('cancel', e),
      notifyVisibleChange: (visible: boolean) => emit('afterVisibleChange', visible),
      setOnKeyDownListener: () => {
        if (typeof window !== 'undefined') window.addEventListener('keydown', handleKeyDown);
      },
      removeKeyDownListener: () => {
        if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeyDown);
      },
      toggleDisplayNone: (displayNone: boolean) => {
        if (displayNone !== state.displayNone) state.displayNone = displayNone;
      },
    };
    const foundation = new (ContainerFoundation as any)(adapter);
    const handleCancel = (e: MouseEvent) => foundation.handleCancel(e);

    // getDerivedStateFromProps
    watch(
      () => props.visible,
      (visible) => {
        if (visible && state.displayNone) state.displayNone = false;
      }
    );
    onMounted(() => {
      if (props.visible) foundation.beforeShow();
    });
    let prevVisible = props.visible;
    let prevDisplayNone = state.displayNone;
    onUpdated(() => {
      const displayNoneChanged = !prevDisplayNone && state.displayNone;
      const shown = !prevVisible && props.visible;
      prevVisible = props.visible;
      prevDisplayNone = state.displayNone;
      if (shown) {
        foundation.beforeShow();
      }
      if (displayNoneChanged) {
        foundation.afterHide();
      }
    });
    onBeforeUnmount(() => {
      if (props.visible) foundation.destroy();
    });

    const onResizeStart = (e: MouseEvent) => {
      if (!props.resizable || !containerRef.value) return;
      resizing = true;
      startX = e.clientX;
      startWidth = containerRef.value.offsetWidth;
      const move = (ev: MouseEvent) => {
        if (!resizing) return;
        const delta = ev.clientX - startX;
        let width = startWidth + delta;
        const min = Number(props.minWidth) || 0;
        const max = props.maxWidth !== undefined && props.maxWidth !== null ? Number(props.maxWidth) : undefined;
        width = Math.max(min, width);
        if (max) width = Math.min(max, width);
        state.width = width;
      };
      const up = () => {
        resizing = false;
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    };

    expose({ containerRef, getElement: () => containerRef.value });

    const renderHeader = () => {
      const { title, showClose, renderHeader } = props;
      const titleSlot = slots.title ? slots.title() : undefined;
      const result = renderHeader ? renderHeader() : null;
      if (result) return result;
      return h('div', { class: `${prefixCls}-container-header` }, [
        h('div', { class: `${prefixCls}-container-header-title` }, [titleSlot || normalizeNode(title)]),
        showClose
          ? h(Button, { class: `${prefixCls}-container-header-closeBtn`, icon: h(IconClose), theme: 'borderless', type: 'tertiary', 'aria-label': 'close', onClick: handleCancel, size: 'small' })
          : null,
      ]);
    };

    const renderInnerContent = ({ animationClassName, animationStyle, animationEventsNeedBind }: any) => {
      const { style, className } = props;
      return h(
        'div',
        {
          class: cls(`${prefixCls}-container`, { [className as string]: className, [animationClassName]: animationClassName }, attrs.class as any),
          ref: containerRef,
          style: [style, animationStyle, state.width !== undefined ? { width: toPx(state.width) } : null, attrs.style as any],
          ...animationEventsNeedBind,
        },
        [
          renderHeader(),
          h('div', { class: `${prefixCls}-container-content` }, slots.default?.()),
          // minimal inline substitute for the React `Resizable` wrapper (ported in task 11):
          // a drag handle on the right edge adjusts the container width
          props.resizable
            ? h('div', {
                class: `${prefixCls}-container-resize-handle`,
                style: { position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', cursor: 'col-resize' },
                onMousedown: onResizeStart,
              })
            : null,
        ]
      );
    };

    return () => {
      const { visible, motion } = props;
      const shouldRender = visible || (motion && !state.displayNone);
      return h(
        CSSAnimation,
        {
          startClassName: visible ? `${prefixCls}-animation-content_show` : `${prefixCls}-animation-content_hide`,
          animationState: visible ? 'enter' : 'leave',
          motion,
          onAnimationEnd: () => foundation.handleAnimationEnd(),
        },
        { default: (slotProps: any) => (shouldRender ? renderInnerContent(slotProps) : null) }
      );
    };
  },
});
(SidebarContainer as any).__SemiComponentName__ = 'Sidebar.Container';

export default SidebarContainer;
