import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TreeSelect from './index';
import { IconSearch } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

const treeData = () => [
  {
    label: 'Asia',
    value: 'Asia',
    key: '0',
    children: [
      { label: 'China', value: 'China', key: '0-0', children: [{ label: 'Beijing', value: 'Beijing', key: '0-0-0' }, { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' }] },
      { label: 'Japan', value: 'Japan', key: '0-1' },
    ],
  },
  { label: 'North America', value: 'North America', key: '1', children: [{ label: 'United States', value: 'United States', key: '1-0' }, { label: 'Canada', value: 'Canada', key: '1-1', disabled: true }] },
];

const popNodes = () => Array.from(document.querySelectorAll('.semi-tree-select-popover .semi-tree-option')) as HTMLElement[];
const popLabels = () => popNodes().map((n) => n.querySelector('.semi-tree-option-label-text')!.textContent);
const base = (props: Record<string, any> = {}, opts: Record<string, any> = {}) =>
  mount(TreeSelect, { attachTo: document.body, props: { treeData: treeData(), motion: false, motionExpand: false, ...props }, ...opts });

describe('TreeSelect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger with a11y attrs, placeholder and arrow; no popup until opened', async () => {
    const wrapper = base({ placeholder: 'pick one' });
    const trigger = wrapper.find('.semi-tree-select');
    expect(trigger.exists()).toBe(true);
    expect(trigger.classes()).toContain('semi-tree-select-single');
    expect(trigger.attributes('role')).toBe('combobox');
    expect(trigger.attributes('aria-haspopup')).toBe('dialog'); // tooltip wrapper sets dialog for custom trigger
    expect(trigger.attributes('aria-label')).toBe('TreeSelect');
    expect(trigger.attributes('tabindex')).toBe('0');
    expect(trigger.find('.semi-tree-select-selection-placeholder').text()).toBe('pick one');
    expect(trigger.find('.semi-tree-select-arrow .semi-icon-chevron_down').exists()).toBe(true);
    expect(document.querySelector('.semi-tree-select-popover')).toBeNull();
    wrapper.unmount();
  });

  it('click opens the dropdown tree, emits visibleChange/focus; selecting emits change/select and closes', async () => {
    const wrapper = base();
    await wrapper.find('.semi-tree-select').trigger('click');
    await wait();
    expect(wrapper.emitted('focus')).toHaveLength(1);
    expect(wrapper.emitted('visibleChange')![0]).toEqual([true]);
    expect(wrapper.find('.semi-tree-select').classes()).toContain('semi-tree-select-focus');
    const pop = document.querySelector('.semi-tree-select-popover') as HTMLElement;
    expect(pop).toBeTruthy();
    expect(pop.querySelector('.semi-tree-wrapper')).toBeTruthy();
    expect(pop.querySelector('.semi-tree-option-list')!.getAttribute('role')).toBe('tree');
    expect(popLabels()).toEqual(['Asia', 'North America']);
    // expand
    (popNodes()[0].querySelector('.semi-tree-option-expand-icon') as HTMLElement).click();
    await nextTick();
    expect(wrapper.emitted('expand')![0][0]).toEqual(['0']);
    expect(popLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    popNodes()[2].click();
    await wait();
    expect(wrapper.emitted('select')![0]).toEqual(['0-1', true, expect.objectContaining({ key: '0-1' })]);
    expect(wrapper.emitted('change')![0][0]).toBe('Japan');
    expect(wrapper.emitted('change')![0][1]).toMatchObject({ key: '0-1' });
    expect(wrapper.emitted('update:value')![0]).toEqual(['Japan']);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['Japan']);
    expect(wrapper.find('.semi-tree-select-selection-content').text()).toBe('Japan');
    expect(wrapper.emitted('visibleChange')![1]).toEqual([false]);
    expect(wrapper.emitted('blur')).toHaveLength(1);
    expect(document.querySelector('.semi-tree-select-popover')).toBeNull();
    wrapper.unmount();
  });

  it('defaultOpen opens initially; clickTriggerToHide=false keeps it open; Esc closes', async () => {
    const wrapper = base({ defaultOpen: true, clickTriggerToHide: false });
    await wait();
    expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy();
    await wrapper.find('.semi-tree-select').trigger('click');
    await wait();
    expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy();
    await wrapper.find('.semi-tree-select').trigger('keydown', { key: 'Escape' });
    await wait();
    expect(document.querySelector('.semi-tree-select-popover')).toBeNull();
    wrapper.unmount();
  });

  it('click outside closes and blurs', async () => {
    const wrapper = base();
    await wrapper.find('.semi-tree-select').trigger('click');
    await wait();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(document.querySelector('.semi-tree-select-popover')).toBeNull();
    expect(wrapper.emitted('blur')).toHaveLength(1);
    wrapper.unmount();
  });

  it('disabled: class, aria, no open', async () => {
    const wrapper = base({ disabled: true });
    expect(wrapper.find('.semi-tree-select').classes()).toContain('semi-tree-select-disabled');
    expect(wrapper.find('.semi-tree-select').attributes('aria-disabled')).toBe('true');
    await wrapper.find('.semi-tree-select').trigger('click');
    await wait();
    expect(document.querySelector('.semi-tree-select-popover')).toBeNull();
    wrapper.unmount();
  });

  it.each([
    ['small', 'semi-tree-select-small'],
    ['large', 'semi-tree-select-large'],
  ] as const)('size=%s', (size, klass) => {
    const wrapper = base({ size });
    expect(wrapper.find('.semi-tree-select').classes()).toContain(klass);
    wrapper.unmount();
  });

  it('validateStatus / borderless / className / style / data attrs', () => {
    const wrapper = base({ validateStatus: 'error', borderless: true, className: 'cls' }, { attrs: { class: 'x', style: 'width: 200px', 'data-foo': 'bar' } });
    const t = wrapper.find('.semi-tree-select');
    expect(t.classes()).toContain('semi-tree-select-error');
    expect(t.classes()).toContain('semi-tree-select-borderless');
    expect(t.classes()).toContain('cls');
    expect(t.classes()).toContain('x');
    expect(t.attributes('data-foo')).toBe('bar');
    expect((t.element as HTMLElement).style.width).toBe('200px');
    const w2 = base({ validateStatus: 'warning' });
    expect(w2.find('.semi-tree-select').classes()).toContain('semi-tree-select-warning');
    wrapper.unmount();
    w2.unmount();
  });

  it('prefix / suffix / insetLabel props and slots', () => {
    const w1 = base({ prefix: 'P', suffix: h(IconSearch), insetLabelId: 'lbl' });
    expect(w1.find('.semi-tree-select').classes()).toContain('semi-tree-select-with-prefix');
    expect(w1.find('.semi-tree-select').classes()).toContain('semi-tree-select-with-suffix');
    expect(w1.find('.semi-tree-select-prefix').classes()).toContain('semi-tree-select-prefix-text');
    expect(w1.find('.semi-tree-select-prefix').attributes('id')).toBe('lbl');
    expect(w1.find('.semi-tree-select-suffix').classes()).toContain('semi-tree-select-suffix-icon');
    const w2 = base({}, { slots: { prefix: () => h('b', 'sp'), suffix: () => 'ss', insetLabel: () => 'il' } });
    expect(w2.find('.semi-tree-select-prefix b').text()).toBe('sp');
    expect(w2.find('.semi-tree-select-suffix').text()).toBe('ss');
    const w3 = base({ insetLabel: 'Inset' });
    expect(w3.find('.semi-tree-select-prefix').classes()).toContain('semi-tree-select-inset-label');
    expect(w3.find('.semi-tree-select-prefix').text()).toBe('Inset');
    w1.unmount();
    w2.unmount();
    w3.unmount();
  });

  it('defaultValue / controlled value / v-model', async () => {
    const w1 = base({ defaultValue: 'Beijing' });
    expect(w1.find('.semi-tree-select-selection-content').text()).toBe('Beijing');
    const w2 = base({ value: 'Asia' });
    expect(w2.find('.semi-tree-select-selection-content').text()).toBe('Asia');
    await w2.find('.semi-tree-select').trigger('click');
    await wait();
    popNodes()[1].click();
    await wait();
    expect(w2.emitted('change')![0][0]).toBe('North America');
    expect(w2.find('.semi-tree-select-selection-content').text()).toBe('Asia');
    await w2.setProps({ value: 'North America' });
    expect(w2.find('.semi-tree-select-selection-content').text()).toBe('North America');
    const Parent = defineComponent({
      setup() {
        const v = ref<any>('Asia');
        return () => h('div', [h(TreeSelect, { treeData: treeData(), motion: false, modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, String(v.value))]);
      },
    });
    document.body.innerHTML = '';
    const w3 = mount(Parent, { attachTo: document.body });
    await w3.find('.semi-tree-select').trigger('click');
    await wait();
    popNodes()[1].click();
    await wait();
    expect(w3.find('#out').text()).toBe('North America');
    w1.unmount();
    w2.unmount();
    w3.unmount();
  });

  it('onChangeWithObject emits node objects', async () => {
    const wrapper = base({ onChangeWithObject: true });
    await wrapper.find('.semi-tree-select').trigger('click');
    await wait();
    popNodes()[0].click();
    await wait();
    expect(wrapper.emitted('change')![0][0]).toMatchObject({ key: '0', label: 'Asia' });
    wrapper.unmount();
  });

  it('renderSelectedItem (single) prop and slot', async () => {
    const w1 = base({ defaultValue: 'Japan', renderSelectedItem: (item: any) => `<${item.label}>` });
    expect(w1.find('.semi-tree-select-selection-content').text()).toBe('<Japan>');
    const w2 = base({ defaultValue: 'Japan' }, { slots: { renderSelectedItem: ({ item }: any) => h('i', { class: 'rs' }, item.value) } });
    expect(w2.find('.semi-tree-select-selection-content .rs').text()).toBe('Japan');
    w1.unmount();
    w2.unmount();
  });

  describe('multiple', () => {
    it('checks nodes, renders tags, removes via tag close, maxTagCount +N', async () => {
      const wrapper = base({ multiple: true, defaultExpandAll: true, maxTagCount: 2 });
      expect(wrapper.find('.semi-tree-select').classes()).toContain('semi-tree-select-multiple');
      await wrapper.find('.semi-tree-select').trigger('click');
      await wait();
      expect(document.querySelector('.semi-tree-select-popover .semi-tree-option-list')!.getAttribute('aria-multiselectable')).toBe('true');
      popNodes()[2].click(); // Beijing
      await wait();
      expect(wrapper.emitted('change')![0][0]).toEqual(['Beijing']);
      expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy(); // stays open
      popNodes()[3].click(); // Shanghai -> China merged
      popNodes()[4].click(); // Japan
      await wait();
      expect(wrapper.emitted('change')![2][0]).toEqual(['Asia']);
      const tags = wrapper.findAll('.semi-tag-group .semi-tag');
      expect(tags).toHaveLength(1);
      expect(tags[0].text()).toBe('Asia');
      popNodes()[6].click(); // North America (Canada disabled -> only United States gets checked; Asia still checked)
      await wait();
      expect(wrapper.emitted('change')![3][0]).toEqual(['Asia', 'United States']);
      popNodes()[0].click(); // uncheck Asia
      await wait();
      expect(wrapper.emitted('change')![4][0]).toEqual(['United States']);
      // leafOnly not set: tags = merged keys
      await wrapper.setProps({ maxTagCount: 0 });
      expect(wrapper.findAll('.semi-tag-group .semi-tag')[0].text()).toBe('+1');
      await wrapper.setProps({ maxTagCount: 5 });
      // close tag
      await wrapper.find('.semi-tag .semi-tag-close').trigger('click');
      await wait();
      expect(wrapper.emitted('select')!.at(-1)).toEqual(['1-0', false, expect.objectContaining({ key: '1-0' })]);
      expect(wrapper.emitted('change')!.at(-1)![0]).toEqual([]);
      expect(wrapper.find('.semi-tree-select-selection-placeholder').exists()).toBe(true);
      wrapper.unmount();
    });

    it('leafOnly, checkRelation=unRelated, controlled array value', async () => {
      const w1 = base({ multiple: true, leafOnly: true, defaultValue: ['China'] });
      expect(w1.findAll('.semi-tag').map((t) => t.text())).toEqual(['Beijing', 'Shanghai']);
      const w2 = base({ multiple: true, checkRelation: 'unRelated', value: ['Asia'] });
      expect(w2.findAll('.semi-tag').map((t) => t.text())).toEqual(['Asia']);
      await w2.find('.semi-tree-select').trigger('click');
      await wait();
      popNodes()[1].click();
      await wait();
      expect(w2.emitted('change')![0][0]).toEqual(['Asia', 'North America']);
      expect(w2.findAll('.semi-tag')).toHaveLength(1);
      await w2.setProps({ value: ['Asia', 'North America'] });
      expect(w2.findAll('.semi-tag')).toHaveLength(2);
      w1.unmount();
      w2.unmount();
    });

    it('renderSelectedItem with isRenderInTag=false renders raw content; disabled tags not closable', async () => {
      const wrapper = base({ multiple: true, defaultValue: ['Canada', 'Japan'], defaultExpandAll: true, renderSelectedItem: (item: any) => ({ isRenderInTag: item.key !== '0-1', content: h('em', { class: 'c' }, item.label) }) });
      expect(wrapper.findAll('.c')).toHaveLength(2);
      expect(wrapper.findAll('.semi-tag')).toHaveLength(1);
      expect(wrapper.find('.semi-tag').classes()).not.toContain('semi-tag-closable');
      wrapper.unmount();
    });

    it('disableStrictly skips disabled descendants', async () => {
      const wrapper = base({ multiple: true, disableStrictly: true, defaultExpandAll: true });
      await wrapper.find('.semi-tree-select').trigger('click');
      await wait();
      popNodes()[5].click(); // North America
      await wait();
      expect(wrapper.emitted('change')![0][0]).toEqual(['United States']);
      wrapper.unmount();
    });
  });

  it('showClear renders clear button on hover, clears and emits clear', async () => {
    const wrapper = base({ showClear: true, defaultValue: 'Japan' });
    expect(wrapper.find('.semi-tree-select-clearbtn').exists()).toBe(false);
    await wrapper.find('.semi-tree-select').trigger('mouseenter');
    const btn = wrapper.find('.semi-tree-select-clearbtn');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('aria-label')).toBe('Clear TreeSelect value');
    expect(wrapper.find('.semi-tree-select-arrow').exists()).toBe(false);
    await btn.trigger('click');
    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('change')![0][0]).toBeUndefined();
    expect(wrapper.find('.semi-tree-select-selection-placeholder').exists()).toBe(true);
    await wrapper.find('.semi-tree-select').trigger('mouseleave');
    expect(wrapper.find('.semi-tree-select-clearbtn').exists()).toBe(false);
    const w2 = base({ showClear: true, defaultValue: 'Japan', clearIcon: h('b', { class: 'ci' }) });
    await w2.find('.semi-tree-select').trigger('mouseenter');
    expect(w2.find('.semi-tree-select-clearbtn .ci').exists()).toBe(true);
    wrapper.unmount();
    w2.unmount();
  });

  it('arrowIcon prop/slot; arrowIcon=null hides the arrow', () => {
    const w1 = base({ arrowIcon: h('b', { class: 'ai' }) });
    expect(w1.find('.semi-tree-select-arrow .ai').exists()).toBe(true);
    const w2 = base({}, { slots: { arrowIcon: () => h('i', { class: 'as' }) } });
    expect(w2.find('.semi-tree-select-arrow .as').exists()).toBe(true);
    const w3 = base({ arrowIcon: null });
    expect(w3.find('.semi-tree-select-arrow').exists()).toBe(false);
    w1.unmount();
    w2.unmount();
    w3.unmount();
  });

  describe('filter', () => {
    it('filterTreeNode renders a search input in the dropdown (locale placeholder) and filters; emits search', async () => {
      const wrapper = base({ filterTreeNode: true });
      expect(wrapper.find('.semi-tree-select').classes()).toContain('semi-tree-select-filterable');
      await wrapper.find('.semi-tree-select').trigger('click');
      await wait();
      const pop = document.querySelector('.semi-tree-select-popover') as HTMLElement;
      const input = pop.querySelector('.semi-tree-search-wrapper input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.getAttribute('placeholder')).toBe('搜索');
      expect(input.getAttribute('aria-label')).toBe('Filter TreeSelect item');
      expect(pop.querySelector('.semi-tree-input')).toBeTruthy();
      input.value = 'bei';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait();
      expect(wrapper.emitted('search')![0][0]).toBe('bei');
      expect(wrapper.emitted('search')![0][2]).toEqual([expect.objectContaining({ key: '0-0-0' })]);
      expect(popLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'North America']);
      expect(pop.querySelector('.semi-tree-option-highlight')!.textContent).toBe('Bei');
      // select clears input and closes
      popNodes()[2].click();
      await wait();
      expect(wrapper.emitted('change')![0][0]).toBe('Beijing');
      expect(document.querySelector('.semi-tree-select-popover')).toBeNull();
      wrapper.unmount();
    });

    it('searchPlaceholder / showFilteredOnly / searchRender=false / searchRender fn & slot', async () => {
      const w1 = base({ filterTreeNode: true, searchPlaceholder: 'find', showFilteredOnly: true });
      await w1.find('.semi-tree-select').trigger('click');
      await wait();
      const input = document.querySelector('.semi-tree-select-popover input') as HTMLInputElement;
      expect(input.getAttribute('placeholder')).toBe('find');
      input.value = 'japan';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait();
      expect(popLabels()).toEqual(['Asia', 'Japan']);
      w1.unmount();
      document.body.innerHTML = '';
      const w2 = base({ filterTreeNode: true, searchRender: false, defaultOpen: true });
      await wait();
      expect(document.querySelector('.semi-tree-search-wrapper')).toBeNull();
      w2.unmount();
      document.body.innerHTML = '';
      const searchRender = vi.fn((p: any) => h('input', { class: 'cus', placeholder: p.placeholder }));
      const w3 = base({ filterTreeNode: true, searchRender, defaultOpen: true });
      await wait();
      expect((document.querySelector('.semi-tree-search-wrapper input.cus') as HTMLInputElement).placeholder).toBe('搜索');
      expect(searchRender.mock.calls[0][0]).toMatchObject({ value: '', showClear: true });
      w3.unmount();
      document.body.innerHTML = '';
      const w4 = base({ filterTreeNode: true, defaultOpen: true }, { slots: { searchRender: (p: any) => h('span', { class: 'slot-s' }, p.placeholder) } });
      await wait();
      expect(document.querySelector('.slot-s')!.textContent).toBe('搜索');
      w4.unmount();
    });

    it('searchPosition=trigger (single) renders the input in the trigger', async () => {
      const wrapper = base({ filterTreeNode: true, searchPosition: 'trigger', defaultValue: 'Japan' });
      const input = wrapper.find('.semi-tree-select-inputTrigger input');
      expect(input.exists()).toBe(true);
      expect(wrapper.find('.semi-tree-select-triggerSingleSearch-wrapper').exists()).toBe(true);
      expect(wrapper.find('.semi-tree-select-selection-TriggerSearchItem').text()).toBe('Japan');
      await input.setValue('bei');
      await wait();
      expect(wrapper.emitted('search')![0][0]).toBe('bei');
      expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy();
      expect(popLabels()).toContain('Beijing');
      expect(wrapper.find('.semi-tree-select-selection-TriggerSearchItem').exists()).toBe(false);
      wrapper.unmount();
    });

    it('searchPosition=trigger (multiple) renders a TagInput', async () => {
      const wrapper = base({ filterTreeNode: true, searchPosition: 'trigger', multiple: true, defaultValue: ['Japan'] });
      expect(wrapper.find('.semi-tagInput').exists()).toBe(true);
      expect(wrapper.find('.semi-tree-select').classes()).toContain('semi-tree-select-multiple-tagInput-notEmpty');
      expect(wrapper.find('.semi-tagInput .semi-tag').text()).toBe('Japan');
      await wrapper.find('.semi-tagInput input').setValue('north');
      await wait();
      expect(wrapper.emitted('search')![0][0]).toBe('north');
      expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy();
      wrapper.unmount();
    });

    it('remote skips local filtering', async () => {
      const wrapper = base({ filterTreeNode: true, remote: true, defaultOpen: true });
      await wait();
      const input = document.querySelector('.semi-tree-select-popover input') as HTMLInputElement;
      input.value = 'zzz';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait();
      expect(wrapper.emitted('search')![0]).toEqual(['zzz', [], []]);
      expect(popLabels()).toEqual(['Asia', 'North America']);
      wrapper.unmount();
    });

    it('exposed search() opens and filters', async () => {
      const wrapper = base({ filterTreeNode: true });
      (wrapper.vm as any).search('canada');
      await wait();
      expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy();
      expect(popLabels()).toEqual(['Asia', 'North America', 'United States', 'Canada']);
      (wrapper.vm as any).close();
      await wait();
      expect(document.querySelector('.semi-tree-select-popover')).toBeNull();
      wrapper.unmount();
    });
  });

  it('dropdownMatchSelectWidth sets minWidth from the trigger; dropdownStyle / dropdownClassName / optionListStyle', async () => {
    const wrapper = base({ dropdownStyle: { padding: '3px' }, dropdownClassName: 'dd', optionListStyle: { maxHeight: '100px' } });
    vi.spyOn(wrapper.find('.semi-tree-select').element, 'getBoundingClientRect').mockReturnValue({ width: 240 } as any);
    await wrapper.find('.semi-tree-select').trigger('click');
    await wait();
    const pop = document.querySelector('.semi-tree-select-popover') as HTMLElement;
    expect(pop.classList.contains('dd')).toBe(true);
    expect(pop.style.minWidth).toBe('240px');
    expect(pop.style.padding).toBe('3px');
    expect((pop.querySelector('.semi-tree-option-list') as HTMLElement).style.maxHeight).toBe('100px');
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = base({ dropdownMatchSelectWidth: false, defaultOpen: true });
    await wait();
    expect((document.querySelector('.semi-tree-select-popover') as HTMLElement).style.minWidth).toBe('');
    w2.unmount();
  });

  it('emptyContent (locale / prop / slot / null hides list) and outerTopSlot / outerBottomSlot', async () => {
    const w1 = base({ treeData: [], defaultOpen: true, outerTopSlot: h('b', { class: 'top' }), outerBottomSlot: h('b', { class: 'bottom' }) });
    await wait();
    expect(document.querySelector('.semi-tree-option-label-empty')!.textContent).toBe('暂无数据');
    expect(document.querySelector('.semi-tree-wrapper .top')).toBeTruthy();
    expect(document.querySelector('.semi-tree-wrapper .bottom')).toBeTruthy();
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = base({ treeData: [], defaultOpen: true, emptyContent: 'none' });
    await wait();
    expect(document.querySelector('.semi-tree-option-label-empty')!.textContent).toBe('none');
    w2.unmount();
    document.body.innerHTML = '';
    const w3 = base({ treeData: [], defaultOpen: true, emptyContent: null });
    await wait();
    expect(document.querySelector('.semi-tree-option-list-hidden')).toBeTruthy();
    expect(document.querySelector('.semi-tree-option-empty')).toBeNull();
    w3.unmount();
    document.body.innerHTML = '';
    const w4 = base({ treeData: [], defaultOpen: true }, { slots: { emptyContent: () => h('i', { class: 'se' }, 'x'), outerTopSlot: () => h('u', { class: 'st' }) } });
    await wait();
    expect(document.querySelector('.semi-tree-option-label-empty .se')).toBeTruthy();
    expect(document.querySelector('.semi-tree-wrapper .st')).toBeTruthy();
    w4.unmount();
  });

  it('expandAction=click expands on node click without closing; controlled expandedKeys', async () => {
    const wrapper = base({ expandAction: 'click', defaultOpen: true });
    await wait();
    popNodes()[0].click();
    await wait();
    expect(wrapper.emitted('change')![0][0]).toBe('Asia');
    expect(wrapper.emitted('expand')![0][0]).toEqual(['0']);
    expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy();
    expect(popLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = base({ expandedKeys: [], defaultOpen: true });
    await wait();
    (popNodes()[0].querySelector('.semi-tree-option-expand-icon') as HTMLElement).click();
    await wait();
    expect(popLabels()).toEqual(['Asia', 'North America']);
    await w2.setProps({ expandedKeys: ['0'] });
    await wait();
    expect(popLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    w2.unmount();
  });

  it('renderLabel / renderFullLabel / showLine / labelEllipsis / expandIcon are forwarded to the tree', async () => {
    const renderFullLabel = vi.fn(({ className, data }: any) => h('li', { class: [className, 'full'] }, data.label));
    const w1 = base({ defaultOpen: true, renderLabel: (label: any) => h('b', { class: 'rl' }, label), showLine: true, labelEllipsis: true, defaultExpandAll: true });
    await wait();
    expect(document.querySelectorAll('.semi-tree-option .rl').length).toBe(8);
    expect(document.querySelector('.semi-tree-option-indent-show-line')).toBeTruthy();
    expect(popNodes()[0].classList.contains('semi-tree-option-ellipsis')).toBe(true);
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = base({ defaultOpen: true, renderFullLabel, expandIcon: () => h('span', { class: 'ei' }) });
    await wait();
    expect(document.querySelectorAll('li.full').length).toBe(2);
    expect(renderFullLabel.mock.calls[0][0].expandIcon).toBeTruthy();
    w2.unmount();
  });

  it('keyMaps / treeNodeLabelProp / treeNodeFilterProp', async () => {
    const data = [{ name: 'A', id: 'a', kids: [{ name: 'B', id: 'b' }] }];
    const wrapper = base({ treeData: data, keyMaps: { key: 'id', label: 'name', children: 'kids', value: 'id' }, defaultValue: 'b', defaultOpen: true });
    expect(wrapper.find('.semi-tree-select-selection-content').text()).toBe('B');
    await wait();
    expect(popLabels()).toEqual(['A', 'B']);
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = base({ treeData: [{ key: 'k', label: 'L', title: 'T', value: 'v' }], treeNodeLabelProp: 'title', defaultValue: 'v' });
    expect(w2.find('.semi-tree-select-selection-content').text()).toBe('T');
    w2.unmount();
  });

  it('loadData loads children on expand and emits load', async () => {
    const data = ref<any[]>([{ key: 'a', label: 'A' }]);
    const loadData = vi.fn(
      (node: any) =>
        new Promise<void>((resolve) => {
          data.value = [{ ...node, children: [{ key: 'a-0', label: 'A0' }] }];
          resolve();
        })
    );
    const onLoad = vi.fn();
    const Parent = defineComponent({
      setup() {
        return () => h(TreeSelect, { treeData: data.value, loadData, onLoad, defaultOpen: true, motion: false, motionExpand: false });
      },
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    await wait();
    (popNodes()[0].querySelector('.semi-tree-option-expand-icon') as HTMLElement).click();
    await wait();
    expect(loadData).toHaveBeenCalled();
    expect(onLoad).toHaveBeenCalled();
    expect(popLabels()).toEqual(['A', 'A0']);
    wrapper.unmount();
  });

  it('triggerRender prop and slot replace the trigger', async () => {
    const triggerRender = vi.fn((p: any) => h('button', { class: 'custom-trigger' }, p.value.map((v: any) => v.label).join(',') || p.placeholder));
    const w1 = base({ triggerRender, defaultValue: 'Japan', placeholder: 'ph' });
    expect(w1.find('.custom-trigger').text()).toBe('Japan');
    expect(w1.find('.semi-tree-select').exists()).toBe(false);
    expect(triggerRender.mock.calls[0][0]).toMatchObject({ componentName: 'TreeSelect', inputValue: '' });
    const w2 = base({}, { slots: { triggerRender: (p: any) => h('span', { class: 'st' }, p.placeholder) } });
    expect(w2.find('.st').exists()).toBe(true);
    w1.unmount();
    w2.unmount();
  });

  it('virtualize renders the virtual list in the popup', async () => {
    const wrapper = base({ defaultOpen: true, defaultExpandAll: true, virtualize: { itemSize: 28, height: 56 } });
    await wait();
    expect(document.querySelector('.semi-tree-select-popover .semi-tree-virtual-list')).toBeTruthy();
    expect(popNodes().length).toBeLessThan(7);
    wrapper.unmount();
  });

  it('position / zIndex / getPopupContainer are forwarded to the popover', async () => {
    const container = document.createElement('div');
    container.id = 'c';
    document.body.appendChild(container);
    const wrapper = base({ defaultOpen: true, position: 'top', zIndex: 2000, getPopupContainer: () => container });
    await wait();
    expect(container.querySelector('.semi-tree-select-popover')).toBeTruthy();
    expect((container.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('2000');
    expect(document.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('top');
    wrapper.unmount();
  });

  it('Enter on the trigger toggles the dropdown', async () => {
    const wrapper = base();
    await wrapper.find('.semi-tree-select').trigger('keypress', { key: 'Enter' });
    await wait();
    expect(document.querySelector('.semi-tree-select-popover')).toBeTruthy();
    wrapper.unmount();
  });
});
