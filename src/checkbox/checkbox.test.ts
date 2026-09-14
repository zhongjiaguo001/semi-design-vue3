import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox, CheckboxGroup } from './index';

describe('Checkbox', () => {
  it('renders unchecked with label and a11y ids', () => {
    const w = mount(Checkbox, { slots: { default: () => 'Label' } });
    expect(w.classes()).toContain('semi-checkbox');
    expect(w.classes()).toContain('semi-checkbox-unChecked');
    const input = w.find('input');
    expect(input.attributes('type')).toBe('checkbox');
    expect(input.classes()).toContain('semi-checkbox-input');
    const addon = w.find('.semi-checkbox-addon');
    expect(addon.text()).toBe('Label');
    expect(addon.attributes('id')).toBeDefined();
    expect(input.attributes('aria-labelledby')).toBe(addon.attributes('id'));
    expect(w.find('.semi-checkbox-inner-display svg').exists()).toBe(false);
  });
  it('uncontrolled toggle via click / Enter emits change event object', async () => {
    const w = mount(Checkbox, { props: { value: 'v' } });
    await w.trigger('click');
    expect(w.classes()).toContain('semi-checkbox-checked');
    expect(w.find('.semi-checkbox-inner').classes()).toContain('semi-checkbox-inner-checked');
    expect(w.find('.semi-icon-checkbox_tick').exists()).toBe(true);
    const ev = w.emitted('change')![0][0] as any;
    expect(ev.target.checked).toBe(true);
    expect(ev.target.value).toBe('v');
    expect(typeof ev.stopPropagation).toBe('function');
    expect(w.emitted('update:modelValue')![0][0]).toBe(true);
    await w.trigger('keypress', { key: 'Enter', keyCode: 13 });
    expect(w.classes()).not.toContain('semi-checkbox-checked');
  });
  it('controlled checked / defaultChecked / v-model', async () => {
    const w = mount(Checkbox, { props: { checked: false } });
    await w.trigger('click');
    expect((w.emitted('change')![0][0] as any).target.checked).toBe(true);
    await nextTick();
    expect(w.classes()).not.toContain('semi-checkbox-checked');
    await w.setProps({ checked: true });
    expect(w.classes()).toContain('semi-checkbox-checked');
    expect(mount(Checkbox, { props: { defaultChecked: true } }).classes()).toContain('semi-checkbox-checked');
    const Parent = defineComponent({
      setup() {
        const v = ref(false);
        return () => h(Checkbox, { modelValue: v.value, 'onUpdate:modelValue': (val: boolean) => (v.value = val), id: 'p' });
      },
    });
    const p = mount(Parent);
    await p.find('#p').trigger('click');
    expect(p.find('#p').classes()).toContain('semi-checkbox-checked');
  });
  it('disabled prevents change; indeterminate icon', async () => {
    const w = mount(Checkbox, { props: { disabled: true } });
    expect(w.classes()).toContain('semi-checkbox-disabled');
    expect(w.find('input').attributes('disabled')).toBeDefined();
    await w.trigger('click');
    expect(w.emitted('change')).toBeUndefined();
    const i = mount(Checkbox, { props: { indeterminate: true } });
    expect(i.classes()).toContain('semi-checkbox-indeterminate');
    expect(i.find('.semi-icon-checkbox_indeterminate').exists()).toBe(true);
  });
  it('extra content and card types', () => {
    const w = mount(Checkbox, { props: { extra: 'more', type: 'card' }, slots: { default: () => 'L' } });
    expect(w.find('.semi-checkbox-extra').text()).toBe('more');
    expect(w.classes()).toContain('semi-checkbox-cardType');
    expect(w.classes()).toContain('semi-checkbox-cardType_enable');
    const pc = mount(Checkbox, { props: { type: 'pureCard', checked: true } });
    expect(pc.find('.semi-checkbox-inner').classes()).toContain('semi-checkbox-inner-pureCardType');
    expect(pc.classes()).toContain('semi-checkbox-cardType_checked');
    const ne = mount(Checkbox, { props: { type: 'card', extra: 'x' } });
    expect(ne.find('.semi-checkbox-extra').classes()).toContain('semi-checkbox-cardType_extra_noChildren');
  });
  it('mouse events, id, name, data attrs, exposed focus', async () => {
    const w = mount(Checkbox, { attachTo: document.body, props: { id: 'cb', name: 'n' }, attrs: { 'data-x': '1', class: 'c' } });
    expect(w.attributes('id')).toBe('cb');
    expect(w.find('input').attributes('name')).toBe('n');
    expect(w.attributes('data-x')).toBe('1');
    expect(w.classes()).toContain('c');
    await w.trigger('mouseenter');
    await w.trigger('mouseleave');
    expect(w.emitted('mouseenter')).toHaveLength(1);
    expect(w.emitted('mouseleave')).toHaveLength(1);
    (w.vm as any).focus();
    expect(document.activeElement).toBe(w.find('input').element);
    w.unmount();
  });
});

describe('CheckboxGroup', () => {
  it('renders options (string / object) with listitem role and group name', () => {
    const w = mount(CheckboxGroup, { props: { options: ['a', { label: 'B', value: 'b', disabled: true, extra: 'e' }], name: 'grp' } });
    expect(w.attributes('role')).toBe('list');
    expect(w.classes()).toContain('semi-checkboxGroup');
    expect(w.classes()).not.toContain('semi-checkbox');
    expect(w.classes()).toContain('semi-checkboxGroup-wrapper');
    expect(w.classes()).toContain('semi-checkboxGroup-vertical');
    const items = w.findAll('[role="listitem"]');
    expect(items).toHaveLength(2);
    expect(items[0].attributes('role')).toBe('listitem');
    expect(items[0].text()).toBe('a');
    expect(items[1].classes()).toContain('semi-checkbox-disabled');
    expect(items[1].find('.semi-checkbox-extra').text()).toBe('e');
    expect(items[0].find('input').attributes('name')).toBe('grp');
  });
  it('uncontrolled selection with defaultValue and change emits array', async () => {
    const w = mount(CheckboxGroup, { props: { defaultValue: ['a'], options: ['a', 'b'] } });
    const items = w.findAll('[role="listitem"]');
    expect(items[0].classes()).toContain('semi-checkbox-checked');
    await items[1].trigger('click');
    expect(w.emitted('change')![0][0]).toEqual(['a', 'b']);
    expect(w.emitted('update:modelValue')![0][0]).toEqual(['a', 'b']);
    expect(w.findAll('[role="listitem"]')[1].classes()).toContain('semi-checkbox-checked');
    await w.findAll('[role="listitem"]')[0].trigger('click');
    expect(w.emitted('change')![1][0]).toEqual(['b']);
  });
  it('controlled value and children checkboxes', async () => {
    const w = mount(CheckboxGroup, {
      props: { value: ['x'], direction: 'horizontal', type: 'card' },
      slots: { default: () => [h(Checkbox, { value: 'x' }, () => 'X'), h(Checkbox, { value: 'y' }, () => 'Y')] },
    });
    expect(w.classes()).toContain('semi-checkboxGroup-horizontal');
    expect(w.classes()).toContain('semi-checkboxGroup-horizontal-cardType');
    const items = w.findAll('[role="listitem"]');
    expect(items[0].classes()).toContain('semi-checkbox-checked');
    expect(items[0].classes()).toContain('semi-checkbox-cardType');
    await items[1].trigger('click');
    expect(w.emitted('change')![0][0]).toEqual(['x', 'y']);
    await nextTick();
    expect(w.findAll('[role="listitem"]')[1].classes()).not.toContain('semi-checkbox-checked');
    await w.setProps({ value: ['x', 'y'] });
    expect(w.findAll('[role="listitem"]')[1].classes()).toContain('semi-checkbox-checked');
  });
  it('group disabled disables children; per-item onChange in options', async () => {
    const onItem = vi.fn();
    const w = mount(CheckboxGroup, { props: { disabled: true, options: [{ label: 'A', value: 'a', onChange: onItem }] } });
    const item = w.find('[role="listitem"]');
    expect(item.classes()).toContain('semi-checkbox-disabled');
    await item.trigger('click');
    expect(w.emitted('change')).toBeUndefined();
    const w2 = mount(CheckboxGroup, { props: { options: [{ label: 'A', value: 'a', onChange: onItem }] } });
    await w2.find('[role="listitem"]').trigger('click');
    expect(onItem).toHaveBeenCalled();
    expect(w2.emitted('change')![0][0]).toEqual(['a']);
  });
});

describe('Checkbox parity extras', () => {
  it('exposes Checkbox.Group static and x-semi-children-alias', async () => {
    expect((Checkbox as any).Group).toBe(CheckboxGroup);
    const w = mount(Checkbox, { attrs: { 'x-semi-children-alias': 'label' }, slots: { default: () => 'L' } });
    expect(w.find('.semi-checkbox-addon').attributes('x-semi-prop')).toBe('label');
    const w2 = mount(Checkbox, { slots: { default: () => 'L' } });
    expect(w2.find('.semi-checkbox-addon').attributes('x-semi-prop')).toBe('children');
  });
  it('extra slot wins over extra prop and sets aria-describedby', () => {
    const w = mount(Checkbox, { props: { extra: 'p', extraId: 'ex1' }, slots: { extra: () => 'slot-extra' } });
    expect(w.find('.semi-checkbox-extra').text()).toBe('slot-extra');
    expect(w.find('input').attributes('aria-describedby')).toBe('ex1');
  });
  it('aria-label / aria-invalid / aria-required forwarded to input', () => {
    const w = mount(Checkbox, { attrs: { 'aria-label': 'lbl', 'aria-invalid': true, 'aria-required': true } });
    const input = w.find('input');
    expect(input.attributes('aria-label')).toBe('lbl');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-required')).toBe('true');
  });
  it('group: aria-label on root, horizontal/card classes, defaultValue toggling with indeterminate check-all pattern', async () => {
    const w = mount(CheckboxGroup, { attrs: { 'aria-label': 'g' }, props: { direction: 'horizontal', type: 'card', options: ['a', 'b'], defaultValue: ['a'] } });
    expect(w.attributes('aria-label')).toBe('g');
    expect(w.attributes('role')).toBe('list');
    expect(w.classes()).toContain('semi-checkboxGroup-horizontal');
    expect(w.classes()).toContain('semi-checkboxGroup-horizontal-cardType');
    const items = w.findAll('[role="listitem"]');
    expect(items[0].classes()).toContain('semi-checkbox-cardType_checked');
    await items[1].trigger('click');
    expect(w.emitted('change')![0][0]).toEqual(['a', 'b']);
    expect(w.emitted('update:modelValue')![0][0]).toEqual(['a', 'b']);
  });
  it('group pureCard type adds inner-pureCardType class to children', () => {
    const w = mount(CheckboxGroup, { props: { type: 'pureCard', options: ['a'] } });
    expect(w.classes()).toContain('semi-checkboxGroup-vertical-pureCardType');
    expect(w.find('.semi-checkbox-inner-pureCardType').exists()).toBe(true);
  });
});
