import { defineComponent, h, reactive, watch, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import _isEqual from 'lodash/isEqual';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/collapse/constants';
import CollapseFoundation from '@douyinfe/semi-foundation/lib/es/collapse/foundation';
import '@douyinfe/semi-foundation/lib/es/collapse/collapse.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr } from '../_utils';
import CollapsePanel, { collapsePanelProps } from './CollapsePanel';
import { provideCollapseContext } from './context';
import type { CollapseContextValue } from './context';

export type CollapseActiveKey = string | string[];
export type ExpandIconPosition = 'left' | 'right';

export const collapseProps = {
  activeKey: { type: [String, Array] as PropType<CollapseActiveKey>, default: undefined },
  modelValue: { type: [String, Array] as PropType<CollapseActiveKey>, default: undefined },
  defaultActiveKey: { type: [String, Array] as PropType<CollapseActiveKey>, default: '' },
  accordion: { type: Boolean, default: false },
  clickHeaderToExpand: { type: Boolean, default: true },
  expandIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  collapseIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  keepDOM: { type: Boolean, default: undefined },
  motion: { type: Boolean, default: undefined },
  expandIconPosition: { type: String as PropType<ExpandIconPosition>, default: 'right' },
  lazyRender: { type: Boolean, default: false },
};

const Collapse = defineComponent({
  name: 'Collapse',
  inheritAttrs: false,
  props: collapseProps,
  emits: ['change', 'update:activeKey', 'update:modelValue'],
  setup(props, { slots, attrs, emit }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, { activeSet: new Set<string>() }, { modelProp: 'activeKey' });

    const adapter = {
      ...baseAdapter,
      handleChange: (activeKey: CollapseActiveKey, e: MouseEvent) => {
        emit('change', activeKey, e);
        emit('update:activeKey', activeKey);
        emit('update:modelValue', activeKey);
      },
      addActiveKey: (activeSet: Set<string>) => {
        state.activeSet = activeSet;
      },
    };
    const foundation = new (CollapseFoundation as any)(adapter);
    const initKeys = foundation.initActiveKey();
    state.activeSet = new Set(initKeys);

    // getDerivedStateFromProps
    watch(
      () => (propsView as any).activeKey,
      (activeKey) => {
        if (activeKey) {
          const keys = Array.isArray(activeKey) ? activeKey : [activeKey];
          const newSet = new Set<string>(keys);
          if (!_isEqual(newSet, state.activeSet)) {
            state.activeSet = newSet;
          }
        }
      },
      { deep: true }
    );
    onBeforeUnmount(() => foundation.destroy());

    const onChange = (activeKey: string, e: MouseEvent) => {
      foundation.handleChange(activeKey, e);
    };

    const context = reactive({
      onClick: onChange,
    }) as CollapseContextValue;
    watch(
      () => [state.activeSet, props.expandIcon, props.collapseIcon, props.clickHeaderToExpand, props.keepDOM, props.expandIconPosition, props.motion, props.lazyRender, slots.expandIcon, slots.collapseIcon],
      () => {
        context.activeSet = state.activeSet;
        context.expandIcon = slots.expandIcon ? slots.expandIcon : props.expandIcon;
        context.collapseIcon = slots.collapseIcon ? slots.collapseIcon : props.collapseIcon;
        context.clickHeaderToExpand = props.clickHeaderToExpand;
        context.keepDOM = props.keepDOM;
        context.expandIconPosition = props.expandIconPosition;
        context.motion = props.motion;
        context.lazyRender = props.lazyRender;
      },
      { immediate: true, flush: 'sync' }
    );
    provideCollapseContext(context);

    return () => {
      const { class: className, style, ...rest } = attrs as any;
      const clsPrefix = cls(cssClasses.PREFIX, className);
      return h('div', { class: clsPrefix, style, ...getDataAttr(rest) }, slots.default?.());
    };
  },
});
(Collapse as any).elementType = 'Collapse';
(Collapse as any).Panel = CollapsePanel;

export { CollapsePanel, collapsePanelProps };
export default Collapse as typeof Collapse & { Panel: typeof CollapsePanel };
