import { defineComponent, Teleport, onBeforeUnmount, ref, watch, h, computed } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import { BASE_CLASS_PREFIX } from '@douyinfe/semi-foundation/lib/es/base/constants';
import { useConfigContext } from '../configProvider/context';
import '@douyinfe/semi-foundation/lib/es/_portal/portal.css';

const defaultGetContainer = () => document.body;

/**
 * Vue Portal: appends an element into `getPopupContainer()` and teleports children into it.
 * Theme classes from ConfigProvider are copied onto the portal element so popups are themed too.
 */
export default defineComponent({
  name: 'Portal',
  props: {
    prefixCls: { type: String, default: `${BASE_CLASS_PREFIX}-portal` },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  },
  setup(props, { slots, expose }) {
    const context = useConfigContext();
    const el = ref<HTMLElement | null>(null);
    let container: HTMLElement | null = null;

    const className = computed(() =>
      classnames(props.prefixCls, props.className, context.themeClassName, {
        [`${props.prefixCls}-rtl`]: context.direction === 'rtl',
        [`${BASE_CLASS_PREFIX}-always-dark`]: context.themeDark,
      })
    );

    const applyStyle = () => {
      if (!el.value) return;
      const style = props.style || {};
      for (const key of Object.keys(style)) {
        (el.value.style as any)[key] = (style as any)[key];
      }
    };

    const initContainer = () => {
      if (typeof document === 'undefined') return;
      try {
        if (!el.value) {
          el.value = document.createElement('div');
        }
        const getContainer = props.getPopupContainer || context.getPopupContainer || defaultGetContainer;
        const portalContainer = getContainer() || document.body;
        if (!container || !Array.from(container.childNodes).includes(el.value)) {
          portalContainer.appendChild(el.value);
          container = portalContainer;
        }
        applyStyle();
        el.value.className = className.value;
      } catch (e) {
        /* ignore, container may not be ready yet */
      }
    };

    initContainer();
    watch(className, (cls) => {
      if (el.value) el.value.className = cls;
    });
    watch(() => props.style, applyStyle, { deep: true });
    watch(
      () => props.getPopupContainer,
      () => {
        if (el.value && container && el.value.parentNode === container) {
          container.removeChild(el.value);
        }
        container = null;
        initContainer();
      }
    );

    onBeforeUnmount(() => {
      if (el.value && container && el.value.parentNode === container) {
        container.removeChild(el.value);
      }
      container = null;
    });

    expose({ getElement: () => el.value });

    return () => {
      if (!el.value) return null;
      return h(Teleport, { to: el.value }, slots.default?.());
    };
  },
});
