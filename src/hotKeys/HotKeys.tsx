import { defineComponent, h, onMounted, onBeforeUnmount, watch } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import classNames from 'classnames';
import HotKeysFoundation from '@douyinfe/semi-foundation/lib/es/hotKeys/foundation';
import { cssClasses, Keys } from '@douyinfe/semi-foundation/lib/es/hotKeys/constants';
import '@douyinfe/semi-foundation/lib/es/hotKeys/hotKeys.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export const hotKeysProps = {
  preventDefault: { type: Boolean, default: false },
  hotKeys: { type: Array as PropType<string[]>, default: () => null as any },
  content: { type: Array as PropType<string[]>, default: () => null as any },
  mergeMetaCtrl: { type: Boolean, default: false },
  render: { type: [Function, Object, String] as PropType<any>, default: undefined },
  getListenerTarget: { type: Function as PropType<() => HTMLElement>, default: () => document.body },
  className: { type: String, default: '' },
  style: { type: Object as PropType<CSSProperties>, default: null as any },
};

export const hotKeysEmits = ['hotKey', 'click'];

const HotKeys = defineComponent({
  name: 'HotKeys',
  inheritAttrs: false,
  props: hotKeysProps,
  emits: hotKeysEmits,
  setup(props, { slots, attrs, emit }) {
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    let registeredTarget: HTMLElement | null = null;
    const onKeyDown = (event: KeyboardEvent) => {
      const keys = props.hotKeys;
      if (!keys || !keys.length) return;
      foundation.handleKeyDown(event);
    };
    const resolveTarget = () => {
      const getter = props.getListenerTarget;
      if (typeof getter === 'function') {
        try {
          return getter() || document.body;
        } catch {
          return document.body;
        }
      }
      return document.body;
    };
    const adapter = {
      ...baseAdapter,
      notifyHotKey: (e: KeyboardEvent) => emit('hotKey', e),
      registerEvent: () => {
        adapter.unregisterEvent();
        const target = resolveTarget();
        registeredTarget = target;
        target.addEventListener('keydown', onKeyDown);
      },
      unregisterEvent: () => {
        if (!registeredTarget) return;
        registeredTarget.removeEventListener('keydown', onKeyDown);
        registeredTarget = null;
      },
    };
    const foundation = new (HotKeysFoundation as any)(adapter);
    onMounted(() => {
      // React crashes on its own default `hotKeys: null` (isValidHotKeys does null.forEach);
      // skip both validation and listener registration when no keys are given so a
      // keydown cannot hit `keysPressed.every` on undefined after unmount/leak.
      if (props.hotKeys && props.hotKeys.length) {
        try {
          foundation.init();
        } catch (err) {
          adapter.unregisterEvent();
          throw err;
        }
      }
    });
    // React never re-registers (componentDidUpdate is empty); in Vue the listener target / keys are
    // reactive, so re-init when hotKeys or getListenerTarget change after mount (e.g. a ref resolving).
    watch(
      () => [props.hotKeys, props.getListenerTarget] as const,
      () => {
        adapter.unregisterEvent();
        if (props.hotKeys && props.hotKeys.length) {
          foundation.init();
        }
      }
    );
    onBeforeUnmount(() => {
      adapter.unregisterEvent();
      try {
        foundation.destroy();
      } catch {
        /* destroy may call unregister again */
      }
    });

    return () => {
      const { hotKeys, content, getListenerTarget: _g, className, style, render } = props;
      const { class: attrClass, style: attrStyle, onClick: attrClick, ...rest } = attrs as any;
      const onClick = (e: MouseEvent) => {
        emit('click', e);
      };
      const { hotKeys: _hk, content: _c, getListenerTarget: _gt, className: _cn, style: _st, render: _r, preventDefault: _p, mergeMetaCtrl: _m, ...dataRest } = props as any;
      const dataAttr = { ...getDataAttr(dataRest), ...getDataAttr(rest) };
      if (typeof render !== 'undefined') {
        if (render === null || (typeof render === 'function' && render() === null)) {
          return null;
        }
        const renderResult = typeof render === 'function' ? render() : render;
        return h('div', { onClick, class: classNames(prefixCls, className, attrClass), style: [style, attrStyle], ...dataAttr }, [slots.render ? slots.render() : normalizeNode(renderResult)]);
      }
      const renderContent: string[] = content !== null && content !== undefined ? content : hotKeys;
      return h(
        'div',
        { onClick, class: classNames(prefixCls, className, attrClass), style: [style, attrStyle], ...dataAttr },
        (renderContent || []).map((key, index) =>
          index === 0
            ? h('span', { key: index }, [h('span', { class: `${prefixCls}-content` }, key)])
            : h('span', { key: index }, [h('span', { class: `${prefixCls}-split` }, '+'), h('span', { class: `${prefixCls}-content` }, key)])
        )
      );
    };
  },
});
(HotKeys as any).Keys = Keys;
(HotKeys as any).elementType = 'HotKeys';

export default HotKeys;
