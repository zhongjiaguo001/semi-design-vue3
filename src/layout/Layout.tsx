import { defineComponent, h, reactive } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/layout/constants';
import '@douyinfe/semi-foundation/lib/es/layout/layout.css';
import { flattenChildren, getVNodeElementType } from '../_utils';
import { provideLayoutContext } from './context';
import Sider, { siderProps } from './Sider';

type BasicType = 'header' | 'footer' | 'content' | 'layout';

const htmlTag: Record<string, string> = {
  Header: 'header',
  Footer: 'footer',
  Content: 'main',
  Layout: 'section',
};

export const basicProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  role: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
};

/**
 * Basic (the React `Basic` class + `generator`): renders `<tagName class="semi-layout-<type>">`
 */
function generator(type: 'Header' | 'Footer' | 'Content') {
  const tagName = htmlTag[type];
  const typeName = type.toLowerCase() as BasicType;
  const Comp = defineComponent({
    name: type,
    inheritAttrs: false,
    props: basicProps,
    setup(props, { slots, attrs }) {
      return () => {
        const { class: className, 'aria-label': ariaLabelAttr, role, ...others } = attrs as any;
        const classString = cls(className, `${props.prefixCls}-${typeName}`);
        return h(
          tagName,
          { ...others, role: props.role ?? role, 'aria-label': props.ariaLabel ?? ariaLabelAttr, class: classString },
          slots.default?.()
        );
      };
    },
  });
  (Comp as any).elementType = `Layout.${type}`;
  return Comp;
}

export const Header = generator('Header');
export const Footer = generator('Footer');
export const Content = generator('Content');

export const layoutProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  hasSider: { type: Boolean, default: undefined },
  tagName: { type: String as PropType<string>, default: 'section' },
};

const Layout = defineComponent({
  name: 'Layout',
  inheritAttrs: false,
  props: layoutProps,
  setup(props, { slots, attrs }) {
    const state = reactive({ siders: [] as string[] });
    const siderHook = {
      addSider: (id: string) => {
        state.siders = [...state.siders, id];
      },
      removeSider: (id: string) => {
        state.siders = state.siders.filter((curr) => curr !== id);
      },
    };
    provideLayoutContext({ siderHook });

    return () => {
      const { prefixCls, hasSider, tagName } = props;
      const { class: className, ...others } = attrs as any;
      const children = flattenChildren(slots.default?.());
      const classString = cls(className, prefixCls, {
        [`${prefixCls}-has-sider`]:
          (typeof hasSider === 'boolean' && hasSider) ||
          state.siders.length > 0 ||
          children.some((child) => getVNodeElementType(child) === 'Layout.Sider'),
      });
      return h(tagName, { ...others, class: classString }, children);
    };
  },
});
(Layout as any).elementType = 'Layout';
(Layout as any).Header = Header;
(Layout as any).Footer = Footer;
(Layout as any).Content = Content;
(Layout as any).Sider = Sider;

export { Sider, siderProps };
export default Layout as typeof Layout & {
  Header: typeof Header;
  Footer: typeof Footer;
  Content: typeof Content;
  Sider: typeof Sider;
};
