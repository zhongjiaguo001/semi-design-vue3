import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect } from 'vitest';
import { InputGroup, Input } from './index';

describe('InputGroup', () => {
  it('renders group and passes size / disabled to children', () => {
    const w = mount(InputGroup, {
      props: { size: 'large', disabled: true },
      slots: { default: () => [h(Input, { placeholder: 'a' }), h(Input, { placeholder: 'b', disabled: false })] },
    });
    const group = w.find('.semi-input-group');
    expect(group.attributes('role')).toBe('group');
    expect(group.attributes('aria-label')).toBe('Input group');
    expect(group.classes()).toContain('semi-input-large');
    const inputs = w.findAll('input');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].attributes('disabled')).toBeDefined();
    expect(inputs[1].attributes('disabled')).toBeUndefined();
    expect(w.findAll('.semi-input-wrapper')[0].classes()).toContain('semi-input-wrapper-large');
  });

  it('default size has no size class', () => {
    const w = mount(InputGroup, { slots: { default: () => h(Input) } });
    expect(w.find('.semi-input-group').classes()).not.toContain('semi-input-default');
  });

  it('emits focus / blur from children', async () => {
    const w = mount(InputGroup, { slots: { default: () => h(Input) } });
    await w.find('input').trigger('focus');
    await w.find('input').trigger('blur');
    expect(w.emitted('focus')!.length).toBeGreaterThan(0);
    expect(w.emitted('blur')!.length).toBeGreaterThan(0);
  });

  it('renders label wrapper when label.text given', () => {
    const w = mount(InputGroup, {
      props: { label: { text: 'Name', name: 'grp', required: true }, labelPosition: 'left' },
      slots: { default: () => h(Input) },
    });
    const wrapper = w.find('.semi-input-group-wrapper');
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.classes()).toContain('semi-input-group-wrapper-with-left-label');
    const label = w.find('label');
    expect(label.text()).toContain('Name');
    expect(label.classes()).toContain('semi-form-field-label-required');
    expect(w.find('.semi-input-group').attributes('id')).toBe('grp');
  });
});

describe('InputGroup parity extras', () => {
  it('labelPosition top adds the top-label wrapper class and links label to group id', () => {
    const w = mount(InputGroup, { props: { label: { text: 'L', name: 'g1' }, labelPosition: 'top' }, slots: { default: () => h(Input) } });
    expect(w.find('.semi-input-group-wrapper').classes()).toContain('semi-input-group-wrapper-with-top-label');
    expect(w.find('label').attributes('for')).toBe('g1');
    expect(w.find('.semi-input-group').attributes('id')).toBe('g1');
  });

  it('passes through extra attrs (e.g. placeholder-like props) to children', () => {
    const w = mount(InputGroup, { attrs: { 'data-x': '1' }, slots: { default: () => h(Input) } });
    expect(w.find('input').attributes('data-x')).toBe('1');
  });
});
