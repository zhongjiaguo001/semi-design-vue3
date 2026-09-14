import { h } from 'vue';
import type { VNodeChild } from 'vue';
import cls from 'classnames';
import HighlightFoundation from '@douyinfe/semi-foundation/lib/es/highlight/foundation';
import { cssClasses as highlightClasses } from '@douyinfe/semi-foundation/lib/es/highlight/constants';
import '@douyinfe/semi-foundation/lib/es/highlight/highlight.css';
import _cloneDeepWith from 'lodash/cloneDeepWith';
import _isPlainObject from 'lodash/isPlainObject';
import { isVNode } from 'vue';

/** deep clone the flatten node list but skip user data / vnodes (React `tree/treeUtil.js#cloneDeep`) */
export function cloneDeep(treeNodeList: any) {
  return _cloneDeepWith(treeNodeList, (val: any) => {
    if (_isPlainObject(val) && !val._innerDataTag) {
      return val;
    }
    if (isVNode(val)) {
      return val;
    }
    return undefined;
  });
}

/** Indent (React `tree/indent.js`) */
export function renderIndent(prefixcls: string, level: number, isEnd: boolean[] = [], showLine?: boolean) {
  const baseClassName = `${prefixcls}-indent-unit`;
  const list: VNodeChild[] = [];
  for (let i = 0; i < level; i += 1) {
    list.push(h('span', { key: i, class: cls(baseClassName, { [`${baseClassName}-end`]: isEnd[i] }) }));
  }
  return h('span', { 'aria-hidden': 'true', class: cls(`${prefixcls}-indent`, { [`${prefixcls}-indent-show-line`]: showLine }) }, list);
}

/** Highlight (minimal port of the React `highlight` component) */
export function renderHighlight(sourceString: string, searchWords: string[], highlightClassName?: string, component = 'mark') {
  const chunks = new (HighlightFoundation as any)().findAll({ sourceString, searchWords, autoEscape: true, caseSensitive: false });
  const tagCls = cls(`${highlightClasses.PREFIX}-tag`, highlightClassName);
  return chunks.map((chunk: any, index: number) => {
    const { end, start, highlight, style, className } = chunk;
    const text = sourceString.substr(start, end - start);
    if (highlight) {
      return h(component, { style, class: `${tagCls} ${className || ''}`.trim(), key: text + index }, text);
    }
    return text;
  });
}
