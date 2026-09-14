import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Steps, { Step } from './index';
import { IconHome } from '../icons/generated';

const threeSteps = (extra: Record<string, any>[] = [{}, {}, {}]) => () => [
  h(Step, { title: 'First', description: 'd1', ...extra[0] }),
  h(Step, { title: 'Second', description: 'd2', ...extra[1] }),
  h(Step, { title: 'Third', description: 'd3', ...extra[2] }),
];

describe('Steps', () => {
  it('exposes Step as Steps.Step', () => {
    expect(Steps.Step).toBe(Step);
  });

  describe('type=fill (default)', () => {
    it('renders wrapper, Row/Col grid with equal widths, statuses derived from current', () => {
      const w = mount(Steps, { props: { current: 1 }, slots: { default: threeSteps() } });
      expect(w.classes()).toContain('semi-steps');
      expect(w.classes()).toContain('semi-steps-horizontal');
      expect(w.find('.semi-row-flex').exists()).toBe(true);
      expect(w.find('.semi-row-flex-start').exists()).toBe(true);
      const cols = w.findAll('.semi-col');
      expect(cols).toHaveLength(3);
      expect((cols[0].element as HTMLElement).style.width).toBe(`${100 / 3}%`);
      const items = w.findAll('.semi-steps-item');
      expect(items).toHaveLength(3);
      expect(items[0].classes()).toContain('semi-steps-item-finish');
      expect(items[1].classes()).toContain('semi-steps-item-process');
      expect(items[2].classes()).toContain('semi-steps-item-wait');
      // icons
      expect(items[0].find('.semi-steps-item-left .semi-icon-tick_circle').exists()).toBe(true);
      expect(items[0].find('.semi-steps-item-left').classes()).toContain('semi-steps-item-plain');
      expect(items[1].find('.semi-steps-item-left').classes()).toContain('semi-steps-item-icon-process');
      expect(items[1].find('.semi-steps-item-left').text()).toBe('2');
      expect(items[2].find('.semi-steps-item-left').text()).toBe('3');
      // title / description
      expect(items[0].find('.semi-steps-item-title').attributes('title')).toBe('First');
      expect(items[0].find('.semi-steps-item-title-text').text()).toBe('First');
      expect(items[0].find('.semi-steps-item-description').text()).toBe('d1');
      expect(items[0].find('.semi-steps-item-description').attributes('title')).toBe('d1');
      // a11y
      expect(items[0].attributes('tabindex')).toBe('0');
      expect(items[0].attributes('aria-current')).toBe('step');
      // not clickable without onChange
      expect(items[0].classes()).not.toContain('semi-steps-item-clickable');
    });

    it('direction vertical: no col width', () => {
      const w = mount(Steps, { props: { direction: 'vertical' }, slots: { default: threeSteps() } });
      expect(w.classes()).toContain('semi-steps-vertical');
      expect((w.find('.semi-col').element as HTMLElement).style.width).toBe('');
    });

    it('status prop applies to current step; error marks previous step next-error', () => {
      const w = mount(Steps, { props: { current: 1, status: 'error' }, slots: { default: threeSteps() } });
      const items = w.findAll('.semi-steps-item');
      expect(items[1].classes()).toContain('semi-steps-item-error');
      expect(items[0].classes()).toContain('semi-steps-next-error');
      expect(items[1].find('.semi-icon-alert_circle').exists()).toBe(true);
      const warn = mount(Steps, { props: { current: 0, status: 'warning' }, slots: { default: threeSteps() } });
      expect(warn.findAll('.semi-steps-item')[0].find('.semi-icon-alert_triangle').exists()).toBe(true);
    });

    it('step status prop overrides derived status', () => {
      const w = mount(Steps, { props: { current: 0 }, slots: { default: threeSteps([{}, { status: 'error' }, {}]) } });
      expect(w.findAll('.semi-steps-item')[1].classes()).toContain('semi-steps-item-error');
    });

    it('initial offsets step numbers and emitted index', async () => {
      const w = mount(Steps, { props: { current: 3, initial: 2, onChange: () => {} }, slots: { default: threeSteps() } });
      const items = w.findAll('.semi-steps-item');
      expect(items[0].classes()).toContain('semi-steps-item-finish');
      expect(items[1].classes()).toContain('semi-steps-item-process');
      expect(items[1].find('.semi-steps-item-left').text()).toBe('4');
      expect(items[2].find('.semi-steps-item-left').text()).toBe('5');
      await items[2].trigger('click');
      expect(w.emitted('change')![0]).toEqual([4]);
    });

    it('onChange makes steps clickable: click / Enter emit change & update:current; current step ignored', async () => {
      const w = mount(Steps, { props: { current: 0, onChange: () => {} }, slots: { default: threeSteps() } });
      const items = w.findAll('.semi-steps-item');
      expect(items[0].classes()).toContain('semi-steps-item-clickable');
      expect(items[0].classes()).toContain('semi-steps-item-process-hover');
      expect(items[0].classes()).toContain('semi-steps-item-process-active');
      expect(items[2].classes()).toContain('semi-steps-item-wait-hover');
      expect(items[0].find('.semi-steps-item-left').classes()).toContain('semi-steps-item-hover');
      await items[2].trigger('click');
      expect(w.emitted('change')![0]).toEqual([2]);
      expect(w.emitted('update:current')![0]).toEqual([2]);
      await items[1].trigger('keydown', { key: 'Enter' });
      expect(w.emitted('change')![1]).toEqual([1]);
      await items[1].trigger('keydown', { key: 'a' });
      expect(w.emitted('change')).toHaveLength(2);
      await items[0].trigger('click');
      expect(w.emitted('change')).toHaveLength(2);
    });

    it('v-model:current', async () => {
      const Parent = defineComponent({
        setup() {
          const cur = ref(0);
          return () => h(Steps, { current: cur.value, 'onUpdate:current': (v: number) => (cur.value = v) }, threeSteps());
        },
      });
      const w = mount(Parent);
      await w.findAll('.semi-steps-item')[2].trigger('click');
      expect(w.findAll('.semi-steps-item')[2].classes()).toContain('semi-steps-item-process');
    });

    it('custom icon (prop and slot)', () => {
      const w = mount(Steps, { slots: { default: () => [h(Step, { title: 'a', icon: h(IconHome) }), h(Step, { title: 'b' }, { icon: () => h('i', { class: 'slot-icon' }) })] } });
      const items = w.findAll('.semi-steps-item');
      expect(items[0].find('.semi-steps-item-left').classes()).toContain('semi-steps-item-icon');
      expect(items[0].find('.semi-steps-item-left').classes()).not.toContain('semi-steps-item-plain');
      expect(items[0].find('.semi-icon-home').exists()).toBe(true);
      expect(items[1].find('.semi-steps-item-left .slot-icon').exists()).toBe(true);
    });

    it('title / description slots', () => {
      const w = mount(Steps, { slots: { default: () => h(Step, null, { title: () => h('b', 'T'), description: () => h('i', 'D') }) } });
      expect(w.find('.semi-steps-item-title-text b').text()).toBe('T');
      expect(w.find('.semi-steps-item-description i').text()).toBe('D');
    });

    it('step onClick emits click and class/style/attrs pass through; wrapper aria-label + data attrs', async () => {
      const onClick = vi.fn();
      const w = mount(Steps, {
        attrs: { class: 'wrap', 'data-test': 'x', 'aria-label': 'steps-nav' },
        slots: { default: () => h(Step, { title: 'a', class: 'mine', style: { color: 'red' }, onClick, role: 'tab', ariaLabel: 'step-a' }) },
      });
      expect(w.classes()).toContain('wrap');
      expect(w.attributes('data-test')).toBe('x');
      expect(w.attributes('aria-label')).toBe('steps-nav');
      const item = w.find('.semi-steps-item');
      expect(item.classes()).toContain('mine');
      expect(item.classes()).toContain('semi-steps-item-clickable');
      expect((item.element as HTMLElement).style.color).toBe('red');
      expect(item.attributes('role')).toBe('tab');
      expect(item.attributes('aria-label')).toBe('step-a');
      await item.trigger('click');
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('type=basic', () => {
    it('renders basic wrapper classes, statuses, active/done and number icons', () => {
      const w = mount(Steps, { props: { type: 'basic', current: 1 }, slots: { default: threeSteps() } });
      expect(w.classes()).toContain('semi-steps-basic');
      expect(w.classes()).toContain('semi-steps-horizontal');
      expect(w.classes()).toContain('semi-steps-hasline');
      expect(w.classes()).not.toContain('semi-steps-default');
      expect(w.find('.semi-row-flex').exists()).toBe(false);
      const items = w.findAll('.semi-steps-item');
      expect(items[0].classes()).toContain('semi-steps-item-finish');
      expect(items[0].classes()).toContain('semi-steps-item-done');
      expect(items[1].classes()).toContain('semi-steps-item-active');
      expect(items[1].classes()).toContain('semi-steps-item-process');
      expect(items[1].find('.semi-steps-item-icon').classes()).toContain('semi-steps-item-icon-process');
      expect(items[1].find('.semi-steps-item-number-icon').text()).toBe('2');
      expect(items[2].find('.semi-steps-item-number-icon').text()).toBe('3');
      expect(items[0].find('.semi-steps-item-icon .semi-icon-tick_circle').exists()).toBe(true);
      expect(items[0].find('.semi-icon-extra-large').exists()).toBe(true);
      expect(items[0].find('.semi-steps-item-title-text').text()).toBe('First');
      expect(items[0].find('.semi-steps-item-description').text()).toBe('d1');
      expect(items[0].find('.semi-steps-item-container').exists()).toBe(true);
    });

    it('size small: wrapper class + icon size large', () => {
      const w = mount(Steps, { props: { type: 'basic', size: 'small', current: 1 }, slots: { default: threeSteps() } });
      expect(w.classes()).toContain('semi-steps-small');
      expect(w.findAll('.semi-steps-item')[0].find('.semi-icon-large').exists()).toBe(true);
    });

    it('hasLine=false, vertical direction', () => {
      const w = mount(Steps, { props: { type: 'basic', hasLine: false, direction: 'vertical' }, slots: { default: threeSteps() } });
      expect(w.classes()).not.toContain('semi-steps-hasline');
      expect(w.classes()).toContain('semi-steps-vertical');
    });

    it('empty title gets title-text-empty; no description node when absent', () => {
      const w = mount(Steps, { props: { type: 'basic' }, slots: { default: () => h(Step) } });
      expect(w.find('.semi-steps-item-title-text').classes()).toContain('semi-steps-item-title-text-empty');
      expect(w.find('.semi-steps-item-description').exists()).toBe(false);
    });

    it('error status on current + next-error on previous; warning icon', () => {
      const w = mount(Steps, { props: { type: 'basic', current: 2, status: 'error' }, slots: { default: threeSteps() } });
      const items = w.findAll('.semi-steps-item');
      expect(items[2].classes()).toContain('semi-steps-item-error');
      expect(items[2].find('.semi-icon-alert_circle').exists()).toBe(true);
      expect(items[1].classes()).toContain('semi-steps-next-error');
      const warn = mount(Steps, { props: { type: 'basic', status: 'warning' }, slots: { default: threeSteps() } });
      expect(warn.find('.semi-icon-alert_triangle').exists()).toBe(true);
    });

    it('custom icon wrapper class', () => {
      const w = mount(Steps, { props: { type: 'basic' }, slots: { default: () => h(Step, { icon: h(IconHome) }) } });
      const icon = w.find('.semi-steps-item-icon');
      expect(icon.classes()).toContain('semi-steps-item-custom-icon');
      expect(icon.find('.semi-icon-home').exists()).toBe(true);
    });

    it('onChange: hover/clickable classes and change emit', async () => {
      const w = mount(Steps, { props: { type: 'basic', current: 0, onChange: () => {} }, slots: { default: threeSteps() } });
      const items = w.findAll('.semi-steps-item');
      expect(items[1].classes()).toContain('semi-steps-item-hover');
      expect(items[1].classes()).toContain('semi-steps-item-clickable');
      expect(items[1].classes()).toContain('semi-steps-item-wait-hover');
      await items[1].trigger('click');
      expect(w.emitted('change')![0]).toEqual([1]);
      await items[2].trigger('keydown', { key: 'Enter' });
      expect(w.emitted('change')![1]).toEqual([2]);
    });

    it('updates when current changes', async () => {
      const w = mount(Steps, { props: { type: 'basic', current: 0 }, slots: { default: threeSteps() } });
      expect(w.findAll('.semi-steps-item')[0].classes()).toContain('semi-steps-item-active');
      await w.setProps({ current: 2 });
      expect(w.findAll('.semi-steps-item')[0].classes()).toContain('semi-steps-item-done');
      expect(w.findAll('.semi-steps-item')[2].classes()).toContain('semi-steps-item-active');
    });
  });

  describe('type=nav', () => {
    it('renders nav wrapper, active item, chevron between items (not after last)', () => {
      const w = mount(Steps, { props: { type: 'nav', current: 1 }, slots: { default: threeSteps() } });
      expect(w.classes()).toContain('semi-steps-nav');
      const items = w.findAll('.semi-steps-item');
      expect(items).toHaveLength(3);
      expect(items[1].classes()).toContain('semi-steps-item-active');
      expect(items[0].classes()).not.toContain('semi-steps-item-active');
      expect(items[0].find('.semi-steps-item-title').text()).toBe('First');
      expect(items[0].find('.semi-steps-item-icon .semi-icon-chevron_right').exists()).toBe(true);
      expect(items[2].find('.semi-steps-item-icon').exists()).toBe(false);
      // nav steps do not render description
      expect(items[0].find('.semi-steps-item-description').exists()).toBe(false);
    });

    it('size small class', () => {
      const w = mount(Steps, { props: { type: 'nav', size: 'small' }, slots: { default: threeSteps() } });
      expect(w.classes()).toContain('semi-steps-small');
    });

    it('onChange emits index + initial', async () => {
      const w = mount(Steps, { props: { type: 'nav', current: 0, initial: 5, onChange: () => {} }, slots: { default: threeSteps() } });
      await w.findAll('.semi-steps-item')[2].trigger('click');
      expect(w.emitted('change')![0]).toEqual([7]);
      await w.findAll('.semi-steps-item')[0].trigger('click');
      expect(w.emitted('change')).toHaveLength(1);
    });
  });

  it('switching type re-renders steps accordingly', async () => {
    const w = mount(Steps, { props: { type: 'fill' }, slots: { default: threeSteps() } });
    expect(w.find('.semi-row-flex').exists()).toBe(true);
    await w.setProps({ type: 'nav' });
    await nextTick();
    expect(w.classes()).toContain('semi-steps-nav');
    expect(w.find('.semi-row-flex').exists()).toBe(false);
  });

  it('Step a11y attrs (aria-current=step, tabindex=0) and keydown emit only on Enter', async () => {
    const onKeydown = vi.fn();
    const w = mount(Steps, {
      props: { type: 'basic', current: 0, onChange: () => {} },
      slots: { default: () => [h(Step, { title: 'a', onKeydown }), h(Step, { title: 'b' })] },
    });
    const item = w.findAll('.semi-steps-item')[0];
    expect(item.attributes('aria-current')).toBe('step');
    expect(item.attributes('tabindex')).toBe('0');
    await item.trigger('keydown', { key: 'a' });
    expect(onKeydown).not.toHaveBeenCalled();
    await item.trigger('keydown', { key: 'Enter' });
    expect(onKeydown).toHaveBeenCalledTimes(1);
  });

  it('Step outside Steps renders nothing', () => {
    const w = mount(Step, { props: { title: 'x' } });
    expect(w.html()).toBe('');
  });
});
