import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import _isString from 'lodash/isString';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/card/constants';
import '@douyinfe/semi-foundation/lib/es/card/card.css';
import Meta from './Meta';
import Skeleton, { SkeletonTitle, SkeletonParagraph } from '../skeleton';
import Space from '../space';
import { Title as TypographyTitle } from '../typography/Typography';
import { renderNode, hasSlotOrProp, normalizeNode, flattenChildren } from '../_utils';

const prefixcls = cssClasses.PREFIX;

export type Shadows = (typeof strings.SHADOWS)[number];

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const cardProps = {
  /** Operation group at the bottom of the card content area (also `actions` slot) */
  actions: { type: Array as PropType<any[]>, default: undefined },
  bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  bordered: { type: Boolean, default: true },
  cover: nodeProp,
  footer: nodeProp,
  footerLine: { type: Boolean, default: false },
  footerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  header: nodeProp,
  headerExtraContent: nodeProp,
  headerLine: { type: Boolean, default: true },
  headerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  loading: { type: Boolean, default: false },
  shadows: { type: String as PropType<Shadows>, default: undefined },
  title: nodeProp,
  ariaLabel: { type: String, default: undefined },
};

const Card = defineComponent({
  name: 'Card',
  inheritAttrs: false,
  props: cardProps,
  setup(props, { slots, attrs }) {
    const renderHeader = () => {
      const { headerLine, headerStyle } = props;
      const hasHeader = hasSlotOrProp(slots, 'header', props.header);
      const hasExtra = hasSlotOrProp(slots, 'headerExtraContent', props.headerExtraContent);
      const hasTitle = hasSlotOrProp(slots, 'title', props.title);
      const headerCls = cls(`${prefixcls}-header`, { [`${prefixcls}-header-bordered`]: Boolean(headerLine) });
      const headerWrapperCls = cls(`${prefixcls}-header-wrapper`);
      const titleCls = cls(`${prefixcls}-header-wrapper-title`, { [`${prefixcls}-header-wrapper-spacing`]: hasExtra });
      if (hasHeader || hasExtra || hasTitle) {
        let headerContent: any;
        if (hasHeader) {
          // Priority of header over title and headerExtraContent
          headerContent = renderNode(slots, 'header', props.header);
        } else {
          const title = renderNode(slots, 'title', props.title);
          // <Typography.Title heading={6} ellipsis={{ rows: 1, showTooltip: true }} x-semi-prop="title">
          const titleNode = _isString(title)
            ? h(TypographyTitle, { heading: 6, ellipsis: { showTooltip: true, rows: 1 }, 'x-semi-prop': 'title' }, { default: () => title })
            : title;
          headerContent = h('div', { class: headerWrapperCls }, [
            hasExtra ? h('div', { class: `${prefixcls}-header-wrapper-extra`, 'x-semi-prop': 'headerExtraContent' }, renderNode(slots, 'headerExtraContent', props.headerExtraContent) as any) : null,
            hasTitle ? h('div', { class: titleCls }, titleNode as any) : null,
          ]);
        }
        return h('div', { style: headerStyle, class: headerCls }, headerContent);
      }
      return null;
    };

    const renderCover = () => {
      if (!hasSlotOrProp(slots, 'cover', props.cover)) return null;
      return h('div', { class: `${prefixcls}-cover`, 'x-semi-prop': 'cover' }, renderNode(slots, 'cover', props.cover) as any);
    };

    const renderBody = () => {
      const { bodyStyle, loading } = props;
      const bodyCls = cls(`${prefixcls}-body`);
      const actionsCls = cls(`${prefixcls}-body-actions`);
      const actionsItemCls = cls(`${prefixcls}-body-actions-item`);
      const children = slots.default ? flattenChildren(slots.default()) : [];
      let actions: any[] | undefined;
      if (slots.actions) {
        actions = flattenChildren(slots.actions());
      } else if (Array.isArray(props.actions)) {
        actions = props.actions;
      }
      const placeholder = () => h('div', [h(SkeletonTitle), h('br'), h(SkeletonParagraph, { rows: 3 })]);
      return h('div', { style: bodyStyle, class: bodyCls }, [
        children.length ? h(Skeleton, { loading, active: true }, { placeholder, default: () => children }) : null,
        Array.isArray(actions)
          ? h('div', { class: actionsCls }, [
              h(
                Space,
                { spacing: 12 },
                {
                  default: () => actions!.map((item, idx) => h('div', { key: idx, class: actionsItemCls, 'x-semi-prop': `actions.${idx}` }, normalizeNode(item) as any)),
                }
              ),
            ])
          : null,
      ]);
    };

    const renderFooter = () => {
      const { footerLine, footerStyle } = props;
      if (!hasSlotOrProp(slots, 'footer', props.footer)) return null;
      const footerCls = cls(`${prefixcls}-footer`, { [`${prefixcls}-footer-bordered`]: footerLine });
      return h('div', { style: footerStyle, class: footerCls, 'x-semi-prop': 'footer' }, renderNode(slots, 'footer', props.footer) as any);
    };

    return () => {
      const { bordered, shadows, loading, ariaLabel } = props;
      const { class: className, style, ...others } = attrs as any;
      const cardCls = cls(prefixcls, className, {
        [`${prefixcls}-bordered`]: bordered,
        [`${prefixcls}-shadows`]: shadows,
        [`${prefixcls}-shadows-${shadows}`]: shadows,
      });
      return h('div', { ...others, 'aria-label': ariaLabel ?? others['aria-label'], 'aria-busy': loading, class: cardCls, style }, [
        renderHeader(),
        renderCover(),
        renderBody(),
        renderFooter(),
      ]);
    };
  },
});
(Card as any).elementType = 'Card';
(Card as any).Meta = Meta;

export default Card as typeof Card & { Meta: typeof Meta };
