import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect } from 'vitest';
import { Radio, RadioGroup } from './index';

describe('Radio', () => {
  it('renders label with radio input', () => {
    const w = mount(Radio, { slots: { default: () => 'Opt' } });
    expect(w.element.tagName).toBe('LABEL');
    expect(w.classes()).toContain('semi-radio');
    expect(w.classes()).not.toContain('semi-radio-checked');
    const input = w.find('input');
    expect(input.attributes('type')).toBe('radio');
    expect(w.find('.semi-radio-addon').text()).toBe('Opt');
    expect(input.attributes('aria-labelledby')).toBe(w.find('.semi-radio-addon').attributes('id'));
    expect(w.find('.semi-radio-inner-display').exists()).toBe(true);
  });
  it('uncontrolled change and controlled checked', async () => {
    const w = mount(Radio, { props: { value: 'a' } });
    await w.find('input').setValue(true);
    expect(w.classes()).toContain('semi-radio-checked');
    expect(w.find('.semi-icon-radio').exists()).toBe(true);
    const ev = w.emitted('change')![0][0] as any;
    expect(ev.target.checked).toBe(true);
    expect(ev.target.value).toBe('a');
    expect(w.emitted('update:modelValue')![0][0]).toBe(true);

    const c = mount(Radio, { props: { checked: false } });
    await c.find('input').setValue(true);
    await nextTick();
    expect(c.classes()).not.toContain('semi-radio-checked');
    await c.setProps({ checked: true });
    expect(c.classes()).toContain('semi-radio-checked');
    expect(mount(Radio, { props: { defaultChecked: true } }).classes()).toContain('semi-radio-checked');
  });
  it('disabled / extra / advanced mode / button type / card type', () => {
    const d = mount(Radio, { props: { disabled: true, extra: 'ex' }, slots: { default: () => 'L' } });
    expect(d.classes()).toContain('semi-radio-disabled');
    expect(d.find('input').attributes('disabled')).toBeDefined();
    expect(d.find('.semi-radio-extra').text()).toBe('ex');
    expect(mount(Radio, { props: { mode: 'advanced' } }).find('input').attributes('type')).toBe('checkbox');
    const b = mount(Radio, { props: { type: 'button' }, slots: { default: () => 'B' } });
    expect(b.classes()).toContain('semi-radio-buttonRadioComponent');
    expect(b.find('.semi-radio-addon-buttonRadio').exists()).toBe(true);
    expect(b.find('.semi-radio-inner-buttonRadio').exists()).toBe(true);
    const c = mount(Radio, { props: { type: 'card', checked: true } });
    expect(c.classes()).toContain('semi-radio-cardRadioGroup');
    expect(c.classes()).toContain('semi-radio-cardRadioGroup_checked');
    expect(mount(Radio, { props: { type: 'pureCard' } }).find('.semi-radio-inner-pureCardRadio').exists()).toBe(true);
  });
  it('hover state, mouse events, displayMode, addon class/style', async () => {
    const w = mount(Radio, { props: { type: 'card', displayMode: 'vertical', addonClassName: 'ac', addonStyle: { color: 'red' } }, slots: { default: () => 'L' } });
    expect(w.classes()).toContain('semi-radio-vertical');
    await w.trigger('mouseenter');
    expect(w.classes()).toContain('semi-radio-cardRadioGroup_hover');
    expect(w.emitted('mouseenter')).toHaveLength(1);
    await w.trigger('mouseleave');
    expect(w.classes()).not.toContain('semi-radio-cardRadioGroup_hover');
    const addon = w.find('.semi-radio-addon');
    expect(addon.classes()).toContain('ac');
    expect(addon.attributes('style')).toContain('color: red');
  });
});

describe('RadioGroup', () => {
  it('renders options and selects via defaultValue', async () => {
    const w = mount(RadioGroup, { props: { defaultValue: 'a', options: ['a', { label: 'B', value: 'b', disabled: true }], name: 'g' } });
    expect(w.classes()).toContain('semi-radioGroup');
    expect(w.classes()).not.toContain('semi-radio');
    expect(w.classes()).toContain('semi-radioGroup-wrapper');
    expect(w.classes()).toContain('semi-radioGroup-horizontal');
    const items = w.findAll('label.semi-radio');
    expect(items).toHaveLength(2);
    expect(items[0].classes()).toContain('semi-radio-checked');
    expect(items[1].classes()).toContain('semi-radio-disabled');
    expect(items[0].find('input').attributes('name')).toBe('g');
  });
  it('uncontrolled change updates selection and emits', async () => {
    const w = mount(RadioGroup, { props: { defaultValue: 'a', options: ['a', 'b'] } });
    await w.findAll('input')[1].setValue(true);
    const ev = w.emitted('change')![0][0] as any;
    expect(ev.target.value).toBe('b');
    expect(w.emitted('update:modelValue')![0][0]).toBe('b');
    expect(w.findAll('label.semi-radio')[1].classes()).toContain('semi-radio-checked');
    expect(w.findAll('label.semi-radio')[0].classes()).not.toContain('semi-radio-checked');
  });
  it('controlled value with children radios; v-model', async () => {
    const w = mount(RadioGroup, { props: { value: 'x' }, slots: { default: () => [h(Radio, { value: 'x' }, () => 'X'), h(Radio, { value: 'y' }, () => 'Y')] } });
    expect(w.findAll('label.semi-radio')[0].classes()).toContain('semi-radio-checked');
    await w.findAll('input')[1].setValue(true);
    expect((w.emitted('change')![0][0] as any).target.value).toBe('y');
    await nextTick();
    expect(w.findAll('label.semi-radio')[1].classes()).not.toContain('semi-radio-checked');
    await w.setProps({ value: 'y' });
    expect(w.findAll('label.semi-radio')[1].classes()).toContain('semi-radio-checked');
    const Parent = defineComponent({
      setup() {
        const v = ref('a');
        return () => h(RadioGroup, { modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val), options: ['a', 'b'] });
      },
    });
    const p = mount(Parent);
    await p.findAll('input')[1].setValue(true);
    expect(p.findAll('label.semi-radio')[1].classes()).toContain('semi-radio-checked');
  });
  it('button type / card type / vertical direction / buttonSize / group disabled', () => {
    const b = mount(RadioGroup, { props: { type: 'button', buttonSize: 'small', options: ['a'] } });
    expect(b.classes()).toContain('semi-radioGroup-buttonRadio');
    expect(b.find('label.semi-radio').classes()).toContain('semi-radio-buttonRadioGroup');
    expect(b.find('label.semi-radio').classes()).toContain('semi-radio-buttonRadioGroup-small');
    expect(b.find('.semi-radio-addon-buttonRadio-small').exists()).toBe(true);
    const c = mount(RadioGroup, { props: { type: 'card', direction: 'vertical', options: ['a'], disabled: true } });
    expect(c.classes()).toContain('semi-radioGroup-vertical');
    expect(c.classes()).toContain('semi-radioGroup-vertical-card');
    expect(c.find('label.semi-radio').classes()).toContain('semi-radio-cardRadioGroup');
    expect(c.find('label.semi-radio').classes()).toContain('semi-radio-disabled');
  });
  it('advanced mode allows unselecting', async () => {
    const w = mount(RadioGroup, { props: { mode: 'advanced', defaultValue: 'a', options: ['a'] } });
    expect(w.find('input').attributes('type')).toBe('checkbox');
    await w.find('input').setValue(false);
    expect((w.emitted('change')![0][0] as any).target.value).toBeUndefined();
    expect(w.find('label.semi-radio').classes()).not.toContain('semi-radio-checked');
  });
});

describe('Radio parity extras', () => {
  it('exposes focus()/blur() and supports autoFocus', async () => {
    const w = mount(Radio, { attachTo: document.body, props: { autoFocus: true } });
    await nextTick();
    expect(document.activeElement).toBe(w.find('input').element);
    (w.vm as any).blur();
    expect(document.activeElement).not.toBe(w.find('input').element);
    (w.vm as any).focus();
    expect(document.activeElement).toBe(w.find('input').element);
    w.unmount();
  });
  it('addonId / extraId / name / aria-label / extra slot', () => {
    const w = mount(Radio, {
      props: { addonId: 'ad', extraId: 'ex', name: 'nm', 'aria-label': 'lbl' } as any,
      slots: { default: () => 'L', extra: () => h('b', 'slot-extra') },
    });
    const input = w.find('input');
    expect(input.attributes('name')).toBe('nm');
    expect(input.attributes('aria-label')).toBe('lbl');
    expect(input.attributes('aria-labelledby')).toBe('ad');
    expect(input.attributes('aria-describedby')).toBe('ex');
    expect(w.find('.semi-radio-addon').attributes('id')).toBe('ad');
    expect(w.find('.semi-radio-extra').attributes('id')).toBe('ex');
    expect(w.find('.semi-radio-extra b').text()).toBe('slot-extra');
  });
  it('emits mouseleave and does not render extra for button type', async () => {
    const w = mount(Radio, { props: { type: 'button', extra: 'x' }, slots: { default: () => 'L' } });
    await w.trigger('mouseleave');
    expect(w.emitted('mouseleave')).toHaveLength(1);
    expect(w.find('.semi-radio-extra').exists()).toBe(false);
  });
  it('standalone advanced mode toggles back to unchecked', async () => {
    const w = mount(Radio, { props: { mode: 'advanced', defaultChecked: true } });
    expect(w.classes()).toContain('semi-radio-checked');
    await w.find('input').setValue(false);
    expect((w.emitted('change')![0][0] as any).target.checked).toBe(false);
    expect(w.classes()).not.toContain('semi-radio-checked');
  });
  it('RadioGroup passes aria/id/name, and options with extra/style/className', () => {
    const w = mount(RadioGroup, {
      props: { id: 'gid', name: 'grp', 'aria-label': 'group', 'aria-required': 'true', options: [{ label: 'G', value: 'g', extra: 'Semi', style: { width: '120px' }, className: 'opt' }] } as any,
    });
    expect(w.attributes('id')).toBe('gid');
    expect(w.attributes('aria-label')).toBe('group');
    expect(w.attributes('aria-required')).toBe('true');
    const item = w.find('label.semi-radio');
    expect(item.classes()).toContain('opt');
    expect(item.attributes('style')).toContain('width: 120px');
    expect(item.find('.semi-radio-extra').text()).toBe('Semi');
    expect(item.find('input').attributes('name')).toBe('grp');
  });
  it('RadioGroup pureCard type and defaultValue with children', () => {
    const w = mount(RadioGroup, {
      props: { type: 'pureCard', defaultValue: 2, direction: 'vertical' },
      slots: { default: () => [h(Radio, { value: 1, disabled: true, extra: 'e' }, () => 'A'), h(Radio, { value: 2, extra: 'e' }, () => 'B')] },
    });
    const items = w.findAll('label.semi-radio');
    expect(items[0].classes()).toContain('semi-radio-cardRadioGroup_disabled');
    expect(items[1].classes()).toContain('semi-radio-cardRadioGroup_checked');
    expect(items[1].find('.semi-radio-inner-pureCardRadio').exists()).toBe(true);
    expect(w.classes()).toContain('semi-radioGroup-vertical-card');
  });
});
