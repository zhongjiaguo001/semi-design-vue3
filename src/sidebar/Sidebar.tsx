import { defineComponent, h, ref } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import _pick from 'lodash/pick';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/sidebar/constants';
import '@douyinfe/semi-foundation/lib/es/sidebar/sidebar.css';
import { IconClose, IconCopyStroked } from '../icons/generated';
import Button from '../button/Button';
import Container from './Container';
import type { ResizableSize } from './Container';
import Options from './Options';
import type { SidebarOption } from './Options';
import { CodeItem, FileItem, CodeContent, FileContent } from './widgets';
import { useLocale } from '../locale';
import { createBaseToast } from '../toast';

const prefixCls = cssClasses.SIDEBAR;

export type SidebarMode = (typeof strings.MODE)[keyof typeof strings.MODE];

export const sidebarProps = {
  title: { type: [Object, Function, String] as PropType<any>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  visible: { type: Boolean, default: false },
  motion: { type: Boolean, default: true },
  minWidth: { type: [String, Number] as PropType<string | number>, default: 150 },
  maxWidth: { type: [String, Number] as PropType<string | number>, default: undefined },
  closeOnEsc: { type: Boolean, default: true },
  resizable: { type: Boolean, default: true },
  defaultSize: { type: Object as PropType<ResizableSize>, default: undefined },
  className: { type: String, default: undefined },
  showClose: { type: Boolean, default: true },
  mode: { type: String as PropType<SidebarMode>, default: 'main' },
  activeKey: { type: String, default: undefined },
  options: { type: Array as PropType<SidebarOption[]>, default: () => [] },
  renderOptionItem: { type: Function as PropType<(option: SidebarOption, onChange?: (e: MouseEvent, key: string) => void) => VNodeChild>, default: undefined },
  renderMainContent: { type: Function as PropType<(activeKey?: string) => VNodeChild>, default: undefined },
  renderDetailHeader: { type: Function as PropType<(mode: SidebarMode, detailContent: any) => VNodeChild>, default: undefined },
  renderDetailContent: { type: Function as PropType<(mode: SidebarMode) => VNodeChild>, default: undefined },
  detailContent: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  imgUploadProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  fileEditable: { type: Boolean, default: true },
};

export const sidebarEmits = [
  'cancel',
  'afterVisibleChange',
  'activeOptionChange',
  'backWard',
  'detailContentCopy',
  'fileContentChange',
];

const Sidebar = defineComponent({
  name: 'Sidebar',
  inheritAttrs: false,
  props: sidebarProps,
  emits: sidebarEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { locale } = useLocale('Sidebar');
    const containerRef = ref<HTMLElement | null>(null);
    const toast = createBaseToast();

    const renderOption = () => {
      const { activeKey, options, renderOptionItem } = props;
      return h(Options, {
        options,
        renderOptionItem,
        onChange: (e: MouseEvent, key: string) => emit('activeOptionChange', e, key),
        activeKey,
      });
    };

    const renderMain = () => {
      const { activeKey, renderMainContent } = props;
      return h('div', { class: `${prefixCls}-main-content-wrapper` }, [
        renderOption(),
        h('div', { class: `${prefixCls}-main-content` }, [renderMainContent ? renderMainContent(activeKey) : null, slots.main ? slots.main(activeKey) : null]),
      ]);
    };

    const renderDetail = () => {
      const { renderDetailContent, detailContent = {}, imgUploadProps, fileEditable, mode } = props;
      const result = renderDetailContent ? renderDetailContent(mode) : undefined;
      if (result) return result;
      if (mode === 'code') {
        return h(CodeItem, { ...detailContent, jsonViewerProps: { height: '100%' } });
      } else if (mode === 'file') {
        return h(FileItem, {
          ...detailContent,
          imgUploadProps,
          editable: fileEditable,
          onContentChange: (html: string) => emit('fileContentChange', html),
        });
      }
      return null;
    };

    const renderContent = () => (props.mode === strings.MODE.MAIN ? renderMain() : renderDetail());
    const renderTitle = () => (props.mode === strings.MODE.MAIN ? (slots.title ? slots.title() : props.title) : null);

    const onDetailClose = (e: MouseEvent) => {
      emit('backWard', e, strings.MODE.MAIN);
      emit('cancel', e);
    };

    const copyText = (text: string): boolean => {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text);
          return true;
        }
      } catch (e) {
        /* fall through */
      }
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        textarea.remove();
        return ok;
      } catch (e) {
        return false;
      }
    };

    const handleCopyDetailContent = (e: MouseEvent) => {
      const { detailContent, mode } = props;
      const content = detailContent?.content ?? '';
      const res = copyText(content);
      if (res) {
        toast.success({ content: locale.value?.copySuccess, getPopupContainer: () => containerRef.value || document.body });
      }
      emit('detailContentCopy', e, content, res);
      void mode;
    };

    const renderHeader = () => {
      const { renderDetailHeader, detailContent, mode } = props;
      const result = renderDetailHeader ? renderDetailHeader(mode, detailContent) : null;
      if (result) return result;
      return h('div', { class: `${prefixCls}-detail-header` }, [
        h('span', { class: `${prefixCls}-detail-header-left` }, [
          h(Button, { theme: 'borderless', type: 'tertiary', icon: h(IconClose), onClick: onDetailClose }),
          h('span', { class: `${prefixCls}-detail-header-title` }, detailContent?.name),
        ]),
        h('span', { class: `${prefixCls}-detail-header-right` }, [
          h(Button, { theme: 'borderless', type: 'tertiary', icon: h(IconCopyStroked), onClick: handleCopyDetailContent }),
        ]),
      ]);
    };

    expose({ containerRef });

    return () => {
      const { mode } = props;
      const containerProps = _pick(props, ['title', 'style', 'visible', 'motion', 'minWidth', 'maxWidth', 'closeOnEsc', 'resizable', 'defaultSize', 'className', 'showClose']);
      return h(
        Container,
        {
          ...containerProps,
          title: renderTitle(),
          containerRef,
          class: cls({
            [containerProps.className as string]: containerProps.className,
            [`${prefixCls}-main`]: mode === strings.MODE.MAIN,
            [`${prefixCls}-detail`]: mode !== strings.MODE.MAIN,
          }, attrs.class as any),
          renderHeader: mode !== strings.MODE.MAIN ? renderHeader : undefined,
          onCancel: (e: MouseEvent) => emit('cancel', e),
          onAfterVisibleChange: (visible: boolean) => emit('afterVisibleChange', visible),
        },
        { default: () => renderContent(), title: slots.title }
      );
    };
  },
});
(Sidebar as any).__SemiComponentName__ = 'Sidebar';
(Sidebar as any).FileContent = FileContent;
(Sidebar as any).CodeContent = CodeContent;
(Sidebar as any).FileItem = FileItem;
(Sidebar as any).CodeItem = CodeItem;
(Sidebar as any).Container = Container;
(Sidebar as any).elementType = 'Sidebar';

export default Sidebar;
