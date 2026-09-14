import { defineComponent, h, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, cloneVNode, Fragment, Text } from 'vue';
import type { PropType, CSSProperties, VNode, VNodeChild } from 'vue';
import _get from 'lodash/get';
import _omit from 'lodash/omit';
import _throttle from 'lodash/throttle';
import _isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { BASE_CLASS_PREFIX } from '@douyinfe/semi-foundation/lib/es/base/constants';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import Event from '@douyinfe/semi-foundation/lib/es/utils/Event';
import { convertDOMRectToObject, isHTMLElement } from '@douyinfe/semi-foundation/lib/es/utils/dom';
import TooltipFoundation from '@douyinfe/semi-foundation/lib/es/tooltip/foundation';
import { strings, cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/tooltip/constants';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/tooltip/tooltip.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { getActiveElement, getFocusableElements, runAfterTicks, stopPropagation as stopPropagationUtil, flattenChildren, resolveDOM, getVNodeElementType, normalizeNode, isVNode, toCssStyle } from '../_utils';
import Portal from '../_portal/Portal';
import CSSAnimation from '../_cssAnimation';
import { TriangleArrow, TriangleArrowVertical } from './TriangleArrow';

const prefix = cssClasses.PREFIX;
const positionSet = strings.POSITION_SET;
const triggerSet = strings.TRIGGER_SET;
const blockDisplays = ['flex', 'block', 'table', 'flow-root', 'grid'];
const defaultGetContainer = () => document.body;

export type Position = (typeof positionSet)[number];
export type Trigger = (typeof triggerSet)[number];

export interface ArrowBounding {
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
}

export const tooltipProps = {
  motion: { type: Boolean, default: true },
  autoAdjustOverflow: { type: Boolean, default: true },
  position: { type: String as PropType<Position>, default: 'top' },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  mouseEnterDelay: { type: Number, default: numbers.MOUSE_ENTER_DELAY },
  mouseLeaveDelay: { type: Number, default: numbers.MOUSE_LEAVE_DELAY },
  trigger: { type: String as PropType<Trigger>, default: 'hover' },
  className: { type: String, default: undefined },
  wrapperClassName: { type: String, default: undefined },
  clickToHide: { type: Boolean, default: false },
  clickTriggerToHide: { type: Boolean, default: false },
  visible: { type: Boolean, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  content: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  prefixCls: { type: String, default: prefix },
  spacing: { type: [Number, Object] as PropType<number | { x?: number; y?: number }>, default: numbers.SPACING },
  margin: { type: [Number, Object] as PropType<number | { marginLeft?: number; marginTop?: number; marginRight?: number; marginBottom?: number }>, default: numbers.MARGIN },
  showArrow: { type: [Boolean, Object] as PropType<boolean | VNode>, default: true },
  zIndex: { type: Number, default: numbers.DEFAULT_Z_INDEX },
  rePosKey: { type: [String, Number], default: undefined },
  arrowBounding: { type: Object as PropType<ArrowBounding>, default: () => numbers.ARROW_BOUNDING },
  transformFromCenter: { type: Boolean, default: true },
  arrowPointAtCenter: { type: Boolean, default: true },
  stopPropagation: { type: Boolean, default: false },
  role: { type: String, default: 'tooltip' },
  wrapWhenSpecial: { type: Boolean, default: true },
  guardFocus: { type: Boolean, default: false },
  returnFocusOnClose: { type: Boolean, default: false },
  preventScroll: { type: Boolean, default: false },
  keepDOM: { type: Boolean, default: false },
  condition: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: false },
  disableFocusListener: { type: Boolean, default: false },
  disableArrowKeyDown: { type: Boolean, default: false },
  wrapperId: { type: String, default: undefined },
};

export const tooltipEmits = ['visibleChange', 'clickOutSide', 'escKeyDown', 'afterClose'];

interface TooltipState {
  visible: boolean;
  transitionState: '' | 'enter' | 'leave';
  triggerEventSet: Record<string, (e?: any) => void>;
  portalEventSet: Record<string, (e?: any) => void>;
  containerStyle: Record<string, any>;
  isInsert: boolean;
  placement: Position;
  transitionStyle: Record<string, any>;
  isPositionUpdated: boolean;
  id: string | undefined;
  displayNone: boolean;
}

const Tooltip = defineComponent({
  name: 'Tooltip',
  inheritAttrs: false,
  props: tooltipProps,
  emits: tooltipEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const { state, adapter: baseAdapter, cache } = useBaseComponent<any, TooltipState>(props as any, {
      visible: false,
      transitionState: '',
      triggerEventSet: {},
      portalEventSet: {},
      containerStyle: {},
      isInsert: false,
      placement: props.position || 'top',
      transitionStyle: {},
      isPositionUpdated: false,
      id: props.wrapperId,
      displayNone: false,
    });

    const eventManager = new (Event as any)();
    const triggerEl = { current: null as any };
    const containerEl = ref<HTMLElement | null>(null);
    const initialFocusRef = ref<any>(null);
    let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
    let resizeHandler: any = null;
    let scrollHandler: any = null;
    let containerPosition: string | undefined;
    let mounted = false;
    let isAnimating = false;
    let cachedLatestTransitionState: 'enter' | 'leave' = 'enter';
    let popupResizeObserver: ResizeObserver | null = null;
    let popupResizeTimer: any = null;
    let isWrapped = false;

    const getPopupContainer = () => (props.getPopupContainer || context.getPopupContainer || defaultGetContainer)();

    const disconnectPopupResizeObserver = () => {
      clearTimeout(popupResizeTimer);
      popupResizeObserver?.disconnect();
      popupResizeObserver = null;
    };

    const getTriggerNode = (): HTMLElement | null => {
      let triggerDOM = triggerEl.current;
      if (!isHTMLElement(triggerDOM)) {
        const resolved = resolveDOM(triggerDOM);
        if (resolved) {
          triggerDOM = resolved;
        } else {
          if (triggerDOM) {
            warning(true, "[Semi Tooltip] The trigger element's ref did not return a DOM node. Please ensure the trigger component has a single root element.");
          }
          return null;
        }
      }
      return triggerDOM;
    };

    const adapter = {
      ...baseAdapter,
      on: (...args: any[]) => eventManager.on(...args),
      off: (...args: any[]) => eventManager.off(...args),
      getAnimatingState: () => isAnimating,
      insertPortal: (_content: any, { position: _p, ...containerStyle }: any) => {
        cachedLatestTransitionState = 'enter';
        disconnectPopupResizeObserver();
        state.isInsert = true;
        state.transitionState = 'enter';
        state.containerStyle = { ...state.containerStyle, ...containerStyle };
        state.isPositionUpdated = false;
        nextTick(() => {
          const emitInserted = () => {
            if (cachedLatestTransitionState === 'enter') {
              eventManager.emit('portalInserted');
            }
          };
          const el = containerEl.value;
          if (el && typeof ResizeObserver !== 'undefined') {
            let emitted = false;
            let lastWidth = el.offsetWidth;
            let lastHeight = el.offsetHeight;
            const emitOnce = () => {
              if (!emitted) {
                emitted = true;
                emitInserted();
              }
            };
            const ro = new ResizeObserver(() => {
              const width = el.offsetWidth;
              const height = el.offsetHeight;
              if (width <= 0 || height <= 0) return;
              const sizeChanged = width !== lastWidth || height !== lastHeight;
              lastWidth = width;
              lastHeight = height;
              if (!emitted) {
                emitOnce();
              } else if (sizeChanged && cachedLatestTransitionState === 'enter') {
                clearTimeout(popupResizeTimer);
                popupResizeTimer = setTimeout(() => {
                  if (cachedLatestTransitionState === 'enter') {
                    foundation.calcPosition();
                  }
                }, 0);
              }
            });
            popupResizeObserver = ro;
            ro.observe(el);
            if (lastWidth > 0 && lastHeight > 0) {
              emitOnce();
            }
            setTimeout(() => {
              if (!emitted) emitOnce();
            }, 50);
            return;
          }
          if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
            emitInserted();
          } else {
            setTimeout(emitInserted, 0);
          }
        });
      },
      removePortal: () => {
        disconnectPopupResizeObserver();
        state.isInsert = false;
        state.isPositionUpdated = false;
      },
      getEventName: () => ({
        mouseEnter: 'onMouseenter',
        mouseLeave: 'onMouseleave',
        mouseOut: 'onMouseout',
        mouseOver: 'onMouseover',
        click: 'onClick',
        focus: 'onFocus',
        blur: 'onBlur',
        keydown: 'onKeydown',
        contextMenu: 'onContextmenu',
      }),
      registerTriggerEvent: (triggerEventSet: any) => {
        state.triggerEventSet = triggerEventSet;
      },
      registerPortalEvent: (portalEventSet: any) => {
        state.portalEventSet = portalEventSet;
      },
      getTriggerBounding: () => {
        const triggerDOM = getTriggerNode();
        return triggerDOM && triggerDOM.getBoundingClientRect();
      },
      getPopupContainerRect: () => {
        const container = getPopupContainer();
        let rect: any = null;
        if (container && isHTMLElement(container)) {
          const boundingRect = convertDOMRectToObject(container.getBoundingClientRect());
          rect = { ...boundingRect, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop };
        }
        return rect;
      },
      containerIsBody: () => getPopupContainer() === document.body,
      containerIsRelative: () => {
        const container = getPopupContainer();
        const computedStyle = window.getComputedStyle(container);
        return computedStyle.getPropertyValue('position') === 'relative';
      },
      containerIsRelativeOrAbsolute: () => ['relative', 'absolute'].includes(containerPosition as string),
      getWrapperBounding: () => {
        const el = containerEl.value;
        return el && el.getBoundingClientRect();
      },
      getDocumentElementBounding: () => document.documentElement.getBoundingClientRect(),
      setPosition: ({ position, ...style }: any) => {
        state.containerStyle = { ...state.containerStyle, ...style };
        state.placement = position;
        state.isPositionUpdated = true;
        nextTick(() => eventManager.emit('positionUpdated'));
      },
      setDisplayNone: (displayNone: boolean, cb?: () => void) => {
        state.displayNone = displayNone;
        cb && nextTick(cb);
      },
      updatePlacementAttr: (placement: Position) => {
        state.placement = placement;
      },
      togglePortalVisible: (visible: boolean, cb: () => void) => {
        state.transitionState = visible ? 'enter' : 'leave';
        state.visible = visible;
        cachedLatestTransitionState = state.transitionState;
        mounted && nextTick(cb);
      },
      registerClickOutsideHandler: (cb: () => void) => {
        if (clickOutsideHandler) {
          adapter.unregisterClickOutsideHandler();
        }
        clickOutsideHandler = (e: MouseEvent) => {
          if (!mounted) return false;
          let el: any = triggerEl.current;
          const popupEl = containerEl.value;
          el = resolveDOM(el) ?? el;
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          const isClickTriggerToHide = props.clickTriggerToHide ? (el && el.contains(target)) || path.includes(el) : false;
          if ((el && !el.contains(target) && popupEl && !popupEl.contains(target) && !(path.includes(popupEl) || path.includes(el))) || isClickTriggerToHide) {
            emit('clickOutSide', e);
            cb();
          }
        };
        window.addEventListener('mousedown', clickOutsideHandler);
      },
      unregisterClickOutsideHandler: () => {
        if (clickOutsideHandler) {
          window.removeEventListener('mousedown', clickOutsideHandler);
          clickOutsideHandler = null;
        }
      },
      registerResizeHandler: (cb: (e?: any) => void) => {
        if (resizeHandler) {
          adapter.unregisterResizeHandler();
        }
        resizeHandler = _throttle((e: any) => {
          if (!mounted) return false;
          cb(e);
        }, 10);
        window.addEventListener('resize', resizeHandler, false);
      },
      unregisterResizeHandler: () => {
        if (resizeHandler) {
          window.removeEventListener('resize', resizeHandler, false);
          resizeHandler = null;
        }
      },
      notifyVisibleChange: (visible: boolean) => {
        emit('visibleChange', visible);
      },
      registerScrollHandler: (rePositionCb: (pos: { x: number; y: number }) => void) => {
        if (scrollHandler) {
          adapter.unregisterScrollHandler();
        }
        scrollHandler = _throttle((e: any) => {
          if (!mounted) return false;
          const triggerDOM = getTriggerNode();
          const isRelativeScroll = e.target && typeof e.target.contains === 'function' && e.target.contains(triggerDOM);
          if (isRelativeScroll) {
            rePositionCb({ x: e.target.scrollLeft, y: e.target.scrollTop });
          }
        }, 10);
        window.addEventListener('scroll', scrollHandler, true);
      },
      unregisterScrollHandler: () => {
        if (scrollHandler) {
          window.removeEventListener('scroll', scrollHandler, true);
          scrollHandler = null;
        }
      },
      canMotion: () => Boolean(props.motion),
      updateContainerPosition: () => {
        const positionInBody = document.body.getAttribute('data-position');
        if (positionInBody) {
          containerPosition = positionInBody;
          return;
        }
        requestAnimationFrame(() => {
          const container = getPopupContainer();
          if (container && isHTMLElement(container)) {
            const computedStyle = window.getComputedStyle(container);
            const position = computedStyle.getPropertyValue('position');
            document.body.setAttribute('data-position', position);
            containerPosition = position;
          }
        });
      },
      getContainerPosition: () => containerPosition,
      getContainer: () => containerEl.value,
      getTriggerNode,
      getFocusableElements: (node: any) => getFocusableElements(node),
      getActiveElement: () => getActiveElement(),
      setInitialFocus: () => {
        const focusRefNode = resolveDOM(initialFocusRef.value) || initialFocusRef.value;
        if (focusRefNode && 'focus' in focusRefNode) {
          focusRefNode.focus({ preventScroll: props.preventScroll });
        }
      },
      notifyEscKeydown: (event: any) => {
        emit('escKeyDown', event);
      },
      setId: () => {
        state.id = getUuidShort();
      },
      getTriggerDOM: () => {
        if (triggerEl.current) {
          return resolveDOM(triggerEl.current);
        }
        return null;
      },
    };

    const foundation = new (TooltipFoundation as any)(adapter);

    // Bind trigger events / id synchronously (React flushes the didMount setState before
    // the browser regains control; in Vue we init before the first render for the same effect).
    foundation.init();

    onMounted(() => {
      mounted = true;
      runAfterTicks(() => {
        const triggerEle = getTriggerNode();
        foundation.updateStateIfCursorOnTrigger(triggerEle);
      }, 1);
    });

    onBeforeUnmount(() => {
      mounted = false;
      disconnectPopupResizeObserver();
      foundation.destroy();
    });

    watch(
      () => props.visible,
      (visible, prev) => {
        if (visible === prev) return;
        if (['hover', 'focus'].includes(props.trigger)) {
          visible ? foundation.delayShow() : foundation.delayHide();
        } else {
          visible ? foundation.show() : foundation.hide();
        }
      }
    );
    watch(
      () => props.rePosKey,
      (val, prev) => {
        if (!_isEqual(val, prev)) foundation.calcPosition();
      }
    );
    watch(
      () => [props.mouseEnterDelay, props.mouseLeaveDelay],
      () => {
        warning(props.mouseLeaveDelay < props.mouseEnterDelay, "[Semi Tooltip] 'mouseLeaveDelay' cannot be less than 'mouseEnterDelay', which may cause the dropdown layer to not be hidden.");
      },
      { immediate: true }
    );

    const didLeave = () => {
      disconnectPopupResizeObserver();
      if (props.keepDOM) {
        foundation.setDisplayNone(true);
      } else {
        foundation.removePortal();
      }
      foundation.unBindEvent();
    };

    const isSpecial = (elem: VNode | undefined): false | string => {
      if (!elem || !isVNode(elem)) return false;
      const p: any = elem.props || {};
      const disabled = p.disabled !== undefined && p.disabled !== false;
      if (typeof elem.type === 'string') {
        return disabled ? strings.STATUS_DISABLED : false;
      }
      if (disabled) return strings.STATUS_DISABLED;
      const loading = p.loading !== undefined && p.loading !== false;
      const et = getVNodeElementType(elem);
      const isButton = et === 'Button' || et === 'IconButton';
      if (loading && isButton) return strings.STATUS_LOADING;
      return false;
    };

    const renderIcon = () => {
      const { placement } = state;
      const { showArrow, prefixCls, style } = props;
      let icon: VNodeChild = null;
      const triangleCls = classNames([`${prefixCls}-icon-arrow`]);
      const bgColor = _get(style, 'backgroundColor');
      const isVertical = placement?.includes('left') || placement?.includes('right');
      if (showArrow) {
        if (isVNode(showArrow)) {
          icon = showArrow;
        } else {
          icon = h(isVertical ? TriangleArrowVertical : TriangleArrow, {
            class: triangleCls,
            style: { color: bgColor, fill: 'currentColor' },
          });
        }
      }
      return icon;
    };

    const handlePortalInnerClick = (e: MouseEvent) => {
      if (props.clickToHide) foundation.hide();
      if (props.stopPropagation) stopPropagationUtil(e);
    };
    const handlePortalMouseDown = (e: MouseEvent) => {
      if (props.stopPropagation) stopPropagationUtil(e);
    };
    const handlePortalFocus = (e: FocusEvent) => {
      if (props.stopPropagation) stopPropagationUtil(e);
    };
    const handlePortalBlur = (e: FocusEvent) => {
      if (props.stopPropagation) stopPropagationUtil(e);
    };
    const handlePortalInnerKeyDown = (e: KeyboardEvent) => {
      foundation.handleContainerKeydown(e);
    };

    const renderContentNode = () => {
      const contentProps = { initialFocusRef };
      if (slots.content) return slots.content(contentProps);
      const content = props.content;
      return typeof content === 'function' && !(content as any).setup && !(content as any).render ? content(contentProps) : normalizeNode(content);
    };

    const renderPortal = () => {
      const { containerStyle = {}, visible, portalEventSet, placement, displayNone, transitionState, id, isPositionUpdated } = state;
      const { prefixCls, showArrow, style, motion, role, zIndex } = props;
      const contentNode = renderContentNode();
      const direction = context.direction;
      const className = classNames(props.className, {
        [`${prefixCls}-wrapper`]: true,
        [`${prefixCls}-wrapper-show`]: visible,
        [`${prefixCls}-with-arrow`]: Boolean(showArrow),
        [`${prefixCls}-rtl`]: direction === 'rtl',
      });
      const icon = renderIcon();
      const portalInnerStyle = _omit(containerStyle, motion ? ['transformOrigin'] : []);
      const transformOrigin = _get(containerStyle, 'transformOrigin');
      const arrowOffsetX = _get(containerStyle, '--semi-tooltip-arrow-offset-x');
      const arrowOffsetY = _get(containerStyle, '--semi-tooltip-arrow-offset-y');
      const wrapperArrowStyle = {
        ...(arrowOffsetX ? { '--semi-tooltip-arrow-offset-x': arrowOffsetX } : {}),
        ...(arrowOffsetY ? { '--semi-tooltip-arrow-offset-y': arrowOffsetY } : {}),
      };
      const userOpacity = _get(style, 'opacity', null);
      const opacity = userOpacity ? userOpacity : 1;

      const inner = h(
        CSSAnimation,
        {
          fillMode: 'forwards',
          animationState: transitionState,
          motion: motion && isPositionUpdated,
          startClassName: transitionState === 'enter' ? `${prefix}-animation-show` : `${prefix}-animation-hide`,
          onAnimationStart: () => {
            isAnimating = true;
          },
          onAnimationEnd: () => {
            if (transitionState === 'leave') {
              didLeave();
              emit('afterClose');
            }
            isAnimating = false;
          },
        },
        {
          default: ({ animationStyle, animationClassName, animationEventsNeedBind }: any) =>
            h(
              'div',
              {
                class: classNames(className, animationClassName),
                style: {
                  ...animationStyle,
                  ...(displayNone ? { display: 'none' } : {}),
                  transformOrigin,
                  ...style,
                  ...wrapperArrowStyle,
                  ...(userOpacity ? { opacity: isPositionUpdated ? opacity : '0' } : {}),
                },
                ...portalEventSet,
                ...animationEventsNeedBind,
                role,
                'x-placement': placement,
                id,
              },
              [h('div', { class: `${prefix}-content` }, contentNode), icon]
            ),
        }
      );

      return h(
        Portal,
        { getPopupContainer: props.getPopupContainer, style: { zIndex } },
        {
          default: () =>
            h(
              'div',
              {
                tabindex: -1,
                class: `${BASE_CLASS_PREFIX}-portal-inner`,
                style: toCssStyle(portalInnerStyle),
                ref: containerEl,
                onClick: handlePortalInnerClick,
                onFocus: handlePortalFocus,
                onBlur: handlePortalBlur,
                onMousedown: handlePortalMouseDown,
                onKeydown: handlePortalInnerKeyDown,
              },
              [inner]
            ),
        }
      );
    };

    const wrapSpan = (elem: VNode | string) => {
      const display = _get(elem, 'props.style.display');
      const block = _get(elem, 'props.block');
      const isStringElem = typeof elem === 'string';
      const style: CSSProperties = {};
      if (!isStringElem) style.display = 'inline-block';
      if (block || blockDisplays.includes(display)) style.width = '100%';
      return h('span', { class: props.wrapperClassName, style }, [elem]);
    };

    expose({
      focusTrigger: () => foundation.focusTrigger(),
      rePosition: () => foundation.calcPosition(),
      getPopupId: () => state.id,
      foundation,
    });

    return () => {
      const { isInsert, triggerEventSet, visible, id } = state;
      const { wrapWhenSpecial, role, trigger } = props;
      const rawChildren = flattenChildren(slots.default?.());
      let child: VNode | undefined = rawChildren[0];
      if (rawChildren.length > 1) {
        // multiple roots: wrap into a span so a single trigger element exists
        child = h('span', { class: props.wrapperClassName, style: { display: 'inline-block' } }, rawChildren);
      }
      if (!child) return isInsert ? renderPortal() : null;

      const extraStyle: CSSProperties = {};
      isWrapped = false;
      const isTextChild = child.type === Text;
      if (wrapWhenSpecial) {
        const special = isSpecial(child);
        if (special) {
          const childrenStyle: CSSProperties = { pointerEvents: 'none' };
          if (special === strings.STATUS_DISABLED) {
            extraStyle.cursor = 'not-allowed';
          }
          child = cloneVNode(child, { style: childrenStyle });
          if (trigger !== 'custom') {
            child = wrapSpan(child) as VNode;
          }
          isWrapped = true;
        } else if (isTextChild || child.type === Fragment) {
          child = wrapSpan(child) as VNode;
          isWrapped = true;
        }
      } else if (isTextChild) {
        child = wrapSpan(child) as VNode;
        isWrapped = true;
      }

      const ariaAttribute: Record<string, any> = {};
      if (role === 'dialog') {
        ariaAttribute['aria-expanded'] = visible ? 'true' : 'false';
        ariaAttribute['aria-haspopup'] = 'dialog';
        ariaAttribute['aria-controls'] = id;
      } else {
        ariaAttribute['aria-describedby'] = id;
      }
      const childProps: any = child.props || {};
      const tooltipRef = childProps.tooltipRef;
      const newChild = cloneVNode(
        child,
        {
          ...ariaAttribute,
          ...triggerEventSet,
          style: extraStyle,
          ref: (node: any) => {
            if (tooltipRef) {
              triggerEl.current = tooltipRef.value ?? tooltipRef.current ?? tooltipRef;
            } else {
              triggerEl.current = node;
            }
          },
          tabindex: childProps.tabindex ?? childProps.tabIndex ?? 0,
          'data-popupid': id,
        } as any,
        true
      );
      return [isInsert ? renderPortal() : null, newChild];
    };
  },
});

export default Tooltip;
