import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/rating/constants';
import RatingFoundation, { RatingItemFoundation } from '@douyinfe/semi-foundation/lib/es/rating/foundation';
import '@douyinfe/semi-foundation/lib/es/rating/rating.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { getDataAttr, normalizeNode, cloneVNode, isVNode } from '../_utils';
import Tooltip from '../tooltip/Tooltip';
import { IconStar } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;

export type RatingSize = (typeof strings.SIZE_SET)[number] | number;

export const ratingItemProps = {
  index: { type: Number, required: true },
  count: { type: Number, required: true },
  prefixCls: { type: String, default: `${prefixCls}-star` },
  allowHalf: { type: Boolean, default: false },
  value: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  character: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  focused: { type: Boolean, default: false },
  size: { type: [String, Number] as PropType<RatingSize>, default: 'default' },
  ariaLabelPrefix: { type: String, default: 'star' },
  preventScroll: { type: Boolean, default: false },
  ariaDescribedby: { type: String, default: undefined },
  renderCharacter: { type: Function as PropType<() => VNodeChild>, default: undefined },
  onHover: { type: Function as PropType<(e: MouseEvent, index: number) => void>, default: undefined },
  onClick: { type: Function as PropType<(e: Event, index: number) => void>, default: undefined },
  onFocus: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
  onBlur: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
};

/** one star (React rating/item.js) */
export const RatingItem = defineComponent({
  name: 'RatingItem',
  inheritAttrs: false,
  props: ratingItemProps,
  setup(props, { expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { firstStarFocus: false, secondStarFocus: false });
    const adapter = {
      ...baseAdapter,
      setFirstStarFocus: (value: boolean) => {
        state.firstStarFocus = value;
      },
      setSecondStarFocus: (value: boolean) => {
        state.secondStarFocus = value;
      },
    };
    const foundation = new (RatingItemFoundation as any)(adapter);
    const liRef = ref<HTMLElement | null>(null);
    const firstStar = ref<HTMLElement | null>(null);
    const secondStar = ref<HTMLElement | null>(null);

    const onHover = (e: MouseEvent) => props.onHover && props.onHover(e, props.index);
    const onClick = (e: Event) => props.onClick && props.onClick(e, props.index);
    const onFocus = (e: FocusEvent, star: 'first' | 'second') => {
      props.onFocus && props.onFocus(e);
      foundation.handleFocusVisible(e, star);
    };
    const onBlur = (e: FocusEvent, star: 'first' | 'second') => {
      props.onBlur && props.onBlur(e);
      foundation.handleBlur(e, star);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 13 || e.key === 'Enter') {
        props.onClick && props.onClick(e, props.index);
      }
    };
    const starFocus = () => {
      const { value, index, preventScroll } = props;
      if (value - index === 0.5) {
        firstStar.value?.focus({ preventScroll });
      } else {
        secondStar.value?.focus({ preventScroll });
      }
    };
    const focusStar = (star: 'first' | 'second') => {
      (star === 'first' ? firstStar.value : secondStar.value)?.focus({ preventScroll: props.preventScroll });
    };

    expose({ getDomNode: () => liRef.value, starFocus, focusStar, liRef });

    return () => {
      const { index, prefixCls: itemPrefix, count, value, disabled, allowHalf, size, ariaLabelPrefix } = props;
      const { firstStarFocus, secondStarFocus } = state;
      const starValue = index + 1;
      const diff = starValue - value;
      const isHalf = allowHalf && diff < 1 && diff > 0;
      const firstWidth = 1 - diff;
      const isFull = starValue <= value;
      const isCustomSize = typeof size === 'number';
      const starCls = cls(itemPrefix, {
        [`${itemPrefix}-half`]: isHalf,
        [`${itemPrefix}-full`]: isFull,
        [`${itemPrefix}-${size}`]: !isCustomSize,
      });
      const sizeStyle: CSSProperties = isCustomSize ? { width: `${size}px`, height: `${size}px`, fontSize: `${size}px` } : {};
      const iconSize = isCustomSize ? 'inherit' : size === 'small' ? 'default' : 'extra-large';
      const makeContent = () => {
        if (props.renderCharacter) return props.renderCharacter();
        const c = normalizeNode(props.character);
        if (c === null || c === undefined || c === '' || c === false) return h(IconStar, { size: iconSize, style: { display: 'block' } });
        return isVNode(c) ? cloneVNode(c) : c;
      };
      const isEmpty = index === count;
      const starWrapCls = cls(`${itemPrefix}-wrapper`, {
        [`${itemPrefix}-disabled`]: disabled,
        [`${prefixCls}-focus`]: (firstStarFocus || secondStarFocus) && value !== 0,
      });
      const starWrapProps: Record<string, any> = {
        onClick: disabled ? undefined : onClick,
        onKeydown: disabled ? undefined : onKeyDown,
        onMousemove: disabled ? undefined : onHover,
        class: starWrapCls,
      };
      const ariaSetSize = allowHalf ? count * 2 + 1 : count + 1;
      const firstStarProps: Record<string, any> = {
        ref: firstStar,
        role: 'radio',
        'aria-checked': value === index + 0.5,
        'aria-posinset': 2 * index + 1,
        'aria-setsize': ariaSetSize,
        'aria-disabled': disabled,
        'aria-label': `${index + 0.5} ${ariaLabelPrefix}s`,
        'aria-labelledby': props.ariaDescribedby,
        'aria-describedby': props.ariaDescribedby,
        class: cls(`${itemPrefix}-first`, `${prefixCls}-no-focus`),
        tabindex: !disabled && value === index + 0.5 ? 0 : -1,
        onFocus: (e: FocusEvent) => onFocus(e, 'first'),
        onBlur: (e: FocusEvent) => onBlur(e, 'first'),
        style: { width: `${firstWidth * 100}%` },
      };
      const secondStarTabIndex = !disabled && (value === index + 1 || (isEmpty && value === 0)) ? 0 : -1;
      const secondStarProps: Record<string, any> = {
        ref: secondStar,
        role: 'radio',
        'aria-checked': isEmpty ? value === 0 : value === index + 1,
        'aria-posinset': allowHalf ? 2 * (index + 1) : index + 1,
        'aria-setsize': ariaSetSize,
        'aria-disabled': disabled,
        'aria-label': `${isEmpty ? 0 : index + 1} ${ariaLabelPrefix}${index === 0 ? '' : 's'}`,
        'aria-labelledby': props.ariaDescribedby,
        'aria-describedby': props.ariaDescribedby,
        class: cls(`${itemPrefix}-second`, `${prefixCls}-no-focus`),
        tabindex: secondStarTabIndex,
        onFocus: (e: FocusEvent) => onFocus(e, 'second'),
        onBlur: (e: FocusEvent) => onBlur(e, 'second'),
        'x-semi-prop': 'character',
      };
      return h('li', { class: starCls, style: sizeStyle, key: index, ref: liRef }, [
        h('div', starWrapProps, [allowHalf && !isEmpty ? h('div', firstStarProps, [makeContent()]) : null, h('div', secondStarProps, [makeContent()])]),
      ]);
    };
  },
});

export const ratingProps = {
  value: { type: Number, default: undefined },
  modelValue: { type: Number, default: undefined },
  defaultValue: { type: Number, default: 0 },
  count: { type: Number, default: 5 },
  allowHalf: { type: Boolean, default: false },
  allowClear: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  prefixCls: { type: String, default: prefixCls },
  character: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  tabIndex: { type: Number, default: -1 },
  autoFocus: { type: Boolean, default: false },
  size: { type: [String, Number] as PropType<RatingSize>, default: 'default' },
  tooltips: { type: Array as PropType<string[]>, default: undefined },
  id: { type: String, default: undefined },
  preventScroll: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  ariaLabelledby: { type: String, default: undefined },
  ariaDescribedby: { type: String, default: undefined },
  ariaErrormessage: { type: String, default: undefined },
  ariaInvalid: { type: Boolean, default: undefined },
  ariaRequired: { type: Boolean, default: undefined },
};

export const ratingEmits = ['update:modelValue', 'update:value', 'change', 'hoverChange', 'focus', 'blur', 'keydown'];

interface RatingState {
  value: number;
  focused: boolean;
  hoverValue: number | undefined;
  clearedValue: number | null;
  emptyStarFocusVisible: boolean;
}

const Rating = defineComponent({
  name: 'Rating',
  inheritAttrs: false,
  props: ratingProps,
  emits: ratingEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const configContext = useConfigContext();
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, RatingState>(
      props as any,
      { value: 0, focused: false, hoverValue: undefined, clearedValue: null, emptyStarFocusVisible: false },
      { modelProp: 'value', contexts: () => ({ direction: configContext.direction }) }
    );
    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);
    state.value = getValueProp() === undefined ? props.defaultValue : getValueProp();

    const rateRef = ref<HTMLElement | null>(null);
    const stars: Record<number, any> = {};

    const adapter = {
      ...baseAdapter,
      focus: () => {
        const { disabled, count } = props;
        const { value } = state;
        if (!disabled) {
          const index = Math.ceil(value) - 1;
          stars[index < 0 ? count : index]?.starFocus();
        }
      },
      getStarDOM: (index: number) => stars[index]?.getDomNode(),
      notifyHoverChange: (hoverValue: number | undefined, clearedValue: number | null) => {
        state.hoverValue = hoverValue;
        state.clearedValue = clearedValue;
        emit('hoverChange', hoverValue);
      },
      updateValue: (value: number) => {
        if (!('value' in propsView)) {
          state.value = value;
        }
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value);
      },
      clearValue: (clearedValue: number | null) => {
        state.clearedValue = clearedValue;
      },
      notifyFocus: (e: FocusEvent) => {
        state.focused = true;
        emit('focus', e);
      },
      notifyBlur: (e: FocusEvent) => {
        state.focused = false;
        emit('blur', e);
      },
      notifyKeyDown: (e: KeyboardEvent) => {
        state.focused = false;
        emit('keydown', e);
      },
      setEmptyStarFocusVisible: (focusVisible: boolean) => {
        state.emptyStarFocusVisible = focusVisible;
      },
    };
    const foundation = new (RatingFoundation as any)(adapter);
    // React walks event.currentTarget.childNodes; Vue may insert teleport placeholders, so focus through item refs instead.
    foundation.changeFocusStar = (value: number) => {
      const { count, allowHalf } = props;
      const index = Math.ceil(value) - 1;
      if (index < 0) {
        stars[count]?.focusStar('second');
      } else {
        stars[index]?.focusStar(allowHalf ? ((value * 10) % 10 === 5 ? 'first' : 'second') : 'second');
      }
    };

    // getDerivedStateFromProps
    watch(
      () => [getValueProp(), (props as any).modelValue],
      () => {
        const v = getValueProp();
        if ('value' in propsView && v !== undefined) state.value = v;
      }
    );

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    const onHover = (event: MouseEvent, index: number) => foundation.handleHover(event, index);
    const onMouseLeave = () => foundation.handleMouseLeave();
    const onClick = (event: Event, index: number) => foundation.handleClick(event, index);
    const onFocus = (e: FocusEvent) => foundation.handleFocus(e);
    const onBlur = (e: FocusEvent) => foundation.handleBlur(e);
    const onKeyDown = (event: KeyboardEvent) => foundation.handleKeyDown(event, state.value);
    const handleStarFocusVisible = (event: FocusEvent) => foundation.handleStarFocusVisible(event);
    const handleStarBlur = (event: FocusEvent) => foundation.handleStarBlur(event);

    const focus = () => {
      const { disabled, preventScroll } = props;
      if (!disabled) rateRef.value?.focus({ preventScroll });
    };
    const blur = () => {
      if (!props.disabled) rateRef.value?.blur();
    };
    expose({ focus, blur, foundation, getValue: () => state.value });

    // React spelling (`aria-label="..."`) is accepted through attrs as a fallback to the camelCase props
    const aria = (name: string) => {
      const propVal = (props as any)[name];
      if (propVal !== undefined) return propVal;
      const kebab = 'aria-' + name.slice(4).toLowerCase();
      return (attrs as any)[kebab];
    };

    const ariaLabelPrefix = computed(() => {
      const label = aria('ariaLabel');
      if (label) return label;
      if (typeof props.character === 'string') return props.character;
      return 'star';
    });

    const getItemList = (prefix: string) => {
      const { count, allowHalf, prefixCls: pc, disabled, character, size, tooltips, preventScroll } = props;
      const { value, hoverValue, focused } = state;
      const renderCharacter = slots.character ? () => slots.character!() : undefined;
      return [...Array(count + 1).keys()].map((ind) => {
        const content = h(RatingItem, {
          ref: (inst: any) => {
            if (inst) stars[ind] = inst;
            else delete stars[ind];
          },
          index: ind,
          count,
          prefixCls: `${pc}-star`,
          allowHalf,
          value: hoverValue === undefined ? value : hoverValue,
          onClick: disabled ? undefined : onClick,
          onHover: disabled ? undefined : onHover,
          key: ind,
          disabled,
          character,
          renderCharacter,
          focused,
          size: ind === count ? 0 : size,
          ariaLabelPrefix: prefix,
          ariaDescribedby: aria('ariaDescribedby'),
          preventScroll,
          onFocus: disabled || count !== ind ? undefined : handleStarFocusVisible,
          onBlur: disabled || count !== ind ? undefined : handleStarBlur,
        });
        if (tooltips) {
          const text = tooltips[ind] ? tooltips[ind] : '';
          const showTips = (hoverValue as number) - 1 === ind;
          return h(Tooltip, { visible: showTips, trigger: 'custom', content: text, key: `${ind}-${showTips}` }, { default: () => h('span', { class: `${pc}-star-outer` }, [content]) });
        }
        return content;
      });
    };

    return () => {
      const { prefixCls: pc, disabled, id, count, tabIndex } = props;
      const { value, emptyStarFocusVisible } = state;
      const prefix = ariaLabelPrefix.value;
      const ariaLabel = `Rating: ${value} of ${count} ${prefix}${value === 1 ? '' : 's'},`;
      const itemList = getItemList(prefix);
      const { class: className, style, ...rest } = attrs as any;
      const listCls = cls(pc, { [`${pc}-disabled`]: disabled, [`${pc}-focus`]: emptyStarFocusVisible }, className);
      return h(
        'ul',
        {
          'aria-label': ariaLabel,
          'aria-labelledby': aria('ariaLabelledby'),
          'aria-describedby': aria('ariaDescribedby'),
          'aria-errormessage': aria('ariaErrormessage'),
          'aria-invalid': aria('ariaInvalid'),
          'aria-required': aria('ariaRequired'),
          class: listCls,
          style,
          onMouseleave: disabled ? undefined : onMouseLeave,
          tabindex: disabled ? -1 : tabIndex,
          // React onFocus/onBlur bubble (focusin/focusout); capture listeners give the same reach for dispatched focus events
          onFocusCapture: disabled ? undefined : onFocus,
          onBlurCapture: disabled ? undefined : onBlur,
          onKeydown: disabled ? undefined : onKeyDown,
          ref: rateRef,
          id,
          ...getDataAttr(rest),
        },
        itemList
      );
    };
  },
});
(Rating as any).elementType = 'Rating';

export default Rating;
