import { defineComponent, h, reactive, watchEffect, getCurrentInstance } from 'vue';
import type { PropType, CSSProperties, VNode, VNodeChild } from 'vue';
import classnames from 'classnames';
import { stepsClasses as css } from '@douyinfe/semi-foundation/lib/es/steps/constants';
import '@douyinfe/semi-foundation/lib/es/steps/steps.css';
import { flattenChildren, normalizeNode, getDataAttr, cloneVNode, isVNode } from '../_utils';
import { IconTickCircle, IconAlertCircle, IconAlertTriangle, IconChevronRight } from '../icons/generated';
import { Row, Col } from '../grid';
import { provideStepsContext, useStepsContext } from './context';
import type { StepsType } from './context';

export type StepStatus = 'wait' | 'process' | 'finish' | 'error' | 'warning';
export type StepsSize = 'default' | 'small';
export type StepsDirection = 'horizontal' | 'vertical';

export const stepSizeMapIconSize: Record<StepsSize, 'large' | 'extra-large'> = {
  small: 'large',
  default: 'extra-large',
};

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

/** props of Steps.Step (public part = React StepProps; the rest is injected by Steps) */
export const stepProps = {
  title: nodeProp,
  description: nodeProp,
  icon: { type: [Object, Function, String] as PropType<any>, default: undefined },
  status: { type: String as PropType<StepStatus>, default: undefined },
  prefixCls: { type: String, default: css.ITEM },
  // injected by the parent Steps
  active: { type: Boolean, default: undefined },
  done: { type: Boolean, default: undefined },
  stepNumber: { type: String, default: undefined },
  size: { type: String as PropType<StepsSize>, default: undefined },
  direction: { type: String as PropType<StepsDirection>, default: undefined },
  index: { type: Number, default: undefined },
  total: { type: Number, default: undefined },
  onChange: { type: Function as PropType<() => void>, default: undefined },
  role: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
};

/**
 * Steps.Step — renders as BasicStep / FillStep / NavStep depending on the parent `type`.
 */
export const Step = defineComponent({
  name: 'StepsStep',
  inheritAttrs: false,
  props: stepProps,
  emits: ['click', 'keydown'],
  setup(props, { slots, attrs, emit }) {
    const context = useStepsContext();
    const instance = getCurrentInstance();
    // listeners of declared emits are stripped from attrs; read the raw vnode props (React 'onClick in props')
    const hasClickListener = () => Boolean(instance?.vnode.props && (instance.vnode.props as any).onClick);

    const hasIcon = () => Boolean(slots.icon) || props.icon !== undefined;
    const iconNode = () => (slots.icon ? flattenChildren(slots.icon())[0] : normalizeNode(props.icon));
    const titleNode = () => (slots.title ? slots.title() : normalizeNode(props.title));
    const descriptionNode = () => (slots.description ? slots.description() : normalizeNode(props.description));
    const hasTitle = () => Boolean(slots.title) || (props.title !== undefined && props.title !== null && props.title !== '');
    const hasDescription = () => Boolean(slots.description) || (props.description !== undefined && props.description !== null && props.description !== '');
    const hasClickHandler = () => Boolean(props.onChange || hasClickListener());

    const handleClick = (e: MouseEvent) => {
      emit('click', e);
      props.onChange && props.onChange();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        emit('keydown', e);
        props.onChange && props.onChange();
      }
    };

    const commonAttrs = () => {
      const { class: _c, style: _s, onClick: _oc, onKeydown: _ok, ...rest } = attrs as any;
      return {
        ...rest,
        role: props.role ?? (attrs as any).role,
        'aria-label': props.ariaLabel ?? (attrs as any)['aria-label'],
        tabindex: 0,
        'aria-current': 'step',
        style: attrs.style,
        onClick: handleClick,
        onKeydown: handleKeyDown,
      };
    };

    const renderBasic = () => {
      const { prefixCls, size = 'default', status = 'wait', active = false, done = false, stepNumber } = props;
      const renderIcon = () => {
        let inner: VNodeChild = null;
        let progress = false;
        if (hasIcon()) {
          const node = iconNode();
          if (isVNode(node)) inner = node;
        } else if (status) {
          switch (status) {
            case 'error':
              inner = h(IconAlertCircle, { size: stepSizeMapIconSize[size] });
              break;
            case 'wait':
              inner = h('span', { class: `${prefixCls}-number-icon` }, stepNumber);
              break;
            case 'process':
              inner = h('span', { class: `${prefixCls}-number-icon` }, stepNumber);
              progress = true;
              break;
            case 'finish':
              inner = h(IconTickCircle, { size: stepSizeMapIconSize[size] });
              break;
            case 'warning':
              inner = h(IconAlertTriangle, { size: stepSizeMapIconSize[size] });
              break;
            default:
              inner = null;
          }
        }
        const cls = classnames({
          [`${prefixCls}-icon`]: true,
          [`${prefixCls}-custom-icon`]: hasIcon(),
          [`${prefixCls}-icon-process`]: progress,
        });
        return inner ? h('span', { class: cls }, [inner]) : null;
      };
      const clickable = hasClickHandler();
      const classString = classnames(
        prefixCls,
        `${prefixCls}-${status}`,
        {
          [`${prefixCls}-active`]: active,
          [`${prefixCls}-done`]: done,
          [`${prefixCls}-hover`]: clickable,
          [`${prefixCls}-clickable`]: clickable,
          [`${prefixCls}-${status}-hover`]: clickable,
        },
        attrs.class as any
      );
      const titleTextClass = classnames(`${prefixCls}-title-text`, { [`${prefixCls}-title-text-empty`]: !hasTitle() });
      return h('div', { ...commonAttrs(), class: classString }, [
        h('div', { class: `${prefixCls}-container` }, [
          h('div', { class: `${prefixCls}-left` }, [renderIcon()]),
          h('div', { class: `${prefixCls}-content` }, [
            h('div', { class: `${prefixCls}-title` }, [h('div', { class: titleTextClass }, [titleNode()])]),
            hasDescription() ? h('div', { class: `${prefixCls}-description` }, [descriptionNode()]) : null,
          ]),
        ]),
      ]);
    };

    const renderFill = () => {
      const { prefixCls, status = 'wait', stepNumber } = props;
      const clickable = hasClickHandler();
      const renderIcon = () => {
        let inner: VNodeChild = null;
        let progress = false;
        if (hasIcon()) {
          inner = iconNode();
        } else if (status) {
          switch (status) {
            case 'error':
              inner = h(IconAlertCircle, { size: 'extra-large' });
              break;
            case 'wait':
              inner = stepNumber;
              break;
            case 'process':
              inner = stepNumber;
              progress = true;
              break;
            case 'finish':
              inner = h(IconTickCircle, { size: 'extra-large' });
              break;
            case 'warning':
              inner = h(IconAlertTriangle, { size: 'extra-large' });
              break;
            default:
              inner = null;
          }
        }
        const cls = classnames({
          [`${prefixCls}-left`]: true,
          [`${prefixCls}-icon`]: hasIcon(),
          [`${prefixCls}-plain`]: !hasIcon(),
          [`${prefixCls}-icon-process`]: progress,
          [`${prefixCls}-hover`]: clickable,
        });
        return inner ? h('div', { class: cls }, [inner]) : null;
      };
      const title = props.title;
      const description = props.description;
      return h(
        'div',
        {
          ...commonAttrs(),
          class: classnames(
            {
              [prefixCls]: true,
              [`${prefixCls}-${status}`]: Boolean(status),
              [`${prefixCls}-${status}-hover`]: Boolean(status) && clickable,
              [`${prefixCls}-${status}-active`]: Boolean(status) && clickable,
              [`${prefixCls}-clickable`]: clickable,
            },
            attrs.class as any
          ),
        },
        [
          renderIcon(),
          h('div', { class: `${prefixCls}-content` }, [
            h('div', { class: `${prefixCls}-title`, title: typeof title === 'string' ? title : null }, [h('span', { class: `${prefixCls}-title-text` }, [titleNode()])]),
            h('div', { class: `${prefixCls}-description`, title: typeof description === 'string' ? description : null }, [descriptionNode()]),
          ]),
        ]
      );
    };

    const renderNav = () => {
      const { prefixCls, active = false, index, total } = props;
      const classString = classnames(prefixCls, { [`${prefixCls}-active`]: active }, attrs.class as any);
      return h('div', { ...commonAttrs(), class: classString }, [
        h('div', { class: `${prefixCls}-container` }, [
          h('div', { class: `${prefixCls}-content` }, [h('div', { class: `${prefixCls}-title` }, [titleNode()])]),
          index !== (total as number) - 1 ? h('div', { class: `${prefixCls}-icon` }, [h(IconChevronRight, { size: 'small' })]) : null,
        ]),
      ]);
    };

    return () => {
      const type = context?.type;
      switch (type) {
        case 'fill':
          return renderFill();
        case 'basic':
          return renderBasic();
        case 'nav':
          return renderNav();
        default:
          return null;
      }
    };
  },
});
(Step as any).elementType = 'Steps.Step';

export const stepsProps = {
  type: { type: String as PropType<StepsType>, default: 'fill' },
  size: { type: String as PropType<StepsSize>, default: 'default' },
  current: { type: Number, default: 0 },
  initial: { type: Number, default: 0 },
  status: { type: String as PropType<StepStatus>, default: 'process' },
  direction: { type: String as PropType<StepsDirection>, default: 'horizontal' },
  hasLine: { type: Boolean, default: true },
  prefixCls: { type: String, default: css.PREFIX },
  ariaLabel: { type: String, default: undefined },
};

export const stepsEmits = ['change', 'update:current'];

const Steps = defineComponent({
  name: 'Steps',
  inheritAttrs: false,
  props: stepsProps,
  emits: stepsEmits,
  setup(props, { slots, attrs, emit }) {
    const context = reactive({ type: props.type });
    watchEffect(() => {
      context.type = props.type;
    });
    provideStepsContext(context);

    const instance = getCurrentInstance();
    // React: steps are clickable only when an onChange handler is passed (listener lives on the raw vnode props)
    const hasChange = () => {
      const raw: any = (instance && instance.vnode.props) || {};
      return Boolean(raw.onChange || raw['onUpdate:current']);
    };
    const notifyChange = (index: number) => {
      emit('change', index);
      emit('update:current', index);
    };

    const getChildren = (): VNode[] => flattenChildren(slots.default?.()).filter((c) => isVNode(c) && typeof c.type !== 'symbol');

    const renderFill = () => {
      const { current, status, prefixCls, initial, direction } = props;
      const children = getChildren();
      const colStyle: CSSProperties | null = direction === 'vertical' ? null : { width: `${100 / children.length}%` };
      const inner = children.map((child, index) => {
        const stepNumber = initial + index;
        const childProps: Record<string, any> = { stepNumber: `${stepNumber + 1}`, direction };
        const cp: any = child.props || {};
        if (status === 'error' && index === current - 1) {
          childProps.class = `${prefixCls}-next-error`;
        }
        if (!cp.status) {
          if (stepNumber === current) childProps.status = status;
          else if (stepNumber < current) childProps.status = 'finish';
          else childProps.status = 'wait';
        }
        childProps.onChange = hasChange()
          ? () => {
              if (index !== current) notifyChange(index + initial);
            }
          : undefined;
        return h(Col, { style: colStyle as any }, { default: () => [cloneVNode(child, childProps, true)] });
      });
      const { class: className, style, ...rest } = attrs as any;
      const wrapperCls = classnames(className, { [prefixCls]: true, [`${prefixCls}-${direction}`]: true });
      return h('div', { class: wrapperCls, style, 'aria-label': props.ariaLabel ?? rest['aria-label'], ...getDataAttr(rest) }, [
        h(Row, { type: 'flex', justify: 'start' }, { default: () => inner }),
      ]);
    };

    const renderBasic = () => {
      const { size, current, status, prefixCls, initial, direction, hasLine } = props;
      const children = getChildren();
      const inner = children.map((child, index) => {
        const stepNumber = initial + index;
        const childProps: Record<string, any> = { stepNumber: `${stepNumber + 1}`, size };
        const cp: any = child.props || {};
        if (status === 'error' && index === current - 1) {
          childProps.class = `${prefixCls}-next-error`;
        }
        if (!cp.status) {
          if (stepNumber === current) childProps.status = status;
          else if (stepNumber < current) childProps.status = 'finish';
          else childProps.status = 'wait';
        }
        childProps.active = stepNumber === current;
        childProps.done = stepNumber < current;
        childProps.onChange = hasChange()
          ? () => {
              if (index !== current) notifyChange(index + initial);
            }
          : undefined;
        return cloneVNode(child, childProps, true);
      });
      const { class: className, style, ...rest } = attrs as any;
      const wrapperCls = classnames(className, {
        [`${prefixCls}-basic`]: true,
        [`${prefixCls}-${direction}`]: true,
        [`${prefixCls}-${size}`]: size !== 'default',
        [`${prefixCls}-hasline`]: hasLine,
      });
      return h('div', { 'aria-label': props.ariaLabel ?? rest['aria-label'], class: wrapperCls, style, ...getDataAttr(rest) }, inner);
    };

    const renderNav = () => {
      const { size, current, initial, prefixCls } = props;
      const children = getChildren();
      const total = children.length;
      const inner = children.map((child, index) => {
        const childProps: Record<string, any> = { index, total };
        childProps.active = index === current;
        childProps.onChange = hasChange()
          ? () => {
              if (index !== current) notifyChange(index + initial);
            }
          : undefined;
        return cloneVNode(child, childProps, true);
      });
      const { class: className, style, ...rest } = attrs as any;
      const wrapperCls = classnames(className, { [`${prefixCls}-nav`]: true, [`${prefixCls}-${size}`]: size !== 'default' });
      return h('div', { 'aria-label': props.ariaLabel ?? rest['aria-label'], class: wrapperCls, style, ...getDataAttr(rest) }, inner);
    };

    return () => {
      switch (props.type) {
        case 'fill':
          return renderFill();
        case 'basic':
          return renderBasic();
        case 'nav':
          return renderNav();
        default:
          return null;
      }
    };
  },
}) as any;
Steps.Step = Step;
Steps.elementType = 'Steps';

export default Steps as typeof Steps & { Step: typeof Step };
