import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sidebar, Container, Options, CodeItem, CodeContent, FileItem, FileContent, CollapseHeader } from './index';
import { IconSetting } from '../icons/generated';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wait = async (ms = 20) => {
  await sleep(ms);
  await flushPromises();
  await nextTick();
};

const options = [
  { key: 'a', name: 'Option A', icon: h(IconSetting) },
  { key: 'b', name: 'Option B' },
];

describe('Sidebar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('hidden by default: renders nothing; visible shows the main container', async () => {
    const wrapper = mount(Sidebar, { props: { options, title: 'My Title' } });
    await nextTick();
    expect(wrapper.find('.semi-sidebar-container').exists()).toBe(false);
    await wrapper.setProps({ visible: true });
    await nextTick();
    const container = wrapper.find('.semi-sidebar-container');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('semi-sidebar-main');
    expect(container.find('.semi-sidebar-container-header-title').text()).toBe('My Title');
    expect(container.find('.semi-sidebar-container-header-closeBtn').exists()).toBe(true);
    expect(container.find('.semi-sidebar-container-content').exists()).toBe(true);
    expect(wrapper.emitted('afterVisibleChange')).toBeUndefined();
  });

  it('main mode: renders options with active state, activeOptionChange, main content + slot', async () => {
    const onChange = vi.fn();
    const renderMainContent = vi.fn((key?: string) => h('b', { class: 'mc' }, `content-${key ?? 'none'}`));
    const wrapper = mount(Sidebar, {
      props: { options, visible: true, activeKey: 'a', renderMainContent, onActiveOptionChange: onChange },
      slots: { main: (key: string) => h('i', { class: 'main-slot' }, `slot-${key}`) },
    });
    await nextTick();
    expect(wrapper.find('.semi-sidebar-main-content-wrapper').exists()).toBe(true);
    expect(wrapper.find('.mc').text()).toBe('content-a');
    expect(wrapper.find('.main-slot').text()).toBe('slot-a');
    expect(renderMainContent).toHaveBeenCalledWith('a');
    const buttons = wrapper.findAll('.semi-sidebar-options-button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].classes()).not.toContain('semi-sidebar-options-normal');
    expect(buttons[1].classes()).toContain('semi-sidebar-options-normal');
    expect(buttons[0].find('.semi-icon-setting').exists()).toBe(true);
    await buttons[1].trigger('click');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][1]).toBe('b');
    expect(wrapper.emitted('activeOptionChange')![0][1]).toBe('b');
  });

  it('renderOptionItem customizes options and receives onChange', async () => {
    const renderOptionItem = vi.fn((option: any, onChange?: any) => h('div', { class: 'opt-item', onClick: () => onChange?.({} as any, option.key) }, option.name));
    const wrapper = mount(Sidebar, { props: { options, visible: true, renderOptionItem } });
    await nextTick();
    expect(wrapper.findAll('.opt-item')).toHaveLength(2);
    expect(wrapper.find('.semi-sidebar-options-button').exists()).toBe(false);
    await wrapper.find('.opt-item').trigger('click');
    expect(wrapper.emitted('activeOptionChange')![0][1]).toBe('a');
  });

  it('title slot overrides title prop', async () => {
    const wrapper = mount(Sidebar, { props: { visible: true, title: 'prop' }, slots: { title: () => h('i', { class: 't-slot' }, 'slot-title') } });
    await nextTick();
    expect(wrapper.find('.semi-sidebar-container-header-title').text()).toBe('slot-title');
  });

  it('showClose=false hides the close button', async () => {
    const wrapper = mount(Sidebar, { props: { visible: true, showClose: false } });
    await nextTick();
    expect(wrapper.find('.semi-sidebar-container-header-closeBtn').exists()).toBe(false);
  });

  it('close button emits cancel; closeOnEsc=false ignores Escape', async () => {
    const onCancel = vi.fn();
    const wrapper = mount(Sidebar, { props: { visible: true, onCancel } });
    await nextTick();
    await wrapper.find('.semi-sidebar-container-header-closeBtn').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(onCancel).toHaveBeenCalled();
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27, key: 'Escape' } as any));
    expect(wrapper.emitted('cancel')).toHaveLength(2);
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 65, key: 'a' } as any));
    expect(wrapper.emitted('cancel')).toHaveLength(2);
    wrapper.unmount();
    // the keydown listener is removed on unmount
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27 } as any));
    await nextTick();

    const noEsc = mount(Sidebar, { props: { visible: true, closeOnEsc: false } });
    await nextTick();
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27, key: 'Escape' } as any));
    expect(noEsc.emitted('cancel')).toBeUndefined();
    noEsc.unmount();
  });

  it('code mode: detail header with title, back button (backWard + cancel) and copy; CodeItem content', async () => {
    const wrapper = mount(Sidebar, {
      props: { visible: true, mode: 'code', detailContent: { name: 'app.js', content: 'const a = 1;', language: 'javascript' } },
    });
    await nextTick();
    const container = wrapper.find('.semi-sidebar-container');
    expect(container.classes()).toContain('semi-sidebar-detail');
    const header = wrapper.find('.semi-sidebar-detail-header');
    expect(header.exists()).toBe(true);
    expect(header.find('.semi-sidebar-detail-header-title').text()).toBe('app.js');
    expect(header.find('.semi-sidebar-detail-header-right .semi-icon-copy_stroked').exists()).toBe(true);
    expect(wrapper.find('.semi-sidebar-code-content .semi-codeHighlight').exists()).toBe(true);
    expect(wrapper.find('.semi-sidebar-container-header').exists()).toBe(false);
    await header.find('.semi-sidebar-detail-header-left .semi-button').trigger('click');
    expect(wrapper.emitted('backWard')![0][1]).toBe('main');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('copy detail content: clipboard + toast + detailContentCopy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const wrapper = mount(Sidebar, {
      props: { visible: true, mode: 'code', detailContent: { name: 'x', content: 'hello' } },
    });
    await nextTick();
    await wrapper.find('.semi-sidebar-detail-header-right .semi-button').trigger('click');
    await wait();
    expect(writeText).toHaveBeenCalledWith('hello');
    const [e, content, res] = wrapper.emitted('detailContentCopy')![0];
    expect(content).toBe('hello');
    expect(res).toBe(true);
    expect(e).toBeInstanceOf(MouseEvent);
    expect(document.querySelector('.semi-toast')).toBeTruthy();
  });

  it('renderDetailHeader / renderDetailContent override the defaults; file mode renders FileItem', async () => {
    const renderDetailHeader = vi.fn((mode: string, detail: any) => h('b', { class: 'hdr' }, `${mode}-${detail.name}`));
    const renderDetailContent = vi.fn((mode: string) => h('i', { class: 'dct' }, mode));
    const wrapper = mount(Sidebar, {
      props: { visible: true, mode: 'code', detailContent: { name: 'x', content: 'y' }, renderDetailHeader, renderDetailContent },
    });
    await nextTick();
    expect(wrapper.find('.hdr').text()).toBe('code-x');
    expect(wrapper.find('.dct').text()).toBe('code');
    expect(wrapper.find('.semi-sidebar-detail-header').exists()).toBe(false);
    expect(renderDetailHeader).toHaveBeenCalledWith('code', { name: 'x', content: 'y' });

    const file = mount(Sidebar, { props: { visible: true, mode: 'file', detailContent: { name: 'f.md', content: '<p>hi</p>' }, fileEditable: false } });
    await nextTick();
    expect(file.find('.semi-sidebar-file').exists()).toBe(true);
    expect(file.find('.semi-sidebar-file-editor').text()).toBe('<p>hi</p>');
    expect(file.find('.semi-sidebar-file-menu-bar').exists()).toBe(false);
    const editable = mount(Sidebar, { props: { visible: true, mode: 'file', detailContent: { name: 'f', content: '' }, fileEditable: true } });
    await nextTick();
    expect(editable.find('.semi-sidebar-file-menu-bar').exists()).toBe(true);
  });

  it('mode=file with renderDetailContent given returns it', async () => {
    const wrapper = mount(Sidebar, {
      props: { visible: true, mode: 'file', renderDetailContent: () => h('i', { class: 'fdc' }) },
    });
    await nextTick();
    expect(wrapper.find('.fdc').exists()).toBe(true);
  });

  it('resizable: dragging the edge changes width within min/max', async () => {
    const wrapper = mount(Sidebar, { props: { visible: true, minWidth: 150, maxWidth: 500, defaultSize: { width: 200 } } });
    await nextTick();
    const container = wrapper.find('.semi-sidebar-container');
    Object.defineProperty(container.element, 'offsetWidth', { configurable: true, get: () => 200 });
    await wrapper.find('.semi-sidebar-container-resize-handle').trigger('mousedown', { clientX: 100 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300 }));
    await nextTick();
    expect(container.attributes('style')).toContain('width: 400px');
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 2000 }));
    await nextTick();
    expect(container.attributes('style')).toContain('width: 500px');
    window.dispatchEvent(new MouseEvent('mouseup'));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }));
    await nextTick();
    expect(container.attributes('style')).toContain('width: 500px');
    // not resizable
    const fixed = mount(Sidebar, { props: { visible: true, resizable: false } });
    await nextTick();
    expect(fixed.find('.semi-sidebar-container-resize-handle').exists()).toBe(false);
  });

  it('motion=false removes the content immediately on hide; motion keeps it until animation end', async () => {
    const wrapper = mount(Sidebar, { props: { visible: true, motion: false } });
    await nextTick();
    expect(wrapper.find('.semi-sidebar-container').exists()).toBe(true);
    await wrapper.setProps({ visible: false });
    await nextTick();
    expect(wrapper.find('.semi-sidebar-container').exists()).toBe(false);

    const animated = mount(Sidebar, { props: { visible: true, motion: true } });
    await nextTick();
    await animated.setProps({ visible: false });
    await nextTick();
    expect(animated.find('.semi-sidebar-container').exists()).toBe(true);
  });

  it('className / class / style / locale (en_US copy toast)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const wrapper = mount(LocaleProvider, {
      props: { locale: en_US as any },
      slots: {
        default: () =>
          h(Sidebar, { visible: true, mode: 'code', detailContent: { name: 'n', content: 'c' }, className: 'a', class: 'b', style: { color: 'red' } }),
      },
    });
    await nextTick();
    const container = wrapper.find('.semi-sidebar-container');
    expect(container.classes()).toContain('a');
    expect(container.classes()).toContain('b');
    expect(container.attributes('style')).toContain('color: red');
    await wrapper.find('.semi-sidebar-detail-header-right .semi-button').trigger('click');
    await wait();
    expect(document.querySelector('.semi-toast')!.textContent).toContain(en_US.Sidebar.copySuccess);
  });

  it('statics', () => {
    expect((Sidebar as any).FileContent).toBe(FileContent);
    expect((Sidebar as any).CodeContent).toBe(CodeContent);
    expect((Sidebar as any).FileItem).toBe(FileItem);
    expect((Sidebar as any).CodeItem).toBe(CodeItem);
    expect((Sidebar as any).Container).toBe(Container);
    expect((Sidebar as any).__SemiComponentName__).toBe('Sidebar');
  });
});

describe('Sidebar sub components', () => {
  it('Container standalone: renderHeader override, cancel emit, esc listener', async () => {
    const renderHeader = vi.fn(() => h('b', { class: 'rh' }, 'H'));
    const wrapper = mount(Container, {
      props: { visible: true, title: 'T', renderHeader },
      slots: { default: () => h('i', { class: 'cnt' }, 'content') },
    });
    await nextTick();
    expect(wrapper.find('.semi-sidebar-container').exists()).toBe(true);
    expect(wrapper.find('.rh').exists()).toBe(true);
    expect(wrapper.find('.semi-sidebar-container-header').exists()).toBe(false);
    expect(wrapper.find('.cnt').text()).toBe('content');
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27 } as any));
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    wrapper.unmount();
  });

  it('Options standalone: buttons, onChange, renderOptionItem', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Options, { props: { options, activeKey: 'a', onChange } });
    const buttons = wrapper.findAll('button.semi-sidebar-options-button');
    expect(buttons).toHaveLength(2);
    await buttons[1].trigger('click');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][1]).toBe('b');
  });

  it('CodeItem: isJson renders inline json substitute, otherwise CodeHighlight', async () => {
    const json = mount(CodeItem, { props: { content: '{"a":1}', isJson: true } });
    expect(json.find('.semi-json-viewer').text()).toBe('{"a":1}');
    const code = mount(CodeItem, { props: { content: 'let x = 1;', language: 'javascript' } });
    await flushPromises();
    expect(code.find('.semi-codeHighlight').exists()).toBe(true);
    expect(code.find('.semi-codeHighlight code').classes()).toContain('language-javascript');
  });

  it('CodeContent: renders Collapse panels with CollapseHeader; expand emits onExpand', async () => {
    const onExpand = vi.fn();
    const codes = [{ key: 'c1', name: 'one.js', content: 'x = 1', language: 'javascript' }];
    const wrapper = mount(CodeContent, { props: { codes, onExpand, activeKey: 'c1' } });
    await flushPromises();
    expect(wrapper.find('.semi-sidebar-collapse-code').exists()).toBe(true);
    expect(wrapper.find('.semi-sidebar-collapse-header-text').text()).toBe('one.js');
    expect(wrapper.find('.semi-icon-code_stroked').exists()).toBe(true);
    expect(wrapper.find('.semi-sidebar-code-content').exists()).toBe(true);
    await wrapper.find('.semi-sidebar-collapse-header-expand-btn').trigger('click');
    expect(onExpand).toHaveBeenCalled();
    expect(onExpand.mock.calls[0][1]).toEqual(codes[0]);
    expect(onExpand.mock.calls[0][2]).toBe('code');
  });

  it('FileContent: renders file panels with FileItem (inline substitute)', () => {
    const files = [{ key: 'f1', name: 'a.md', content: 'text' }];
    const wrapper = mount(FileContent, { props: { files, activeKey: 'f1' } });
    expect(wrapper.find('.semi-sidebar-collapse-file').exists()).toBe(true);
    expect(wrapper.find('.semi-icon-file').exists()).toBe(true);
    expect(wrapper.find('.semi-sidebar-file-editor').text()).toBe('text');
  });

  it('CollapseHeader: file mode icon and expand', async () => {
    const onExpand = vi.fn();
    const wrapper = mount(CollapseHeader, { props: { content: { name: 'f.md' }, mode: 'file', onExpand } });
    expect(wrapper.find('.semi-icon-file').exists()).toBe(true);
    await wrapper.find('button').trigger('click');
    expect(onExpand).toHaveBeenCalled();
    expect(onExpand.mock.calls[0][2]).toBe('file');
  });
});
