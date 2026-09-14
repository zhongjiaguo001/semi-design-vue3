import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Tree from './index';
import type { TreeNodeData } from './index';
import { IconSearch } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

const treeData = (): TreeNodeData[] => [
  {
    label: 'Asia',
    value: 'Asia',
    key: '0',
    children: [
      {
        label: 'China',
        value: 'China',
        key: '0-0',
        children: [
          { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
          { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
        ],
      },
      { label: 'Japan', value: 'Japan', key: '0-1', children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }] },
    ],
  },
  {
    label: 'North America',
    value: 'North America',
    key: '1',
    children: [
      { label: 'United States', value: 'United States', key: '1-0' },
      { label: 'Canada', value: 'Canada', key: '1-1', disabled: true },
    ],
  },
];

const nodes = (w: any) => w.findAll('.semi-tree-option');
// eslint-disable-next-line
const labels = (w: any) => nodes(w).map((n: any) => n.find('.semi-tree-option-label-text').text());

describe('Tree', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders wrapper / list / top-level nodes with a11y attributes', () => {
    const wrapper = mount(Tree, { props: { treeData: treeData() } });
    expect(wrapper.classes()).toContain('semi-tree-wrapper');
    const list = wrapper.find('.semi-tree-option-list');
    expect(list.classes()).toContain('semi-tree-option-list-block');
    expect(list.attributes('role')).toBe('tree');
    expect(list.attributes('aria-multiselectable')).toBe('false');
    expect(labels(wrapper)).toEqual(['Asia', 'North America']);
    const first = nodes(wrapper)[0];
    expect(first.attributes('role')).toBe('treeitem');
    expect(first.attributes('data-key')).toBe('0');
    expect(first.attributes('aria-level')).toBe('1');
    expect(first.attributes('aria-expanded')).toBe('false');
    expect(first.attributes('aria-setsize')).toBe('2');
    expect(first.attributes('aria-posinset')).toBe('1');
    expect(first.classes()).toContain('semi-tree-option-level-1');
    expect(first.classes()).toContain('semi-tree-option-collapsed');
    expect(first.find('.semi-tree-option-expand-icon').exists()).toBe(true);
    expect(first.find('.semi-tree-option-expand-icon').attributes('role')).toBe('button');
    expect(first.find('.semi-tree-option-indent').exists()).toBe(true);
    expect(first.findAll('.semi-tree-option-indent-unit')).toHaveLength(0);
    expect(nodes(wrapper)[1].classes()).toContain('semi-tree-option-tree-node-last-leaf');
  });

  it('blockNode=false removes the block class; class/style/data attrs and aria-label apply to the wrapper', () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), blockNode: false, className: 'cls', ariaLabel: 'my tree' }, attrs: { class: 'x', style: 'width: 10px', 'data-foo': 'bar' } });
    expect(wrapper.find('.semi-tree-option-list').classes()).not.toContain('semi-tree-option-list-block');
    expect(wrapper.classes()).toContain('cls');
    expect(wrapper.classes()).toContain('x');
    expect(wrapper.attributes('data-foo')).toBe('bar');
    expect(wrapper.attributes('aria-label')).toBe('my tree');
    expect((wrapper.element as HTMLElement).style.width).toBe('10px');
  });

  it('renders empty content (locale) when there is no data; emptyContent prop and slot', () => {
    const w1 = mount(Tree, { props: { treeData: [] } });
    expect(w1.find('.semi-tree-option-list').attributes('role')).toBe('none');
    expect(w1.find('.semi-tree-option-empty').exists()).toBe(true);
    expect(w1.find('.semi-tree-option-label-empty').text()).toBe('暂无数据');
    expect(w1.find('.semi-tree-option-label-empty').attributes('x-semi-prop')).toBe('emptyContent');
    const w2 = mount(Tree, { props: { treeData: [], emptyContent: 'nothing' } });
    expect(w2.find('.semi-tree-option-label-empty').text()).toBe('nothing');
    const w3 = mount(Tree, { props: { treeData: [] }, slots: { emptyContent: () => h('b', 'slot empty') } });
    expect(w3.find('.semi-tree-option-label-empty b').text()).toBe('slot empty');
  });

  it('expands / collapses on expand icon click and emits expand', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), motion: false } });
    await nodes(wrapper)[0].find('.semi-tree-option-expand-icon').trigger('click');
    expect(labels(wrapper)).toEqual(['Asia', 'China', 'Japan', 'North America']);
    expect(wrapper.emitted('expand')![0][0]).toEqual(['0']);
    expect(wrapper.emitted('expand')![0][1]).toMatchObject({ expanded: true, node: { key: '0' } });
    expect(nodes(wrapper)[0].attributes('aria-expanded')).toBe('true');
    expect(nodes(wrapper)[1].attributes('aria-level')).toBe('2');
    expect(nodes(wrapper)[1].findAll('.semi-tree-option-indent-unit')).toHaveLength(1);
    // no select on expand icon click
    expect(wrapper.emitted('select')).toBeUndefined();
    await nodes(wrapper)[0].find('.semi-tree-option-expand-icon').trigger('click');
    expect(labels(wrapper)).toEqual(['Asia', 'North America']);
    expect(wrapper.emitted('expand')![1][1]).toMatchObject({ expanded: false });
  });

  it('motion: collapsing wraps children in a collapsible that is removed on motion end', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), defaultExpandedKeys: ['0'] } });
    expect(labels(wrapper)).toEqual(['Asia', 'China', 'Japan', 'North America']);
    await nodes(wrapper)[0].find('.semi-tree-option-expand-icon').trigger('click');
    expect(wrapper.find('.semi-collapsible-wrapper').exists()).toBe(true);
    expect(wrapper.find('.semi-collapsible-wrapper').findAll('.semi-tree-option')).toHaveLength(2);
    await wait(300);
    expect(wrapper.find('.semi-collapsible-wrapper').exists()).toBe(false);
    expect(labels(wrapper)).toEqual(['Asia', 'North America']);
  });

  it('defaultExpandAll / expandAll / defaultExpandedKeys', () => {
    const w1 = mount(Tree, { props: { treeData: treeData(), defaultExpandAll: true } });
    expect(nodes(w1)).toHaveLength(9);
    const w2 = mount(Tree, { props: { treeData: treeData(), expandAll: true } });
    expect(nodes(w2)).toHaveLength(9);
    const w3 = mount(Tree, { props: { treeData: treeData(), defaultExpandedKeys: ['0-0'] } });
    // defaultExpandedKeys expands ancestors too
    expect(labels(w3)).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'North America']);
  });

  it('controlled expandedKeys: does not toggle until parent updates; autoExpandParent', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), expandedKeys: [], motion: false } });
    await nodes(wrapper)[0].find('.semi-tree-option-expand-icon').trigger('click');
    expect(wrapper.emitted('expand')![0][0]).toEqual(['0']);
    expect(labels(wrapper)).toEqual(['Asia', 'North America']);
    await wrapper.setProps({ expandedKeys: ['0'] });
    expect(labels(wrapper)).toEqual(['Asia', 'China', 'Japan', 'North America']);
    // child key without parent: nothing shown unless autoExpandParent
    await wrapper.setProps({ expandedKeys: ['0-0'] });
    expect(labels(wrapper)).toEqual(['Asia', 'North America']);
    await wrapper.setProps({ expandedKeys: ['0-0'], autoExpandParent: true });
    expect(labels(wrapper)).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'North America']);
  });

  it('single select: click selects, emits select + change (value) + update:value, class selected', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), defaultExpandAll: true } });
    await nodes(wrapper)[2].trigger('click');
    expect(wrapper.emitted('select')![0]).toEqual(['0-0-0', true, expect.objectContaining({ key: '0-0-0' })]);
    expect(wrapper.emitted('change')![0]).toEqual(['Beijing']);
    expect(wrapper.emitted('update:value')![0]).toEqual(['Beijing']);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['Beijing']);
    expect(nodes(wrapper)[2].classes()).toContain('semi-tree-option-selected');
    expect(nodes(wrapper)[2].attributes('aria-selected')).toBe('true');
    // clicking again does not emit change again
    await nodes(wrapper)[2].trigger('click');
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(wrapper.emitted('select')).toHaveLength(2);
    // selecting another node moves selection
    await nodes(wrapper)[3].trigger('click');
    expect(wrapper.emitted('change')![1]).toEqual(['Shanghai']);
    expect(nodes(wrapper)[2].classes()).not.toContain('semi-tree-option-selected');
    expect(nodes(wrapper)[3].classes()).toContain('semi-tree-option-selected');
  });

  it('Enter key on a node acts like click', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData() } });
    await nodes(wrapper)[0].trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('change')![0]).toEqual(['Asia']);
  });

  it('onChangeWithObject emits node objects', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), onChangeWithObject: true } as any });
    await nodes(wrapper)[0].trigger('click');
    expect(wrapper.emitted('change')![0][0]).toMatchObject({ key: '0', label: 'Asia', value: 'Asia' });
  });

  it('controlled value / defaultValue / v-model', async () => {
    const w1 = mount(Tree, { props: { treeData: treeData(), defaultValue: 'Shanghai' } });
    // value expands ancestors
    expect(labels(w1)).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'North America']);
    expect(nodes(w1)[3].classes()).toContain('semi-tree-option-selected');

    const w2 = mount(Tree, { props: { treeData: treeData(), value: 'Asia' } });
    expect(nodes(w2)[0].classes()).toContain('semi-tree-option-selected');
    await nodes(w2)[1].trigger('click');
    expect(w2.emitted('change')![0]).toEqual(['North America']);
    expect(nodes(w2)[0].classes()).toContain('semi-tree-option-selected');
    expect(nodes(w2)[1].classes()).not.toContain('semi-tree-option-selected');
    await w2.setProps({ value: 'North America' });
    expect(nodes(w2)[1].classes()).toContain('semi-tree-option-selected');

    const Parent = defineComponent({
      setup() {
        const v = ref<any>('Asia');
        return () => h('div', [h(Tree, { treeData: treeData(), modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, String(v.value))]);
      },
    });
    const w3 = mount(Parent);
    await nodes(w3)[1].trigger('click');
    expect(w3.find('#out').text()).toBe('North America');
    expect(nodes(w3)[1].classes()).toContain('semi-tree-option-selected');
  });

  it('disabled tree and disabled nodes do not select', async () => {
    const w1 = mount(Tree, { props: { treeData: treeData(), disabled: true } });
    expect(nodes(w1)[0].classes()).toContain('semi-tree-option-disabled');
    await nodes(w1)[0].trigger('click');
    expect(w1.emitted('change')).toBeUndefined();
    const w2 = mount(Tree, { props: { treeData: treeData(), defaultExpandedKeys: ['1'] } });
    const canada = nodes(w2)[3];
    expect(canada.text()).toContain('Canada');
    expect(canada.classes()).toContain('semi-tree-option-disabled');
    expect(canada.attributes('aria-disabled')).toBe('true');
    await canada.trigger('click');
    expect(w2.emitted('change')).toBeUndefined();
  });

  describe('multiple', () => {
    it('renders checkboxes, checking a parent checks descendants (related) and emits merged value', async () => {
      const wrapper = mount(Tree, { props: { treeData: treeData(), multiple: true, defaultExpandAll: true } });
      expect(wrapper.find('.semi-tree-option-list').attributes('aria-multiselectable')).toBe('true');
      expect(wrapper.findAll('.semi-tree-option .semi-checkbox')).toHaveLength(9);
      await nodes(wrapper)[1].find('.semi-checkbox').trigger('click');
      expect(wrapper.emitted('select')![0]).toEqual(['0-0', true, expect.objectContaining({ key: '0-0' })]);
      expect(wrapper.emitted('change')![0]).toEqual([['China']]);
      expect(nodes(wrapper)[1].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      expect(nodes(wrapper)[2].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      expect(nodes(wrapper)[3].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      // parent is half checked
      expect(nodes(wrapper)[0].find('.semi-checkbox').classes()).toContain('semi-checkbox-indeterminate');
      // clicking the node label also toggles
      await nodes(wrapper)[4].trigger('click');
      expect(wrapper.emitted('change')![1]).toEqual([['Asia']]);
      expect(nodes(wrapper)[0].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      // uncheck
      await nodes(wrapper)[2].find('.semi-checkbox').trigger('click');
      expect(wrapper.emitted('change')![2]).toEqual([['Shanghai', 'Japan']]);
      expect(wrapper.emitted('select')![2]).toEqual(['0-0-0', false, expect.anything()]);
    });

    it('leafOnly emits only leaf values; autoMergeValue=false emits all keys', async () => {
      const w1 = mount(Tree, { props: { treeData: treeData(), multiple: true, leafOnly: true } });
      await nodes(w1)[0].trigger('click');
      expect(w1.emitted('change')![0]).toEqual([['Beijing', 'Shanghai', 'Osaka']]);
      const w2 = mount(Tree, { props: { treeData: treeData(), multiple: true, autoMergeValue: false } });
      await nodes(w2)[0].trigger('click');
      expect(w2.emitted('change')![0][0]).toEqual(expect.arrayContaining(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'Osaka']));
    });

    it('checkRelation=unRelated checks only the clicked node', async () => {
      const wrapper = mount(Tree, { props: { treeData: treeData(), multiple: true, checkRelation: 'unRelated', defaultExpandAll: true } });
      await nodes(wrapper)[0].trigger('click');
      expect(wrapper.emitted('change')![0]).toEqual([['Asia']]);
      expect(nodes(wrapper)[0].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      expect(nodes(wrapper)[1].find('.semi-checkbox').classes()).not.toContain('semi-checkbox-checked');
      await nodes(wrapper)[0].trigger('click');
      expect(wrapper.emitted('change')![1]).toEqual([[]]);
    });

    it('controlled multiple value and defaultValue', async () => {
      const w1 = mount(Tree, { props: { treeData: treeData(), multiple: true, defaultValue: ['China'] } });
      expect(labels(w1)).toEqual(['Asia', 'China', 'Japan', 'North America']);
      expect(nodes(w1)[1].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      const w2 = mount(Tree, { props: { treeData: treeData(), multiple: true, value: ['Japan'] } });
      expect(nodes(w2)[2].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      await nodes(w2)[1].trigger('click');
      // China + Japan checked => Asia fully checked => merged value
      expect(w2.emitted('change')![0]).toEqual([['Asia']]);
      expect(nodes(w2)[1].find('.semi-checkbox').classes()).not.toContain('semi-checkbox-checked');
      await w2.setProps({ value: ['China', 'Japan'] });
      expect(nodes(w2)[1].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
      expect(nodes(w2)[0].find('.semi-checkbox').classes()).toContain('semi-checkbox-checked');
    });

    it('disableStrictly: disabled descendants are skipped when checking a parent', async () => {
      const wrapper = mount(Tree, { props: { treeData: treeData(), multiple: true, disableStrictly: true, defaultExpandAll: true } });
      await nodes(wrapper)[6].trigger('click'); // North America
      expect(wrapper.emitted('change')![0]).toEqual([['United States']]);
      expect(nodes(wrapper)[8].find('.semi-checkbox').classes()).not.toContain('semi-checkbox-checked');
      expect(nodes(wrapper)[6].find('.semi-checkbox').classes()).toContain('semi-checkbox-indeterminate');
    });
  });

  describe('filter', () => {
    it('filterTreeNode renders the search input (locale placeholder, search icon, showClear) and filters', async () => {
      const wrapper = mount(Tree, { props: { treeData: treeData(), filterTreeNode: true } });
      const search = wrapper.find('.semi-tree-search-wrapper');
      expect(search.exists()).toBe(true);
      const input = search.find('input');
      expect(input.attributes('placeholder')).toBe('搜索');
      expect(input.attributes('aria-label')).toBe('Filter Tree');
      expect(search.find('.semi-input-wrapper').classes()).toContain('semi-tree-input');
      expect(search.find('.semi-icon-search').exists()).toBe(true);
      await input.setValue('bei');
      expect(wrapper.emitted('search')![0]).toEqual(['bei', ['0-0', '0']]);
      expect(labels(wrapper)).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'North America']);
      const hit = nodes(wrapper)[2];
      expect(hit.find('.semi-tree-option-highlight').exists()).toBe(true);
      expect(hit.find('.semi-tree-option-highlight').text()).toBe('Bei');
      // clearable (showClear default true): clear button appears on hover
      expect(search.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-clearable');
      await search.find('.semi-input-wrapper').trigger('mouseenter');
      expect(search.find('.semi-input-clearbtn').exists()).toBe(true);
      await input.setValue('');
      expect(wrapper.emitted('search')![1][0]).toBe('');
    });

    it('showFilteredOnly hides non matching nodes; searchPlaceholder / searchClassName / searchStyle / showClear=false', async () => {
      const wrapper = mount(Tree, {
        props: { treeData: treeData(), filterTreeNode: true, showFilteredOnly: true, searchPlaceholder: 'find', searchClassName: 'my-search', searchStyle: { padding: '2px' }, showClear: false },
      });
      const search = wrapper.find('.semi-tree-search-wrapper');
      expect(search.classes()).toContain('my-search');
      expect((search.element as HTMLElement).style.padding).toBe('2px');
      expect(search.find('input').attributes('placeholder')).toBe('find');
      await search.find('input').setValue('osaka');
      expect(labels(wrapper)).toEqual(['Asia', 'Japan', 'Osaka']);
      expect(search.find('.semi-input-wrapper').classes()).not.toContain('semi-input-wrapper-clearable');
      await search.find('input').setValue('zzz');
      expect(wrapper.find('.semi-tree-option-empty').exists()).toBe(true);
      expect(wrapper.find('.semi-tree-option-list').attributes('role')).toBe('none');
    });

    it('filterTreeNode function + treeNodeFilterProp', async () => {
      const fn = vi.fn((input: string, target: any) => String(target).startsWith(input));
      const wrapper = mount(Tree, { props: { treeData: treeData(), filterTreeNode: fn, treeNodeFilterProp: 'value' } });
      await wrapper.find('input').setValue('Ja');
      expect(fn).toHaveBeenCalledWith('Ja', 'Japan', expect.objectContaining({ key: '0-1' }));
      expect(labels(wrapper)).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('searchRender=false hides the input; searchRender function and slot receive input props', async () => {
      const w1 = mount(Tree, { props: { treeData: treeData(), filterTreeNode: true, searchRender: false } });
      expect(w1.find('.semi-tree-search-wrapper').exists()).toBe(false);
      const searchRender = vi.fn((p: any) => h('input', { class: 'custom', value: p.value, onInput: (e: any) => p.onChange(e.target.value) }));
      const w2 = mount(Tree, { props: { treeData: treeData(), filterTreeNode: true, searchRender } });
      expect(searchRender.mock.calls[0][0]).toMatchObject({ value: '', placeholder: '搜索', showClear: true, className: 'semi-tree-input' });
      await w2.find('input.custom').setValue('osaka');
      expect(w2.emitted('search')![0][0]).toBe('osaka');
      const w3 = mount(Tree, { props: { treeData: treeData(), filterTreeNode: true }, slots: { searchRender: (p: any) => h('span', { class: 'slot-search' }, p.placeholder) } });
      expect(w3.find('.slot-search').text()).toBe('搜索');
    });

    it('exposed search() method filters programmatically', async () => {
      const wrapper = mount(Tree, { props: { treeData: treeData(), filterTreeNode: true } });
      (wrapper.vm as any).search('canada');
      await nextTick();
      expect(labels(wrapper)).toEqual(['Asia', 'North America', 'United States', 'Canada']);
      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('canada');
    });
  });

  it('treeDataSimpleJson renders keys as labels and emits picked json on change', async () => {
    const json = { Node1: { Child1: '0-0-1', Child2: '0-0-2' }, Node2: '0-1' };
    const wrapper = mount(Tree, { props: { treeDataSimpleJson: json, motion: false } });
    expect(labels(wrapper)).toEqual(['Node1', 'Node2']);
    await nodes(wrapper)[1].trigger('click');
    expect(wrapper.emitted('change')![0]).toEqual([{ Node2: '0-1' }]);
    await nodes(wrapper)[0].find('.semi-tree-option-expand-icon').trigger('click');
    expect(labels(wrapper)).toEqual(['Node1', 'Child1', 'Child2', 'Node2']);
    await nodes(wrapper)[1].trigger('click');
    expect(wrapper.emitted('change')![1]).toEqual([{ Node1: { Child1: '0-0-1' } }]);
  });

  it('keyMaps maps custom field names', async () => {
    const data = [{ name: 'A', id: 'a', kids: [{ name: 'B', id: 'b' }] }];
    const wrapper = mount(Tree, { props: { treeData: data, keyMaps: { key: 'id', label: 'name', children: 'kids', value: 'id' }, defaultExpandAll: true } });
    expect(labels(wrapper)).toEqual(['A', 'B']);
    await nodes(wrapper)[1].trigger('click');
    expect(wrapper.emitted('change')![0]).toEqual(['b']);
  });

  it('directory mode renders folder / file icons', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), directory: true, defaultExpandedKeys: ['1'], motion: false } });
    expect(nodes(wrapper)[0].find('.semi-icon-folder').exists()).toBe(true);
    expect(nodes(wrapper)[1].find('.semi-icon-folder_open').exists()).toBe(true);
    expect(nodes(wrapper)[2].find('.semi-icon-file').exists()).toBe(true);
    expect(nodes(wrapper)[2].find('.semi-tree-option-item-icon').exists()).toBe(true);
  });

  it('icon prop (node / function) and slot; node level icon wins', () => {
    const w1 = mount(Tree, { props: { treeData: treeData(), icon: h(IconSearch) } });
    expect(nodes(w1)[0].find('.semi-tree-option-label .semi-icon-search').exists()).toBe(true);
    const iconFn = vi.fn((p: any) => h('i', { class: 'fn-icon' }, p.eventKey));
    const w2 = mount(Tree, { props: { treeData: treeData(), icon: iconFn } });
    expect(nodes(w2)[0].find('.fn-icon').text()).toBe('0');
    const w3 = mount(Tree, { props: { treeData: treeData() }, slots: { icon: (p: any) => h('i', { class: 'slot-icon' }, p.eventKey) } });
    expect(nodes(w3)[1].find('.slot-icon').text()).toBe('1');
    const w4 = mount(Tree, { props: { treeData: [{ key: 'k', label: 'L', icon: h('em', { class: 'own' }) }], icon: h(IconSearch) } });
    expect(nodes(w4)[0].find('.own').exists()).toBe(true);
    expect(nodes(w4)[0].find('.semi-icon-search').exists()).toBe(false);
  });

  it('showLine renders indent lines and leaf switchers', () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), showLine: true, defaultExpandAll: true } });
    expect(nodes(wrapper)[0].find('.semi-tree-option-indent-show-line').exists()).toBe(true);
    const leaf = nodes(wrapper)[2];
    expect(leaf.find('.semi-tree-option-switcher').exists()).toBe(true);
    expect(leaf.find('.semi-tree-option-switcher-leaf-line').exists()).toBe(true);
    expect(leaf.find('.semi-tree-option-empty-icon').exists()).toBe(false);
    const w2 = mount(Tree, { props: { treeData: treeData(), defaultExpandAll: true } });
    expect(nodes(w2)[2].find('.semi-tree-option-empty-icon').exists()).toBe(true);
  });

  it('expandAction=click expands on node click; doubleClick expands on dblclick and emits doubleClick', async () => {
    const w1 = mount(Tree, { props: { treeData: treeData(), expandAction: 'click', motion: false } });
    await nodes(w1)[0].trigger('click');
    expect(w1.emitted('change')![0]).toEqual(['Asia']);
    expect(w1.emitted('expand')![0][0]).toEqual(['0']);
    expect(labels(w1)).toEqual(['Asia', 'China', 'Japan', 'North America']);
    const w2 = mount(Tree, { props: { treeData: treeData(), expandAction: 'doubleClick', motion: false } });
    await nodes(w2)[0].trigger('dblclick');
    expect(w2.emitted('doubleClick')![0][1]).toMatchObject({ key: '0' });
    expect(w2.emitted('expand')![0][0]).toEqual(['0']);
    expect(labels(w2)).toEqual(['Asia', 'China', 'Japan', 'North America']);
    await nodes(w2)[0].trigger('click');
    expect(w2.emitted('change')![0]).toEqual(['Asia']);
  });

  it('emits contextMenu on right click', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData() } });
    await nodes(wrapper)[1].trigger('contextmenu');
    expect(wrapper.emitted('contextMenu')![0][1]).toMatchObject({ key: '1' });
  });

  it('renderLabel prop and slot', () => {
    const renderLabel = vi.fn((label: any, data: any) => h('b', { class: 'rl' }, `${label}-${data.key}`));
    const w1 = mount(Tree, { props: { treeData: treeData(), renderLabel } });
    expect(nodes(w1)[0].find('.rl').text()).toBe('Asia-0');
    const w2 = mount(Tree, { props: { treeData: treeData() }, slots: { renderLabel: ({ label, data }: any) => h('i', { class: 'sl' }, `${label}/${data.key}`) } });
    expect(nodes(w2)[1].find('.sl').text()).toBe('North America/1');
  });

  it('renderFullLabel replaces the node markup and receives handlers / status', async () => {
    const renderFullLabel = vi.fn(({ className, onClick, onExpand, data, level, expandIcon, checkStatus, expandStatus }: any) =>
      h('li', { class: [className, 'full'], onClick, 'data-level': level }, [h('span', { class: 'exp', onClick: onExpand }, 'x'), expandIcon, `${data.label}:${checkStatus.checked}:${expandStatus.expanded}`])
    );
    const wrapper = mount(Tree, { props: { treeData: treeData(), renderFullLabel, motion: false } });
    const first = wrapper.findAll('li.full')[0];
    expect(first.classes()).toContain('semi-tree-option');
    expect(first.classes()).toContain('semi-tree-option-fullLabel-level-1');
    expect(first.attributes('data-level')).toBe('0');
    expect(first.text()).toContain('Asia:false:false');
    await first.find('.exp').trigger('click');
    expect(wrapper.emitted('expand')![0][0]).toEqual(['0']);
    expect(wrapper.findAll('li.full')).toHaveLength(4);
    await wrapper.findAll('li.full')[1].trigger('click');
    expect(wrapper.emitted('change')![0]).toEqual(['China']);
    const w2 = mount(Tree, { props: { treeData: treeData() }, slots: { renderFullLabel: ({ data }: any) => h('li', { class: 'slot-full' }, data.label) } });
    expect(w2.findAll('.slot-full')).toHaveLength(2);
  });

  it('expandIcon prop (function / vnode) and slot', async () => {
    const w1 = mount(Tree, { props: { treeData: treeData(), expandIcon: (p: any) => h('span', { class: ['ei', p.className], onClick: p.onClick }, p.expanded ? '-' : '+'), motion: false } });
    expect(nodes(w1)[0].find('.ei').text()).toBe('+');
    await nodes(w1)[0].find('.ei').trigger('click');
    expect(nodes(w1)[0].find('.ei').text()).toBe('-');
    const w2 = mount(Tree, { props: { treeData: treeData(), expandIcon: h('span', { class: 'vn' }, 'v'), motion: false } });
    expect(nodes(w2)[0].find('.vn').classes()).toContain('semi-tree-option-expand-icon');
    await nodes(w2)[0].find('.vn').trigger('click');
    expect(w2.emitted('expand')).toHaveLength(1);
    const w3 = mount(Tree, { props: { treeData: treeData() }, slots: { expandIcon: (p: any) => h('b', { class: 'se' }, String(p.expanded)) } });
    expect(nodes(w3)[0].find('.se').text()).toBe('false');
  });

  it('loadData: expanding a non-leaf loads children, shows spinner, emits load; loadedKeys controlled', async () => {
    const data = ref<any[]>([
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B', isLeaf: true },
    ]);
    const loadData = vi.fn(
      (node: any) =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            data.value = data.value.map((n) => (n.key === node.key ? { ...n, children: [{ key: 'a-0', label: 'A0' }] } : n));
            resolve();
          }, 20);
        })
    );
    const onLoad = vi.fn();
    const Parent = defineComponent({
      setup() {
        return () => h(Tree, { treeData: data.value, loadData, onLoad, motion: false });
      },
    });
    const wrapper = mount(Parent);
    // non-leaf (no isLeaf) shows an expand icon; isLeaf=true does not
    expect(nodes(wrapper)[0].find('.semi-tree-option-expand-icon').exists()).toBe(true);
    expect(nodes(wrapper)[1].find('.semi-tree-option-expand-icon').exists()).toBe(false);
    await nodes(wrapper)[0].find('.semi-tree-option-expand-icon').trigger('click');
    expect(loadData).toHaveBeenCalledWith(expect.objectContaining({ key: 'a' }));
    expect(nodes(wrapper)[0].find('.semi-tree-option-spin-icon').exists()).toBe(true);
    await wait(60);
    expect(onLoad).toHaveBeenCalled();
    expect(onLoad.mock.calls[0][0]).toBeInstanceOf(Set);
    expect(onLoad.mock.calls[0][0].has('a')).toBe(true);
    expect(labels(wrapper)).toEqual(['A', 'A0', 'B']);
    expect(nodes(wrapper)[0].find('.semi-tree-option-spin-icon').exists()).toBe(false);

    const w2 = mount(Tree, { props: { treeData: [{ key: 'a', label: 'A' }], loadData: vi.fn(() => Promise.resolve()), loadedKeys: ['a'] } });
    // already loaded with no children -> leaf
    expect(nodes(w2)[0].find('.semi-tree-option-expand-icon').exists()).toBe(false);
  });

  it('treeData change keeps expanded state and updates nodes', async () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), defaultExpandedKeys: ['0'], motion: false } });
    expect(labels(wrapper)).toEqual(['Asia', 'China', 'Japan', 'North America']);
    const next = treeData();
    next[0].children![0].label = 'PRC';
    await wrapper.setProps({ treeData: next });
    expect(labels(wrapper)).toEqual(['Asia', 'PRC', 'Japan', 'North America']);
    await wrapper.setProps({ treeData: [{ key: 'z', label: 'Z' }] });
    expect(labels(wrapper)).toEqual(['Z']);
  });

  it('labelEllipsis adds the ellipsis class', () => {
    const wrapper = mount(Tree, { props: { treeData: treeData(), labelEllipsis: true } });
    expect(nodes(wrapper)[0].classes()).toContain('semi-tree-option-ellipsis');
  });

  describe('draggable', () => {
    it('sets draggable attr / class and emits drag events with node data', async () => {
      const wrapper = mount(Tree, { attachTo: document.body, props: { treeData: treeData(), draggable: true, defaultExpandAll: true, motion: false } });
      const first = nodes(wrapper)[0];
      expect(first.attributes('draggable')).toBe('true');
      expect(first.classes()).toContain('semi-tree-option-draggable');
      const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn() };
      await first.trigger('dragstart', { dataTransfer });
      const dragStart: any = wrapper.emitted('dragStart')![0][0];
      expect(dragStart).toMatchObject({ node: { key: '0', label: 'Asia', pos: '0-0', expanded: true } });
      expect(dragStart.event).toBeTruthy();
      const target = nodes(wrapper)[6]; // North America
      const rect = { top: 100, bottom: 130, height: 30 };
      vi.spyOn(target.element as HTMLElement, 'getBoundingClientRect').mockReturnValue(rect as any);
      await target.trigger('dragenter', { clientY: 115 });
      await wait(20);
      expect(wrapper.emitted('dragEnter')![0][0]).toMatchObject({ node: { key: '1' } });
      expect(target.classes()).toContain('semi-tree-option-drag-over');
      // dragover at the same position is a no-op (no event); moving to the top gap updates the position
      await target.trigger('dragover', { clientY: 115 });
      expect(wrapper.emitted('dragOver')).toBeUndefined();
      await target.trigger('dragover', { clientY: 102 });
      expect(wrapper.emitted('dragOver')![0][0]).toMatchObject({ node: { key: '1' } });
      expect(target.find('.semi-tree-option-label').classes()).toContain('semi-tree-option-drag-over-gap-top');
      await target.trigger('drop', { clientY: 102 });
      const drop: any = wrapper.emitted('drop')![0][0];
      expect(drop).toMatchObject({ node: { key: '1' }, dragNode: { key: '0' }, dropToGap: true, dropPosition: 0 });
      expect(drop.dragNodesKeys).toEqual(expect.arrayContaining(['0', '0-0', '0-0-0']));
      await first.trigger('dragend');
      expect(wrapper.emitted('dragEnd')![0][0]).toMatchObject({ node: { key: '0' } });
      wrapper.unmount();
    });

    it('dragleave emits dragLeave; dropping on a descendant of the dragged node is ignored', async () => {
      const wrapper = mount(Tree, { attachTo: document.body, props: { treeData: treeData(), draggable: true, defaultExpandAll: true, motion: false, autoExpandWhenDragEnter: false } });
      const first = nodes(wrapper)[0];
      await first.trigger('dragstart', { dataTransfer: { setData: vi.fn() } });
      const child = nodes(wrapper)[1];
      await child.trigger('dragleave');
      expect(wrapper.emitted('dragLeave')![0][0]).toMatchObject({ node: { key: '0-0' } });
      await child.trigger('drop');
      expect(wrapper.emitted('drop')).toBeUndefined();
      wrapper.unmount();
    });
    it('hideDraggingNode sets a transparent drag image; renderDraggingNode supplies a custom one', async () => {
      const wrapper = mount(Tree, { attachTo: document.body, props: { treeData: treeData(), draggable: true, hideDraggingNode: true, motion: false } });
      const first = nodes(wrapper)[0];
      const setDragImage = vi.fn();
      await first.trigger('dragstart', { dataTransfer: { setData: vi.fn(), setDragImage } });
      expect(setDragImage).toHaveBeenCalledTimes(1);
      const img = setDragImage.mock.calls[0][0] as HTMLElement;
      expect(img.style.opacity).toBe('0');
      expect(img.classList.contains('semi-tree-option')).toBe(true);
      wrapper.unmount();

      const custom = document.createElement('div');
      custom.className = 'my-drag-img';
      const renderDraggingNode = vi.fn(() => custom);
      const w2 = mount(Tree, { attachTo: document.body, props: { treeData: treeData(), draggable: true, renderDraggingNode, motion: false } });
      const setDragImage2 = vi.fn();
      await nodes(w2)[0].trigger('dragstart', { dataTransfer: { setData: vi.fn(), setDragImage: setDragImage2 } });
      expect(renderDraggingNode).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ key: '0' }));
      expect(setDragImage2.mock.calls[0][0]).toBe(custom);
      w2.unmount();
    });

    it('autoExpandWhenDragEnter (default) expands a collapsed node hovered while dragging', async () => {
      const wrapper = mount(Tree, { attachTo: document.body, props: { treeData: treeData(), draggable: true, motion: false } });
      expect(nodes(wrapper).length).toBe(2);
      await nodes(wrapper)[0].trigger('dragstart', { dataTransfer: { setData: vi.fn() } });
      const target = nodes(wrapper)[1]; // North America (collapsed)
      vi.spyOn(target.element as HTMLElement, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 130, height: 30 } as any);
      await target.trigger('dragenter', { clientY: 115 });
      await wait(20);
      expect(wrapper.emitted('dragEnter')![0][0]).toMatchObject({ node: { key: '1' }, expandedKeys: expect.arrayContaining(['1']) });
      expect(wrapper.emitted('expand')).toBeTruthy();
      expect(labels(wrapper)).toContain('United States');
      wrapper.unmount();
    });
  });

  it('virtualize renders a virtual list and exposes scrollTo', async () => {
    const wrapper = mount(Tree, { attachTo: document.body, props: { treeData: treeData(), defaultExpandAll: true, virtualize: { itemSize: 28, height: 56 } } });
    const list = wrapper.find('.semi-tree-virtual-list');
    expect(list.exists()).toBe(true);
    expect(wrapper.find('.semi-tree-auto-wrapper').exists()).toBe(true);
    // only the visible window (+overscan) is rendered
    expect(nodes(wrapper).length).toBeLessThan(9);
    expect(nodes(wrapper)[0].classes()).toContain('semi-tree-option-ellipsis');
    (wrapper.vm as any).scrollTo({ key: '1-1', align: 'start' });
    await nextTick();
    expect((list.element as HTMLElement).scrollTop).toBe(8 * 28);
    wrapper.unmount();
  });

  it('exposes foundation and Tree.TreeNode static', () => {
    const wrapper = mount(Tree, { props: { treeData: treeData() } });
    expect((wrapper.vm as any).foundation).toBeTruthy();
    expect((Tree as any).TreeNode).toBeTruthy();
    expect((Tree as any).elementType).toBe('Tree');
  });
});
