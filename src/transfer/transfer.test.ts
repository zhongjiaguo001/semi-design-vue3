import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Transfer from './index';

const dataSource = [
  { label: 'Apple', value: 'apple', key: 'apple' },
  { label: 'Banana', value: 'banana', key: 'banana' },
  { label: 'Cherry', value: 'cherry', key: 'cherry' },
];

describe('Transfer', () => {
  it('renders left and right panels with locale empty right', () => {
    const w = mount(Transfer, { props: { dataSource } });
    expect(w.classes()).toContain('semi-transfer');
    expect(w.find('.semi-transfer-left').exists()).toBe(true);
    expect(w.find('.semi-transfer-right').exists()).toBe(true);
    expect(w.find('.semi-transfer-filter').exists()).toBe(true);
    expect(w.find('.semi-transfer-left-list').exists()).toBe(true);
    expect(w.findAll('.semi-checkbox').length).toBe(3);
    expect(w.find('.semi-transfer-right-empty').exists()).toBe(true);
  });

  it('selecting an item moves it to the right and emits change/select', async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const w = mount(Transfer, { props: { dataSource, onChange, onSelect } });
    await w.findAll('.semi-checkbox')[0].trigger('click');
    await nextTick();
    expect(onSelect).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toContain('apple');
    expect(w.find('.semi-transfer-right-list').exists()).toBe(true);
    expect(w.find('.semi-transfer-right-item-text').text()).toContain('Apple');
    expect(w.emitted('update:value')).toBeTruthy();
  });

  it('virtualize renders a windowed selected list', () => {
    const lots = Array.from({ length: 40 }, (_, i) => ({ label: `Item ${i}`, value: `v${i}`, key: `v${i}` }));
    const w = mount(Transfer, {
      props: {
        dataSource: lots,
        defaultValue: lots.slice(0, 20).map((d) => d.value),
        virtualize: { height: 120, itemSize: 36 },
      },
    });
    expect(w.find('.semi-transfer-right-list').exists()).toBe(true);
    const items = w.findAll('.semi-transfer-right-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThan(20);
  });

  it('removing from the right deselects', async () => {
    const onDeselect = vi.fn();
    const w = mount(Transfer, { props: { dataSource, defaultValue: ['apple'], onDeselect } });
    expect(w.find('.semi-transfer-right-item-text').text()).toContain('Apple');
    await w.find('.semi-transfer-item-close-icon').trigger('click');
    await nextTick();
    expect(onDeselect).toHaveBeenCalled();
    expect(w.find('.semi-transfer-right-empty').exists()).toBe(true);
  });

  it('select all / clear select all from header', async () => {
    const onChange = vi.fn();
    const w = mount(Transfer, { props: { dataSource, onChange } });
    const allBtn = w.find('.semi-transfer-header-all');
    expect(allBtn.exists()).toBe(true);
    await allBtn.trigger('click');
    await nextTick();
    expect(onChange.mock.calls.at(-1)[0]).toEqual(['apple', 'banana', 'cherry']);
    expect(w.findAll('.semi-transfer-right-item')).toHaveLength(3);
    await w.find('.semi-transfer-left .semi-transfer-header-all').trigger('click');
    await nextTick();
    expect(w.find('.semi-transfer-right-empty').exists()).toBe(true);
  });

  it('clear button on the right', async () => {
    const w = mount(Transfer, { props: { dataSource, defaultValue: ['apple', 'banana'] } });
    expect(w.findAll('.semi-transfer-right-item')).toHaveLength(2);
    await w.find('.semi-transfer-right-header .semi-transfer-header-all').trigger('click');
    await nextTick();
    expect(w.find('.semi-transfer-right-empty').exists()).toBe(true);
  });

  it('search filters left items and emits search', async () => {
    const onSearch = vi.fn();
    const w = mount(Transfer, { props: { dataSource, onSearch } });
    const input = w.find('.semi-transfer-filter input');
    await input.setValue('Ban');
    await nextTick();
    expect(onSearch).toHaveBeenCalledWith('Ban');
    expect(w.findAll('.semi-transfer-left-list .semi-checkbox')).toHaveLength(1);
    expect(w.text()).toContain('Banana');
  });

  it('filter=false hides search', () => {
    const w = mount(Transfer, { props: { dataSource, filter: false } });
    expect(w.find('.semi-transfer-filter').exists()).toBe(false);
  });

  it('empty dataSource shows left empty', () => {
    const w = mount(Transfer, { props: { dataSource: [] } });
    expect(w.find('.semi-transfer-left-empty').exists()).toBe(true);
  });

  it('controlled value updates the right panel', async () => {
    const w = mount(Transfer, { props: { dataSource, value: ['banana'] } });
    expect(w.find('.semi-transfer-right-item-text').text()).toContain('Banana');
    await w.setProps({ value: ['cherry'] });
    await nextTick();
    expect(w.find('.semi-transfer-right-item-text').text()).toContain('Cherry');
  });

  it('groupList renders group titles', () => {
    const groups = [
      { title: 'Fruit', children: [{ label: 'Apple', value: 'apple', key: 'apple' }] },
      { title: 'Veg', children: [{ label: 'Pea', value: 'pea', key: 'pea' }] },
    ];
    const w = mount(Transfer, { props: { dataSource: groups, type: 'groupList' } });
    const titles = w.findAll('.semi-transfer-group-title');
    expect(titles.map((t) => t.text())).toEqual(['Fruit', 'Veg']);
  });

  it('disabled class on wrapper', () => {
    const w = mount(Transfer, { props: { dataSource, disabled: true } });
    expect(w.classes()).toContain('semi-transfer-disabled');
  });

  it('loading shows spin on the left', () => {
    const w = mount(Transfer, { props: { dataSource, loading: true } });
    expect(w.find('.semi-spin').exists()).toBe(true);
  });

  it('renderSourcePanel / renderSelectedPanel take over', () => {
    const w = mount(Transfer, {
      props: {
        dataSource,
        renderSourcePanel: () => h('div', { class: 'custom-left' }, 'L'),
        renderSelectedPanel: () => h('div', { class: 'custom-right' }, 'R'),
      },
    });
    expect(w.find('.custom-left').text()).toBe('L');
    expect(w.find('.custom-right').text()).toBe('R');
    expect(w.classes()).toContain('semi-transfer-custom-panel');
  });
});
