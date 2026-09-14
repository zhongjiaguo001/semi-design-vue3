import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/sidebar/constants';
import '@douyinfe/semi-foundation/lib/es/sidebar/sidebar.css';
import { IconCodeStroked, IconFullScreenStroked, IconFile } from '../icons/generated';
import Button from '../button/Button';
import CodeHighlight from '../codeHighlight/CodeHighlight';
import Collapse, { CollapsePanel } from '../collapse';
import { normalizeNode } from '../_utils';

const collapseCls = cssClasses.COLLAPSE;
const prefixCls = cssClasses.SIDEBAR;
const filePrefixCls = cssClasses.FILE;

/* ------------------------------ widgets / code ------------------------------ */

export const sidebarCodeItemProps = {
  language: { type: String, default: undefined },
  content: { type: String, default: '' },
  isJson: { type: Boolean, default: undefined },
  jsonViewerProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  codeHighlightProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
};

/**
 * CodeItem: renders highlighted code, or a JSON view when `isJson` is true.
 * (The React version uses the `JsonViewer` component, which is not part of the port;
 * a minimal inline substitute with the same wrapper classes is rendered instead.)
 */
export const CodeItem = defineComponent({
  name: 'SidebarCodeItem',
  props: sidebarCodeItemProps,
  setup(props) {
    return () => {
      const { language, content, isJson, jsonViewerProps = {}, codeHighlightProps = {} } = props;
      return h('div', { class: `${prefixCls}-code-content` }, [
        isJson
          ? h('pre', { class: 'semi-json-viewer', style: { height: '100%', width: '100%', margin: 0, overflow: 'auto', ...(jsonViewerProps as any).style } }, content)
          : h(CodeHighlight, { language, code: content, ...codeHighlightProps }),
      ]);
    };
  },
});

export const sidebarCollapseHeaderProps = {
  content: { type: Object as PropType<any>, required: true as const },
  mode: { type: String, default: 'code' },
  onExpand: { type: Function as PropType<(e: MouseEvent, content: any, mode: string) => void>, default: undefined },
};

export const CollapseHeader = defineComponent({
  name: 'SidebarCollapseHeader',
  props: sidebarCollapseHeaderProps,
  setup(props) {
    const handleExpand = (e: MouseEvent) => props.onExpand && props.onExpand(e, props.content, props.mode);
    return () => {
      const { content, mode } = props;
      return h('div', { class: `${collapseCls}-header-content` }, [
        mode === 'code' ? h(IconCodeStroked) : h(IconFile),
        h('span', { class: `${collapseCls}-header-text` }, content.name),
        h(Button, { class: `${collapseCls}-header-expand-btn`, theme: 'borderless', type: 'tertiary', icon: h(IconFullScreenStroked), onClick: handleExpand }),
      ]);
    };
  },
});

export const sidebarCodeContentProps = {
  activeKey: { type: String, default: undefined },
  codes: { type: Array as PropType<any[]>, default: () => [] },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  onChange: { type: Function as PropType<(activeKey: string) => void>, default: undefined },
  onExpand: { type: Function as PropType<(e: MouseEvent, content: any, mode: string) => void>, default: undefined },
};

export const CodeContent = defineComponent({
  name: 'SidebarCodeContent',
  props: sidebarCodeContentProps,
  setup(props) {
    return () => {
      const { activeKey, codes = [], style, className, onChange, onExpand } = props;
      return h(
        Collapse,
        { class: cls(collapseCls, `${collapseCls}-code`, { [className as string]: className }), style, onChange, activeKey, clickHeaderToExpand: false },
        {
          default: () =>
            codes.map((code) =>
              h(
                CollapsePanel,
                {
                  header: h(CollapseHeader, { content: code, onExpand, mode: 'code' }),
                  itemKey: code.key,
                  key: code.key,
                },
                { default: () => h(CodeItem, { key: code.key, ...code }) }
              )
            ),
        }
      );
    };
  },
});

/* ------------------------------ widgets / file ------------------------------ */

/**
 * FileItem / FileContent: the React implementation is a rich-text editor built on
 * tiptap (React only) and cannot be ported. Minimal substitutes with the same
 * Semi classes render the content in a scrollable div.
 */
export const sidebarFileItemProps = {
  editable: { type: Boolean, default: true },
  content: { type: [String, Object] as PropType<any>, default: '' },
  onContentChange: { type: Function as PropType<(html: string) => void>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  imgUploadProps: { type: Object as PropType<Record<string, any>>, default: undefined },
};

export const FileItem = defineComponent({
  name: 'SidebarFileItem',
  props: sidebarFileItemProps,
  setup(props) {
    return () => {
      const { editable, content, className, style } = props;
      return h('div', { class: cls(filePrefixCls, { [className as string]: className }), style }, [
        editable ? h('div', { class: `${filePrefixCls}-menu-bar` }, '') : null,
        h('div', { class: `${filePrefixCls}-editor`, style: { overflow: 'auto', whiteSpace: 'pre-wrap' } }, typeof content === 'string' ? content : JSON.stringify(content)),
      ]);
    };
  },
});

export const sidebarFileContentProps = {
  activeKey: { type: String, default: undefined },
  files: { type: Array as PropType<any[]>, default: () => [] },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  onChange: { type: Function as PropType<(activeKey: string) => void>, default: undefined },
  onExpand: { type: Function as PropType<(e: MouseEvent, content: any, mode: string) => void>, default: undefined },
};

export const FileContent = defineComponent({
  name: 'SidebarFileContent',
  props: sidebarFileContentProps,
  setup(props) {
    return () => {
      const { activeKey, files = [], style, className, onChange, onExpand } = props;
      return h(
        Collapse,
        { class: cls(collapseCls, `${collapseCls}-file`, { [className as string]: className }), style, onChange, activeKey, clickHeaderToExpand: false },
        {
          default: () =>
            files.map((file) =>
              h(
                CollapsePanel,
                {
                  header: h(CollapseHeader, { content: file, onExpand, mode: 'file' }),
                  itemKey: file.key,
                  key: file.key,
                },
                { default: () => h(FileItem, { key: file.key, content: file.content, editable: false }) }
              )
            ),
        }
      );
    };
  },
});

export { strings as sidebarStrings };
