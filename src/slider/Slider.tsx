import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, Fragment } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import _noop from 'lodash/noop';
import _isEqual from 'lodash/isEqual';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/slider/constants';
import SliderFoundation from '@douyinfe/semi-foundation/lib/es/slider/foundation';
import '@douyinfe/semi-foundation/lib/es/slider/slider.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { getDataAttr } from '../_utils';
import Tooltip from '../tooltip/Tooltip';

const prefixCls = cssClasses.PREFIX;

export interface SliderMarks {
  [key: number]: string;
}
export interface HandleDot {
  size?: string;
  color?: string;
}
export type SliderValue = number | number[];
export type TipFormatterBasicType = string | number | boolean | null;

function domIsInRenderTree(e: HTMLElement | null) {
  if (!e) return false;
  return Boolean(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}

export const sliderProps = {
  value: { type: [Number, Array] as PropType<SliderValue>, default: undefined },
  modelValue: { type: [Number, Array] as PropType<SliderValue>, default: undefined },
  defaultValue: { type: [Number, Array] as PropType<SliderValue>, default: undefined },
  disabled: { type: Boolean, default: false },
  showMarkLabel: { type: Boolean, default: true },
  included: { type: Boolean, default: true },
  marks: { type: Object as PropType<SliderMarks>, default: undefined },
  max: { type: Number, default: 100 },
  min: { type: Number, default: 0 },
  range: { type: Boolean, default: false },
  step: { type: Number, default: 1 },
  tipFormatter: {
    type: [Function, null] as PropType<((value: TipFormatterBasicType | TipFormatterBasicType[]) => any) | null>,
    // type is an array, so Vue calls the default as a factory
    default: () => (value: any) => value,
  },
  vertical: { type: Boolean, default: false },
  verticalReverse: { type: Boolean, default: false },
  tooltipOnMark: { type: Boolean, default: false },
  tooltipVisible: { type: Boolean, default: undefined },
  showArrow: { type: Boolean, default: true },
  showBoundary: { type: Boolean, default: false },
  railStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  getAriaValueText: { type: Function as PropType<(value: number, index?: number) => string>, default: undefined },
  handleDot: { type: [Object, Array] as PropType<HandleDot | HandleDot[]>, default: undefined },
  ariaLabel: { type: String, default: undefined },
  ariaLabelledby: { type: String, default: undefined },
  ariaValuetext: { type: String, default: undefined },
};

export const sliderEmits = ['update:modelValue', 'update:value', 'change', 'afterChange', 'mouseup'];

const Slider = defineComponent({
  name: 'Slider',
  inheritAttrs: false,
  props: sliderProps,
  emits: sliderEmits,
  setup(props, { attrs, emit, expose }) {
    const context = useConfigContext();
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      currentValue: 0 as SliderValue,
      min: props.min || 0,
      max: props.max || 0,
      focusPos: '' as 'min' | 'max' | '',
      disabled: props.disabled || false,
      chooseMovePos: '' as 'min' | 'max' | '',
      isDrag: false,
      clickValue: 0,
      showBoundary: false,
      isInRenderTree: true,
      firstDotFocusVisible: false,
      secondDotFocusVisible: false,
    }, { modelProp: 'value' });

    const getValueProp = (): SliderValue | undefined => ('value' in propsView ? (propsView as any).value : undefined);
    {
      let value: any = getValueProp();
      if (!value) value = props.defaultValue;
      state.currentValue = value ? value : props.range ? [0, 0] : 0;
    }

    const sliderEl = ref<HTMLElement | null>(null);
    const minHandleEl = ref<HTMLElement | null>(null);
    const maxHandleEl = ref<HTMLElement | null>(null);
    let dragging = [false, false];
    const eventListenerSet = new Set<() => void>();
    const handleDownEventListenerSet = new Set<() => void>();

    const addEventListener = (target: any, eventName: string, callback: any, ...rests: any[]) => {
      if (target && target.addEventListener) {
        target.addEventListener(eventName, callback, ...rests);
        const clearSelf = () => {
          target?.removeEventListener(eventName, callback);
          Promise.resolve().then(() => {
            eventListenerSet.delete(clearSelf);
          });
        };
        eventListenerSet.add(clearSelf);
        return clearSelf;
      }
      return _noop;
    };

    const adapter = {
      ...baseAdapter,
      getSliderLengths: () => {
        const el = sliderEl.value;
        if (el) {
          const rect = el.getBoundingClientRect();
          const offsetParentRect = (el.offsetParent as HTMLElement | null)?.getBoundingClientRect();
          const offset = {
            x: offsetParentRect ? rect.left - offsetParentRect.left : el.offsetLeft,
            y: offsetParentRect ? rect.top - offsetParentRect.top : el.offsetTop,
          };
          return { sliderX: offset.x, sliderY: offset.y, sliderWidth: rect.width, sliderHeight: rect.height };
        }
        return { sliderX: 0, sliderY: 0, sliderWidth: 0, sliderHeight: 0 };
      },
      getParentRect: () => {
        const parentObj = sliderEl.value && sliderEl.value.offsetParent;
        if (!parentObj) return undefined;
        return parentObj.getBoundingClientRect();
      },
      getScrollParentVal: () => {
        const scrollParent = foundation.getScrollParent(sliderEl.value);
        return { scrollTop: scrollParent.scrollTop, scrollLeft: scrollParent.scrollLeft };
      },
      isEventFromHandle: (e: any) => {
        const handles = [minHandleEl.value, maxHandleEl.value];
        let flag = false;
        handles.forEach((handleDom) => {
          if (handleDom && handleDom.contains(e.target)) flag = true;
        });
        return flag;
      },
      getOverallVars: () => ({ dragging }),
      updateDisabled: (disabled: boolean) => {
        state.disabled = disabled;
      },
      transNewPropsToState: (stateObj: any, callback: () => void = _noop) => {
        baseAdapter.setState(stateObj, callback);
      },
      notifyChange: (cbValue: SliderValue) => {
        const value = Array.isArray(cbValue) ? [...cbValue].sort((a, b) => a - b) : cbValue;
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value);
      },
      setDragging: (value: boolean[]) => {
        dragging = value;
      },
      updateCurrentValue: (value: SliderValue) => {
        if (value !== state.currentValue) {
          state.currentValue = value;
        }
      },
      setOverallVars: (key: string, value: any) => {
        if (key === 'dragging') dragging = value;
      },
      getMinHandleEl: () => minHandleEl.value,
      getMaxHandleEl: () => maxHandleEl.value,
      onHandleDown: (_e: any) => {
        handleDownEventListenerSet.add(addEventListener(document.body, 'mousemove', foundation.onHandleMove, false));
        handleDownEventListenerSet.add(addEventListener(window, 'mouseup', foundation.onHandleUp, false));
        handleDownEventListenerSet.add(addEventListener(document.body, 'touchmove', foundation.onHandleTouchMove, false));
      },
      onHandleMove: (mousePos: number, isMin: boolean, stateChangeCallback: () => void = _noop, clickTrack = false, outPutValue?: SliderValue) => {
        const sliderDOMIsInRenderTree = foundation.checkAndUpdateIsInRenderTreeState();
        if (!sliderDOMIsInRenderTree) return;
        const value = getValueProp();
        let finalOutPutValue = outPutValue;
        if (finalOutPutValue === undefined) {
          const moveValue = foundation.transPosToValue(mousePos, isMin);
          if (moveValue === false) return;
          finalOutPutValue = foundation.outPutValue(moveValue);
        }
        const { currentValue } = state;
        if (!_isEqual(foundation.outPutValue(currentValue), finalOutPutValue)) {
          if (!clickTrack && foundation.valueFormatIsCorrect(value)) {
            return false;
          }
          baseAdapter.setState({ currentValue: finalOutPutValue }, stateChangeCallback);
        }
        return undefined;
      },
      setEventDefault: (e: any) => {
        e.stopPropagation();
        e.preventDefault();
      },
      setStateVal: (name: string, val: any) => {
        (state as any)[name] = val;
      },
      checkAndUpdateIsInRenderTreeState: () => {
        const sliderDOMIsInRenderTree = domIsInRenderTree(sliderEl.value);
        if (sliderDOMIsInRenderTree !== state.isInRenderTree) {
          state.isInRenderTree = sliderDOMIsInRenderTree;
        }
        return sliderDOMIsInRenderTree;
      },
      onHandleEnter: (pos: 'min' | 'max' | '') => {
        state.focusPos = pos;
      },
      onHandleLeave: () => {
        state.focusPos = '';
      },
      onHandleUpBefore: (e: any) => {
        emit('mouseup', e);
        e.stopPropagation();
        e.preventDefault();
        Array.from(handleDownEventListenerSet).forEach((clear) => clear());
        handleDownEventListenerSet.clear();
      },
      onHandleUpAfter: () => {
        const value = foundation.outPutValue(state.currentValue);
        emit('afterChange', value);
      },
      unSubscribeEventListener: () => {
        Array.from(eventListenerSet).forEach((clear) => clear());
      },
    };

    const foundation = new (SliderFoundation as any)(adapter);

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => props.disabled,
      (disabled) => foundation.handleDisabledChange(disabled)
    );
    watch(
      () => getValueProp(),
      (value, prev) => {
        if (!_isEqual(value, prev)) {
          const prevValue = state.currentValue;
          foundation.handleValueChange(prevValue, value);
          emit('afterChange', value);
        }
      },
      { deep: true }
    );
    watch(
      () => [props.min, props.max],
      ([min, max]) => {
        state.min = min || 0;
        state.max = max || 0;
      }
    );

    const getAriaValueText = (value: number, index?: number) => {
      const { getAriaValueText } = props;
      return getAriaValueText ? getAriaValueText(value, index) : value;
    };

    const renderHandleDot = (dot: HandleDot | undefined) => {
      if (!dot) return null;
      return h('div', {
        class: cssClasses.HANDLE_DOT,
        style: {
          ...(dot.size ? { width: dot.size, height: dot.size } : {}),
          ...(dot.color ? { backgroundColor: dot.color } : {}),
        },
      });
    };

    const renderHandle = () => {
      const { vertical, range, tooltipVisible, tipFormatter, getAriaValueText: _g, disabled } = props;
      const ariaLabel = props.ariaLabel ?? (attrs as any)['aria-label'];
      const ariaLabelledby = props.ariaLabelledby ?? (attrs as any)['aria-labelledby'];
      const ariaValueText = props.ariaValuetext ?? (attrs as any)['aria-valuetext'];
      const { chooseMovePos, isDrag, isInRenderTree, firstDotFocusVisible, secondDotFocusVisible } = state;
      const direction = context.direction;
      const isRTL = direction === 'rtl' && !vertical;
      const stylePos = vertical ? 'top' : isRTL ? 'right' : 'left';
      const percentInfo = foundation.getMinAndMaxPercent(state.currentValue);
      const minPercent = percentInfo.min;
      const maxPercent = percentInfo.max;
      const { tipVisible, tipChildren } = foundation.computeHandleVisibleVal(tooltipVisible && isInRenderTree, tipFormatter, range);
      const minClass = cls(cssClasses.HANDLE, { [`${cssClasses.HANDLE}-clicked`]: chooseMovePos === 'min' && isDrag });
      const maxClass = cls(cssClasses.HANDLE, { [`${cssClasses.HANDLE}-clicked`]: chooseMovePos === 'max' && isDrag });
      const { min, max, currentValue } = state;
      const commonAria: Record<string, any> = {
        'aria-label': ariaLabel ?? (disabled ? 'Disabled Slider' : undefined),
        'aria-labelledby': ariaLabelledby,
        'aria-disabled': disabled,
      };
      if (vertical) commonAria['aria-orientation'] = 'vertical';
      const handleDot = props.handleDot as any;
      const tabindex = disabled ? -1 : 0;

      const handleEvents = (pos: 'min' | 'max') => ({
        onMousedown: (e: MouseEvent) => foundation.onHandleDown(e, pos),
        onMouseenter: () => foundation.onHandleEnter(pos),
        onTouchstart: (e: TouchEvent) => foundation.onHandleTouchStart(e, pos),
        onMouseleave: () => foundation.onHandleLeave(),
        onKeyup: (e: KeyboardEvent) => foundation.onHandleUp(e),
        onTouchend: (e: TouchEvent) => foundation.onHandleUp(e),
        onKeydown: (e: KeyboardEvent) => foundation.handleKeyDown(e, pos),
        onFocus: (e: FocusEvent) => foundation.onFocus(e, pos),
        onBlur: (e: FocusEvent) => foundation.onBlur(e, pos),
      });

      if (!range) {
        return h(
          Tooltip,
          {
            content: tipChildren.min,
            showArrow: props.showArrow,
            position: 'top',
            trigger: 'custom',
            rePosKey: minPercent,
            visible: isInRenderTree && (tipVisible.min || firstDotFocusVisible),
            className: `${cssClasses.HANDLE}-tooltip`,
          },
          {
            default: () =>
              h(
                'span',
                {
                  onMouseover: foundation.checkAndUpdateIsInRenderTreeState,
                  ref: minHandleEl,
                  class: minClass,
                  style: { [stylePos]: `${minPercent * 100}%`, zIndex: chooseMovePos === 'min' && isDrag ? 2 : 1 },
                  ...handleEvents('min'),
                  role: 'slider',
                  'aria-valuetext': props.getAriaValueText ? props.getAriaValueText(currentValue as number, 0) : ariaValueText,
                  tabindex,
                  ...commonAria,
                  'aria-valuenow': currentValue,
                  'aria-valuemax': max,
                  'aria-valuemin': min,
                },
                [handleDot ? renderHandleDot(handleDot) : null]
              ),
          }
        );
      }
      const cv = currentValue as number[];
      return h(Fragment, [
        h(
          Tooltip,
          {
            content: tipChildren.min,
            position: 'top',
            trigger: 'custom',
            rePosKey: minPercent,
            visible: isInRenderTree && (tipVisible.min || firstDotFocusVisible),
            className: `${cssClasses.HANDLE}-tooltip`,
          },
          {
            default: () =>
              h(
                'span',
                {
                  ref: minHandleEl,
                  class: minClass,
                  style: { [stylePos]: `${minPercent * 100}%`, zIndex: chooseMovePos === 'min' ? 2 : 1 },
                  ...handleEvents('min'),
                  role: 'slider',
                  tabindex,
                  ...commonAria,
                  'aria-valuetext': props.getAriaValueText ? props.getAriaValueText(cv[0], 0) : ariaValueText,
                  'aria-valuenow': cv[0],
                  'aria-valuemax': cv[1],
                  'aria-valuemin': min,
                },
                [handleDot?.[0] ? renderHandleDot(handleDot[0]) : null]
              ),
          }
        ),
        h(
          Tooltip,
          {
            content: tipChildren.max,
            position: 'top',
            trigger: 'custom',
            rePosKey: maxPercent,
            visible: isInRenderTree && (tipVisible.max || secondDotFocusVisible),
            className: `${cssClasses.HANDLE}-tooltip`,
          },
          {
            default: () =>
              h(
                'span',
                {
                  ref: maxHandleEl,
                  class: maxClass,
                  style: { [stylePos]: `${maxPercent * 100}%`, zIndex: chooseMovePos === 'max' ? 2 : 1 },
                  ...handleEvents('max'),
                  role: 'slider',
                  tabindex,
                  ...commonAria,
                  'aria-valuetext': props.getAriaValueText ? props.getAriaValueText(cv[1], 1) : ariaValueText,
                  'aria-valuenow': cv[1],
                  'aria-valuemax': max,
                  'aria-valuemin': cv[0],
                },
                [handleDot?.[1] ? renderHandleDot(handleDot[1]) : null]
              ),
          }
        ),
      ]);
    };

    const renderTrack = () => {
      const { range, included, vertical } = props;
      const direction = context.direction;
      const isRTL = direction === 'rtl' && !vertical;
      const percentInfo = foundation.getMinAndMaxPercent(state.currentValue);
      const minPercent = percentInfo.min;
      const maxPercent = percentInfo.max;
      let trackStyle: Record<string, any>;
      if (!vertical) {
        if (isRTL) {
          trackStyle = {
            width: range ? `${Math.abs(maxPercent - minPercent) * 100}%` : `${minPercent * 100}%`,
            right: range ? `${Math.min(minPercent, maxPercent) * 100}%` : 0,
          };
        } else {
          trackStyle = {
            width: range ? `${Math.abs(maxPercent - minPercent) * 100}%` : `${minPercent * 100}%`,
            left: range ? `${Math.min(minPercent, maxPercent) * 100}%` : 0,
          };
        }
      } else {
        trackStyle = {
          height: range ? `${Math.abs(maxPercent - minPercent) * 100}%` : `${minPercent * 100}%`,
          top: range ? `${Math.min(minPercent, maxPercent) * 100}%` : 0,
        };
      }
      trackStyle = included ? trackStyle : {};
      return h('div', { class: cssClasses.TRACK, style: trackStyle, onClick: foundation.handleWrapClick });
    };

    const renderStepDot = () => {
      const { min, max, vertical, marks } = props;
      const direction = context.direction;
      const isRTL = direction === 'rtl' && !vertical;
      const stylePos = vertical ? 'top' : isRTL ? 'right' : 'left';
      if (!(marks && Object.keys(marks).length > 0)) return null;
      return h(
        'div',
        { class: cssClasses.DOTS },
        Object.keys(marks).map((mark) => {
          const activeResult = foundation.isMarkActive(Number(mark));
          const markClass = cls(`${prefixCls}-dot`, { [`${prefixCls}-dot-active`]: activeResult === 'active' });
          const markPercent = (Number(mark) - min) / (max - min);
          const dotDOM = h('span', {
            key: mark,
            onClick: foundation.handleWrapClick,
            class: markClass,
            style: { [stylePos]: `calc(${markPercent * 100}% - 2px)` },
          });
          if (!activeResult) return null;
          return props.tooltipOnMark ? h(Tooltip, { key: mark, content: (marks as any)[mark] }, { default: () => dotDOM }) : dotDOM;
        })
      );
    };

    const renderLabel = () => {
      if (!props.showMarkLabel) return null;
      const { min, max, vertical, marks, verticalReverse } = props;
      const direction = context.direction;
      const isRTL = direction === 'rtl' && !vertical;
      const stylePos = vertical ? 'top' : isRTL ? 'right' : 'left';
      if (!(marks && Object.keys(marks).length > 0)) return null;
      return h(
        'div',
        { class: cssClasses.MARKS + (vertical && verticalReverse ? '-reverse' : '') },
        Object.keys(marks).map((mark) => {
          const activeResult = foundation.isMarkActive(Number(mark));
          const markPercent = (Number(mark) - min) / (max - min);
          return activeResult
            ? h(
                'span',
                {
                  key: mark,
                  class: cls(`${prefixCls}-mark${vertical && verticalReverse ? '-reverse' : ''}`),
                  style: { [stylePos]: `${markPercent * 100}%` },
                  onClick: foundation.handleWrapClick,
                },
                (marks as any)[mark]
              )
            : null;
        })
      );
    };

    expose({ foundation, sliderEl, minHandleEl, maxHandleEl });

    return () => {
      const { disabled, currentValue, min, max } = state;
      const { vertical, verticalReverse, railStyle, range } = props;
      const { class: className, style, ...restAttrs } = attrs as any;
      const wrapperClass = cls(
        `${prefixCls}-wrapper`,
        {
          [`${prefixCls}-disabled`]: disabled,
          [`${cssClasses.VERTICAL}-wrapper`]: vertical,
          [`${prefixCls}-reverse`]: vertical && verticalReverse,
        },
        className
      );
      const boundaryClass = cls(`${prefixCls}-boundary`, {
        [`${prefixCls}-boundary-show`]: props.showBoundary && state.showBoundary,
      });
      const sliderCls = cls({ [`${prefixCls}`]: !vertical, [cssClasses.VERTICAL]: vertical });
      const fixedCurrentValue: any = Array.isArray(currentValue) ? [...currentValue].sort() : currentValue;
      const ariaLabel = range ? `Range: ${getAriaValueText(fixedCurrentValue[0], 0)} to ${getAriaValueText(fixedCurrentValue[1], 1)}` : undefined;
      const slider = h(
        'div',
        {
          class: wrapperClass,
          style,
          ref: sliderEl,
          'aria-label': ariaLabel,
          onMouseenter: () => foundation.handleWrapperEnter(),
          onMouseleave: () => foundation.handleWrapperLeave(),
          ...getDataAttr(restAttrs),
        },
        [
          h('div', { class: `${prefixCls}-rail`, onClick: foundation.handleWrapClick, style: railStyle }),
          renderTrack(),
          renderStepDot(),
          h('div', null, [renderHandle()]),
          renderLabel(),
          h('div', { class: boundaryClass }, [
            h('span', { class: `${prefixCls}-boundary-min` }, String(min)),
            h('span', { class: `${prefixCls}-boundary-max` }, String(max)),
          ]),
        ]
      );
      if (!vertical) {
        return h('div', { class: sliderCls }, [slider]);
      }
      return slider;
    };
  },
});
(Slider as any).elementType = 'Slider';

export default Slider;
