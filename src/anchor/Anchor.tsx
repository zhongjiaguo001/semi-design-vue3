import { defineComponent, h, ref, reactive, watch, onMounted, onBeforeUnmount, provide, inject, computed, toRaw } from 'vue';
import type { PropType, CSSProperties, InjectionKey } from 'vue';
import cls from 'classnames';
import _throttle from 'lodash/throttle';
import _debounce from 'lodash/debounce';
import _isObject from 'lodash/isObject';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/anchor/constants';
import AnchorFoundation from '@douyinfe/semi-foundation/lib/es/anchor/foundation';
import LinkFoundation from '@douyinfe/semi-foundation/lib/es/anchor/linkFoundation';
import getUuid from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/anchor/anchor.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { getDataAttr, normalizeNode, renderSlotOrProp, toPx, flattenChildren, isVNode, getVNodeElementType } from '../_utils';
import { Text as TypographyText } from '../typography/Typography';
import { provideAnchorContext, useAnchorContext } from './context';
import type { AnchorContextValue } from './context';

const prefixCls = cssClasses.PREFIX;

export type AnchorSize = (typeof strings.SIZE)[number];
export type AnchorRailTheme = (typeof strings.SLIDE_COLOR)[number];
export type AnchorPosition = (typeof strings.POSITION_SET)[number];

/** nesting level of links (React passes `level` via cloneElement) + ancestor hrefs (used to build childMap) */
const LinkLevelKey: InjectionKey<{ level: number; parents: string[] }> = Symbol('SemiAnchorLinkLevel');

export const anchorLinkProps = {
  href: { type: String, default: '#' },
  title: { type: [String, Number, Object, Function, Array] as PropType<any>, default: '' },
  disabled: { type: Boolean, default: false },
  level: { type: Number, default: undefined },
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
};

export const Link = defineComponent({
  name: 'AnchorLink',
  inheritAttrs: false,
  props: anchorLinkProps,
  setup(props, { slots, attrs }) {
    const context = useAnchorContext();
    const configContext = useConfigContext();
    const parentInfo = inject(LinkLevelKey, { level: 0, parents: [] as string[] });
    const level = computed(() => props.level ?? parentInfo.level + 1);
    const direction = computed(() => props.direction ?? configContext.direction);
    provide(LinkLevelKey, {
      get level() {
        return level.value;
      },
      get parents() {
        return [...parentInfo.parents, props.href];
      },
    });

    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const adapter = {
      ...baseAdapter,
      addLink: (href: string) => context?.addLink(href, parentInfo.parents.slice()),
      removeLink: (href: string) => context?.removeLink(href),
    };
    const foundation = new (LinkFoundation as any)(adapter);

    onMounted(() => foundation.handleAddLink());
    watch(
      () => props.href,
      (href, prevHref) => foundation.handleUpdateLink(href, prevHref)
    );
    onBeforeUnmount(() => foundation.handleRemoveLink());

    const handleClick = (e: Event) => {
      const { disabled, href } = props;
      !disabled && context?.onClick(e, href);
    };

    const renderTitle = () => {
      const { href, disabled = false } = props;
      const activeLink = context?.activeLink;
      const showTooltip = context?.showTooltip;
      const position = context?.position;
      const size = context?.size;
      const active = activeLink === href;
      const linkTitleCls = cls(`${prefixCls}-link-tooltip`, {
        [`${prefixCls}-link-tooltip-small`]: size === 'small',
        [`${prefixCls}-link-tooltip-active`]: active,
        [`${prefixCls}-link-tooltip-disabled`]: disabled,
      });
      const title = renderSlotOrProp(slots, 'title', normalizeNode(props.title));
      if (showTooltip) {
        const showTooltipObj: any = _isObject(showTooltip) ? { opts: {}, ...(showTooltip as any) } : { opts: {} };
        showTooltipObj.opts = { ...(showTooltipObj.opts || {}) };
        // The position can be set through showTooltip, here it is compatible with the position API
        if (position) {
          showTooltipObj.opts.position = position;
        }
        return h(
          TypographyText,
          {
            size: size === 'default' ? 'normal' : 'small',
            ellipsis: { showTooltip: showTooltipObj },
            type: 'tertiary',
            class: linkTitleCls,
          },
          { default: () => title }
        );
      }
      return title;
    };

    const renderChildren = () => {
      const { href } = props;
      const children = slots.default?.();
      if (!context?.autoCollapse) {
        return h('div', { role: 'list' }, children);
      }
      const { activeLink, childMap } = context;
      return activeLink === href || (childMap[href] && childMap[href].has(activeLink)) ? h('div', { role: 'list' }, children) : null;
    };

    return () => {
      const { href, disabled = false, title } = props;
      const activeLink = context?.activeLink;
      const showTooltip = context?.showTooltip;
      const active = activeLink === href;
      const { class: className, style, ...rest } = attrs as any;
      const linkCls = cls(`${prefixCls}-link`, className);
      const linkTitleCls = cls(`${prefixCls}-link-title`, {
        [`${prefixCls}-link-title-active`]: active,
        [`${prefixCls}-link-title-disabled`]: disabled,
      });
      const paddingAttributeKey = direction.value === 'rtl' ? 'paddingRight' : 'paddingLeft';
      const ariaProps: Record<string, any> = {
        'aria-disabled': disabled,
        style: { [paddingAttributeKey]: `${8 * level.value}px` },
      };
      if (active) ariaProps['aria-details'] = 'active';
      if (!showTooltip && typeof title === 'string') ariaProps.title = title;
      return h('div', { ...getDataAttr(rest), class: linkCls, style, role: 'listitem' }, [
        h('div', { role: 'link', tabindex: 0, ...ariaProps, class: linkTitleCls, onClick: handleClick, onKeypress: handleClick }, [renderTitle()]),
        renderChildren(),
      ]);
    };
  },
});
(Link as any).elementType = 'Anchor.Link';

export const anchorProps = {
  size: { type: String as PropType<AnchorSize>, default: 'default' },
  railTheme: { type: String as PropType<AnchorRailTheme>, default: 'primary' },
  scrollMotion: { type: Boolean, default: false },
  autoCollapse: { type: Boolean, default: false },
  offsetTop: { type: Number, default: 0 },
  targetOffset: { type: Number, default: 0 },
  showTooltip: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: false as boolean | Record<string, any> },
  position: { type: String as PropType<AnchorPosition>, default: undefined },
  maxWidth: { type: [String, Number] as PropType<string | number>, default: strings.MAX_WIDTH },
  maxHeight: { type: [String, Number] as PropType<string | number>, default: strings.MAX_HEIGHT },
  getContainer: { type: Function as PropType<() => HTMLElement | Window | null | undefined>, default: undefined },
  defaultAnchor: { type: String, default: '' },
  ariaLabel: { type: String, default: undefined },
};

export const anchorEmits = ['change', 'click'];

interface AnchorState {
  activeLink: string;
  links: string[];
  clickLink: boolean;
  scrollHeight: string;
  slideBarTop: string;
}

const Anchor = defineComponent({
  name: 'Anchor',
  inheritAttrs: false,
  props: anchorProps,
  emits: anchorEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent<any, AnchorState>(props as any, {
      activeLink: '',
      links: [],
      clickLink: false,
      scrollHeight: '100%',
      slideBarTop: '0',
    });
    const rootRef = ref<HTMLElement | null>(null);
    const linkWrapperRef = ref<HTMLElement | null>(null);
    const anchorID = getUuid('semi-anchor').replace('.', '');
    let childMap: Record<string, Set<string>> = {};
    let scrollContainer: HTMLElement | Window | null = null;
    let handler: any = null;
    let clickHandler: any = null;
    let resizeObserver: ResizeObserver | null = null;

    /**
     * Build a React-like `children` tree (`{ props: { href, children } }`) so the foundation's setChildMap
     * works untouched. Two sources are merged:
     *  1. the default-slot vnode tree (like React's props.children walk) - this also finds links that are
     *     currently not rendered because of `autoCollapse`;
     *  2. the runtime registry filled by mounted links (href + ancestor hrefs via LinkLevelKey) - this finds
     *     links rendered through wrapper components / fragments that the vnode walk cannot see into.
     */
    /** href -> parent-href lists, one entry per mounted Link instance (duplicate hrefs allowed) */
    const linkRegistry = new Map<string, string[][]>();
    const buildChildrenTree = (): any[] => {
      const nodes = new Map<string, any>();
      const mk = (href: string) => {
        if (!nodes.has(href)) nodes.set(href, { props: { href, children: [] } });
        return nodes.get(href);
      };
      const walk = (vnodes: any, parent: any | null) => {
        for (const node of flattenChildren(vnodes)) {
          if (!isVNode(node)) continue;
          if (typeof node.type === 'string') {
            // plain element: descend into its children
            walk(Array.isArray(node.children) ? node.children : null, parent);
            continue;
          }
          if (typeof node.type !== 'object') continue;
          if (getVNodeElementType(node) !== 'Anchor.Link') continue; // other components: found via the registry
          const href = (node.props as any)?.href ?? '#';
          const slotsOfNode: any = node.children && typeof node.children === 'object' && !Array.isArray(node.children) ? node.children : null;
          const nested = slotsOfNode && typeof slotsOfNode.default === 'function' ? slotsOfNode.default() : null;
          const cur = mk(href);
          (parent ? parent.props.children : roots).push(cur);
          walk(nested, cur);
        }
      };
      const roots: any[] = [];
      walk(slots.default?.(), null);
      // merge links only known through the registry (e.g. rendered by a wrapper component)
      const fromSlot = new Set(nodes.keys());
      linkRegistry.forEach((parentLists, href) => {
        if (fromSlot.has(href)) return;
        for (const parents of parentLists) {
          const cur = { props: { href, children: [] as any[] } };
          if (!nodes.has(href)) nodes.set(href, cur);
          let parent: any = null;
          for (let i = parents.length - 1; i >= 0; i--) {
            if (parents[i] !== href && nodes.has(parents[i])) {
              parent = nodes.get(parents[i]);
              break;
            }
          }
          (parent ? parent.props.children : roots).push(cur);
        }
      });
      // registry-only links may themselves have registry-only children registered before them: re-link
      linkRegistry.forEach((parentLists, href) => {
        if (fromSlot.has(href)) return;
        for (const parents of parentLists) {
          const idx = roots.findIndex((n) => n.props.href === href);
          if (idx === -1 || !parents.length) continue;
          for (let i = parents.length - 1; i >= 0; i--) {
            const p = nodes.get(parents[i]);
            if (p && parents[i] !== href) {
              p.props.children.push(roots.splice(idx, 1)[0]);
              break;
            }
          }
        }
      });
      return roots;
    };

    const adapter = {
      ...baseAdapter,
      getProp: (key: string) => (key === 'children' ? buildChildrenTree() : key === 'onChange' ? true : baseAdapter.getProp(key)),
      addLink: (value: string, parents: string[] = []) => {
        linkRegistry.set(value, [...(linkRegistry.get(value) || []), parents]);
        state.links = [...state.links, value];
      },
      removeLink: (link: string) => {
        const links = state.links.slice();
        const index = links.indexOf(link);
        if (index !== -1) {
          links.splice(index, 1);
          state.links = links;
        }
        const lists = linkRegistry.get(link);
        if (lists) {
          lists.pop();
          if (!lists.length) linkRegistry.delete(link);
        }
      },
      setChildMap: (value: Record<string, Set<string>>) => {
        childMap = value;
        context.childMap = value;
      },
      setScrollHeight: (height: string) => {
        state.scrollHeight = height;
      },
      setSlideBarTop: (height: number) => {
        state.slideBarTop = `${height}px`;
      },
      setClickLink: (value: boolean) => {
        state.clickLink = value;
      },
      setActiveLink: (link: string, cb: () => void) => {
        baseAdapter.setState({ activeLink: link } as any, () => cb());
      },
      setClickLinkWithCallBack: (value: boolean, link: string, cb: (link: string) => void) => {
        baseAdapter.setState({ clickLink: value } as any, () => cb(link));
      },
      getContainer: (): HTMLElement | Window => {
        const container = props.getContainer ? props.getContainer() : null;
        return container ? container : window;
      },
      getContainerBoundingTop: () => {
        const container = adapter.getContainer();
        if ('getBoundingClientRect' in container) {
          return (container as HTMLElement).getBoundingClientRect().top;
        }
        return 0;
      },
      getLinksBoundingTop: () => {
        const { links } = state;
        const { offsetTop } = props;
        const containerTop = adapter.getContainerBoundingTop();
        return links.map((link) => {
          const node = adapter.getContentNode(link);
          return (node && node.getBoundingClientRect().top - containerTop - offsetTop) || -Infinity;
        });
      },
      getAnchorNode: (selector: string) => {
        const root = rootRef.value;
        if (root) return root.querySelector(selector) as HTMLElement;
        return document.querySelector(`#${anchorID} ${selector}`) as HTMLElement;
      },
      getContentNode: (selector: string) => {
        if (!selector) return null as any;
        try {
          const byQuery = document.querySelector(selector) as HTMLElement | null;
          if (byQuery) return byQuery;
        } catch {
          /* invalid selector, e.g. id starting with a digit */
        }
        if (selector.charAt(0) === '#') {
          return document.getElementById(selector.slice(1));
        }
        return null as any;
      },
      notifyChange: (currentLink: string, previousLink: string) => emit('change', currentLink, previousLink),
      notifyClick: (e: any, link: string) => emit('click', e, link),
      canSmoothScroll: () => 'scrollBehavior' in document.body.style,
    };
    const foundation = new (AnchorFoundation as any)(adapter);

    const addLink = (link: string, parents: string[] = []) => adapter.addLink(link, parents);
    const removeLink = (link: string) => foundation.removeLink(link);
    const handleClick = (e: any, link: string) => foundation.handleClick(e, link);

    const context = reactive<AnchorContextValue>({
      activeLink: '',
      showTooltip: props.showTooltip,
      position: props.position,
      childMap: {},
      autoCollapse: props.autoCollapse,
      size: props.size,
      onClick: handleClick,
      addLink,
      removeLink,
    });
    watch(
      () => [state.activeLink, props.showTooltip, props.position, props.autoCollapse, props.size] as const,
      () => {
        context.activeLink = state.activeLink;
        context.showTooltip = props.showTooltip;
        context.position = props.position;
        context.autoCollapse = props.autoCollapse;
        context.size = props.size;
      },
      { immediate: true }
    );
    provideAnchorContext(context);

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (entry) {
        let isVisible = false;
        if ((entry as any).borderBoxSize && (entry as any).borderBoxSize[0]) {
          isVisible = !((entry as any).borderBoxSize[0].blockSize === 0 && (entry as any).borderBoxSize[0].inlineSize === 0);
        } else {
          isVisible = !(entry.contentRect.height === 0 && entry.contentRect.width === 0);
        }
        if (isVisible) foundation.setScrollHeight();
      }
    };

    onMounted(() => {
      scrollContainer = adapter.getContainer();
      handler = _throttle(() => foundation.handleScroll(), 100);
      clickHandler = _debounce(() => foundation.handleClickLink(), 100);
      scrollContainer.addEventListener('scroll', handler);
      scrollContainer.addEventListener('scroll', clickHandler);
      foundation.setScrollHeight();
      foundation.setChildMap();
      Boolean(props.defaultAnchor) && foundation.handleClick(null, props.defaultAnchor, false);
      if (linkWrapperRef.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(linkWrapperRef.value);
      }
    });
    // componentDidUpdate: links changed -> scroll height + child map
    watch(
      () => state.links.join(''),
      (links, prevLinks) => {
        foundation.updateScrollHeight({ links: [prevLinks] }, { links: [links] });
        foundation.updateChildMap({ links: [prevLinks] }, { links: [links] });
      },
      { flush: 'post' }
    );
    onBeforeUnmount(() => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handler);
        scrollContainer.removeEventListener('scroll', clickHandler);
      }
      resizeObserver && resizeObserver.disconnect();
    });

    expose({
      foundation,
      getChildMap: () => toRaw(childMap),
      getLinks: () => state.links.slice(),
      getActiveLink: () => state.activeLink,
      scrollTo: (link: string) => foundation.handleClick(null, link, false),
    });

    return () => {
      const { size, railTheme, maxWidth, maxHeight } = props;
      const { activeLink, scrollHeight, slideBarTop } = state;
      const { class: className, style, ...rest } = attrs as any;
      const wrapperCls = cls(prefixCls, className, { [`${prefixCls}-size-${size}`]: size });
      const slideCls = cls(`${prefixCls}-slide`, `${prefixCls}-slide-${railTheme}`);
      const slideBarCls = cls(`${prefixCls}-slide-bar`, {
        [`${prefixCls}-slide-bar-${size}`]: size,
        [`${prefixCls}-slide-bar-${railTheme}`]: railTheme,
        [`${prefixCls}-slide-bar-active`]: activeLink,
      });
      const wrapperStyle: CSSProperties = { maxWidth: toPx(maxWidth), maxHeight: toPx(maxHeight) };
      return h(
        'div',
        {
          role: 'navigation',
          'aria-label': props.ariaLabel || rest['aria-label'] || 'Side navigation',
          class: wrapperCls,
          style: [wrapperStyle, style],
          id: anchorID,
          ref: rootRef,
          ...getDataAttr(rest),
        },
        [
          h('div', { 'aria-hidden': true, class: slideCls, style: { height: scrollHeight } }, [h('span', { class: slideBarCls, style: { top: slideBarTop } })]),
          h('div', { class: `${prefixCls}-link-wrapper`, role: 'list', ref: linkWrapperRef }, slots.default?.()),
        ]
      );
    };
  },
}) as any;
Anchor.Link = Link;
Anchor.elementType = 'Anchor';

export default Anchor as typeof Anchor & { Link: typeof Link };
