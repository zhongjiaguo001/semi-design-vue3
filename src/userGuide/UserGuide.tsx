import { defineComponent, h, watch, onMounted, onBeforeUnmount, Fragment } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, numbers, strings } from '@douyinfe/semi-foundation/lib/es/userGuide/constants';
import UserGuideFoundation from '@douyinfe/semi-foundation/lib/es/userGuide/foundation';
import { noop } from '@douyinfe/semi-foundation/lib/es/utils/function';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/userGuide/userGuide.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, getScrollbarWidth, normalizeNode } from '../_utils';
import { useLocale } from '../locale';
import Popover from '../popover/Popover';
import Button from '../button/Button';
import Modal from '../modal/Modal';
import type { Position } from '../tooltip/Tooltip';

const prefixCls = cssClasses.PREFIX;

export interface StepItem {
  className?: string;
  cover?: any;
  target?: (() => Element) | Element;
  title?: any;
  description?: any;
  mask?: boolean;
  showArrow?: boolean;
  spotlightPadding?: number;
  theme?: 'default' | 'primary';
  position?: Position;
}

export const userGuideProps = {
  current: { type: Number, default: undefined },
  finishText: { type: [String, Object, Function] as PropType<any>, default: undefined },
  mask: { type: Boolean, default: true },
  mode: { type: String as PropType<'popup' | 'modal'>, default: 'popup' },
  nextButtonProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  position: { type: String as PropType<Position>, default: 'bottom' },
  prevButtonProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  showPrevButton: { type: Boolean, default: true },
  showSkipButton: { type: Boolean, default: true },
  spotlightPadding: { type: Number, default: undefined },
  steps: { type: Array as PropType<StepItem[]>, default: () => [] },
  theme: { type: String as PropType<'default' | 'primary'>, default: 'default' },
  visible: { type: Boolean, default: false },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  zIndex: { type: Number, default: numbers.DEFAULT_Z_INDEX },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const userGuideEmits = ['change', 'finish', 'next', 'prev', 'skip', 'update:current', 'update:visible'];

const UserGuide = defineComponent({
  name: 'UserGuide',
  inheritAttrs: false,
  props: userGuideProps,
  emits: userGuideEmits,
  setup(props, { attrs, emit }) {
    const { locale } = useLocale('UserGuide');
    const { state, adapter: baseAdapter, isControlled } = useBaseComponent(props as any, {
      current: props.current ?? numbers.DEFAULT_CURRENT,
      spotlightRect: null as DOMRect | null,
    });

    let bodyOverflow = '';
    let scrollBarWidth = 0;
    let originBodyWidth = '100%';
    let userGuideId = '';

    const adapter = {
      ...baseAdapter,
      disabledBodyScroll: () => {
        bodyOverflow = document.body.style.overflow || '';
        originBodyWidth = document.body.style.width || '100%';
        if (!props.getPopupContainer && bodyOverflow !== 'hidden') {
          document.body.style.overflow = 'hidden';
          document.body.style.width = `calc(${originBodyWidth || '100%'} - ${scrollBarWidth}px)`;
        }
      },
      enabledBodyScroll: () => {
        if (!props.getPopupContainer && bodyOverflow !== 'hidden') {
          document.body.style.overflow = bodyOverflow;
          document.body.style.width = originBodyWidth;
        }
      },
      notifyChange: (current: number) => {
        emit('change', current);
        emit('update:current', current);
      },
      notifyFinish: () => {
        emit('finish');
        emit('update:visible', false);
      },
      notifyNext: (current: number) => emit('next', current),
      notifyPrev: (current: number) => emit('prev', current),
      notifySkip: () => {
        emit('skip');
        emit('update:visible', false);
      },
      setCurrent: (current: number) => {
        state.current = current;
      },
    };
    const foundation = new (UserGuideFoundation as any)(adapter);

    const scrollTargetIntoViewIfNeeded = (target: Element) => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const isInViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
      if (!isInViewport) {
        target.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    };

    const updateSpotlightRect = () => {
      const step = props.steps[state.current];
      if (!step?.target) return;
      const target = typeof step.target === 'function' ? step.target() : step.target;
      if (!target) return;
      scrollTargetIntoViewIfNeeded(target);
      const rect = target.getBoundingClientRect();
      const padding = step.spotlightPadding ?? props.spotlightPadding ?? numbers.DEFAULT_SPOTLIGHT_PADDING;
      const newRects = new DOMRect(rect.x - padding, rect.y - padding, rect.width + padding * 2, rect.height + padding * 2);
      requestAnimationFrame(() => {
        state.spotlightRect = newRects;
      });
    };

    onMounted(() => {
      foundation.init();
      scrollBarWidth = getScrollbarWidth();
      userGuideId = getUuidShort();
      if (props.visible) {
        foundation.beforeShow();
        updateSpotlightRect();
      }
    });
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => props.current,
      (current) => {
        if (!isNullOrUndefined(current) && current !== state.current) state.current = current as number;
      }
    );
    watch(
      () => props.visible,
      (visible, prev) => {
        if (visible !== prev) {
          if (visible) {
            foundation.beforeShow();
            if (!isControlled('current')) state.current = 0;
          } else {
            foundation.afterHide();
          }
        }
      }
    );
    watch(
      () => [state.current, props.visible, props.mode, props.steps] as const,
      () => {
        if (props.mode === 'popup' && props.visible) updateSpotlightRect();
      }
    );

    const renderPopupContent = (step: StepItem, index: number) => {
      const loc = locale.value || {};
      const isFirst = index === 0;
      const isLast = index === (props.steps.length || 0) - 1;
      const popupPrefixCls = `${prefixCls}-popup-content`;
      const isPrimaryTheme = props.theme === 'primary' || step?.theme === 'primary';
      const { cover, title, description } = step;
      const { children: nextChildren, ...nextButtonProps } = props.nextButtonProps || {};
      const { children: prevChildren, ...prevButtonProps } = props.prevButtonProps || {};
      return h(
        'div',
        { class: cls(popupPrefixCls, { [`${popupPrefixCls}-primary`]: isPrimaryTheme }) },
        [
          cover ? h('div', { class: `${popupPrefixCls}-cover` }, [normalizeNode(cover)]) : null,
          h('div', { class: `${popupPrefixCls}-body` }, [
            title ? h('div', { class: `${popupPrefixCls}-title` }, [normalizeNode(title)]) : null,
            description ? h('div', { class: `${popupPrefixCls}-description` }, [normalizeNode(description)]) : null,
            h('div', { class: `${popupPrefixCls}-footer` }, [
              props.steps.length > 1 ? h('div', { class: `${popupPrefixCls}-indicator` }, `${state.current + 1}/${props.steps.length}`) : null,
              h('div', { class: `${popupPrefixCls}-buttons` }, [
                props.showSkipButton && !isLast
                  ? h(
                      Button,
                      {
                        style: isPrimaryTheme ? { backgroundColor: 'var(--semi-color-fill-2)' } : {},
                        theme: isPrimaryTheme ? 'solid' : 'light',
                        type: isPrimaryTheme ? 'primary' : 'tertiary',
                        onClick: () => foundation.handleSkip(),
                      },
                      () => loc.skip
                    )
                  : null,
                props.showPrevButton && !isFirst
                  ? h(
                      Button,
                      {
                        style: isPrimaryTheme ? { backgroundColor: 'var(--semi-color-fill-2)' } : {},
                        theme: isPrimaryTheme ? 'solid' : 'light',
                        type: isPrimaryTheme ? 'primary' : 'tertiary',
                        onClick: () => foundation.handlePrev(),
                        ...prevButtonProps,
                      },
                      () => normalizeNode(prevChildren) || loc.prev
                    )
                  : null,
                h(
                  Button,
                  {
                    style: isPrimaryTheme ? { backgroundColor: '#FFF' } : {},
                    theme: isPrimaryTheme ? 'borderless' : 'solid',
                    type: 'primary',
                    onClick: () => foundation.handleNext(),
                    ...nextButtonProps,
                  },
                  () => (isLast ? normalizeNode(props.finishText) || loc.finish : normalizeNode(nextChildren) || loc.next)
                ),
              ]),
            ]),
          ]),
        ]
      );
    };

    const renderStep = (step: StepItem, index: number) => {
      if (state.current !== index) return null;
      if (!step.target) return null;
      const target = typeof step.target === 'function' ? step.target() : step.target;
      if (!target || typeof (target as Element).getBoundingClientRect !== 'function') return null;
      const rect = (target as Element).getBoundingClientRect();
      const padding = step.spotlightPadding ?? props.spotlightPadding ?? numbers.DEFAULT_SPOTLIGHT_PADDING;
      const isPrimaryTheme = props.theme === 'primary' || step.theme === 'primary';
      const primaryStyle = isPrimaryTheme ? { backgroundColor: 'var(--semi-color-primary)' } : {};
      return h(
        Popover,
        {
          key: `userGuide-popup-${index}`,
          className: cls(`${prefixCls}-popover`, props.className, step.className),
          style: { padding: 0, ...primaryStyle, ...(props.style || {}) },
          content: () => renderPopupContent(step, index),
          position: step.position || props.position,
          trigger: 'custom',
          visible: props.visible && state.current === index,
          showArrow: step.showArrow !== false,
          zIndex: props.zIndex,
          getPopupContainer: props.getPopupContainer,
          motion: false,
        },
        () =>
          h('div', {
            style: {
              position: 'fixed',
              left: `${rect.x - padding}px`,
              top: `${rect.y - padding}px`,
              width: `${rect.width + padding * 2}px`,
              height: `${rect.height + padding * 2}px`,
              pointerEvents: 'none',
            },
          })
      );
    };

    const renderSpotlight = () => {
      const step = props.steps[state.current];
      if (!step?.target) return null;
      const { spotlightRect } = state;
      if (!spotlightRect) {
        updateSpotlightRect();
        return null;
      }
      const id = `spotlight-${userGuideId}`;
      return h('svg', { class: `${prefixCls}-spotlight`, style: { zIndex: props.zIndex } }, [
        h('defs', null, [
          h('mask', { id }, [
            h('rect', { width: '100%', height: '100%', fill: 'white' }),
            h('rect', {
              class: `${prefixCls}-spotlight-rect`,
              x: spotlightRect.x,
              y: spotlightRect.y,
              width: spotlightRect.width,
              height: spotlightRect.height,
              rx: 4,
              fill: 'black',
            }),
          ]),
        ]),
        (step.mask ?? props.mask)
          ? [
              h('rect', { width: '100%', height: '100%', fill: 'var(--semi-color-overlay-bg)', mask: `url(#${id})` }),
              h('rect', { x: 0, y: 0, width: '100%', height: spotlightRect.y, fill: 'transparent', class: `${prefixCls}-spotlight-transparent-rect` }),
              h('rect', { x: 0, y: spotlightRect.y, width: spotlightRect.x, height: spotlightRect.height, fill: 'transparent', class: `${prefixCls}-spotlight-transparent-rect` }),
              h('rect', {
                x: spotlightRect.x + spotlightRect.width,
                y: spotlightRect.y,
                width: `calc(100% - ${spotlightRect.x + spotlightRect.width}px)`,
                height: spotlightRect.height,
                fill: 'transparent',
                class: `${prefixCls}-spotlight-transparent-rect`,
              }),
              h('rect', {
                y: spotlightRect.y + spotlightRect.height,
                width: '100%',
                height: `calc(100% - ${spotlightRect.y + spotlightRect.height}px)`,
                fill: 'transparent',
                class: `${prefixCls}-spotlight-transparent-rect`,
              }),
            ]
          : null,
      ]);
    };

    const renderIndicator = () =>
      props.steps.map((_s, i) =>
        h('span', {
          key: i,
          'data-index': i,
          class: cls(`${cssClasses.PREFIX_MODAL}-indicator-item`, {
            [`${cssClasses.PREFIX_MODAL}-indicator-item-active`]: i === state.current,
          }),
        })
      );

    const renderModal = () => {
      const loc = locale.value || {};
      const step: StepItem = props.steps[state.current] || {};
      const isFirst = state.current === 0;
      const isLast = state.current === props.steps.length - 1;
      const { children: nextChildren, ...nextButtonProps } = props.nextButtonProps || {};
      const { children: prevChildren, ...prevButtonProps } = props.prevButtonProps || {};
      return h(
        Modal,
        {
          className: cls(cssClasses.PREFIX_MODAL, props.className, step.className),
          style: props.style,
          bodyStyle: { padding: 0 },
          header: null,
          visible: props.visible,
          maskClosable: false,
          mask: step.mask ?? props.mask,
          centered: true,
          footer: null,
          zIndex: props.zIndex,
          getPopupContainer: props.getPopupContainer,
          motion: false,
        },
        () => [
          step.cover
            ? [
                h('div', { class: `${cssClasses.PREFIX_MODAL}-cover` }, [normalizeNode(step.cover)]),
                h('div', { class: `${cssClasses.PREFIX_MODAL}-indicator` }, renderIndicator()),
              ]
            : null,
          step.title || step.description
            ? h('div', { class: `${cssClasses.PREFIX_MODAL}-body` }, [
                step.title ? h('div', { class: `${cssClasses.PREFIX_MODAL}-body-title` }, [normalizeNode(step.title)]) : null,
                step.description ? h('div', { class: `${cssClasses.PREFIX_MODAL}-body-description` }, [normalizeNode(step.description)]) : null,
              ])
            : null,
          h('div', { class: `${cssClasses.PREFIX_MODAL}-footer` }, [
            props.showSkipButton && !isLast
              ? h(Button, { type: 'tertiary', onClick: () => foundation.handleSkip() }, () => loc.skip)
              : null,
            props.showPrevButton && !isFirst
              ? h(Button, { type: 'tertiary', onClick: () => foundation.handlePrev(), ...prevButtonProps }, () => normalizeNode(prevChildren) || loc.prev)
              : null,
            h(Button, { theme: 'solid', onClick: () => foundation.handleNext(), ...nextButtonProps }, () =>
              isLast ? normalizeNode(props.finishText) || loc.finish : normalizeNode(nextChildren) || loc.next
            ),
          ]),
        ]
      );
    };

    return () => {
      const { class: _c, style: _s, ...rest } = attrs as any;
      if (!props.visible || !props.steps.length) return null;
      return h(Fragment, { ...getDataAttr(rest) }, [
        props.mode === 'popup' ? [props.steps.map((step, index) => renderStep(step, index)), renderSpotlight()] : null,
        props.mode === 'modal' ? renderModal() : null,
      ]);
    };
  },
});

(UserGuide as any).elementType = 'UserGuide';
void strings;
void noop;
export default UserGuide;
