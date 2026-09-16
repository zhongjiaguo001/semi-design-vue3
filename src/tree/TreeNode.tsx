import { defineComponent, h, ref, isVNode, cloneVNode } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import _isEmpty from 'lodash/isEmpty';
import _get from 'lodash/get';
import _isString from 'lodash/isString';
import _isFunction from 'lodash/isFunction';
import _debounce from 'lodash/debounce';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/tree/constants';
import isEnterPress from '@douyinfe/semi-foundation/lib/es/utils/isEnterPress';
import { IconTreeTriangleDown, IconFile, IconFolder, IconFolderOpen } from '../icons/generated';
import Checkbox from '../checkbox/Checkbox';
import Spin from '../spin/Spin';
import { normalizeNode } from '../_utils';
import { useTreeContext } from './treeContext';
import { renderIndent, renderHighlight } from './treeUtil';

const prefixcls = cssClasses.PREFIX_OPTION;

export const treeNodeProps = {
  eventKey: { type: String, default: undefined },
  expanded: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  checked: { type: Boolean, default: false },
  halfChecked: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: undefined },
  loaded: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  isLeaf: { type: Boolean, default: undefined },
  pos: { type: String, default: undefined },
  children: { type: [Array, Object] as PropType<any>, default: undefined },
  icon: { type: [String, Object, Function] as PropType<any>, default: undefined },
  directory: { type: Boolean, default: false },
  keyword: { type: String, default: undefined },
  treeNodeFilterProp: { type: String, default: undefined },
  selectedKey: { type: String, default: '' },
  motionKey: { type: [String, Array] as PropType<string | string[]>, default: '' },
  isEnd: { type: Array as PropType<boolean[]>, default: () => [] },
  showLine: { type: Boolean, default: false },
  expandIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  level: { type: Number, default: 0 },
  empty: { type: Boolean, default: false },
  emptyContent: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  filtered: { type: Boolean, default: false },
  label: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  data: { type: Object as PropType<any>, default: undefined },
  style: { type: Object as PropType<any>, default: undefined },
  value: { type: [String, Number, Object, Boolean] as PropType<any>, default: undefined },
  display: { type: null as unknown as PropType<any>, default: undefined },
};

const TreeNode = defineComponent({
  name: 'TreeNode',
  inheritAttrs: false,
  props: treeNodeProps,
  setup(props, { attrs }) {
    const context = useTreeContext();
    const refNode = ref<HTMLElement | null>(null);

    /** the props object handed to the foundation (React passes `this.props`) */
    const nodeProps = () => ({ ...attrs, ...props, nodeInstance: refNode.value });

    const getNodeChildren = () => props.children || [];
    const isLeaf = () => {
      const { isLeaf, loaded } = props;
      const { loadData } = context;
      const hasChildren = getNodeChildren().length !== 0;
      if (isLeaf === false) return false;
      return Boolean(isLeaf || (!loadData && !hasChildren) || (loadData && loaded && !hasChildren));
    };
    const isDisabled = () => {
      const { disabled } = props;
      const { treeDisabled } = context;
      if (disabled === false) return false;
      return Boolean(treeDisabled || disabled);
    };

    const onSelect = (e: any) => {
      context.onNodeSelect?.(e, nodeProps());
    };
    const onExpand = (e: any) => {
      e && e.stopPropagation();
      e && typeof e.stopImmediatePropagation === 'function' && e.stopImmediatePropagation();
      context.onNodeExpand?.(e, nodeProps());
    };
    const onCheck = (e: any) => {
      if (isDisabled()) return;
      e.stopPropagation();
      typeof e.stopImmediatePropagation === 'function' && e.stopImmediatePropagation();
      context.onNodeCheck?.(e, nodeProps());
    };
    const handleCheckEnterPress = (e: KeyboardEvent) => {
      if (isEnterPress(e)) onCheck(e);
    };
    const onContextMenu = (e: MouseEvent) => {
      context.onNodeRightClick?.(e, nodeProps());
    };
    const debounceSelect = _debounce(onSelect, 500, { leading: true, trailing: false });
    const onClick = (e: any) => {
      const { expandAction } = context;
      if (expandAction === 'doubleClick') {
        debounceSelect(e);
        return;
      }
      onSelect(e);
      if (expandAction === 'click') onExpand(e);
    };
    const handleliEnterPress = (e: KeyboardEvent) => {
      if (isEnterPress(e)) onClick(e);
    };
    const onDoubleClick = (e: any) => {
      const { expandAction, onNodeDoubleClick } = context;
      e.stopPropagation();
      typeof e.stopImmediatePropagation === 'function' && e.stopImmediatePropagation();
      if (_isFunction(onNodeDoubleClick)) onNodeDoubleClick(e, nodeProps());
      if (expandAction === 'doubleClick') onExpand(e);
    };
    const onDragStart = (e: DragEvent) => {
      e.stopPropagation();
      context.onNodeDragStart?.(e, nodeProps());
      try {
        e.dataTransfer?.setData('text/plain', '');
      } catch (error) {
        /* empty */
      }
    };
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      context.onNodeDragEnter?.(e, nodeProps());
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      context.onNodeDragOver?.(e, nodeProps());
    };
    const onDragLeave = (e: DragEvent) => {
      e.stopPropagation();
      context.onNodeDragLeave?.(e, nodeProps());
    };
    const onDragEnd = (e: DragEvent) => {
      e.stopPropagation();
      context.onNodeDragEnd?.(e, nodeProps());
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      context.onNodeDrop?.(e, nodeProps());
    };

    const renderSwitcher = () => {
      if (isLeaf()) {
        return h('span', { class: cls(`${prefixcls}-switcher`) }, [h('span', { class: `${prefixcls}-switcher-leaf-line` })]);
      }
      return null;
    };

    const renderArrow = (): VNodeChild => {
      const showIcon = !isLeaf();
      const { loading, expanded, showLine, expandIcon } = props;
      if (loading) {
        return h(Spin, { wrapperClassName: `${prefixcls}-spin-icon` });
      }
      if (showIcon) {
        if (expandIcon) {
          if (typeof expandIcon === 'function' && !(expandIcon as any).setup && !(expandIcon as any).render && !(expandIcon as any).__vccOpts && !(expandIcon as any).props) {
            return expandIcon({ onClick: onExpand, className: `${prefixcls}-expand-icon`, expanded });
          }
          const node = normalizeNode(expandIcon);
          if (isVNode(node)) {
            const className = cls(`${prefixcls}-expand-icon`, (node.props as any)?.class);
            return cloneVNode(node, { onClick: onExpand, class: className });
          }
          return node;
        }
        return h(IconTreeTriangleDown, {
          role: 'button',
          'aria-label': `${expanded ? 'Expand' : 'Collapse'} the tree item`,
          class: `${prefixcls}-expand-icon`,
          size: 'small',
          onClick: onExpand,
        });
      }
      if (showLine) return renderSwitcher();
      return h('span', { class: `${prefixcls}-empty-icon` });
    };

    const renderCheckbox = () => {
      const { checked, halfChecked, eventKey } = props;
      const disabled = isDisabled();
      return h('div', { role: 'none', onClick: onCheck, onKeypress: handleCheckEnterPress }, [
        h(Checkbox, { 'aria-label': 'Toggle the checked state of checkbox', value: eventKey, indeterminate: halfChecked, checked, disabled: Boolean(disabled) }),
      ]);
    };

    const renderIcon = (): VNodeChild => {
      const { directory, treeIcon } = context;
      const { expanded, icon } = props;
      if (icon) return normalizeNode(icon);
      if (treeIcon) {
        return typeof treeIcon === 'function' && !(treeIcon as any).setup && !(treeIcon as any).render && !(treeIcon as any).__vccOpts && !(treeIcon as any).props
          ? treeIcon(nodeProps())
          : normalizeNode(treeIcon);
      }
      if (directory) {
        const hasChild = !isLeaf();
        if (!hasChild) return h(IconFile, { class: `${prefixcls}-item-icon` });
        return expanded ? h(IconFolderOpen, { class: `${prefixcls}-item-icon` }) : h(IconFolder, { class: `${prefixcls}-item-icon` });
      }
      return null;
    };

    const renderRealLabel = (): VNodeChild => {
      const { renderLabel } = context;
      const { label, keyword, data, filtered } = props;
      if (_isFunction(renderLabel)) {
        return renderLabel(label, data, keyword);
      } else if (_isString(label) && filtered && keyword) {
        return h('span', null, renderHighlight(label, [keyword], `${prefixcls}-highlight`, 'span'));
      }
      return normalizeNode(label);
    };

    const renderEmptyNode = () => {
      const { emptyContent } = props;
      const wrapperCls = cls(prefixcls, { [`${prefixcls}-empty`]: true });
      return h('ul', { class: wrapperCls }, [h('li', { class: `${prefixcls}-label ${prefixcls}-label-empty`, 'x-semi-prop': 'emptyContent' }, [normalizeNode(emptyContent)])]);
    };

    return () => {
      const { eventKey, expanded, selected, checked, halfChecked, loading, active, level, empty, filtered, style, isEnd, showLine, data, pos, keyword } = props;
      if (empty) return renderEmptyNode();
      const { multiple, draggable, renderFullLabel, dragOverNodeKey, dropPosition, labelEllipsis } = context;
      const isEndNode = isEnd[isEnd.length - 1];
      const disabled = isDisabled();
      const dragOver = dragOverNodeKey === eventKey && dropPosition === 0;
      const dragOverGapTop = dragOverNodeKey === eventKey && dropPosition === -1;
      const dragOverGapBottom = dragOverNodeKey === eventKey && dropPosition === 1;
      const nodeCls = cls(prefixcls, {
        [`${prefixcls}-level-${level + 1}`]: true,
        [`${prefixcls}-fullLabel-level-${level + 1}`]: renderFullLabel,
        [`${prefixcls}-collapsed`]: !expanded,
        [`${prefixcls}-disabled`]: Boolean(disabled),
        [`${prefixcls}-selected`]: selected,
        [`${prefixcls}-active`]: !multiple && active,
        [`${prefixcls}-ellipsis`]: labelEllipsis,
        [`${prefixcls}-drag-over`]: !disabled && dragOver,
        [`${prefixcls}-draggable`]: !disabled && draggable && !renderFullLabel,
        [`${prefixcls}-fullLabel-draggable`]: !disabled && draggable && renderFullLabel,
        [`${prefixcls}-fullLabel-drag-over-gap-top`]: !disabled && dragOverGapTop && renderFullLabel,
        [`${prefixcls}-fullLabel-drag-over-gap-bottom`]: !disabled && dragOverGapBottom && renderFullLabel,
        [`${prefixcls}-tree-node-last-leaf`]: isEndNode,
      });
      const labelProps = {
        onClick,
        onContextMenu,
        onDoubleClick,
        className: nodeCls,
        onExpand,
        data,
        level,
        onCheck,
        style,
        expandIcon: renderArrow(),
        checkStatus: { checked, halfChecked },
        expandStatus: { expanded, loading },
        filtered,
        searchWord: keyword,
      };
      const dragProps: Record<string, any> = {
        onDblclick: onDoubleClick,
        onDragstart: draggable ? onDragStart : undefined,
        onDragenter: draggable ? onDragEnter : undefined,
        onDragover: draggable ? onDragOver : undefined,
        onDragleave: draggable ? onDragLeave : undefined,
        onDrop: draggable ? onDrop : undefined,
        onDragend: draggable ? onDragEnd : undefined,
        draggable: (!disabled && draggable) || undefined,
      };
      if (renderFullLabel) {
        const customLabel: any = renderFullLabel({ ...labelProps });
        const node = Array.isArray(customLabel) ? customLabel[0] : customLabel;
        if (draggable && isVNode(node)) {
          return cloneVNode(node, { ref: refNode, ...dragProps }, true);
        }
        if (_isEmpty(style) || !isVNode(node)) return customLabel;
        return cloneVNode(node, { style: { ..._get(node, ['props', 'style']), ...style } }, true);
      }
      const labelCls = cls(`${prefixcls}-label`, {
        [`${prefixcls}-drag-over-gap-top`]: !disabled && dragOverGapTop,
        [`${prefixcls}-drag-over-gap-bottom`]: !disabled && dragOverGapBottom,
      });
      const setsize = _get(data, ['children', 'length']);
      const posinset = _isString(pos) ? Number(pos.split('-')[level + 1]) + 1 : 1;
      return h(
        'li',
        {
          class: nodeCls,
          role: 'treeitem',
          'aria-disabled': disabled,
          'aria-checked': checked,
          'aria-selected': selected,
          'aria-setsize': setsize,
          'aria-posinset': posinset,
          'aria-expanded': expanded,
          'aria-level': level + 1,
          'data-key': eventKey,
          onClick,
          onKeypress: handleliEnterPress,
          onContextmenu: onContextMenu,
          ref: refNode,
          style,
          ...dragProps,
        },
        [
          renderIndent(prefixcls, level, isEnd, showLine),
          renderArrow(),
          h('span', { class: labelCls }, [multiple ? renderCheckbox() : null, renderIcon(), h('span', { class: `${prefixcls}-label-text` }, [renderRealLabel()])]),
        ]
      );
    };
  },
});

export default TreeNode;
