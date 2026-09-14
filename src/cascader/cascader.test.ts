import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Cascader from './index';
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
    value: 'asia',
    children: [
      { label: 'China', value: 'china', children: [{ label: 'Beijing', value: 'beijing' }, { label: 'Shanghai', value: 'shanghai' }] },
      { label: 'Japan', value: 'japan' },
    ],
  },
  {
    label: 'North America',
    value: 'na',
    children: [
      { label: 'United States', value: 'us' },
      { label: 'Canada', value: 'canada', disabled: true },
    ],
  },
];

const popLists = () => Array.from(document.querySelectorAll('.semi-cascader-option-list')) as HTMLElement[];
const popItems = () => Array.from(document.querySelectorAll('.semi-cascader-option-list li.semi-cascader-option')) as HTMLElement[];
const base = (props: Record<string, any> = {}, opts: Record<string, any> = {}) =>
  mount(Cascader, { attachTo: document.body, props: { treeData: treeData(), motion: false, ...props }, ...opts });

describe('Cascader', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the trigger with a11y attrs, placeholder, arrow; dropdown closed initially', () => {
    const wrapper = base({ placeholder: 'please select' });
    const trigger = wrapper.find('.semi-cascader');
    expect(trigger.exists()).toBe(true);
    expect(trigger.classes()).toContain('semi-cascader-single');
    expect(trigger.attributes('role')).toBe('combobox');
    expect(trigger.attributes('tabindex')).toBe('0');
    expect(trigger.attributes('aria-label')).toBe('Cascader');
    expect(trigger.find('.semi-cascader-selection-placeholder').text()).toBe('please select');
    expect(trigger.find('.semi-cascader-arrow .semi-icon-chevron_down').exists()).toBe(true);
    expect(document.querySelector('.semi-cascader-popover')).toBeNull();
    wrapper.unmount();
  });

  it('click opens panels; hovering/clicking through levels; selecting a leaf emits change/select and closes', async () => {
    const wrapper = base();
    await wrapper.find('.semi-cascader').trigger('click');
    await wait();
    expect(wrapper.emitted('dropdownVisibleChange')![0]).toEqual([true]);
    const pop = document.querySelector('.semi-cascader-popover') as HTMLElement;
    expect(pop).toBeTruthy();
    expect(pop.getAttribute('role')).toBe('listbox');
    expect(pop.querySelector('.semi-cascader-option-lists')).toBeTruthy();
    // first column
    expect(popItems().map((i) => i.querySelector('.semi-cascader-option-label')!.textContent)).toEqual(['Asia', 'North America']);
    const first = popItems()[0];
    expect(first.getAttribute('role')).toBe('menuitem');
    expect(first.getAttribute('id')).toBe('cascaderItem-asia');
    expect(first.getAttribute('aria-haspopup')).toBe('true');
    expect(first.getAttribute('aria-expanded')).toBe('false');
    first.click();
    await nextTick();
    // two columns now: second column of Asia
    expect(popLists()).toHaveLength(2);
    expect(popItems().slice(2).map((i) => i.querySelector('.semi-cascader-option-label')!.textContent)).toEqual(['China', 'Japan']);
    expect(popItems()[0].getAttribute('aria-expanded')).toBe('true');
    expect(popItems()[0].classList.contains('semi-cascader-option-active')).toBe(true);
    const china = popItems()[2];
    china.click();
    await nextTick();
    expect(popLists()).toHaveLength(3);
    const beijing = popItems()[4];
    expect(beijing.querySelector('.semi-cascader-option-label')!.textContent).toBe('Beijing');
    expect(beijing.getAttribute('aria-haspopup')).toBe('false');
    beijing.click();
    await wait();
    expect(wrapper.emitted('select')![0]).toEqual(['beijing']);
    expect(wrapper.emitted('change')![0]).toEqual([['asia', 'china', 'beijing']]);
    expect(wrapper.emitted('update:value')![0]).toEqual([['asia', 'china', 'beijing']]);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['asia', 'china', 'beijing']]);
    expect(wrapper.find('.semi-cascader-selection').text()).toBe('Asia / China / Beijing');
    expect(document.querySelector('.semi-cascader-popover')).toBeNull();
    expect(wrapper.emitted('dropdownVisibleChange')![1]).toEqual([false]);
    expect(wrapper.emitted('blur')).toHaveLength(1);
    wrapper.unmount();
  });

  it('changeOnSelect emits change for non-leaf nodes without closing', async () => {
    const wrapper = base({ changeOnSelect: true });
    await wrapper.find('.semi-cascader').trigger('click');
    await wait();
    popItems()[0].click();
    await nextTick();
    expect(wrapper.emitted('change')![0]).toEqual([['asia']]);
    expect(document.querySelector('.semi-cascader-popover')).toBeTruthy();
    popItems()[2].click();
    await nextTick();
    expect(wrapper.emitted('change')![1]).toEqual([['asia', 'china']]);
    wrapper.unmount();
  });

  it('defaultValue / controlled value / v-model; displayRender; separator; displayProp', async () => {
    const w1 = base({ defaultValue: ['asia', 'china', 'beijing'] });
    expect(w1.find('.semi-cascader-selection').text()).toBe('Asia / China / Beijing');
    const displayRender = vi.fn((path: string[]) => h('b', { class: 'dr' }, path.join(' > ')));
    const w2 = base({ value: ['asia', 'japan'], displayRender });
    expect(displayRender).toHaveBeenCalledWith(['Asia', 'Japan']);
    expect(w2.find('.semi-cascader-selection .dr').text()).toBe('Asia > Japan');
    await w2.find('.semi-cascader').trigger('click');
    await wait();
    popItems()[1].click(); // North America is not a leaf -> no change
    await nextTick();
    expect(w2.emitted('change')).toBeUndefined();
    await w2.setProps({ value: ['na', 'us'] });
    expect(w2.find('.semi-cascader-selection .dr').text()).toBe('North America > United States');
    const w3 = base({ separator: '|', defaultValue: ['asia', 'japan'] });
    expect(w3.find('.semi-cascader-selection').text()).toBe('Asia|Japan');
    const w4 = base({ defaultValue: ['asia', 'japan'], displayProp: 'value' });
    expect(w4.find('.semi-cascader-selection').text()).toBe('asia / japan');
    const Parent = defineComponent({
      setup() {
        const v = ref<any[]>(['asia', 'japan']);
        return () => h('div', [h(Cascader, { treeData: treeData(), motion: false, modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, v.value.join(','))]);
      },
    });
    document.body.innerHTML = '';
    const w5 = mount(Parent, { attachTo: document.body });
    expect(w5.find('.semi-cascader-selection').text()).toBe('Asia / Japan');
    await w5.find('.semi-cascader').trigger('click');
    await wait();
    popItems()[0].click();
    await nextTick();
    popItems()[2].click();
    await nextTick();
    popItems()[4].click(); // beijing
    await wait();
    expect(w5.find('#out').text()).toBe('asia,china,beijing');
    w1.unmount();
    w2.unmount();
    w3.unmount();
    w4.unmount();
    w5.unmount();
  });

  it('showNext=hover expands on hover', async () => {
    const wrapper = base({ showNext: 'hover' });
    await wrapper.find('.semi-cascader').trigger('click');
    await wait();
    await popItems()[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await nextTick();
    expect(popLists()).toHaveLength(2);
    wrapper.unmount();
  });

  it('disabled: no open, no events; disabled options do not expand', async () => {
    const w1 = base({ disabled: true });
    expect(w1.find('.semi-cascader').classes()).toContain('semi-cascader-disabled');
    await w1.find('.semi-cascader').trigger('click');
    await wait();
    expect(document.querySelector('.semi-cascader-popover')).toBeNull();
    w1.unmount();
    const w2 = base();
    await w2.find('.semi-cascader').trigger('click');
    await wait();
    popItems()[1].click(); // North America
    await nextTick();
    expect(popLists()).toHaveLength(2);
    expect(popItems()[3].classList.contains('semi-cascader-option-disabled')).toBe(true);
    expect(popItems()[3].getAttribute('aria-disabled')).toBe('true');
    popItems()[3].click();
    await nextTick();
    expect(popLists()).toHaveLength(2);
    w2.unmount();
  });

  it('click outside closes; Esc closes; Enter opens', async () => {
    const wrapper = base({ defaultOpen: true });
    await wait();
    expect(document.querySelector('.semi-cascader-popover')).toBeTruthy();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(document.querySelector('.semi-cascader-popover')).toBeNull();
    await wrapper.find('.semi-cascader').trigger('keypress', { key: 'Enter' });
    await wait();
    expect(document.querySelector('.semi-cascader-popover')).toBeTruthy();
    await wrapper.find('.semi-cascader').trigger('keydown', { key: 'Escape' });
    await wait();
    expect(document.querySelector('.semi-cascader-popover')).toBeNull();
    wrapper.unmount();
  });

  it('onChangeWithObject emits data objects', async () => {
    const wrapper = base({ onChangeWithObject: true, defaultValue: ['asia', 'japan'], changeOnSelect: true });
    await wrapper.find('.semi-cascader').trigger('click');
    await wait();
    popItems()[0].click();
    await nextTick();
    popItems()[2].click();
    await wait();
    expect(wrapper.emitted('change')![1][0]).toEqual([
      expect.objectContaining({ value: 'asia' }),
      expect.objectContaining({ value: 'china' }),
    ]);
    wrapper.unmount();
  });

  it.each([
    ['small', 'semi-cascader-small'],
    ['large', 'semi-cascader-large'],
  ] as const)('size=%s', (size, klass) => {
    const wrapper = base({ size });
    expect(wrapper.find('.semi-cascader').classes()).toContain(klass);
    wrapper.unmount();
  });

  it('validateStatus / borderless / className / style / data attrs / id / a11y props', () => {
    const wrapper = base({ validateStatus: 'error', borderless: true, className: 'cls', id: 'c1' }, { attrs: { class: 'x', style: 'width: 200px', 'data-foo': 'bar' } });
    const t = wrapper.find('.semi-cascader');
    expect(t.classes()).toContain('semi-cascader-error');
    expect(t.classes()).toContain('semi-cascader-borderless');
    expect(t.classes()).toContain('cls');
    expect(t.classes()).toContain('x');
    expect(t.attributes('data-foo')).toBe('bar');
    expect(t.attributes('id')).toBe('c1');
    expect((t.element as HTMLElement).style.width).toBe('200px');
    const w2 = base({ validateStatus: 'warning' });
    expect(w2.find('.semi-cascader').classes()).toContain('semi-cascader-warning');
    wrapper.unmount();
    w2.unmount();
  });

  it('prefix / suffix / insetLabel props and slots', () => {
    const w1 = base({ prefix: 'P', suffix: h(IconSearch), insetLabelId: 'lbl' });
    expect(w1.find('.semi-cascader').classes()).toContain('semi-cascader-with-prefix');
    expect(w1.find('.semi-cascader').classes()).toContain('semi-cascader-with-suffix');
    expect(w1.find('.semi-cascader-prefix').classes()).toContain('semi-cascader-prefix-text');
    expect(w1.find('.semi-cascader-prefix').attributes('id')).toBe('lbl');
    expect(w1.find('.semi-cascader-suffix').classes()).toContain('semi-cascader-suffix-icon');
    const w2 = base({}, { slots: { prefix: () => h('b', 'sp'), suffix: () => 'ss' } });
    expect(w2.find('.semi-cascader-prefix b').text()).toBe('sp');
    expect(w2.find('.semi-cascader-suffix').text()).toBe('ss');
    const w3 = base({ insetLabel: 'Inset' });
    expect(w3.find('.semi-cascader-prefix').classes()).toContain('semi-cascader-inset-label');
    w1.unmount();
    w2.unmount();
    w3.unmount();
  });

  it('showClear renders the clear button on hover and clears (single)', async () => {
    const wrapper = base({ showClear: true, defaultValue: ['asia', 'japan'] });
    expect(wrapper.find('.semi-cascader-clearbtn').exists()).toBe(false);
    await wrapper.find('.semi-cascader').trigger('mouseenter');
    const btn = wrapper.find('.semi-cascader-clearbtn');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('role')).toBe('button');
    expect(wrapper.find('.semi-cascader-arrow').exists()).toBe(false);
    await btn.trigger('click');
    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('change')![0]).toEqual([[]]);
    expect(wrapper.find('.semi-cascader-selection-placeholder').exists()).toBe(true);
    const w2 = base({ showClear: true, defaultValue: ['asia', 'japan'], clearIcon: h('b', { class: 'ci' }) });
    await w2.find('.semi-cascader').trigger('mouseenter');
    expect(w2.find('.semi-cascader-clearbtn .ci').exists()).toBe(true);
    wrapper.unmount();
    w2.unmount();
  });

  it('arrowIcon prop/slot; null hides arrow', () => {
    const w1 = base({ arrowIcon: h('b', { class: 'ai' }) });
    expect(w1.find('.semi-cascader-arrow .ai').exists()).toBe(true);
    const w2 = base({}, { slots: { arrowIcon: () => h('i', { class: 'as' }) } });
    expect(w2.find('.semi-cascader-arrow .as').exists()).toBe(true);
    const w3 = base({ arrowIcon: null });
    expect(w3.find('.semi-cascader-arrow').exists()).toBe(false);
    w1.unmount();
    w2.unmount();
    w3.unmount();
  });

  it('emptyContent (locale / prop / slot / null) and topSlot / bottomSlot', async () => {
    const w1 = base({ treeData: [], defaultOpen: true, topSlot: h('b', { class: 'top' }), bottomSlot: h('b', { class: 'bottom' }) });
    await wait();
    expect(document.querySelector('.semi-cascader-option-empty .semi-cascader-option-label')!.textContent).toBe('暂无数据');
    expect(document.querySelector('.semi-cascader-popover .top')).toBeTruthy();
    expect(document.querySelector('.semi-cascader-popover .bottom')).toBeTruthy();
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = base({ treeData: [], defaultOpen: true, emptyContent: 'none' });
    await wait();
    expect(document.querySelector('.semi-cascader-option-empty')!.textContent).toBe('none');
    w2.unmount();
    document.body.innerHTML = '';
    const w3 = base({ treeData: [], defaultOpen: true, emptyContent: null });
    await wait();
    expect(document.querySelector('.semi-cascader-option-empty')).toBeNull();
    w3.unmount();
    document.body.innerHTML = '';
    const w4 = base({ treeData: [], defaultOpen: true }, { slots: { emptyContent: () => h('i', { class: 'se' }, 'x') } });
    await wait();
    expect(document.querySelector('.semi-cascader-option-empty .se')).toBeTruthy();
    w4.unmount();
  });

  describe('filter (trigger position)', () => {
    it('renders the search input on the trigger, filters to a flatten list with highlight; select from search', async () => {
      const wrapper = base({ filterTreeNode: true, searchPlaceholder: 'find' });
      const searchWrapper = wrapper.find('.semi-cascader-search-wrapper');
      expect(searchWrapper.exists()).toBe(true);
      expect(wrapper.find('.semi-cascader').classes()).toContain('semi-cascader-filterable');
      expect(searchWrapper.find('.semi-cascader-selection-placeholder').text()).toBe('find');
      // input shows when opened
      await wrapper.find('.semi-cascader').trigger('click');
      await wait();
      const input = wrapper.find('.semi-cascader-search-wrapper .semi-cascader-input input');
      expect(input.exists()).toBe(true);
      await input.setValue('bei');
      expect(wrapper.emitted('search')![0]).toEqual(['bei']);
      await wait();
      const items = popItems();
      expect(items[0].classList.contains('semi-cascader-option-flatten')).toBe(true);
      expect(items[0].querySelector('.semi-cascader-option-label')!.textContent).toBe('Asia / China / Beijing');
      expect(document.querySelector('.semi-cascader-option-label-highlight')!.textContent).toBe('Bei');
      items[0].click();
      await wait();
      expect(wrapper.emitted('change')![0]).toEqual([['asia', 'china', 'beijing']]);
      expect(document.querySelector('.semi-cascader-popover')).toBeNull();
      wrapper.unmount();
    });

    it('filterTreeNode function + treeNodeFilterProp + filterLeafOnly=false + filterRender + filterSorter', async () => {
      const fn = vi.fn((input: string, path: string) => path.split(',').some((p) => p.includes(input)));
      const filterRender = vi.fn((p: any) => h('li', { class: [p.className, 'fr'], onClick: p.onClick, 'data-checked': p.checkStatus.checked }, p.data.map((d: any) => d.label).join('-')));
      const filterSorter = vi.fn(() => 0);
      const wrapper = base({ filterTreeNode: fn, treeNodeFilterProp: 'value', filterLeafOnly: false, filterRender, filterSorter, searchPosition: 'trigger' });
      await wrapper.find('.semi-cascader').trigger('click');
      await wait();
      await wrapper.find('.semi-cascader-input input').setValue('ja');
      await wait();
      expect(fn).toHaveBeenCalled();
      expect(document.querySelectorAll('li.fr').length).toBeGreaterThan(0);
      expect(filterRender.mock.calls[0][0].inputValue).toBe('ja');
      wrapper.unmount();
    });

    it('remote: filtered keys use current treeData leaves; searchPosition=custom renders no trigger input', async () => {
      const wrapper = base({
        treeData: [{ label: 'Remote A', value: 'ra' }, { label: 'Remote B', value: 'rb' }],
        filterTreeNode: true,
        remote: true,
        defaultOpen: true,
      });
      await wait();
      const input = wrapper.find('.semi-cascader-input input');
      await input.setValue('remote');
      await wait();
      expect(popItems().length).toBe(2);
      expect(wrapper.emitted('search')![0]).toEqual(['remote']);
      wrapper.unmount();
      document.body.innerHTML = '';
      const w2 = base({ filterTreeNode: true, searchPosition: 'custom', defaultOpen: true });
      await wait();
      expect(w2.find('.semi-cascader-search-wrapper').exists()).toBe(false);
      w2.unmount();
    });
  });

  describe('multiple', () => {
    it('checks nodes with checkboxes, renders tags, emits path values; tag close removes', async () => {
      const wrapper = base({ multiple: true });
      expect(wrapper.find('.semi-cascader').classes()).toContain('semi-cascader-single');
      await wrapper.find('.semi-cascader').trigger('click');
      await wait();
      const beijing = popItems()[0];
      expect(beijing.querySelector('.semi-checkbox')).toBeTruthy();
      const checkboxWrap = beijing.querySelector('.semi-cascader-option-label') as HTMLElement;
      (checkboxWrap.querySelector('.semi-checkbox') as HTMLElement).click();
      await wait();
      expect(wrapper.emitted('change')![0]).toEqual([[['asia']]]);
      expect(wrapper.emitted('select')![0]).toEqual(['asia']);
      expect(wrapper.find('.semi-tag').text()).toBe('Asia');
      // close the tag
      await wrapper.find('.semi-tag .semi-tag-close').trigger('click');
      await wait();
      expect(wrapper.emitted('change')![1]).toEqual([[]]);
      expect(wrapper.find('.semi-cascader-selection-placeholder').exists()).toBe(true);
      wrapper.unmount();
    });

    it('leafOnly / autoMergeValue=false / checkRelation=unRelated / maxTagCount +N', async () => {
      const w1 = base({ multiple: true, leafOnly: true, defaultValue: [['asia', 'china']] });
      expect(w1.findAll('.semi-tag').map((t) => t.text()).sort()).toEqual(['Beijing', 'Shanghai']);
      const w2 = base({ multiple: true, autoMergeValue: false, defaultValue: [['asia', 'china']] });
      expect(w2.findAll('.semi-tag').map((t) => t.text())).toEqual(['China', 'Beijing', 'Shanghai']);
      const w3 = base({ multiple: true, checkRelation: 'unRelated', defaultValue: [['asia'], ['na']] });
      expect(w3.findAll('.semi-tag').map((t) => t.text())).toEqual(['Asia', 'North America']);
      const w4 = base({ multiple: true, defaultValue: [['asia', 'china'], ['na']], maxTagCount: 1 });
      expect(w4.findAll('.semi-tag').length).toBe(1);
      expect(w4.find('.semi-cascader-selection-n').text()).toBe('+1');
      w1.unmount();
      w2.unmount();
      w3.unmount();
      w4.unmount();
    });

    it('controlled multiple value + defaultValue + max exceeded', async () => {
      const w1 = base({ multiple: true, value: [['asia', 'china']] });
      expect(w1.findAll('.semi-tag').map((t) => t.text())).toEqual(['China']);
      await w1.find('.semi-cascader').trigger('click');
      await wait();
      const japan = popItems()[3]; // second column (active path of the controlled value is open)
      (japan.querySelector('.semi-checkbox') as HTMLElement).click();
      await wait();
      expect(w1.emitted('change')![0]).toEqual([[['asia']]]);
      expect(w1.findAll('.semi-tag').map((t) => t.text())).toEqual(['China']);
      await w1.setProps({ value: [['asia']] });
      expect(w1.findAll('.semi-tag').map((t) => t.text())).toEqual(['Asia']);
      w1.unmount();
      const onExceed = vi.fn();
      const w2 = base({ multiple: true, max: 1, onExceed });
      await w2.find('.semi-cascader').trigger('click');
      await wait();
      (popItems()[0].querySelector('.semi-checkbox') as HTMLElement).click();
      await wait();
      (popItems()[1].querySelector('.semi-checkbox') as HTMLElement).click();
      await wait();
      expect(onExceed).toHaveBeenCalled();
      // foundation notifies the full candidate key set (existing + new), not only the newly checked node
      const exceededValues = onExceed.mock.calls[0][0].map((e: any) => e?.data?.value);
      expect(exceededValues).toContain('na');
      w2.unmount();
    });

    it('disableStrictly skips disabled descendants; disabled tags are not closable', async () => {
      const wrapper = base({ multiple: true, disableStrictly: true, defaultValue: [['na']] });
      expect(wrapper.findAll('.semi-tag').map((t) => t.text())).toEqual(['North America']);
      expect(wrapper.find('.semi-tag').classes()).toContain('semi-tag-closable');
      wrapper.unmount();
      // directly disabled item produces a non-closable tag
      const data2 = [{ label: 'X', value: 'x', disabled: true }];
      const w2 = base({ multiple: true, defaultValue: [['x']], treeData: data2 });
      expect(w2.find('.semi-tag').classes()).not.toContain('semi-tag-closable');
      expect(w2.find('.semi-cascader-selection-tag').classes()).toContain('semi-cascader-selection-tag-disabled');
      w2.unmount();
    });
  });

  it('loadData: loads children on click, spinner, onLoad; loadedKeys', async () => {
    const data = ref<any[]>([{ label: 'A', value: 'a' }]);
    const loadData = vi.fn(
      (selectOptions: any[]) =>
        new Promise<void>((resolve) => {
          data.value = [{ label: 'A', value: 'a', children: [{ label: 'A1', value: 'a1' }] }];
          resolve();
        })
    );
    const onLoad = vi.fn();
    const Parent = defineComponent({
      setup() {
        return () => h(Cascader, { treeData: data.value, loadData, onLoad, defaultOpen: true, motion: false });
      },
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    await wait();
    popItems()[0].click();
    await wait();
    expect(loadData).toHaveBeenCalledWith([expect.objectContaining({ value: 'a' })]);
    expect(onLoad).toHaveBeenCalled();
    expect(onLoad.mock.calls[0][0]).toBeInstanceOf(Set);
    expect(popLists()).toHaveLength(2);
    wrapper.unmount();
  });

  it('triggerRender prop and slot; onListScroll', async () => {
    const triggerRender = vi.fn((p: any) => h('button', { class: 'custom-trigger' }, p.placeholder));
    const w1 = base({ triggerRender, placeholder: 'ph' });
    expect(w1.find('.custom-trigger').text()).toBe('ph');
    expect(w1.find('.semi-cascader').exists()).toBe(false);
    expect(triggerRender.mock.calls[0][0].componentName).toBe('Cascader');
    const w2 = base({}, { slots: { triggerRender: (p: any) => h('span', { class: 'st' }, p.placeholder) } });
    expect(w2.find('.st').exists()).toBe(true);
    w1.unmount();
    w2.unmount();
    const onListScroll = vi.fn();
    const w3 = base({ onListScroll, defaultOpen: true });
    await wait();
    popLists()[0].dispatchEvent(new Event('scroll'));
    expect(onListScroll).toHaveBeenCalled();
    expect(onListScroll.mock.calls[0][1]).toMatchObject({ panelIndex: 0 });
    w3.unmount();
  });

  it('keyMaps maps custom fields', async () => {
    const data = [{ name: 'A', id: 'a', kids: [{ name: 'B', id: 'b' }] }];
    const wrapper = base({ treeData: data, keyMaps: { label: 'name', value: 'id', children: 'kids' }, defaultValue: ['a', 'b'] });
    expect(wrapper.find('.semi-cascader-selection').text()).toBe('A / B');
    wrapper.unmount();
  });

  it('position / zIndex / getPopupContainer / dropdownStyle / dropdownClassName', async () => {
    const container = document.createElement('div');
    container.id = 'c';
    document.body.appendChild(container);
    const wrapper = base({ defaultOpen: true, position: 'top', zIndex: 1500, getPopupContainer: () => container, dropdownStyle: { padding: '4px' }, dropdownClassName: 'dd' });
    await wait();
    const pop = container.querySelector('.semi-cascader-popover') as HTMLElement;
    expect(pop).toBeTruthy();
    expect(pop.classList.contains('dd')).toBe(true);
    expect(pop.style.padding).toBe('4px');
    expect((container.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('1500');
    expect(document.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('top');
    wrapper.unmount();
  });

  it('exposed methods open/close/focus/blur/search and foundation', async () => {
    const wrapper = base();
    (wrapper.vm as any).open();
    await wait();
    expect(document.querySelector('.semi-cascader-popover')).toBeTruthy();
    (wrapper.vm as any).close();
    await wait();
    expect(document.querySelector('.semi-cascader-popover')).toBeNull();
    (wrapper.vm as any).focus();
    await nextTick();
    expect(wrapper.find('.semi-cascader').classes()).toContain('semi-cascader-focus');
    (wrapper.vm as any).blur();
    await nextTick();
    expect(wrapper.find('.semi-cascader').classes()).not.toContain('semi-cascader-focus');
    expect((wrapper.vm as any).foundation).toBeTruthy();
    expect((Cascader as any).elementType).toBe('Cascader');
    wrapper.unmount();
  });
  describe('parity additions', () => {
    it('clickToSelect: clicking a non-leaf node in multiple mode checks it', async () => {
      const wrapper = base({ multiple: true, clickToSelect: true, showNext: 'hover' });
      await wrapper.find('.semi-cascader').trigger('click');
      await wait();
      popItems()[0].click();
      await wait();
      expect(wrapper.emitted('change')![0]).toEqual([[['asia']]]);
      expect(wrapper.find('.semi-tag').text()).toBe('Asia');
      wrapper.unmount();
    });

    it('enableLeafClick: clicking a leaf row toggles its checkbox in multiple mode', async () => {
      const wrapper = base({ multiple: true, enableLeafClick: true });
      await wrapper.find('.semi-cascader').trigger('click');
      await wait();
      popItems()[1].click(); // North America (expand)
      await wait();
      const us = popItems().find((li) => li.textContent?.includes('United States'))!;
      us.click();
      await wait();
      expect(wrapper.emitted('change')![0]).toEqual([[['na', 'us']]]);
      wrapper.unmount();
    });

    it('triggerRender receives pos value (single) / Set of pos (multiple) and onRemove removes by pos', async () => {
      const single = vi.fn((p: any) => h('span', { class: 'ts' }, String(p.value)));
      const w1 = base({ triggerRender: single, defaultValue: ['asia', 'china', 'shanghai'] });
      await nextTick();
      expect(w1.find('.ts').text()).toBe('0-0-1');
      w1.unmount();
      let last: any;
      const multi = vi.fn((p: any) => {
        last = p;
        return h('span', { class: 'tm' }, Array.from(p.value as Set<string>).join(','));
      });
      const w2 = base({ triggerRender: multi, multiple: true, defaultValue: [['asia', 'china'], ['na', 'us']] });
      await nextTick();
      expect(w2.find('.tm').text()).toBe('0-0,1-0');
      last.onRemove('0-0');
      await wait();
      expect(w2.emitted('change')![0]).toEqual([[['na', 'us']]]);
      expect(w2.find('.tm').text()).toBe('1-0');
      w2.unmount();
    });

    it('showRestTagsPopover wraps +N in a Popover showing the hidden tags', async () => {
      const wrapper = base({ multiple: true, defaultValue: [['asia', 'china'], ['na']], maxTagCount: 1, showRestTagsPopover: true, restTagsPopoverProps: { motion: false, mouseEnterDelay: 0 } });
      const plusN = wrapper.find('.semi-cascader-selection-n');
      expect(plusN.text()).toBe('+1');
      await plusN.trigger('mouseenter');
      await wait(200);
      const pop = document.querySelector('.semi-popover');
      expect(pop).toBeTruthy();
      expect(pop!.textContent).toContain('North America');
      wrapper.unmount();
    });

    it('clearIcon prop & slot; clear emits clear + change and the placeholder returns', async () => {
      const onClear = vi.fn();
      const w1 = base({ showClear: true, clearIcon: h('i', { class: 'my-clear' }), defaultValue: ['asia', 'japan'], onClear, placeholder: 'ph' });
      await w1.find('.semi-cascader').trigger('mouseenter');
      await nextTick();
      expect(w1.find('.semi-cascader-clearbtn .my-clear').exists()).toBe(true);
      await w1.find('.semi-cascader-clearbtn').trigger('click');
      await wait();
      expect(onClear).toHaveBeenCalled();
      expect(w1.emitted('clear')).toBeTruthy();
      expect(w1.emitted('change')![0]).toEqual([[]]);
      expect(w1.find('.semi-cascader-selection-placeholder').text()).toBe('ph');
      w1.unmount();
      const w2 = base({ showClear: true, multiple: true, defaultValue: [['asia']] }, { slots: { clearIcon: () => h('i', { class: 'slot-clear' }) } });
      await w2.find('.semi-cascader').trigger('mouseenter');
      await nextTick();
      expect(w2.find('.slot-clear').exists()).toBe(true);
      w2.unmount();
    });

    it('expandIcon prop and slot replace the chevron on expandable rows', async () => {
      const w1 = base({ defaultOpen: true, expandIcon: h('i', { class: 'my-expand' }) });
      await wait();
      expect(popItems()[0].querySelector('.my-expand')).toBeTruthy();
      expect(popItems()[0].querySelector('.semi-cascader-option-icon-expand')).toBeNull();
      w1.unmount();
      document.body.innerHTML = '';
      const w2 = base({ defaultOpen: true }, { slots: { expandIcon: () => h('i', { class: 'slot-expand' }) } });
      await wait();
      expect(popItems()[0].querySelector('.slot-expand')).toBeTruthy();
      w2.unmount();
    });

    it('virtualizeInSearch renders the flattened search list through a virtual list', async () => {
      const wrapper = base({ filterTreeNode: true, virtualizeInSearch: { height: 100, width: 300, itemSize: 36 } });
      await wrapper.find('.semi-cascader').trigger('click');
      await wait();
      (wrapper.vm as any).search('a');
      await wait();
      const list = document.querySelector('.semi-cascader-option-list');
      expect(list).toBeTruthy();
      expect(list!.querySelector('.semi-cascader-option-flatten')).toBeTruthy();
      expect(list!.querySelectorAll('.semi-cascader-option-label-highlight').length).toBeGreaterThan(0);
      wrapper.unmount();
    });

    it('emits focus / dropdownVisibleChange / search; searchPlaceholder; autoClearSearchValue prop; input shows display text after close', async () => {
      const wrapper = base({ filterTreeNode: true, searchPlaceholder: 'type here', autoClearSearchValue: false, placeholder: 'ph' });
      expect(wrapper.find('.semi-cascader-selection-placeholder').text()).toBe('type here');
      await wrapper.find('.semi-cascader').trigger('click');
      await wait();
      expect(wrapper.emitted('dropdownVisibleChange')![0]).toEqual([true]);
      expect(wrapper.emitted('focus')).toBeTruthy();
      (wrapper.vm as any).search('bei');
      await wait();
      expect(wrapper.emitted('search')![0]).toEqual(['bei']);
      popItems()[0].click();
      await wait();
      expect(wrapper.emitted('change')![0]).toEqual([['asia', 'china', 'beijing']]);
      expect((wrapper.vm as any).state.inputValue).toBe('Asia / China / Beijing');
      expect(wrapper.emitted('dropdownVisibleChange')![1]).toEqual([false]);
      wrapper.unmount();
    });

    it('mouseEnterDelay / mouseLeaveDelay / preventScroll / stopPropagation / motion props are accepted', async () => {
      const wrapper = base({ mouseEnterDelay: 10, mouseLeaveDelay: 20, preventScroll: true, stopPropagation: false, motion: false, defaultOpen: true });
      await wait();
      expect(document.querySelector('.semi-cascader-popover')).toBeTruthy();
      wrapper.unmount();
    });

    it('dynamic treeData update rebuilds options in single mode', async () => {
      const data = ref<any[]>([]);
      const Comp = defineComponent({ setup: () => () => h(Cascader, { treeData: data.value, defaultOpen: true, motion: false }) });
      const wrapper = mount(Comp, { attachTo: document.body });
      await wait();
      expect(document.querySelector('.semi-cascader-option-empty')).toBeTruthy();
      data.value = [{ label: 'Item-0', value: '0', children: [{ label: 'Item-0-0', value: '0-0' }] }];
      await wait();
      expect(popItems()[0].textContent).toContain('Item-0');
      wrapper.unmount();
    });
  });
});
