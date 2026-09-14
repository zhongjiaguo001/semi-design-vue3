import { defineComponent, h, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, Fragment, Text } from 'vue';
import type { PropType, VNode, VNodeChild } from 'vue';
import cls from 'classnames';
import _isFunction from 'lodash/isFunction';
import _isString from 'lodash/isString';
import _isUndefined from 'lodash/isUndefined';
import _merge from 'lodash/merge';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/typography/constants';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import isEnterPress from '@douyinfe/semi-foundation/lib/es/utils/isEnterPress';
import '@douyinfe/semi-foundation/lib/es/typography/typography.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import Tooltip from '../tooltip/Tooltip';
import Popover from '../popover/Popover';
import { flattenChildren, normalizeNode, isSemiIcon, runAfterTicks, cloneVNode } from '../_utils';
import Copyable from './Copyable';
import getRenderText from './util';
import { provideTypographySize, useTypographySize } from './context';
import type { TypographySize } from './context';

const prefixCls = cssClasses.PREFIX;
const ELLIPSIS_STR = '...';

export type TypographyBaseType = (typeof strings.TYPE)[number];
export type TypographyBaseSize = (typeof strings.SIZE)[number];
export type TypographyBaseSpacing = (typeof strings.SPACING)[number];
export type TypographyBaseRule = (typeof strings.RULE)[number];
export type TypographyBaseTruncate = (typeof strings.TRUNCATE)[number];
export type TypographyWeight = (typeof strings.WEIGHT)[number] | number;
export type EllipsisPos = 'end' | 'middle';

export interface ShowTooltip {
  type?: string;
  opts?: Record<string, any>;
  renderTooltip?: (content: VNodeChild, children: VNodeChild) => VNodeChild;
}

export interface Ellipsis {
  collapseText?: string;
  collapsible?: boolean;
  expandText?: string;
  expandable?: boolean;
  pos?: EllipsisPos;
  rows?: number;
  showTooltip?: boolean | ShowTooltip;
  suffix?: string;
  onExpand?: (expanded: boolean, event: Event) => void;
}

export interface CopyableConfig {
  content?: string;
  copyTip?: any;
  successTip?: any;
  onCopy?: (e: Event, content: string, res: boolean) => void;
  duration?: number;
  icon?: any;
  render?: (copied: boolean, doCopy: (e?: any) => void, config: Record<string, any>) => VNodeChild;
}

export type LinkType = Record<string, any> | boolean;

export const baseTypographyProps = {
  // NOTE: defaults are typed as the full union: Vue's InferPropType falls back to the default's type for 'boolean | object' unions
  copyable: { type: [Boolean, Object] as PropType<boolean | CopyableConfig>, default: false as boolean | CopyableConfig },
  delete: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  ellipsis: { type: [Boolean, Object] as PropType<boolean | Ellipsis>, default: false as boolean | Ellipsis },
  icon: { type: [String, Object, Function] as PropType<any>, default: '' },
  mark: { type: Boolean, default: false },
  underline: { type: Boolean, default: false },
  strong: { type: Boolean, default: false },
  link: { type: [Boolean, Object] as PropType<LinkType>, default: false as LinkType },
  code: { type: Boolean, default: false },
  type: { type: String as PropType<TypographyBaseType>, default: 'primary' },
  size: { type: String as PropType<TypographyBaseSize>, default: 'normal' },
  spacing: { type: String as PropType<TypographyBaseSpacing>, default: 'normal' },
  component: { type: String, default: undefined },
  heading: { type: String, default: undefined },
  weight: { type: [String, Number] as PropType<TypographyWeight>, default: undefined },
};

export const baseTypographyEmits = ['expand', 'copy'];

/** text of the default slot when it is pure text (joined), otherwise undefined */
function getPureText(nodes: VNode[]): string | undefined {
  if (!nodes.length) return undefined;
  let text = '';
  for (const node of nodes) {
    if (node.type === Text && typeof node.children === 'string') {
      text += node.children;
    } else {
      return undefined;
    }
  }
  return text;
}

interface BaseState {
  editable: boolean;
  copied: boolean;
  isOverflowed: boolean;
  ellipsisContent: any;
  expanded: boolean;
  isTruncated: boolean;
}

/**
 * Port of semi-ui typography/base.js — shared implementation of Text / Title / Paragraph / Numeral.
 */
const Base = defineComponent({
  name: 'TypographyBase',
  inheritAttrs: false,
  props: baseTypographyProps,
  emits: baseTypographyEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state } = useBaseComponent<any, BaseState>(props as any, {
      editable: false,
      copied: false,
      isOverflowed: false,
      ellipsisContent: undefined,
      expanded: false,
      isTruncated: false,
    });
    const { locale } = useLocale('Typography');
    const contextSize = useTypographySize();
    const realSize = computed<TypographySize>(() => (props.size === 'inherit' ? (contextSize ? contextSize.value : 'normal') : props.size) as TypographySize);
    provideTypographySize(realSize);

    const wrapperRef = ref<HTMLElement | null>(null);
    const expandRef = ref<HTMLElement | null>(null);
    const copyRef = ref<any>(null);
    let rafId: any = null;
    let observerTakingEffect = false;
    let resizeObserver: ResizeObserver | null = null;
    let observedParent: Element | null = null;
    let lastWidth: number | null = null;
    let prevChildren: string | undefined | null = null;
    // latest children (set during render, read by the async measurement)
    let currentChildren: VNode[] = [];
    let currentText: string | undefined;

    const getEllipsisOpt = (): Ellipsis => {
      const { ellipsis } = props;
      if (!ellipsis) return {};
      const opt: Ellipsis = Object.assign(
        {
          rows: 1,
          expandable: false,
          pos: 'end',
          suffix: '',
          showTooltip: false,
          collapsible: false,
          expandText: (ellipsis as Ellipsis).expandable ? locale.value?.expand : undefined,
          collapseText: (ellipsis as Ellipsis).collapsible ? locale.value?.collapse : undefined,
        },
        typeof ellipsis === 'object' ? ellipsis : null
      );
      return opt;
    };

    // if it needs to use js overflowed:
    // 1. text is expandable 2. expandText need to be shown  3. has extra operation 4. text need to ellipse from mid
    const canUseCSSEllipsis = () => {
      const { copyable } = props;
      const { expandable, expandText, pos, suffix } = getEllipsisOpt();
      return !expandable && _isUndefined(expandText) && !copyable && pos === 'end' && !(suffix && suffix.length);
    };

    /**
     * Compare content width with container content-box width using a Range (see semi issues 1731 / 2350)
     */
    const compareSingleRow = () => {
      if (!(document && document.createRange)) return false;
      const containerNode = wrapperRef.value;
      if (!containerNode) return false;
      const range = document.createRange();
      if (typeof (range as any).getBoundingClientRect !== 'function') return false; // jsdom
      const containerRectWidth = containerNode.getBoundingClientRect().width;
      const computedStyle = window.getComputedStyle(containerNode);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
      const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
      const contentAreaWidth = Math.max(0, containerRectWidth - paddingLeft - paddingRight - borderLeft - borderRight);
      const childNodes = Array.from(containerNode.childNodes);
      const contentWidth = childNodes.reduce((acc, node) => {
        range.selectNodeContents(node);
        return acc + (range.getBoundingClientRect().width ?? 0);
      }, 0);
      range.detach();
      return contentWidth > contentAreaWidth;
    };

    /**
     * whether truncated
     *  rows <= 1: overflow content; rows > 1: overflow height
     */
    const shouldTruncated = (rows: number) => {
      if (!rows || rows < 1) return false;
      const el = wrapperRef.value;
      if (!el) return false;
      return rows <= 1 ? compareSingleRow() : el.scrollHeight > el.offsetHeight;
    };

    const getEllipsisState = async (): Promise<void> => {
      const { rows, suffix, pos, showTooltip } = getEllipsisOpt();
      const { strong } = props;
      // wait until element mounted
      if (!wrapperRef.value) {
        await onResize();
        return;
      }
      const { expanded } = state;
      if (canUseCSSEllipsis()) {
        // Proactively compute overflow when showTooltip is enabled so the Tooltip wrapper is mounted before the first hover.
        if (showTooltip) {
          const updateOverflow = shouldTruncated(rows!);
          state.isOverflowed = updateOverflow;
          state.isTruncated = false;
          await nextTick();
        }
        return;
      }
      // If children is null, css/js truncated flag isTruncate is false
      if (!currentChildren.length) {
        state.isTruncated = false;
        state.isOverflowed = false;
        await nextTick();
        return;
      }
      // Currently only text truncation is supported
      warning(currentText === undefined, '[Semi Typography] Only children with pure text could be used with ellipsis at this moment.');
      if (!rows || rows < 0 || expanded) {
        return;
      }
      const extraNode = {
        expand: expandRef.value,
        copy: copyRef.value ? (copyRef.value.getElement ? copyRef.value.getElement() : copyRef.value.$el) : null,
      };
      const realChildren = currentText !== undefined ? currentText : currentChildren.map((n) => (typeof n.children === 'string' ? n.children : '')).join('');
      const content = getRenderText(wrapperRef.value, rows, realChildren, extraNode, ELLIPSIS_STR, suffix, pos, strong);
      state.isOverflowed = false;
      state.ellipsisContent = content;
      state.isTruncated = realChildren !== content;
      await nextTick();
    };

    const onResize = (): Promise<void> => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      return new Promise((resolve) => {
        rafId = window.requestAnimationFrame(async () => {
          await getEllipsisState();
          resolve();
        });
      });
    };

    const onHover = () => {
      if (canUseCSSEllipsis()) {
        const { rows } = getEllipsisOpt();
        const updateOverflow = shouldTruncated(rows!);
        // isOverflowed needs to be updated to show tooltip when using css ellipsis
        state.isOverflowed = updateOverflow;
        state.isTruncated = false;
      }
    };

    /** Triggered when the fold button is clicked to save the latest expanded state */
    const toggleOverflow = (e: Event) => {
      const { onExpand, expandable, collapsible } = getEllipsisOpt();
      const { expanded } = state;
      onExpand && onExpand(!expanded, e);
      emit('expand', !expanded, e);
      if ((expandable && !expanded) || (collapsible && expanded)) {
        state.expanded = !expanded;
      }
    };

    const showTooltip = (): false | (ShowTooltip & { type: string }) => {
      const { isOverflowed, isTruncated, expanded } = state;
      const { showTooltip: st, expandable, expandText } = getEllipsisOpt();
      const useCSS = canUseCSSEllipsis();
      // If css truncated, use isOverflowed to judge. If js truncated, use isTruncated to judge.
      const overflowed = !expanded && (useCSS ? isOverflowed : isTruncated);
      const noExpandText = !expandable && _isUndefined(expandText);
      const show = noExpandText && overflowed && st;
      if (!show) return false;
      const defaultOpts = { type: 'tooltip' };
      if (typeof st === 'object') {
        if (st.type && st.type.toLowerCase() === 'popover') {
          return _merge(
            { opts: { showArrow: true } },
            st,
            {
              opts: {
                className: cls({
                  [`${prefixCls}-ellipsis-popover`]: true,
                  [st.opts?.className]: Boolean(st.opts?.className),
                }),
              },
            }
          ) as any;
        }
        return Object.assign({}, defaultOpts, st) as any;
      }
      return defaultOpts as any;
    };

    // ---- lifecycle: measurement + ResizeObserver (observeParent, width) ----
    const disconnectObserver = () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      observedParent = null;
    };
    const connectObserver = () => {
      disconnectObserver();
      const el = wrapperRef.value;
      const parent = el && el.parentElement;
      if (!parent || typeof ResizeObserver === 'undefined') return;
      resizeObserver = new ResizeObserver((entries) => {
        if (!observerTakingEffect) return;
        const entry = entries && entries[0];
        const width = entry && entry.contentRect ? entry.contentRect.width : null;
        if (width !== null && width === lastWidth) return;
        lastWidth = width;
        onResize();
      });
      observedParent = parent;
      resizeObserver.observe(parent);
    };
    onMounted(() => {
      if (props.ellipsis) {
        connectObserver();
        // runAfterTicks: make sure the observer starts on the next tick
        onResize().then(() => runAfterTicks(() => (observerTakingEffect = true), 1));
      }
    });
    watch(
      () => Boolean(props.ellipsis),
      (has) => {
        if (has) {
          nextTick(() => {
            connectObserver();
            onResize().then(() => runAfterTicks(() => (observerTakingEffect = true), 1));
          });
        } else {
          disconnectObserver();
        }
      }
    );
    onBeforeUnmount(() => {
      if (rafId) window.cancelAnimationFrame(rafId);
      disconnectObserver();
    });

    // ---- render helpers ----
    const renderExpandable = () => {
      const { expanded, isTruncated } = state;
      if (!isTruncated) return null;
      const { expandText, expandable, collapseText, collapsible } = getEllipsisOpt();
      const noExpandText = !expandable && _isUndefined(expandText);
      const noCollapseText = !collapsible && _isUndefined(collapseText);
      let text: string | undefined;
      if (!expanded && !noExpandText) {
        text = expandText;
      } else if (expanded && !noCollapseText) {
        text = collapseText;
      }
      if (!noExpandText || !noCollapseText) {
        // TODO(semi): replace `a` tag with `span` in next major version
        return h(
          'a',
          {
            role: 'button',
            tabindex: 0,
            class: `${prefixCls}-ellipsis-expand`,
            key: 'expand',
            ref: expandRef,
            'aria-label': text,
            onClick: toggleOverflow,
            onKeypress: (e: KeyboardEvent) => isEnterPress(e) && toggleOverflow(e),
          },
          text
        );
      }
      return null;
    };

    const renderCopy = () => {
      const { copyable } = props;
      if (!copyable) return null;
      const config = typeof copyable === 'object' ? copyable : ({} as CopyableConfig);
      // If configured in copyable.content, the copied content will be that content
      const willCopyContent: any = config.content ?? (currentText !== undefined ? currentText : currentChildren);
      let copyContent = '';
      let hasObject = false;
      if (Array.isArray(willCopyContent)) {
        willCopyContent.forEach((value: any) => {
          if (typeof value === 'object') {
            if (value && value.type === Text && typeof value.children === 'string') {
              copyContent += value.children;
              return;
            }
            hasObject = true;
          }
          copyContent += String(value);
        });
      } else if (typeof willCopyContent !== 'object') {
        copyContent = String(willCopyContent);
      } else {
        hasObject = true;
        copyContent = String(willCopyContent);
      }
      warning(hasObject, 'Content to be copied in Typography is a object, it will case a [object Object] mistake when copy to clipboard.');
      const { onCopy, content: _content, ...restConfig } = config;
      return h(Copyable, {
        content: copyContent,
        duration: 3,
        ...restConfig,
        ref: copyRef,
        onCopy: (e: Event, content: string, res: boolean) => {
          onCopy && onCopy(e, content, res);
          emit('copy', e, content, res);
        },
      } as any);
    };

    const renderIcon = () => {
      const iconNode = slots.icon ? flattenChildren(slots.icon())[0] : normalizeNode(props.icon);
      if (!iconNode) return null;
      const iconSize = realSize.value === 'small' ? 'small' : 'default';
      return h('span', { class: `${prefixCls}-icon`, 'x-semi-prop': 'icon' }, [isSemiIcon(iconNode) ? cloneVNode(iconNode as VNode, { size: iconSize }) : iconNode]);
    };

    const getEllipsisStyle = () => {
      const { ellipsis, component } = props;
      if (!ellipsis) return { ellipsisCls: '', ellipsisStyle: {} as Record<string, any> };
      const { rows } = getEllipsisOpt();
      const { expanded } = state;
      const useCSS = !expanded && canUseCSSEllipsis();
      const ellipsisCls = cls({
        [`${prefixCls}-ellipsis`]: true,
        [`${prefixCls}-ellipsis-single-line`]: rows === 1,
        [`${prefixCls}-ellipsis-multiple-line`]: rows! > 1,
        // component === 'span', Text component, should be externally displayed inline
        [`${prefixCls}-ellipsis-multiple-line-text`]: rows! > 1 && component === 'span',
        [`${prefixCls}-ellipsis-overflow-ellipsis`]: rows === 1 && useCSS,
        [`${prefixCls}-ellipsis-overflow-ellipsis-text`]: rows === 1 && useCSS && component === 'span',
      });
      const ellipsisStyle = useCSS && rows! > 1 ? { WebkitLineClamp: rows, '-webkit-line-clamp': rows } : {};
      return { ellipsisCls, ellipsisStyle };
    };

    const renderEllipsisText = (opt: Ellipsis, children: VNode[]) => {
      const { suffix } = opt;
      const { isTruncated, expanded, ellipsisContent } = state;
      if (expanded || !isTruncated) {
        return h('span', { onMouseenter: onHover }, [...children, suffix && suffix.length ? suffix : null]);
      }
      // non-string children are never truncated by JS: fall back to the live children
      const content = typeof ellipsisContent === 'string' ? ellipsisContent : children;
      return h('span', { onMouseenter: onHover }, [content, suffix]);
    };

    const wrapperDecorations = (content: VNodeChild) => {
      const { mark, code, underline, strong, link, disabled } = props;
      let wrapped: VNodeChild = content;
      const wrap = (isNeeded: any, tag: string) => {
        if (!isNeeded) return;
        let wrapProps: Record<string, any> = {};
        if (typeof isNeeded === 'object') wrapProps = { ...isNeeded };
        wrapped = h(tag, wrapProps, [wrapped]);
      };
      wrap(mark, 'mark');
      wrap(code, 'code');
      wrap(underline && !link, 'u');
      wrap(strong, 'strong');
      wrap(props.delete, 'del');
      wrap(link, disabled ? 'span' : 'a');
      return wrapped;
    };

    const renderContent = (children: VNode[]) => {
      const { component, type, spacing, disabled, ellipsis, link, heading, weight } = props;
      const iconNode = renderIcon();
      const ellipsisOpt = getEllipsisOpt();
      const { ellipsisCls, ellipsisStyle } = getEllipsisStyle();
      let textNode: VNodeChild = ellipsis ? renderEllipsisText(ellipsisOpt, children) : children;
      const linkCls = cls({
        [`${prefixCls}-link-text`]: link,
        [`${prefixCls}-link-underline`]: props.underline && link,
      });
      textNode = wrapperDecorations(h(Fragment, [iconNode, link ? h('span', { class: linkCls }, [textNode]) : textNode]));
      const hTagReg = /^h[1-6]$/;
      const isHeader = _isString(heading) && hTagReg.test(heading);
      const { class: className, style, ...rest } = attrs as any;
      const wrapperCls = cls(prefixCls, className, ellipsisCls, {
        [`${prefixCls}-${type}`]: type && !link,
        [`${prefixCls}-${realSize.value}`]: realSize.value,
        [`${prefixCls}-link`]: link,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-${spacing}`]: spacing,
        [`${prefixCls}-${heading}`]: isHeader,
        [`${prefixCls}-${heading}-weight-${weight}`]: isHeader && weight && isNaN(Number(weight)),
      });
      const textStyle = { ...(isNaN(Number(weight)) || weight === undefined || (weight as any) === '' ? {} : { fontWeight: weight }) };
      const tag = component || 'article';
      return h(
        tag,
        { ...rest, class: wrapperCls, style: [textStyle, ellipsisStyle, style], ref: wrapperRef },
        [textNode, renderExpandable(), renderCopy()]
      );
    };

    const renderTipWrapper = (children: VNode[]) => {
      const st = showTooltip();
      const content = renderContent(children);
      if (st) {
        const { type, opts, renderTooltip } = st;
        const tipContent = () => (currentText !== undefined ? currentText : children.map((c) => cloneVNode(c)));
        if (_isFunction(renderTooltip)) {
          return renderTooltip(tipContent(), content);
        } else if (type.toLowerCase() === 'popover') {
          return h(Popover, { content: tipContent, position: 'top', ...(opts || {}) }, { default: () => content });
        }
        return h(Tooltip, { content: tipContent, position: 'top', ...(opts || {}) }, { default: () => content });
      }
      return content;
    };

    expose({
      getElement: () => wrapperRef.value,
      wrapperRef,
      toggleOverflow,
      getEllipsisState,
    });

    return () => {
      const children = flattenChildren(slots.default?.());
      const text = getPureText(children);
      currentChildren = children;
      currentText = text;
      // getDerivedStateFromProps: reset ellipsis state if children update
      const childrenKey = text !== undefined ? text : children.length ? children : undefined;
      if (prevChildren !== null && props.ellipsis && (childrenKey as any) !== prevChildren) {
        state.isOverflowed = false;
        state.ellipsisContent = text;
        state.expanded = false;
        state.isTruncated = true;
        // Render was based on outdated refs and needs to be rerun
        onResize();
      }
      if (prevChildren === null && state.ellipsisContent === undefined) {
        state.ellipsisContent = text;
      }
      prevChildren = childrenKey as any;
      return renderTipWrapper(children);
    };
  },
});

export default Base;
