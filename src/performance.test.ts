/**
 * Lightweight render-budget checks for the heaviest already-ported components.
 * These are not microbenchmarks: they fail only if a mount is pathologically slow
 * (typically a render loop or accidental O(n²) child work).
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { Button } from './button';
import { Select } from './select';
import { Table } from './table';
import { Tree } from './tree';
import { Tabs, TabPane } from './tabs';

const BUDGET_MS = 2500;

function timeMs(fn: () => void) {
  const start = Date.now();
  fn();
  return Date.now() - start;
}

describe('render performance budgets', () => {
  it(`mounts 200 Buttons under ${BUDGET_MS}ms`, () => {
    const elapsed = timeMs(() => {
      const w = mount({
        render: () => h('div', Array.from({ length: 200 }, (_, i) => h(Button, { key: i }, () => `B${i}`))),
      });
      expect(w.findAll('button')).toHaveLength(200);
      w.unmount();
    });
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it(`mounts a 100-option Select under ${BUDGET_MS}ms`, () => {
    const optionList = Array.from({ length: 100 }, (_, i) => ({ label: `Option ${i}`, value: i }));
    const elapsed = timeMs(() => {
      const w = mount(Select, { props: { optionList, defaultValue: 1, motion: false } });
      expect(w.find('.semi-select').exists()).toBe(true);
      w.unmount();
    });
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it(`mounts a 80-row Table under ${BUDGET_MS}ms`, () => {
    const columns = [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Score', dataIndex: 'score' },
    ];
    const dataSource = Array.from({ length: 80 }, (_, i) => ({ key: String(i), name: `n${i}`, score: i }));
    const elapsed = timeMs(() => {
      const w = mount(Table, { props: { columns, dataSource, pagination: false } });
      expect(w.findAll('.semi-table-tbody .semi-table-row').length).toBeGreaterThan(0);
      w.unmount();
    });
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it(`mounts a 40-node Tree under ${BUDGET_MS}ms`, () => {
    const treeData = Array.from({ length: 10 }, (_, i) => ({
      label: `p${i}`,
      value: `p${i}`,
      key: `p${i}`,
      children: Array.from({ length: 3 }, (_, j) => ({ label: `c${i}-${j}`, value: `c${i}-${j}`, key: `c${i}-${j}` })),
    }));
    const elapsed = timeMs(() => {
      const w = mount(Tree, { props: { treeData, defaultExpandAll: true } });
      expect(w.find('.semi-tree-wrapper').exists()).toBe(true);
      w.unmount();
    });
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it(`mounts Tabs under ${BUDGET_MS}ms`, () => {
    const elapsed = timeMs(() => {
      const w = mount(Tabs, {
        props: { activeKey: 'a' },
        slots: {
          default: () =>
            Array.from({ length: 12 }, (_, i) => h(TabPane, { itemKey: `k${i}`, tab: `T${i}` }, () => `P${i}`)),
        },
      });
      expect(w.find('.semi-tabs').exists()).toBe(true);
      w.unmount();
    });
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });
});
