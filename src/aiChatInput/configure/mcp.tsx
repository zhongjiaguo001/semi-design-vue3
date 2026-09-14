import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import { useLocale } from '../../locale';
import Button from '../../button/Button';
import Dropdown from '../../dropdown/Dropdown';
import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownItem from '../../dropdown/DropdownItem';

const prefixCls = cssClasses.PREFIX;

export const ConfigureMcp = defineComponent({
  name: 'AIChatInputConfigureMcp',
  inheritAttrs: false,
  props: {
    options: { type: Array as PropType<Array<{ value: string; label: string; icon?: any }>>, default: () => [] },
    num: { type: Number, default: 0 },
    showConfigure: { type: Boolean, default: true },
    onConfigureButtonClick: { type: Function as PropType<() => void>, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const { locale } = useLocale('AIChatInput');
    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const loc = locale.value || {};
      const count = props.options?.length ?? props.num;
      const title = String(loc.selected || '').replace('${count}', String(count));
      return h(
        Dropdown,
        {
          style: props.style || attrStyle,
          className: cls(props.className, attrClass, `${prefixCls}-footer-configure-mcp`),
          ...rest,
        },
        {
          default: () =>
            h(
              Button,
              {
                theme: 'outline',
                type: 'tertiary',
                class: `${prefixCls}-footer-configure-mcp-trigger`,
                onClick: (e: MouseEvent) => e.stopPropagation(),
              },
              () => `MCP · ${count}`
            ),
          render: () =>
            h('div', null, [
              h('div', { class: `${prefixCls}-footer-configure-mcp-header` }, [
                h('span', { class: `${prefixCls}-footer-configure-mcp-header-title` }, title),
                props.showConfigure
                  ? h(
                      Button,
                      {
                        theme: 'outline',
                        class: `${prefixCls}-footer-configure-mcp-header-config`,
                        onClick: () => props.onConfigureButtonClick?.(),
                      },
                      () => loc.configure
                    )
                  : null,
              ]),
              slots.default
                ? slots.default()
                : h(DropdownMenu, null, () =>
                    (props.options || []).map((item) =>
                      h(DropdownItem, { key: item.value, icon: item.icon }, () => item.label)
                    )
                  ),
            ]),
        }
      );
    };
  },
});

export default ConfigureMcp;
