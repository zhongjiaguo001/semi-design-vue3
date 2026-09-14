import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/tabs/constants';
import CSSAnimation from '../_cssAnimation';
import { getDataAttr } from '../_utils';
import { useTabsContext } from './context';
import type { PlainTab } from './context';

export const tabPaneProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  disabled: { type: Boolean, default: false },
  itemKey: { type: String, default: undefined },
  tab: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  icon: { type: [String, Object, Function] as PropType<any>, default: undefined },
  closable: { type: Boolean, default: false },
  tabIndex: { type: Number, default: undefined },
};

const TabPane = defineComponent({
  name: 'TabPane',
  inheritAttrs: false,
  props: tabPaneProps,
  setup(props, { slots, attrs }) {
    const context = useTabsContext();
    let everActive = false;

    // get direction from current item key to activeKey
    const getDirection = (activeKey: string | undefined, itemKey: string | undefined, panes: PlainTab[] | undefined, lastActiveKey: string | null | undefined) => {
      if (itemKey !== null && activeKey !== null && Array.isArray(panes) && panes.length) {
        const activeIndex = panes.findIndex((pane) => pane.itemKey === activeKey);
        const itemIndex = panes.findIndex((pane) => pane.itemKey === itemKey);
        const lastActiveIndex = panes.findIndex((pane) => pane.itemKey === lastActiveKey);
        if (activeIndex === itemIndex) {
          return lastActiveIndex > activeIndex;
        }
        return itemIndex < activeIndex;
      }
      return false;
    };

    const shouldRender = () => {
      const { itemKey } = props;
      const { activeKey, lazyRender } = context;
      const active = activeKey === itemKey;
      everActive = everActive || active;
      return lazyRender ? everActive : true;
    };

    return () => {
      const { tabPaneMotion: motion, tabPosition, prevActiveKey } = context;
      const { className, style, itemKey, tabIndex } = props;
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const active = context.activeKey === itemKey;
      const classNames = cls(className, attrClass, {
        [cssClasses.TABS_PANE_INACTIVE]: !active,
        [cssClasses.TABS_PANE_ACTIVE]: active,
        [cssClasses.TABS_PANE]: true,
      });
      const render = shouldRender();
      const direction = getDirection(context.activeKey, itemKey, context.panes, prevActiveKey);
      let startClassName: string;
      if (tabPosition === 'top') {
        startClassName = direction ? cssClasses.TABS_PANE_ANIMATE_RIGHT_SHOW : cssClasses.TABS_PANE_ANIMATE_LEFT_SHOW;
      } else {
        startClassName = direction ? cssClasses.TABS_PANE_ANIMATE_BOTTOM_SHOW : cssClasses.TABS_PANE_ANIMATE_TOP_SHOW;
      }
      const panes = context.panes || [];
      const isActivatedBecauseOtherTabPaneRemoved = !panes.find((tabPane) => tabPane.itemKey === prevActiveKey);
      const hasMotion = Boolean(motion && active && !isActivatedBecauseOtherTabPaneRemoved && !context.forceDisableMotion);
      return h(
        'div',
        {
          role: 'tabpanel',
          id: `semiTabPanel${itemKey}`,
          'aria-labelledby': `semiTab${itemKey}`,
          class: classNames,
          style: [attrStyle, style],
          'aria-hidden': active ? 'false' : 'true',
          tabindex: tabIndex ? tabIndex : 0,
          ...getDataAttr(restAttrs),
          'x-semi-prop': 'children',
        },
        [
          h(
            CSSAnimation,
            { motion: hasMotion, animationState: active ? 'enter' : 'leave', startClassName },
            {
              default: ({ animationClassName, animationEventsNeedBind }: any) =>
                h(
                  'div',
                  { class: cls(cssClasses.TABS_PANE_MOTION_OVERLAY, animationClassName), 'x-semi-prop': 'children', ...animationEventsNeedBind },
                  render ? slots.default?.() : null
                ),
            }
          ),
        ]
      );
    };
  },
});
(TabPane as any).isTabPane = true;
(TabPane as any).elementType = 'Tabs.TabPane';

export default TabPane;
