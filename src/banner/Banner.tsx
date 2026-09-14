import { defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/banner/constants';
import { cssClasses as typographyClasses } from '@douyinfe/semi-foundation/lib/es/typography/constants';
import BannerFoundation from '@douyinfe/semi-foundation/lib/es/banner/foundation';
import '@douyinfe/semi-foundation/lib/es/banner/banner.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, renderNode, hasSlotOrProp, normalizeNode } from '../_utils';
import { IconButton } from '../button';
import { IconClose, IconAlertTriangle, IconInfoCircle, IconTickCircle, IconAlertCircle } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;
const types = strings.TYPE;

export type BannerType = (typeof types)[number];

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const bannerProps = {
  fullMode: { type: Boolean, default: true },
  type: { type: String as PropType<BannerType>, default: 'info' },
  title: nodeProp,
  description: nodeProp,
  /** custom icon; pass `null` to hide the icon (React `icon={null}`) */
  icon: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  /** custom close icon; pass `null` to remove the close button (React `closeIcon={null}`) */
  closeIcon: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  bordered: { type: Boolean, default: false },
};

const Banner = defineComponent({
  name: 'Banner',
  inheritAttrs: false,
  props: bannerProps,
  emits: ['close'],
  setup(props, { slots, attrs, emit }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, { visible: true });

    const adapter = {
      ...baseAdapter,
      setVisible: () => {
        state.visible = false;
      },
      notifyClose: (e: MouseEvent) => {
        emit('close', e);
      },
    };
    const foundation = new (BannerFoundation as any)(adapter);
    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    const remove = (e?: MouseEvent) => {
      e && e.stopPropagation();
      foundation.removeBanner(e);
    };

    const renderCloser = () => {
      const passedCloseIcon = 'closeIcon' in propsView;
      if (passedCloseIcon && props.closeIcon === null && !slots.closeIcon) {
        return null;
      }
      const custom = slots.closeIcon ? slots.closeIcon() : normalizeNode(props.closeIcon);
      const icon = custom || h(IconClose, { 'x-semi-prop': 'closeIcon', 'aria-hidden': true });
      return h(IconButton, {
        class: `${prefixCls}-close`,
        onClick: remove,
        icon: () => icon,
        theme: 'borderless',
        size: 'small',
        type: 'tertiary',
        ariaLabel: 'Close',
      });
    };

    const renderIcon = () => {
      const { type } = props;
      const iconMap: Record<string, any> = {
        warning: h(IconAlertTriangle, { size: 'large', 'aria-label': 'warning' }),
        success: h(IconTickCircle, { size: 'large', 'aria-label': 'success' }),
        info: h(IconInfoCircle, { size: 'large', 'aria-label': 'info' }),
        danger: h(IconAlertCircle, { size: 'large', 'aria-label': 'danger' }),
      };
      let iconType = iconMap[type];
      const iconCls = cls({ [`${prefixCls}-icon`]: true });
      if (slots.icon) {
        iconType = slots.icon();
      } else if ('icon' in propsView) {
        iconType = normalizeNode(props.icon);
      }
      if (iconType && !(Array.isArray(iconType) && iconType.length === 0)) {
        return h('div', { class: iconCls, 'x-semi-prop': 'icon' }, iconType);
      }
      return null;
    };

    return () => {
      const { type, bordered, fullMode } = props;
      const { visible } = state;
      const { class: className, style, ...rest } = attrs as any;
      const wrapper = cls(prefixCls, className, {
        [`${prefixCls}-${type}`]: type,
        [`${prefixCls}-full`]: fullMode,
        [`${prefixCls}-in-container`]: !fullMode,
        [`${prefixCls}-bordered`]: !fullMode && bordered,
      });
      if (!visible) return null;
      const hasTitle = hasSlotOrProp(slots, 'title', props.title);
      const hasDescription = hasSlotOrProp(slots, 'description', props.description);
      const children = slots.default?.();
      // Typography is not ported yet: render plain elements carrying the Typography classes
      // (<Typography.Title heading={5} component="div"> / <Typography.Paragraph component="div">)
      const title = hasTitle
        ? h(
            'div',
            {
              class: cls(typographyClasses.PREFIX, `${prefixCls}-title`, `${typographyClasses.PREFIX}-primary`, `${typographyClasses.PREFIX}-normal`, `${typographyClasses.PREFIX}-h5`),
              'x-semi-prop': 'title',
            },
            renderNode(slots, 'title', props.title) as any
          )
        : null;
      const description = hasDescription
        ? h(
            'div',
            {
              class: cls(typographyClasses.PREFIX, `${prefixCls}-description`, `${typographyClasses.PREFIX}-primary`, `${typographyClasses.PREFIX}-normal`, `${typographyClasses.PREFIX}-paragraph`),
              'x-semi-prop': 'description',
            },
            renderNode(slots, 'description', props.description) as any
          )
        : null;
      return h('div', { class: wrapper, style, role: 'alert', ...getDataAttr(rest) }, [
        h('div', { class: `${prefixCls}-content-wrapper` }, [
          h('div', { class: `${prefixCls}-content` }, [renderIcon(), h('div', { class: `${prefixCls}-content-body` }, [title, description])]),
          renderCloser(),
        ]),
        children && children.length ? h('div', { class: `${prefixCls}-extra`, 'x-semi-prop': 'children' }, children) : null,
      ]);
    };
  },
});
(Banner as any).elementType = 'Banner';

export default Banner;
