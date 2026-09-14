import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Upload, FileCard } from './index';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';

/* ---------- XMLHttpRequest mock ---------- */
class MockXHR {
  static instances: MockXHR[] = [];
  upload: { onprogress: ((e: any) => void) | null } = { onprogress: null };
  onload: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  status = 0;
  responseText = '';
  withCredentials = false;
  headers: Record<string, string> = {};
  method = '';
  url = '';
  sent: any = null;
  aborted = false;
  constructor() {
    MockXHR.instances.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send(body: any) {
    this.sent = body;
  }
  abort() {
    this.aborted = true;
  }
  getResponseHeader() {
    return null;
  }
  getAllResponseHeaders() {
    return '';
  }
  // helpers
  progress(loaded: number, total: number) {
    this.upload.onprogress && this.upload.onprogress({ loaded, total });
  }
  respond(status: number, body = '{"ok":true}') {
    this.status = status;
    this.responseText = body;
    this.onload && this.onload({ type: 'load' });
  }
  fail() {
    this.onerror && this.onerror({ type: 'error' });
  }
}

const makeFile = (name = 'a.txt', size = 10, type = 'text/plain') => {
  const file = new File([new Array(size).fill('a').join('')], name, { type });
  return file;
};

const selectFiles = async (wrapper: any, files: File[], selector = 'input.semi-upload-hidden-input') => {
  const input = wrapper.find(selector);
  Object.defineProperty(input.element, 'files', { configurable: true, value: files });
  await input.trigger('change');
  await flushPromises();
  await nextTick();
};

const flush = async () => {
  await flushPromises();
  await nextTick();
  await nextTick();
};

const fileItem = (over: Record<string, any> = {}): any => ({ uid: 'u1', name: 'file.txt', size: '1KB', status: 'success', url: 'http://x/file.txt', ...over });

describe('Upload', () => {
  beforeEach(() => {
    MockXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', MockXHR);
    if (!(URL as any).createObjectURL) {
      (URL as any).createObjectURL = () => 'blob:mock';
      (URL as any).revokeObjectURL = () => undefined;
    }
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('renders root, hidden inputs and add trigger with children', () => {
    const wrapper = mount(Upload, { props: { action: '/up' }, slots: { default: () => h('button', { class: 'btn' }, 'pick') } });
    expect(wrapper.classes()).toContain('semi-upload');
    expect(wrapper.attributes('x-prompt-pos')).toBe('right');
    const input = wrapper.find('input.semi-upload-hidden-input');
    expect(input.attributes('type')).toBe('file');
    expect(input.attributes('tabindex')).toBe('-1');
    expect(input.attributes('multiple')).toBeUndefined();
    expect(wrapper.find('input.semi-upload-hidden-input-replace').exists()).toBe(true);
    const add = wrapper.find('.semi-upload-add');
    expect(add.attributes('role')).toBe('button');
    expect(add.find('.btn').text()).toBe('pick');
    expect(wrapper.find('.semi-upload-file-list').exists()).toBe(false);
  });

  it('accept / multiple / directory / capture / className / style / data attrs / validateStatus', () => {
    const wrapper = mount(Upload, {
      props: { action: '/up', accept: 'image/*', multiple: true, directory: true, capture: 'user', className: 'a', class: 'b', style: { color: 'red' }, 'data-x': '1', validateStatus: 'error', promptPosition: 'left', listType: 'picture' },
    });
    const input = wrapper.find('input.semi-upload-hidden-input');
    expect(input.attributes('accept')).toBe('image/*');
    expect(input.attributes('multiple')).toBeDefined();
    expect(input.attributes('webkitdirectory')).toBe('webkitdirectory');
    expect(input.attributes('capture')).toBe('user');
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.classes()).toContain('semi-upload-error');
    expect(wrapper.classes()).toContain('semi-upload-picture');
    expect(wrapper.attributes('style')).toContain('color: red');
    expect(wrapper.attributes('data-x')).toBe('1');
    expect(wrapper.attributes('x-prompt-pos')).toBe('left');
    ['default', 'warning', 'success'].forEach((s) => {
      expect(mount(Upload, { props: { action: '/up', validateStatus: s as any } }).classes()).toContain(`semi-upload-${s}`);
    });
  });

  it('prompt / validateMessage as prop and slot', () => {
    const wrapper = mount(Upload, { props: { action: '/up', prompt: 'tip', validateMessage: 'bad' } });
    expect(wrapper.find('.semi-upload-prompt').text()).toBe('tip');
    expect(wrapper.find('.semi-upload-prompt').attributes('x-semi-prop')).toBe('prompt');
    expect(wrapper.find('.semi-upload-validate-message').text()).toBe('bad');
    const wrapper2 = mount(Upload, { props: { action: '/up' }, slots: { prompt: () => h('i', { class: 'ps' }), validateMessage: () => h('i', { class: 'vs' }) } });
    expect(wrapper2.find('.semi-upload-prompt .ps').exists()).toBe(true);
    expect(wrapper2.find('.semi-upload-validate-message .vs').exists()).toBe(true);
  });

  it('click on trigger opens the file dialog and emits openFileDialog; disabled does nothing', async () => {
    const wrapper = mount(Upload, { props: { action: '/up' }, slots: { default: () => 'pick' } });
    const click = vi.spyOn(wrapper.find('input.semi-upload-hidden-input').element as HTMLInputElement, 'click');
    await wrapper.find('.semi-upload-add').trigger('click');
    expect(click).toHaveBeenCalled();
    expect(wrapper.emitted('openFileDialog')).toHaveLength(1);
    const disabled = mount(Upload, { props: { action: '/up', disabled: true }, slots: { default: () => 'pick' } });
    expect(disabled.classes()).toContain('semi-upload-disabled');
    expect(disabled.find('.semi-upload-add').attributes('aria-disabled')).toBe('true');
    const click2 = vi.spyOn(disabled.find('input.semi-upload-hidden-input').element as HTMLInputElement, 'click');
    await disabled.find('.semi-upload-add').trigger('click');
    expect(click2).not.toHaveBeenCalled();
    expect(disabled.emitted('openFileDialog')).toBeUndefined();
  });

  it('selecting a file: emits fileChange/change/update:fileList, posts XHR, progress/success flow', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', name: 'myfile', data: { a: '1' }, headers: { 'X-Token': 't' }, withCredentials: true } });
    const file = makeFile('a.txt');
    await selectFiles(wrapper, [file]);
    expect(wrapper.emitted('fileChange')![0][0]).toHaveLength(1);
    const change = wrapper.emitted('change')![0][0] as any;
    expect(change.fileList).toHaveLength(1);
    expect(change.currentFile.name).toBe('a.txt');
    expect(change.currentFile.status).toBe('uploading');
    expect(wrapper.emitted('update:fileList')![0][0]).toHaveLength(1);
    // list rendered
    expect(wrapper.find('.semi-upload-file-list').exists()).toBe(true);
    expect(wrapper.find('.semi-upload-file-list-title-choosen').exists()).toBe(true);
    const card = wrapper.find('.semi-upload-file-card');
    expect(card.exists()).toBe(true);
    expect(card.find('.semi-upload-file-card-info-name').text()).toBe('a.txt');
    // xhr
    expect(MockXHR.instances).toHaveLength(1);
    const xhr = MockXHR.instances[0];
    expect(xhr.method).toBe('post');
    expect(xhr.url).toBe('/up');
    expect(xhr.withCredentials).toBe(true);
    expect(xhr.headers['X-Token']).toBe('t');
    expect(xhr.sent).toBeInstanceOf(FormData);
    expect((xhr.sent as FormData).get('a')).toBe('1');
    expect((xhr.sent as FormData).get('myfile')).toBeTruthy();
    // progress
    xhr.progress(50, 100);
    await flush();
    expect(wrapper.emitted('progress')![0][0]).toBe(48);
    expect(wrapper.find('.semi-progress').exists()).toBe(true);
    expect(wrapper.find('.semi-progress-track-inner').attributes('style')).toContain('width: 48%');
    // success
    xhr.respond(200, '{"url":"http://x/a.txt"}');
    await flush();
    const success = wrapper.emitted('success')![0];
    expect(success[0]).toEqual({ url: 'http://x/a.txt' });
    expect((success[2] as any)[0].status).toBe('success');
    expect(wrapper.find('.semi-progress').exists()).toBe(false);
    expect(wrapper.emitted('progress')!.pop()![0]).toBe(100);
  });

  it('data / headers as functions', async () => {
    const data = vi.fn(() => ({ k: 'v' }));
    const headers = vi.fn(() => ({ H: '1' }));
    const wrapper = mount(Upload, { props: { action: '/up', data, headers } });
    const file = makeFile();
    await selectFiles(wrapper, [file]);
    expect(data).toHaveBeenCalledWith(file);
    expect(headers).toHaveBeenCalledWith(file);
    expect((MockXHR.instances[0].sent as FormData).get('k')).toBe('v');
    expect(MockXHR.instances[0].headers.H).toBe('1');
  });

  it('upload error (xhr status / onerror): emits error, shows fail state, retry re-posts and emits retry', async () => {
    const wrapper = mount(Upload, { props: { action: '/up' } });
    await selectFiles(wrapper, [makeFile()]);
    MockXHR.instances[0].respond(500);
    await flush();
    const err = wrapper.emitted('error')![0];
    expect((err[0] as any).status).toBe(500);
    expect((err[2] as any)[0].status).toBe('uploadFail');
    const card = wrapper.find('.semi-upload-file-card');
    expect(card.classes()).toContain('semi-upload-file-card-fail');
    expect(card.find('.semi-upload-file-card-info-validate-message').text()).toContain('上传失败');
    expect(card.find('.semi-upload-file-card-info-retry').exists()).toBe(true);
    await card.find('.semi-upload-file-card-info-retry').trigger('click');
    await flush();
    expect((wrapper.emitted('retry')![0][0] as any).name).toBe('a.txt');
    expect(MockXHR.instances).toHaveLength(2);
    MockXHR.instances[1].fail();
    await flush();
    expect(wrapper.emitted('error')).toHaveLength(2);
    // showRetry=false hides retry
    const noRetry = mount(Upload, { props: { action: '/up', showRetry: false, defaultFileList: [fileItem({ status: 'uploadFail' })] } });
    expect(noRetry.find('.semi-upload-file-card-info-retry').exists()).toBe(false);
  });

  it('customRequest is used instead of XHR and drives progress/success/error', async () => {
    const customRequest = vi.fn();
    const wrapper = mount(Upload, { props: { action: '/up', customRequest, withCredentials: true } });
    const file = makeFile();
    await selectFiles(wrapper, [file]);
    // the foundation instantiates an XHR before branching, but never opens / sends it
    expect(MockXHR.instances.every((x) => x.sent === null && x.url === '')).toBe(true);
    expect(customRequest).toHaveBeenCalledTimes(1);
    const args = customRequest.mock.calls[0][0];
    expect(args.fileName).toBe('a.txt');
    expect(args.fileInstance).toBe(file);
    expect(args.action).toBe('/up');
    expect(args.withCredentials).toBe(true);
    args.onProgress({ loaded: 1, total: 2 });
    await flush();
    expect(wrapper.emitted('progress')![0][0]).toBe(48);
    args.onSuccess({ id: 1 });
    await flush();
    expect(wrapper.emitted('success')![0][0]).toEqual({ id: 1 });
    args.onError({ status: 400 });
    await flush();
    expect((wrapper.emitted('error')![0][0] as any).status).toBe(400);
  });

  it('beforeUpload false / object / promise; afterUpload changes name/url/status', async () => {
    const beforeUpload = vi.fn(({ file }: any) => (file.name === 'skip.txt' ? false : { shouldUpload: true, status: 'validating', validateMessage: 'checking' }));
    const afterUpload = vi.fn(() => ({ status: 'success', name: 'renamed.txt', url: 'http://x/renamed', validateMessage: 'done' }));
    const wrapper = mount(Upload, { props: { action: '/up', beforeUpload, afterUpload, multiple: true } });
    await selectFiles(wrapper, [makeFile('skip.txt'), makeFile('go.txt')]);
    expect(beforeUpload).toHaveBeenCalledTimes(2);
    expect(MockXHR.instances).toHaveLength(1);
    const cards = wrapper.findAll('.semi-upload-file-card');
    expect(cards[1].find('.semi-upload-file-card-info-validate-message').text()).toContain('checking');
    expect(cards[1].find('.semi-upload-file-card-icon-loading').exists()).toBe(true);
    MockXHR.instances[0].respond(200, '{}');
    await flush();
    expect(afterUpload).toHaveBeenCalled();
    const list = (wrapper.emitted('success')!.pop() as any)[2] as any[];
    expect(list[1].name).toBe('renamed.txt');
    expect(list[1].url).toBe('http://x/renamed');
    expect(wrapper.findAll('.semi-upload-file-card-info-name')[1].text()).toBe('renamed.txt');

    const wrapper2 = mount(Upload, { props: { action: '/up', beforeUpload: () => Promise.resolve({ shouldUpload: false, autoRemove: true }) } });
    await selectFiles(wrapper2, [makeFile()]);
    await flush();
    expect(MockXHR.instances).toHaveLength(1);
    expect(wrapper2.findAll('.semi-upload-file-card')).toHaveLength(0);
  });

  it('limit: exceed emits, limit=1 replaces, extra files trimmed', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', limit: 1 } });
    await selectFiles(wrapper, [makeFile('1.txt')]);
    await selectFiles(wrapper, [makeFile('2.txt')]);
    expect(wrapper.emitted('exceed')).toHaveLength(1);
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);
    expect(wrapper.find('.semi-upload-file-card-info-name').text()).toBe('2.txt');
    // limit === 1 hides the title
    expect(wrapper.find('.semi-upload-file-list-title').exists()).toBe(false);

    const wrapper2 = mount(Upload, { props: { action: '/up', limit: 2, multiple: true } });
    await selectFiles(wrapper2, [makeFile('1.txt'), makeFile('2.txt'), makeFile('3.txt')]);
    expect(wrapper2.emitted('exceed')![0][0]).toHaveLength(3);
    expect(wrapper2.findAll('.semi-upload-file-card')).toHaveLength(2);
  });

  it('maxSize / minSize: sizeError emitted, invalid file not uploaded and shows message', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', maxSize: 1, multiple: true } });
    await selectFiles(wrapper, [makeFile('big.txt', 5000)]);
    expect((wrapper.emitted('sizeError')![0][0] as any).name).toBe('big.txt');
    expect(MockXHR.instances).toHaveLength(0);
    const card = wrapper.find('.semi-upload-file-card');
    expect(card.classes()).toContain('semi-upload-file-card-fail');
    expect(card.find('.semi-upload-file-card-info-validate-message').text()).toContain('文件尺寸不合法');
    const wrapper2 = mount(Upload, { props: { action: '/up', minSize: 100 } });
    await selectFiles(wrapper2, [makeFile('small.txt', 10)]);
    expect(wrapper2.emitted('sizeError')).toHaveLength(1);
  });

  it('accept filters files and emits acceptInvalid', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', accept: '.png,image/*', multiple: true } });
    await selectFiles(wrapper, [makeFile('a.txt', 10, 'text/plain'), makeFile('b.png', 10, 'image/png')]);
    expect((wrapper.emitted('acceptInvalid')![0][0] as any)[0].name).toBe('a.txt');
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);
    expect(wrapper.find('.semi-upload-file-card-preview').classes()).not.toContain('semi-upload-file-card-preview-placeholder');
  });

  it('transformFile is applied', async () => {
    const transformFile = vi.fn((f: File) => {
      (f as any).uid = 'custom-uid';
      return f;
    });
    const wrapper = mount(Upload, { props: { action: '/up', transformFile } });
    await selectFiles(wrapper, [makeFile()]);
    expect(transformFile).toHaveBeenCalled();
    expect((wrapper.emitted('change')![0][0] as any).fileList[0].uid).toBe('custom-uid');
  });

  it('remove: beforeRemove gate, emits remove/change; showClear + beforeClear + clear', async () => {
    const beforeRemove = vi.fn(() => false);
    const wrapper = mount(Upload, { props: { action: '/up', beforeRemove, defaultFileList: [fileItem(), fileItem({ uid: 'u2', name: 'b.txt' })] } });
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(2);
    await wrapper.find('.semi-upload-file-card-close').trigger('click');
    await flush();
    expect(beforeRemove).toHaveBeenCalled();
    expect(wrapper.emitted('remove')).toBeUndefined();
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(2);
    await wrapper.setProps({ beforeRemove: () => Promise.resolve(true) });
    await wrapper.find('.semi-upload-file-card-close').trigger('click');
    await flush();
    expect((wrapper.emitted('remove')![0][2] as any).uid).toBe('u1');
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);
    expect((wrapper.emitted('change')!.pop()![0] as any).fileList).toHaveLength(1);
    // clear
    const clearBtn = wrapper.find('.semi-upload-file-list-title-clear');
    expect(clearBtn.exists()).toBe(true);
    expect(clearBtn.text()).toBe('清空');
    const beforeClear = vi.fn(() => true);
    await wrapper.setProps({ beforeClear });
    await clearBtn.trigger('click');
    await flush();
    expect(beforeClear).toHaveBeenCalled();
    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(0);
    // showClear=false / disabled hides the clear button
    expect(mount(Upload, { props: { action: '/up', showClear: false, defaultFileList: [fileItem()] } }).find('.semi-upload-file-list-title-clear').exists()).toBe(false);
    expect(mount(Upload, { props: { action: '/up', disabled: true, defaultFileList: [fileItem()] } }).find('.semi-upload-file-list-title-clear').exists()).toBe(false);
  });

  it('fileListTitle as node and as function', () => {
    const wrapper = mount(Upload, { props: { action: '/up', fileListTitle: 'My files', defaultFileList: [fileItem()] } });
    expect(wrapper.find('.semi-upload-file-list-title-choosen').text()).toBe('My files');
    const fn = vi.fn(({ fileList, clearText }: any) => h('b', { class: 'ttl' }, `${fileList.length}-${clearText}`));
    const wrapper2 = mount(Upload, { props: { action: '/up', fileListTitle: fn, defaultFileList: [fileItem()] } });
    expect(wrapper2.find('.ttl').text()).toBe('1-清空');
    expect(typeof fn.mock.calls[0][0].onClear).toBe('function');
    const wrapper3 = mount(Upload, { props: { action: '/up', defaultFileList: [fileItem()] }, slots: { fileListTitle: () => h('u', { class: 'slot-ttl' }) } });
    expect(wrapper3.find('.slot-ttl').exists()).toBe(true);
  });

  it('controlled fileList (v-model:fileList) does not change until parent updates', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', fileList: [fileItem()] } });
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);
    await wrapper.find('.semi-upload-file-card-close').trigger('click');
    await flush();
    expect(wrapper.emitted('update:fileList')![0][0]).toHaveLength(0);
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);
    await wrapper.setProps({ fileList: [] });
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(0);

    const Parent = defineComponent({
      setup() {
        const list = ref<any[]>([fileItem()]);
        return () => h('div', [h(Upload, { action: '/up', fileList: list.value, 'onUpdate:fileList': (v: any[]) => (list.value = v) }), h('span', { id: 'n' }, String(list.value.length))]);
      },
    });
    const p = mount(Parent);
    await p.find('.semi-upload-file-card-close').trigger('click');
    await flush();
    expect(p.find('#n').text()).toBe('0');
    expect(p.findAll('.semi-upload-file-card')).toHaveLength(0);
  });

  it('showUploadList=false hides list; listType=none renders nothing extra', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', showUploadList: false, defaultFileList: [fileItem()] } });
    expect(wrapper.find('.semi-upload-file-list').exists()).toBe(false);
    const none = mount(Upload, { props: { action: '/up', listType: 'none', defaultFileList: [fileItem()] }, slots: { default: () => 'x' } });
    expect(none.find('.semi-upload-file-list').exists()).toBe(false);
    expect(none.find('.semi-upload-add').exists()).toBe(true);
  });

  it('itemStyle / previewFile / renderFileItem / renderFileOperation / fileItem slot / showTooltip', () => {
    const previewFile = vi.fn(() => h('i', { class: 'pv' }));
    const renderFileOperation = vi.fn(() => h('i', { class: 'op' }));
    const wrapper = mount(Upload, { props: { action: '/up', itemStyle: { color: 'red' }, previewFile, renderFileOperation, showTooltip: false, defaultFileList: [fileItem()] } });
    const card = wrapper.find('.semi-upload-file-card');
    expect(card.attributes('style')).toContain('color: red');
    expect(card.find('.semi-upload-file-card-preview .pv').exists()).toBe(true);
    expect(card.find('.semi-upload-file-card-preview').classes()).toContain('semi-upload-file-card-preview-placeholder');
    expect(card.find('.op').exists()).toBe(true);
    expect(card.find('.semi-upload-file-card-close').exists()).toBe(false);
    expect(card.find('.semi-upload-file-card-info-name').attributes('title')).toBeUndefined();
    expect((previewFile.mock.calls[0] as any)[0].name).toBe('file.txt');

    const renderFileItem = vi.fn((p: any) => h('div', { class: 'custom-item' }, p.name));
    const wrapper2 = mount(Upload, { props: { action: '/up', renderFileItem, defaultFileList: [fileItem()] } });
    expect(wrapper2.find('.custom-item').text()).toBe('file.txt');
    expect(typeof renderFileItem.mock.calls[0][0].onRemove).toBe('function');
    const wrapper3 = mount(Upload, { props: { action: '/up', defaultFileList: [fileItem()] }, slots: { fileItem: (p: any) => h('div', { class: 'slot-item' }, p.name) } });
    expect(wrapper3.find('.slot-item').text()).toBe('file.txt');
  });

  it('onPreviewClick: pointer class and emits previewClick with the file', async () => {
    const onPreviewClick = vi.fn();
    const wrapper = mount(Upload, { props: { action: '/up', onPreviewClick, defaultFileList: [fileItem()] } });
    const card = wrapper.find('.semi-upload-file-card');
    expect(card.classes()).toContain('semi-upload-file-card-show-pointer');
    await card.trigger('click');
    expect(onPreviewClick).toHaveBeenCalled();
    expect((wrapper.emitted('previewClick')![0][0] as any).uid).toBe('u1');
    const plain = mount(Upload, { props: { action: '/up', defaultFileList: [fileItem()] } });
    expect(plain.find('.semi-upload-file-card').classes()).not.toContain('semi-upload-file-card-show-pointer');
  });

  it('showReplace: replace button opens the replace input and replaces the file', async () => {
    const wrapper = mount(Upload, { attachTo: document.body, props: { action: '/up', showReplace: true, defaultFileList: [fileItem()] } });
    const replaceInput = wrapper.find('input.semi-upload-hidden-input-replace').element as HTMLInputElement;
    const click = vi.spyOn(replaceInput, 'click');
    expect(wrapper.find('.semi-upload-file-card-replace').exists()).toBe(true);
    await wrapper.find('.semi-upload-file-card-replace button').trigger('click');
    await flush();
    expect(click).toHaveBeenCalled();
    await selectFiles(wrapper, [makeFile('new.txt')], 'input.semi-upload-hidden-input-replace');
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);
    expect(wrapper.find('.semi-upload-file-card-info-name').text()).toBe('new.txt');
    expect(MockXHR.instances).toHaveLength(1);
    wrapper.unmount();
  });

  it('uploadTrigger=custom waits; exposed upload() / insert() / openFileDialog()', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', uploadTrigger: 'custom' } });
    await selectFiles(wrapper, [makeFile()]);
    expect(MockXHR.instances).toHaveLength(0);
    expect((wrapper.emitted('change')![0][0] as any).currentFile.status).toBe('wait');
    const vm = wrapper.vm as any;
    vm.upload();
    await flush();
    expect(MockXHR.instances).toHaveLength(1);
    vm.insert([makeFile('ins.txt')], 0);
    await flush();
    expect(wrapper.findAll('.semi-upload-file-card-info-name')[0].text()).toBe('ins.txt');
    const click = vi.spyOn(wrapper.find('input.semi-upload-hidden-input').element as HTMLInputElement, 'click');
    vm.openFileDialog();
    expect(click).toHaveBeenCalled();
    expect(wrapper.emitted('openFileDialog')).toHaveLength(1);
  });

  it('draggable: renders drag area with default icon/texts, custom dragIcon/dragMainText/dragSubText, drag status and drop', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', draggable: true, dragSubText: 'sub' } });
    const area = wrapper.find('.semi-upload-drag-area');
    expect(area.exists()).toBe(true);
    expect(area.find('.semi-upload-drag-area-icon .semi-icon-upload').exists()).toBe(true);
    expect(area.find('.semi-upload-drag-area-main-text').text()).toBe('点击上传文件或拖拽文件到这里');
    expect(area.find('.semi-upload-drag-area-sub-text').text()).toBe('sub');
    await area.trigger('dragenter');
    expect(wrapper.find('.semi-upload-drag-area').classes()).toContain('semi-upload-drag-area-legal');
    expect(wrapper.find('.semi-upload-drag-area-tips-legal').text()).toBe('松手开始上传');
    await area.trigger('dragleave');
    expect(wrapper.find('.semi-upload-drag-area').classes()).not.toContain('semi-upload-drag-area-legal');
    const file = makeFile('d.txt');
    const drop = new Event('drop', { bubbles: true, cancelable: true }) as any;
    drop.dataTransfer = { files: [file], items: [] };
    area.element.dispatchEvent(drop);
    await flush();
    expect(drop.defaultPrevented).toBe(true);
    expect((wrapper.emitted('drop')![0][1] as any)[0]).toBe(file);
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);

    const custom = mount(Upload, { props: { action: '/up', draggable: true, dragIcon: h('i', { class: 'di' }), dragMainText: 'main' } });
    expect(custom.find('.semi-upload-drag-area-icon .di').exists()).toBe(true);
    expect(custom.find('.semi-upload-drag-area-main-text').text()).toBe('main');
    const slotted = mount(Upload, { props: { action: '/up', draggable: true }, slots: { dragIcon: () => h('i', { class: 'dis' }), dragMainText: () => 'M', dragSubText: () => 'S' } });
    expect(slotted.find('.dis').exists()).toBe(true);
    expect(slotted.find('.semi-upload-drag-area-main-text').text()).toBe('M');
    expect(slotted.find('.semi-upload-drag-area-sub-text').text()).toBe('S');
    const withChildren = mount(Upload, { props: { action: '/up', draggable: true }, slots: { default: () => h('b', { class: 'cc' }) } });
    expect(withChildren.find('.semi-upload-drag-area').classes()).toContain('semi-upload-drag-area-custom');
    expect(withChildren.find('.semi-upload-drag-area .cc').exists()).toBe(true);
    // disabled: dragenter does not mark legal
    const disabled = mount(Upload, { props: { action: '/up', draggable: true, disabled: true } });
    await disabled.find('.semi-upload-drag-area').trigger('dragenter');
    expect(disabled.find('.semi-upload-drag-area').classes()).not.toContain('semi-upload-drag-area-legal');
  });

  it('picture list: add trigger, cards, showPicInfo, picWidth/picHeight, hotSpotLocation, limit hides trigger', async () => {
    const list = [fileItem({ url: 'http://x/a.png', name: 'a.png' }), fileItem({ uid: 'u2', url: 'http://x/b.png', name: 'b.png', status: 'uploading', percent: 30 })];
    const wrapper = mount(Upload, { props: { action: '/up', listType: 'picture', showPicInfo: true, picWidth: 100, picHeight: 80, defaultFileList: list }, slots: { default: () => h('i', { class: 'plus' }) } });
    expect(wrapper.find('.semi-upload-file-list').classes()).toContain('semi-upload-picture-file-list');
    const main = wrapper.find('.semi-upload-file-list-main');
    expect(main.attributes('aria-label')).toBe('picture list');
    const children = Array.from(main.element.children) as HTMLElement[];
    expect(children[children.length - 1].classList.contains('semi-upload-picture-add')).toBe(true);
    const add = wrapper.find('.semi-upload-picture-add');
    expect(add.find('.plus').exists()).toBe(true);
    expect(add.attributes('style')).toContain('height: 80px');
    expect(add.attributes('style')).toContain('width: 100px');
    const cards = wrapper.findAll('.semi-upload-picture-file-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].find('img').attributes('src')).toBe('http://x/a.png');
    expect(cards[0].attributes('style')).toContain('width: 100px');
    expect(cards[0].find('.semi-upload-picture-file-card-pic-info').text()).toBe('1');
    expect(cards[0].find('.semi-upload-picture-file-card-preview').exists()).toBe(true);
    expect(cards[0].find('.semi-upload-picture-file-card-close .semi-icon-clear').exists()).toBe(true);
    expect(cards[1].classes()).toContain('semi-upload-picture-file-card-uploading');
    expect(cards[1].find('.semi-progress-circle').exists()).toBe(true);

    const start = mount(Upload, { props: { action: '/up', listType: 'picture', hotSpotLocation: 'start', defaultFileList: [fileItem()] } });
    expect((start.find('.semi-upload-file-list-main').element.children[0] as HTMLElement).classList.contains('semi-upload-picture-add')).toBe(true);
    const limited = mount(Upload, { props: { action: '/up', listType: 'picture', limit: 1, defaultFileList: [fileItem()] } });
    expect(limited.find('.semi-upload-picture-add').exists()).toBe(false);
    const empty = mount(Upload, { props: { action: '/up', listType: 'picture', disabled: true } });
    expect(empty.find('.semi-upload-picture-add').classes()).toContain('semi-upload-picture-add-disabled');
    expect(empty.find('.semi-upload-file-list').exists()).toBe(false);
    // draggable picture add area
    const drag = mount(Upload, { props: { action: '/up', listType: 'picture', draggable: true } });
    await drag.find('.semi-upload-picture-add').trigger('dragenter');
    expect(drag.find('.semi-upload-picture-add').classes()).toContain('semi-upload-drag-area-legal');
  });

  it('picture card: retry / replace / renderPicInfo / renderPicClose / renderPicPreviewIcon / renderThumbnail / error tooltip / image fallback', async () => {
    const renderPicInfo = vi.fn(() => h('i', { class: 'pi' }));
    const renderPicClose = vi.fn(({ className, remove }: any) => h('i', { class: ['pc', className], onClick: remove }));
    const renderPicPreviewIcon = vi.fn(() => h('i', { class: 'ppi' }));
    const renderThumbnail = vi.fn(() => h('i', { class: 'th' }));
    const wrapper = mount(Upload, {
      attachTo: document.body,
      props: { action: '/up', listType: 'picture', showPicInfo: true, renderPicInfo, renderPicClose, renderPicPreviewIcon, renderThumbnail, defaultFileList: [fileItem(), fileItem({ uid: 'u2', status: 'uploadFail', fileInstance: makeFile('fail.png', 12, 'image/png') })] },
    });
    const cards = wrapper.findAll('.semi-upload-picture-file-card');
    expect(cards[0].find('.pi').exists()).toBe(true);
    expect(cards[0].find('.ppi').exists()).toBe(true);
    expect(cards[0].find('.th').exists()).toBe(true);
    expect(cards[1].classes()).toContain('semi-upload-picture-file-card-error');
    expect(cards[1].find('.semi-upload-picture-file-card-retry').exists()).toBe(true);
    expect(cards[1].find('.semi-upload-picture-file-card-icon-error').exists()).toBe(true);
    await cards[1].find('.semi-upload-picture-file-card-retry').trigger('click');
    await flush();
    expect(wrapper.emitted('retry')).toHaveLength(1);
    expect(MockXHR.instances).toHaveLength(1);
    await cards[0].find('.pc').trigger('click');
    await flush();
    expect((wrapper.emitted('remove')![0][2] as any).uid).toBe('u1');
    wrapper.unmount();

    const rep = mount(Upload, { props: { action: '/up', listType: 'picture', showReplace: true, defaultFileList: [fileItem()] } });
    expect(rep.find('.semi-upload-picture-file-card-replace').exists()).toBe(true);
    expect(rep.find('.semi-upload-picture-file-card-preview').exists()).toBe(false);
    // image fallback
    const fb = mount(Upload, { props: { action: '/up', listType: 'picture', defaultFileList: [fileItem()] } });
    await fb.find('.semi-upload-picture-file-card img').trigger('error');
    expect(fb.find('.semi-upload-picture-file-card').classes()).toContain('semi-upload-picture-file-card-preview-fallback');
    expect(fb.find('.semi-upload-picture-file-card .semi-icon-file').exists()).toBe(true);
    // disabled hides close
    const dis = mount(Upload, { props: { action: '/up', listType: 'picture', disabled: true, defaultFileList: [fileItem()] } });
    expect(dis.find('.semi-upload-picture-file-card').classes()).toContain('semi-upload-picture-file-card-disabled');
    expect(dis.find('.semi-upload-picture-file-card-close').exists()).toBe(false);
  });

  it('addOnPasting: paste event with files adds them; unbinds on unmount', async () => {
    const wrapper = mount(Upload, { attachTo: document.body, props: { action: '/up', addOnPasting: true } });
    const file = makeFile('p.png', 10, 'image/png');
    const ev = new Event('paste', { bubbles: true, cancelable: true }) as any;
    ev.clipboardData = { items: [{ kind: 'file', getAsFile: () => file }] };
    document.body.dispatchEvent(ev);
    await flush();
    expect(ev.defaultPrevented).toBe(true);
    expect(wrapper.findAll('.semi-upload-file-card')).toHaveLength(1);
    wrapper.unmount();
    const ev2 = new Event('paste', { bubbles: true, cancelable: true }) as any;
    ev2.clipboardData = { items: [{ kind: 'file', getAsFile: () => file }] };
    document.body.dispatchEvent(ev2);
    expect(ev2.defaultPrevented).toBe(false);
  });

  it('locale: en_US strings through LocaleProvider', () => {
    const wrapper = mount(LocaleProvider, {
      props: { locale: en_US as any },
      slots: { default: () => h(Upload, { action: '/up', draggable: true, defaultFileList: [fileItem({ status: 'uploadFail' })] }) },
    });
    expect(wrapper.find('.semi-upload-drag-area-main-text').text()).toBe(en_US.Upload.mainText);
    expect(wrapper.find('.semi-upload-file-list-title-clear').text()).toBe(en_US.Upload.clear);
    expect(wrapper.find('.semi-upload-file-card-info-retry').text()).toBe(en_US.Upload.retry);
    expect(wrapper.find('.semi-upload-file-card-info-validate-message').text()).toContain(en_US.Upload.fail);
  });

  it('unmount aborts in-flight XHR progress and statics exist', async () => {
    const wrapper = mount(Upload, { props: { action: '/up' } });
    await selectFiles(wrapper, [makeFile()]);
    const xhr = MockXHR.instances[0];
    wrapper.unmount();
    xhr.progress(1, 2);
    expect(xhr.aborted).toBe(true);
    expect((Upload as any).FileCard).toBe(FileCard);
    expect((Upload as any).__SemiComponentName__).toBe('Upload');
  });
});

describe('FileCard', () => {
  it('list card: size formatting, validating spin, custom validateMessage node, callbacks', async () => {
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    const wrapper = mount(FileCard, { props: { name: 'n.txt', size: 2048, status: 'validating', validateMessage: 'v', onRemove, onRetry, showRetry: true } });
    expect(wrapper.find('.semi-upload-file-card-info-size').text()).toBe('2.0KB');
    expect(wrapper.find('.semi-upload-file-card-icon-loading').exists()).toBe(true);
    await wrapper.find('.semi-upload-file-card-close').trigger('click');
    expect(onRemove).toHaveBeenCalled();
    const fail = mount(FileCard, { props: { name: 'n', status: 'uploadFail', validateMessage: h('i', { class: 'vm' }), onRetry, showRetry: true } });
    expect(fail.find('.vm').exists()).toBe(true);
    await fail.find('.semi-upload-file-card-info-retry').trigger('click');
    expect(onRetry).toHaveBeenCalled();
    const str = mount(FileCard, { props: { name: 'n', status: 'validateFail', validateMessage: 'bad' } });
    expect(str.find('.semi-upload-file-card-icon-error').exists()).toBe(true);
    expect(str.classes()).toContain('semi-upload-file-card-fail');
    expect(mount(FileCard, { props: { listType: 'none' } }).find('[role=listitem]').exists()).toBe(false);
  });
});

describe('Upload crop', () => {
  beforeEach(() => {
    MockXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', MockXHR);
    (URL as any).createObjectURL = () => 'blob:mock';
    (URL as any).revokeObjectURL = () => undefined;
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const img = (name = 'a.png') => makeFile(name, 10, 'image/png');

  it('crop=true intercepts image selection and opens the cropper modal (locale title / custom titles / cropModalProps)', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', crop: true }, attachTo: document.body });
    await selectFiles(wrapper, [img()]);
    expect(MockXHR.instances.length).toBe(0);
    expect((wrapper.vm as any).$.exposed.cropperRef).toBeDefined();
    const modal = document.body.querySelector('.semi-modal');
    expect(modal).not.toBeNull();
    expect(document.body.querySelector('.semi-modal-title')!.textContent).toBe('裁切图片');
    expect(document.body.querySelector('.semi-upload-cropper-modal')).not.toBeNull();
    expect(document.body.querySelector('.semi-cropper')).not.toBeNull();
    wrapper.unmount();

    const wrapper2 = mount(Upload, {
      props: { action: '/up', crop: { modalTitle: 'T', modalOkText: 'OK!', modalCancelText: 'NO!', shape: 'round', aspectRatio: 1 }, cropModalProps: { width: 800, bodyStyle: { backgroundColor: 'rgb(1, 2, 3)' } } },
      attachTo: document.body,
    });
    await selectFiles(wrapper2, [img()]);
    expect(document.body.querySelector('.semi-modal-title')!.textContent).toBe('T');
    const btns = Array.from(document.body.querySelectorAll('.semi-modal-footer .semi-button')).map((b) => b.textContent);
    expect(btns).toContain('OK!');
    expect(btns).toContain('NO!');
    expect((document.body.querySelector('.semi-modal-body') as HTMLElement).style.backgroundColor).toBe('rgb(1, 2, 3)');
    // width is fixed to 600 after spreading cropModalProps (React parity)
    expect((document.body.querySelector('.semi-modal') as HTMLElement).style.width).toBe('600px');
    wrapper2.unmount();
  });

  it('non-image files bypass cropping; cancel resets state; ok crops and uploads', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', crop: true, cropModalProps: { motion: false } }, attachTo: document.body });
    await selectFiles(wrapper, [makeFile('a.txt')]);
    expect(MockXHR.instances.length).toBe(1);
    expect(document.body.querySelector('.semi-modal')).toBeNull();

    await selectFiles(wrapper, [img()]);
    expect(document.body.querySelector('.semi-modal')).not.toBeNull();
    (wrapper.vm as any).$.exposed.handleCropCancel();
    await flush();
    expect(document.body.querySelector('.semi-modal')).toBeNull();
    expect(MockXHR.instances.length).toBe(1);

    await selectFiles(wrapper, [img('b.png'), makeFile('c.txt')]);
    const exposed = (wrapper.vm as any).$.exposed;
    // stub the cropper canvas
    exposed.cropperRef.value = {
      getCropperCanvas: () => ({ toBlob: (cb: any, type: string) => cb(new Blob(['x'], { type })) }),
    };
    await exposed.handleCropOk();
    await flush();
    expect(document.body.querySelector('.semi-modal')).toBeNull();
    // cropped image + non-image file dispatched together
    expect(MockXHR.instances.length).toBe(3);
    const names = wrapper.findAll('.semi-upload-file-card-info-name').map((n) => n.text());
    expect(names).toContain('b.png');
    expect(names).toContain('c.txt');
    wrapper.unmount();
  });

  it('beforeCrop=false skips cropping and uploads directly; throwing beforeCrop calls onCropError + emits cropError', async () => {
    const beforeCrop = vi.fn(() => false);
    const wrapper = mount(Upload, { props: { action: '/up', crop: true, beforeCrop } });
    await selectFiles(wrapper, [img()]);
    expect(beforeCrop).toHaveBeenCalledTimes(1);
    expect(beforeCrop.mock.calls[0][0]).toBeInstanceOf(File);
    expect(MockXHR.instances.length).toBe(1);
    expect(document.body.querySelector('.semi-modal')).toBeNull();

    const onCropError = vi.fn();
    const wrapper2 = mount(Upload, { props: { action: '/up', crop: true, onCropError, beforeCrop: () => Promise.reject(new Error('nope')) } });
    await selectFiles(wrapper2, [img()]);
    expect(onCropError).toHaveBeenCalled();
    expect(wrapper2.emitted('cropError')).toBeTruthy();
    // failure -> skipped cropping, uploaded directly
    expect(MockXHR.instances.length).toBe(2);
  });

  it('handleCropOk without cropper instance reports cropError', async () => {
    const onCropError = vi.fn();
    const wrapper = mount(Upload, { props: { action: '/up', crop: true, onCropError }, attachTo: document.body });
    await selectFiles(wrapper, [img()]);
    const exposed = (wrapper.vm as any).$.exposed;
    exposed.cropperRef.value = null;
    await exposed.handleCropOk();
    expect(onCropError).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('draggable + crop: dropping images emits drop and opens cropper instead of uploading', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', crop: true, draggable: true }, attachTo: document.body });
    const area = wrapper.find('.semi-upload-drag-area');
    const file = img();
    const drop = new Event('drop', { bubbles: true, cancelable: true }) as any;
    drop.dataTransfer = { files: [file], items: [] };
    area.element.dispatchEvent(drop);
    await flush();
    expect(drop.defaultPrevented).toBe(true);
    expect((wrapper.emitted('drop')![0][1] as any)[0]).toBe(file);
    expect(MockXHR.instances.length).toBe(0);
    expect(document.body.querySelector('.semi-modal')).not.toBeNull();
    wrapper.unmount();
  });

  it('addOnPasting + crop: pasted images open the cropper', async () => {
    const wrapper = mount(Upload, { props: { action: '/up', crop: true, addOnPasting: true }, attachTo: document.body });
    const file = img();
    const ev = new Event('paste', { bubbles: true, cancelable: true }) as any;
    ev.clipboardData = { items: [{ kind: 'file', getAsFile: () => file }], files: [file] };
    document.body.dispatchEvent(ev);
    await flush();
    expect(ev.defaultPrevented).toBe(true);
    expect(document.body.querySelector('.semi-modal')).not.toBeNull();
    expect(MockXHR.instances.length).toBe(0);
    wrapper.unmount();
  });
});
