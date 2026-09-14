import { h, isVNode, Text as TextType } from 'vue';
import type { VNode, VNodeChild } from 'vue';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import HighlightFoundation from '@douyinfe/semi-foundation/lib/es/highlight/foundation';
import { cssClasses as highlightCssClasses } from '@douyinfe/semi-foundation/lib/es/highlight/constants';
import '@douyinfe/semi-foundation/lib/es/highlight/highlight.css';
import { flattenChildren, getVNodeElementType } from '../_utils';

export interface OptionLike {
  value?: string | number;
  label?: any;
  children?: any;
  disabled?: boolean;
  showTick?: boolean;
  className?: string;
  style?: Record<string, any>;
  key?: any;
  _show?: boolean;
  _selected?: boolean;
  _scrollIndex?: number;
  _parentGroup?: any;
  _keyInJsx?: any;
  _keyInOptionList?: any;
  _inputCreateOnly?: boolean;
  _notExist?: boolean;
  [x: string]: any;
}

/** text content of a vnode child list (used to derive a label from Option children) */
export function getVNodeText(children: VNodeChild): string | undefined {
  const list = flattenChildren(children as any);
  if (!list.length) return undefined;
  const parts: string[] = [];
  for (const node of list) {
    if (node.type === TextType && typeof node.children === 'string') parts.push(node.children);
    else return undefined;
  }
  return parts.join('');
}

const getSlotChildren = (child: VNode) => {
  const slots: any = child.children;
  if (slots && typeof slots === 'object' && typeof slots.default === 'function') {
    return slots.default();
  }
  return undefined;
};

export const generateOption = (child: VNode, parent: any, index: number, newKey?: any): OptionLike | null => {
  const childProps: any = child.props || {};
  if (!child) return null;
  const slotChildren = getSlotChildren(child);
  // Dropdown menu rendering priority label value, children, value in turn downgrade
  const text = getVNodeText(slotChildren);
  const children = text !== undefined ? text : slotChildren && flattenChildren(slotChildren).length ? slotChildren : undefined;
  const option: OptionLike = {
    value: childProps.value,
    label: childProps.label ?? (children ?? childProps.value),
    _show: true,
    _selected: false,
    _scrollIndex: index,
    ...childProps,
    children,
    _parentGroup: parent,
  };
  if (option.label === undefined || option.label === null) option.label = children ?? childProps.value;
  // Vue normalises a bare boolean attribute to the empty string in `vnode.props`
  // (React always hands over a real boolean), so cast it back here.
  if (option.disabled === '' || option.disabled === 'disabled') option.disabled = true;
  option._keyInJsx = newKey ?? child.key ?? undefined;
  return option;
};

export const getOptionsFromGroup = (selectChildren: VNodeChild) => {
  let optionGroups: any[] = [];
  let options: OptionLike[] = [];
  const emptyGroup: any = { label: '', children: [], _show: false };
  const childNodes = flattenChildren(selectChildren as any).filter((node) => isVNode(node) && typeof node.type === 'object');
  let type = '';
  let optionIndex = -1;
  childNodes.forEach((child, childIdx) => {
    const et = getVNodeElementType(child);
    if (et === 'SelectOption') {
      type = 'option';
      optionIndex++;
      const option = generateOption(child, undefined, optionIndex, child.key ?? `.${childIdx}`);
      if (option) {
        emptyGroup.children.push(option);
        options.push(option);
      }
    } else if (et === 'SelectOptionGroup') {
      type = 'group';
      const groupProps: any = { ...(child.props || {}) };
      const groupKey = child.key ?? `.${childIdx}`;
      groupProps.key = groupKey;
      const groupChildren = flattenChildren(getSlotChildren(child)).filter((node) => isVNode(node) && typeof node.type === 'object');
      const childrenOption = groupChildren
        .map((option, index) => {
          let newKey = option.key;
          if (newKey === null || newKey === undefined) {
            newKey = `${String(groupKey)}.${index}`;
          }
          optionIndex++;
          return generateOption(option, groupProps, optionIndex, newKey);
        })
        .filter(Boolean) as OptionLike[];
      const group = { ...groupProps, children: childrenOption, key: groupKey };
      optionGroups.push(group);
      options = options.concat(childrenOption);
    } else {
      warning(true, '[Semi Select] The children of `Select` should be `Select.Option` or `Select.OptionGroup`');
    }
  });
  if (type === 'option') {
    optionGroups = [emptyGroup];
  }
  return { optionGroups, options };
};

/** Vue port of semi-ui Highlight (only what Select needs) */
export function renderHighlight(sourceString: string, searchWords: string[], highlightClassName: string): VNodeChild[] {
  const chunks = new (HighlightFoundation as any)().findAll({ sourceString, searchWords, autoEscape: true, caseSensitive: false });
  const tagCls = `${highlightCssClasses.PREFIX}-tag ${highlightClassName}`.trim();
  return chunks.map((chunk: any, index: number) => {
    const { end, start, highlight } = chunk;
    const text = sourceString.substr(start, end - start);
    if (highlight) {
      return h('mark', { class: tagCls, key: text + index }, text);
    }
    return text;
  });
}
