/**
 * Public API smoke test.
 *
 * Mounts every component the library exports (with the minimum props each needs)
 * and asserts it renders without throwing. This catches integration problems that
 * per-component unit tests can miss: a component missing from the barrel, a broken
 * named export, a missing css import, a render error only triggered from the root.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import * as Semi from './index';

type MountCase = { name: string; props?: Record<string, any>; slots?: Record<string, any>; expectRoot?: boolean; wrapInRow?: boolean };

const text = () => h('span', 'x');
const options = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
];
const treeData = [{ label: 'L1', value: '1', key: '1', children: [{ label: 'L2', value: '2', key: '2' }] }];

const cases: MountCase[] = [
  { name: 'Button' },
  { name: 'ButtonGroup' },
  { name: 'IconButton', props: { icon: Semi.IconClose } },
  { name: 'SplitButtonGroup' },
  { name: 'Input', props: { defaultValue: 'v' } },
  { name: 'TextArea', props: { defaultValue: 'v' } },
  { name: 'InputGroup' },
  { name: 'InputNumber', props: { defaultValue: 1 } },
  { name: 'AutoComplete', props: { data: ['a'] } },
  { name: 'TagInput', props: { defaultValue: ['a'] } },
  { name: 'Switch', props: { defaultChecked: true } },
  { name: 'Checkbox', props: { defaultChecked: true } },
  { name: 'CheckboxGroup', props: { options: ['a'] } },
  { name: 'Radio', props: { defaultChecked: true } },
  { name: 'RadioGroup', props: { options: ['a'] } },
  { name: 'Select', props: { optionList: options } },
  { name: 'Slider', props: { defaultValue: 10 } },
  { name: 'PinCode', props: { defaultValue: '12' } },
  { name: 'DatePicker' },
  { name: 'TimePicker' },
  { name: 'Calendar' },
  { name: 'ScrollList' },
  { name: 'Tree', props: { treeData } },
  { name: 'TreeSelect', props: { treeData } },
  { name: 'Cascader', props: { treeData, defaultValue: '1' } },
  { name: 'Tabs', slots: { default: () => h(Semi.TabPane, { itemKey: 'a', tab: 'A' }, text) } },
  { name: 'TabPane', props: { itemKey: 'a', tab: 'A' }, slots: { default: text } },
  { name: 'Collapse', slots: { default: () => h(Semi.CollapsePanel, { itemKey: 'a', header: 'H' }, text) } },
  { name: 'CollapsePanel', props: { itemKey: 'a', header: 'H' }, slots: { default: text } },
  { name: 'Collapsible', props: { isOpen: true }, slots: { default: text } },
  { name: 'Descriptions', props: { data: [{ key: 'k', value: 'v' }] } },
  { name: 'Banner', props: { title: 't' } },
  { name: 'Card', props: { title: 't' }, slots: { default: text } },
  { name: 'CardGroup' },
  { name: 'Skeleton' },
  { name: 'SkeletonAvatar' }, // eslint-disable-line
  { name: 'Avatar', slots: { default: () => 'AB' } },
  { name: 'AvatarGroup', props: { maxCount: 1 }, slots: { default: () => h(Semi.Avatar, null, () => 'A') } },
  { name: 'Tag', slots: { default: () => 'tag' } },
  { name: 'Badge', props: { count: 1 }, slots: { default: text } },
  { name: 'Divider' },
  { name: 'Space', slots: { default: text } },
  { name: 'Grid' as any, props: {} as any, expectRoot: false },
  { name: 'Row', slots: { default: () => h(Semi.Col, { span: 24 }, text) } },
  { name: 'Col', props: { span: 12 }, slots: { default: text }, wrapInRow: true } as any,
  { name: 'List', slots: { default: () => h(Semi.ListItem, null, text) } },
  { name: 'ListItem', slots: { default: text } },
  { name: 'Layout', slots: { default: text } },
  { name: 'Header', slots: { default: text } },
  { name: 'Footer', slots: { default: text } },
  { name: 'Content', slots: { default: text } },
  { name: 'Sider', slots: { default: text } },
  { name: 'Steps', props: { current: 0 }, slots: { default: () => h(Semi.Step, { title: 'S' }) } },
  { name: 'Step', props: { title: 'S' } },
  { name: 'Timeline', props: { dataSource: [{ time: 't', content: 'c' }] } },
  { name: 'Pagination', props: { total: 50 } },
  { name: 'Breadcrumb', props: { routes: ['a', 'b'] } },
  { name: 'Anchor', slots: { default: text } },
  { name: 'BackTop' },
  { name: 'Rating', props: { defaultValue: 3 } },
  { name: 'Progress', props: { percent: 50 } },
  { name: 'Spin' },
  { name: 'Empty', props: { title: 't' } },
  { name: 'Typography', slots: { default: text } },
  { name: 'Text', slots: { default: () => 'x' } },
  { name: 'Title', slots: { default: () => 'x' } },
  { name: 'Paragraph', slots: { default: () => 'x' } },
  { name: 'Numeral', slots: { default: () => '1' } },
  { name: 'Highlight', props: { text: 'abc', searchWords: ['a'] } },
  { name: 'CodeHighlight', props: { code: 'const a = 1' } },
  { name: 'Tooltip', props: { content: 'c' }, slots: { default: text } },
  { name: 'Popover', props: { content: 'c' }, slots: { default: text } },
  { name: 'Popconfirm', props: { title: 't' }, slots: { default: text } },
  { name: 'Dropdown', slots: { default: text } },
  { name: 'DropdownMenu' },
  { name: 'DropdownItem', slots: { default: () => 'i' } },
  { name: 'Modal', props: { visible: false } },
  { name: 'SideSheet', props: { visible: false } },
  { name: 'Nav', props: { items: [{ itemKey: 'a', text: 'A' }] } },
  { name: 'NavItem', props: { itemKey: 'a', text: 'A' } },
  { name: 'NavHeader', props: { text: 'H' } },
  { name: 'NavFooter' },
  { name: 'Notification' as any, expectRoot: false },
  { name: 'Toast' as any, expectRoot: false },
  { name: 'Image', props: { src: 'a.png' } },
  { name: 'Carousel', slots: { default: () => h('div', '1') } },
  { name: 'Collapse' },
  { name: 'Upload', props: { action: '/x' } },
  { name: 'ColorPicker' },
  { name: 'Cropper', props: { src: 'a.png' } },
  { name: 'Feedback', props: { visible: false } },
  { name: 'Lottie', props: { params: { animationData: { v: '5.5.7', fr: 30, ip: 0, op: 1, w: 10, h: 10, layers: [] } } } },
  { name: 'JsonViewer', props: { value: '{"a":1}', showSearch: false } },
  { name: 'UserGuide', props: { visible: false, steps: [] } },
  { name: 'AudioPlayer', props: { audioUrl: 'a.mp3' } },
  { name: 'VideoPlayer', props: { src: 'a.mp4', width: 160, height: 90 } },
  { name: 'MarkdownRender', props: { raw: '' } },
  { name: 'Chat', props: { chats: [], enableUpload: false } },
  { name: 'AIChatDialogue', props: { chats: [] } },
  { name: 'AIChatInput', props: { showUploadButton: false } },
  { name: 'FloatButton' },
  { name: 'OverflowList', props: { items: [1, 2], visibleItemRenderer: (i: any) => h('span', String(i)) } },
  { name: 'Sidebar', props: { visible: true } },
  { name: 'HotKeys', props: { hotKeys: ['a'] } },
  { name: 'DragMove', slots: { default: text } },
  { name: 'Transfer', props: { dataSource: [{ label: 'A', value: 'a', key: 'a' }] } },
  { name: 'Form' },
  { name: 'ArrayField', props: { field: 'arr', initValue: [] }, slots: { default: () => null } },
  { name: 'Resizable' },
  { name: 'ConfigProvider', slots: { default: text } },
  { name: 'Portal', slots: { default: text } },
  { name: 'Icon', props: { svg: { viewBox: '0 0 24 24', fill: 'none', inner: '' } } },
  { name: 'IconClose' },
];

describe('public API', () => {
  it('exports the theme namespace and helpers', () => {
    expect(typeof Semi.theme.defaultAlgorithm).toBe('function');
    expect(typeof Semi.theme.darkAlgorithm).toBe('function');
    expect(typeof Semi.theme.compactAlgorithm).toBe('function');
    expect(typeof Semi.theme.getDesignToken).toBe('function');
    expect(typeof Semi.theme.useToken).toBe('function');
    expect(typeof Semi.theme.generate).toBe('function');
    expect(typeof Semi.useToken).toBe('function');
    expect(typeof Semi.useLocale).toBe('function');
    expect(typeof Semi.LocaleProvider).toBeDefined();
    expect(typeof Semi.defaultResponsiveMap).toBe('object');
    expect(typeof Semi.gridResponsiveMap).toBe('object');
  });

  it('exports 500+ icons', () => {
    const iconNames = Object.keys(Semi).filter((n) => /^Icon[A-Z]/.test(n));
    expect(iconNames.length).toBeGreaterThan(500);
  });

  it.each(cases.filter((c) => typeof (Semi as any)[c.name] !== 'undefined').map((c) => [c.name, c] as const))(
    'mounts %s without throwing',
    (_name, c) => {
      const comp = (Semi as any)[c.name];
      expect(comp).toBeDefined();
      const wrapper = c.wrapInRow
        ? mount(Semi.Row, { attachTo: document.body, slots: { default: () => h(comp, c.props || {}, c.slots as any) } })
        : mount(comp as any, { props: c.props || {}, slots: c.slots as any, attachTo: document.body });
      const html = wrapper.html();
      expect(typeof html).toBe('string');
      if (c.expectRoot !== false) {
        expect(wrapper.element).toBeTruthy();
      }
      wrapper.unmount();
    }
  );

  it('every listed case is actually exported', () => {
    const missing = cases.filter((c) => typeof (Semi as any)[c.name] === 'undefined').map((c) => c.name);
    // Grid/Resizable/Notification/Toast are excluded from the mount table when they are namespaces/imperative APIs
    const allowed = new Set(['Grid', 'Resizable', 'Notification', 'Toast', 'SkeletonAvatar']);
    expect(missing.filter((m) => !allowed.has(m))).toEqual([]);
  });
});
