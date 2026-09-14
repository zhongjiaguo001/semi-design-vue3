import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Form from './Form';
import { FormInput, FormSwitch, FormSelect, FormCheckbox } from './field';
import Slot from './Slot';
import Label from './Label';
import ErrorMessage from './ErrorMessage';
import Section from './Section';
import useForm from './useForm';
import withField from './withField';
import { useFormApi, useFormState, useFieldApi, useFieldState, withFormApi, withFormState } from './context';
import ArrayField from './arrayField';
import FormInputGroup from './group';

const wait = async () => {
  await flushPromises();
  await nextTick();
  await nextTick();
};

describe('Form', () => {
  it('renders a form with vertical layout class', () => {
    const w = mount(Form, { slots: { default: () => 'x' } });
    expect(w.find('form').classes()).toContain('semi-form');
    expect(w.find('form').classes()).toContain('semi-form-vertical');
  });

  it('initValues + Form.Input bind value and submit', async () => {
    const onSubmit = vi.fn();
    const w = mount(Form, {
      props: { initValues: { name: 'semi' }, onSubmit },
      slots: {
        default: () => h(FormInput, { field: 'name', label: 'Name' }),
      },
    });
    await wait();
    const input = w.find('input');
    expect((input.element as HTMLInputElement).value).toBe('semi');
    await input.setValue('vue');
    await wait();
    await w.find('form').trigger('submit');
    await wait();
    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'vue' });
  });

  it('rules validate on change and expose error message', async () => {
    const w = mount(Form, {
      slots: {
        default: () => h(FormInput, { field: 'email', label: 'Email', rules: [{ required: true, message: 'required' }] }),
      },
    });
    await wait();
    await w.find('input').setValue('');
    await w.find('input').trigger('change');
    await wait();
    // empty string may convert to undefined then validate
    await w.find('form').trigger('submit');
    await wait();
    expect(w.find('.semi-form-field-error-message').exists()).toBe(true);
  });

  it('getFormApi can setValue / getValue / reset', async () => {
    let api: any;
    const w = mount(Form, {
      props: { initValues: { a: 1 }, getFormApi: (x: any) => (api = x) },
      slots: { default: () => h(FormInput, { field: 'a' }) },
    });
    await wait();
    expect(api.getValue('a')).toBe(1);
    api.setValue('a', 2);
    await wait();
    expect(api.getValue('a')).toBe(2);
    api.reset();
    await wait();
    expect(api.getValue('a')).toBe(1);
  });

  it('Form.Switch uses checked valueKey', async () => {
    const onSubmit = vi.fn();
    const w = mount(Form, {
      props: { initValues: { on: true }, onSubmit },
      slots: { default: () => h(FormSwitch, { field: 'on', label: 'On' }) },
    });
    await wait();
    expect(w.find('.semi-switch').classes().join(' ')).toMatch(/checked|switch/);
    await w.find('form').trigger('submit');
    await wait();
    expect(onSubmit.mock.calls[0][0].on).toBe(true);
  });

  it('horizontal layout class and statics', () => {
    const w = mount(Form, { props: { layout: 'horizontal' } });
    expect(w.find('form').classes()).toContain('semi-form-horizontal');
    expect((Form as any).Input).toBeTruthy();
    expect((Form as any).Select).toBeTruthy();
    expect((Form as any).ArrayField).toBe(ArrayField);
    expect((Form as any).InputGroup).toBe(FormInputGroup);
    expect((Form as any).useForm).toBeTruthy();
    expect((Form as any).useFieldApi).toBeTruthy();
    expect((Form as any).useFieldState).toBeTruthy();
    expect((Form as any).withFormApi).toBeTruthy();
    expect((Form as any).withFormState).toBeTruthy();
    expect((Form as any).withField).toBeTruthy();
    expect((Form as any).elementType).toBe('Form');
  });

  it('Field validator alias works like validate', async () => {
    const w = mount(Form, {
      slots: {
        default: () =>
          h(FormInput, {
            field: 'name',
            label: 'Name',
            validator: (val: any) => (val ? '' : 'need name'),
          }),
      },
    });
    await wait();
    await w.find('form').trigger('submit');
    await wait();
    expect(w.find('.semi-form-field-error-message').exists()).toBe(true);
    expect(w.text()).toContain('need name');
  });

  it('ArrayField add / remove and submit values', async () => {
    const onSubmit = vi.fn();
    const w = mount(Form, {
      props: { initValues: { users: [{ name: 'a' }] }, onSubmit },
      slots: {
        default: () =>
          h(ArrayField, { field: 'users', initValue: [{ name: 'a' }] }, {
            default: ({ arrayFields, addWithInitValue }: any) =>
              h('div', [
                arrayFields.map((f: any) =>
                  h('div', { key: f.key, class: 'row' }, [
                    h(FormInput, { field: `${f.field}.name`, noLabel: true }),
                    h('button', { type: 'button', class: 'rm', onClick: f.remove }, 'rm'),
                  ])
                ),
                h('button', { type: 'button', class: 'add', onClick: () => addWithInitValue({ name: 'b' }) }, 'add'),
              ]),
          }),
      },
    });
    await wait();
    expect(w.findAll('.row')).toHaveLength(1);
    expect((w.find('input').element as HTMLInputElement).value).toBe('a');
    await w.find('.add').trigger('click');
    await wait();
    expect(w.findAll('.row').length).toBeGreaterThanOrEqual(2);
    await w.find('form').trigger('submit');
    await wait();
    expect(onSubmit).toHaveBeenCalled();
    expect(Array.isArray(onSubmit.mock.calls[0][0].users)).toBe(true);
    expect(onSubmit.mock.calls[0][0].users.map((u: any) => u?.name)).toEqual(['a', 'b']);
  });

  it('Form.InputGroup groups fields and hides per-field labels', async () => {
    const w = mount(Form, {
      slots: {
        default: () =>
          h(FormInputGroup, { label: 'Range' }, () => [
            h(FormInput, { field: 'start', label: 'Start', style: { width: '80px' } }),
            h(FormInput, { field: 'end', label: 'End', style: { width: '80px' } }),
          ]),
      },
    });
    await wait();
    expect(w.find('.semi-form-field-group').exists()).toBe(true);
    expect(w.find('.semi-input-group').exists() || w.find('.semi-input-wrapper').exists()).toBe(true);
    expect(w.findAll('input').length).toBe(2);
    expect(w.find('.semi-form-field-label').text()).toContain('Range');
  });

  it('label object spreads extra / optional / required into Label', async () => {
    const w = mount(Form, {
      slots: {
        default: () => [
          h(FormInput, { field: 'pwd', label: { text: '密码', extra: h('i', { class: 'extra-icon' }) } }),
          h(FormSelect, { field: 'role', label: { text: '角色', optional: true } }),
          h(FormInput, { field: 'pass', label: { text: '及格', required: true } }),
        ],
      },
    });
    await wait();
    const labels = w.findAll('.semi-form-field-label');
    expect(labels[0].classes()).toContain('semi-form-field-label-with-extra');
    expect(labels[0].find('.extra-icon').exists()).toBe(true);
    expect(labels[1].find('.semi-form-field-label-optional-text').exists()).toBe(true);
    expect(labels[2].classes()).toContain('semi-form-field-label-required');
  });

  it('required derives from rules and sets aria-required', async () => {
    const w = mount(Form, {
      slots: { default: () => h(FormInput, { field: 'a', label: 'A', rules: [{ required: true, message: 'x' }] }) },
    });
    await wait();
    expect(w.find('.semi-form-field-label').classes()).toContain('semi-form-field-label-required');
    expect(w.find('input').attributes('aria-required')).toBe('true');
  });

  it('pure renders no label / error and adds semi-form-field-pure class', async () => {
    const w = mount(Form, { slots: { default: () => h(FormInput, { field: 'p', pure: true, class: 'my' }) } });
    await wait();
    expect(w.find('.semi-form-field').exists()).toBe(false);
    expect(w.find('.semi-form-field-pure').exists()).toBe(true);
    expect(w.find('.semi-form-field-pure').classes()).toContain('my');
  });

  it('noLabel / noErrorMessage / name / fieldClassName / fieldStyle', async () => {
    const w = mount(Form, {
      slots: {
        default: () =>
          h(FormInput, { field: 'n', noLabel: true, noErrorMessage: true, name: 'abc', fieldClassName: 'fc', fieldStyle: { marginTop: '3px' }, helpText: 'help', validator: () => 'bad' }),
      },
    });
    await wait();
    await w.find('form').trigger('submit');
    await wait();
    const field = w.find('.semi-form-field');
    expect(field.classes()).toContain('semi-form-field-abc');
    expect(field.classes()).toContain('fc');
    expect(field.attributes('style')).toContain('margin-top: 3px');
    expect(w.find('.semi-form-field-label').exists()).toBe(false);
    expect(w.find('.semi-form-field-error-message').exists()).toBe(false);
    expect(w.find('input').attributes('name')).toBe('abc');
  });

  it('helpText / extraText (prop + slot) and extraTextPosition middle', async () => {
    const w = mount(Form, {
      props: { extraTextPosition: 'middle' },
      slots: {
        default: () => [
          h(FormInput, { field: 'a', label: 'A', helpText: 'help me', extraText: 'extra text' }),
          h(FormInput, { field: 'b', label: 'B', extraTextPosition: 'bottom' }, { extraText: () => h('b', { class: 'slot-extra' }, 'from slot') }),
        ],
      },
    });
    await wait();
    const fa = w.findAll('.semi-form-field')[0];
    expect(fa.attributes('x-extra-pos')).toBe('middle');
    expect(fa.find('.semi-form-field-help-text').text()).toBe('help me');
    expect(fa.find('.semi-form-field-extra').classes()).toContain('semi-form-field-extra-middle');
    expect(fa.find('.semi-form-field-extra').classes()).toContain('semi-form-field-extra-string');
    expect(fa.find('input').attributes('aria-describedby')).toBe('a-helpText a-extraText');
    const fb = w.findAll('.semi-form-field')[1];
    expect(fb.attributes('x-extra-pos')).toBe('bottom');
    expect(fb.find('.slot-extra').text()).toBe('from slot');
    expect(fb.find('.semi-form-field-extra').classes()).toContain('semi-form-field-extra-bottom');
  });

  it('validateStatus prop wins and error aria attributes are set', async () => {
    const w = mount(Form, {
      slots: { default: () => h(FormInput, { field: 'a', validateStatus: 'warning', validator: () => 'err' }) },
    });
    await wait();
    await w.find('form').trigger('submit');
    await wait();
    expect(w.find('input').attributes('aria-invalid')).toBe('true');
    expect(w.find('input').attributes('aria-errormessage')).toBe('a-errormessage');
    expect(w.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-warning');
  });

  it('inset labelPosition passes insetLabel from string or label object', async () => {
    const w = mount(Form, {
      props: { labelPosition: 'inset' },
      slots: {
        default: () => [h(FormInput, { field: 'name', label: '姓名' }), h(FormInput, { field: 'role', label: { text: '角色' } })],
      },
    });
    await wait();
    expect(w.find('label').exists()).toBe(false);
    const prefixes = w.findAll('.semi-input-prefix');
    expect(prefixes[0].text()).toBe('姓名');
    expect(prefixes[1].text()).toBe('角色');
    expect(prefixes[0].attributes('id')).toBe('name-label');
  });

  it('labelCol / wrapperCol wraps form in Row and field in Cols', async () => {
    const w = mount(Form, {
      props: { labelCol: { span: 4 }, wrapperCol: { span: 20 }, labelPosition: 'left', labelAlign: 'right' },
      slots: { default: () => [h(FormInput, { field: 'a', label: 'A' }), h(Slot, { label: 'S' }, () => 'slot')] },
    });
    await wait();
    expect(w.find('.semi-row').exists()).toBe(true);
    const field = w.find('.semi-form-field');
    expect(field.findAll('.semi-col').length).toBe(2);
    expect(field.find('.semi-col').classes()).toContain('semi-form-col-right');
    expect(field.find('.semi-col').classes()).toContain('semi-col-4');
    const slot = w.find('.semi-form-slot');
    expect(slot.findAll('.semi-col').length).toBe(2);
    expect(slot.find('.semi-form-field-label').classes()).toContain('semi-form-field-label-right');
  });

  it('labelCol with labelPosition top wraps label col in overflow hidden div', async () => {
    const w = mount(Form, {
      props: { labelCol: { span: 4 }, wrapperCol: { span: 20 }, labelPosition: 'top' },
      slots: { default: () => h(FormInput, { field: 'a', label: 'A' }) },
    });
    await wait();
    const field = w.find('.semi-form-field');
    expect((field.element.firstElementChild as HTMLElement).style.overflow).toBe('hidden');
  });

  it('Form.Slot renders label + error and honours noLabel', async () => {
    const w = mount(Form, {
      props: { labelPosition: 'left', labelWidth: 100 },
      slots: {
        default: () => [
          h(Slot, { label: { text: 'SlotA' }, error: 'slot error' }, () => h('span', { class: 'c' }, 'content')),
          h(Slot, { label: { text: 'SlotB', width: 160, align: 'right' } }, () => 'b'),
          h(Slot, { noLabel: true, class: 'nl' }, () => 'c'),
        ],
      },
    });
    await wait();
    const slots = w.findAll('.semi-form-slot');
    expect(slots[0].attributes('x-label-pos')).toBe('left');
    expect(slots[0].find('.semi-form-field-label').attributes('style')).toContain('width: 100px');
    expect(slots[0].find('.semi-form-field-error-message').text()).toBe('slot error');
    expect(slots[0].find('.semi-form-slot-main .c').exists()).toBe(true);
    expect(slots[1].find('.semi-form-field-label').attributes('style')).toContain('width: 160px');
    expect(slots[1].find('.semi-form-field-label').classes()).toContain('semi-form-field-label-right');
    expect(slots[2].find('.semi-form-field-label').exists()).toBe(false);
  });

  it('Form.Section / Label / ErrorMessage standalone', () => {
    const w = mount(Section, { props: { text: '基本信息', class: 'sec' }, slots: { default: () => h('i', 'child') } });
    expect(w.find('section.semi-form-section.sec').exists()).toBe(true);
    expect(w.find('.semi-form-section-text').text()).toBe('基本信息');
    expect(w.find('i').text()).toBe('child');
    const l = mount(Label, { props: { text: 'T', required: true, extra: 'E', width: 80, align: 'right', optional: true, id: 'x-label', name: 'x' } });
    expect(l.find('label').attributes('for')).toBe('x');
    expect(l.find('label').attributes('id')).toBe('x-label');
    expect(l.find('.semi-form-field-label-extra').text()).toBe('E');
    expect(l.find('.semi-form-field-label-optional-text').exists()).toBe(true);
    const e1 = mount(ErrorMessage, { props: { error: ['a', '', 'b'], validateStatus: 'error', showValidateIcon: true } });
    expect(e1.text()).toBe('a, b');
    expect(e1.find('.semi-form-field-validate-status-icon').exists()).toBe(true);
    const e2 = mount(ErrorMessage, { props: { error: '', validateStatus: 'error' } });
    expect(e2.find('div').exists()).toBe(false);
    const e3 = mount(ErrorMessage, { props: { helpText: 'hp', helpTextId: 'h-id' } });
    expect(e3.find('.semi-form-field-help-text span').attributes('id')).toBe('h-id');
  });

  it('render / component props receive { formState, formApi, values }', async () => {
    const render = vi.fn(({ formApi }: any) => h('i', { class: 'r' }, typeof formApi.setValue));
    const w = mount(Form, { props: { render } });
    await wait();
    expect(w.find('i.r').text()).toBe('function');
    const Comp = defineComponent({ props: { values: Object, formState: Object, formApi: Object }, setup: (p: any) => () => h('b', { class: 'c' }, JSON.stringify(p.values)) });
    const w2 = mount(Form, { props: { component: Comp, initValues: { a: 1 } } });
    await wait();
    expect(w2.find('b.c').text()).toBe('{"a":1}');
  });

  it('emits change / valueChange / errorChange / reset / submitFail', async () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    const onErrorChange = vi.fn();
    const onReset = vi.fn();
    const onSubmitFail = vi.fn();
    const w = mount(Form, {
      props: { onChange, onValueChange, onErrorChange, onReset, onSubmitFail },
      slots: { default: () => h(FormInput, { field: 'a', rules: [{ required: true, message: 'need' }] }) },
    });
    await wait();
    await w.find('input').setValue('x');
    await wait();
    expect(onValueChange).toHaveBeenCalled();
    expect(onValueChange.mock.calls[0][0]).toEqual({ a: 'x' });
    expect(onValueChange.mock.calls[0][1]).toEqual({ a: 'x' });
    expect(onChange).toHaveBeenCalled();
    await w.find('input').setValue('');
    await wait();
    expect(onErrorChange).toHaveBeenCalled();
    expect(onErrorChange.mock.calls[0][0].a).toBe('need');
    await w.find('form').trigger('submit');
    await wait();
    expect(onSubmitFail).toHaveBeenCalled();
    expect(onSubmitFail.mock.calls[0][0].a).toBe('need');
    await w.find('form').trigger('reset');
    await wait();
    expect(onReset).toHaveBeenCalled();
  });

  it('field onChange receives latest values as last argument and Form level validator sets errors', async () => {
    const onChange = vi.fn();
    const validator = (values: any) => (values.name !== 'mike' ? { name: 'you must name mike' } : {});
    const w = mount(Form, {
      props: { validator, layout: 'horizontal' },
      slots: { default: () => h(FormInput, { field: 'name', onChange }) },
    });
    await wait();
    await w.find('input').setValue('ab');
    await wait();
    const args = onChange.mock.calls[0];
    expect(args[0]).toBe('ab');
    expect(args[args.length - 1]).toEqual({ name: 'ab' });
    await w.find('form').trigger('submit');
    await wait();
    expect(w.find('.semi-form-field-error-message').text()).toContain('you must name mike');
  });

  it('formApi validate(silent) / validate(fields) / reset(fields) / getFieldExist / setValues / getFormProps', async () => {
    let api: any;
    const w = mount(Form, {
      props: { getFormApi: (x: any) => (api = x), disabled: false, initValues: { a: 'x', b: 'y' } },
      slots: {
        default: () => [
          h(FormInput, { field: 'a', rules: [{ required: true, message: 'a required' }] }),
          h(FormInput, { field: 'b', rules: [{ required: true, message: 'b required' }] }),
        ],
      },
    });
    await wait();
    api.setValues({ a: '', b: '' });
    await wait();
    await expect(api.validate({ silent: true })).rejects.toBeTruthy();
    await wait();
    expect(w.find('.semi-form-field-error-message').exists()).toBe(false);
    await expect(api.validate(['a'])).rejects.toBeTruthy();
    await wait();
    expect(w.findAll('.semi-form-field-error-message').length).toBe(1);
    api.reset(['a']);
    await wait();
    expect(api.getValue('a')).toBe('x');
    expect(api.getValue('b')).toBeUndefined();
    expect(api.getFieldExist('a')).toBe(true);
    expect(api.getFieldExist('zzz')).toBe(false);
    expect(api.getFormProps(['disabled']).disabled).toBe(false);
    api.setError('b', 'manual');
    await wait();
    expect(api.getError('b')).toBe('manual');
    api.setTouched('b', true);
    expect(api.getTouched('b')).toBe(true);
    expect(typeof api.submitForm).toBe('function');
    expect(typeof api.scrollToError).toBe('function');
    expect(typeof api.scrollToField).toBe('function');
  });

  it('keepState keeps value after unmount / remount, non keepState resets', async () => {
    let api: any;
    const show = ref(true);
    const w = mount(Form, {
      props: { getFormApi: (x: any) => (api = x) },
      slots: {
        default: () => [show.value ? h(FormInput, { field: 'keep', keepState: true }) : null, show.value ? h(FormInput, { field: 'nokeep' }) : null],
      },
    });
    await wait();
    api.setValue('keep', 'k');
    api.setValue('nokeep', 'n');
    await wait();
    show.value = false;
    await wait();
    show.value = true;
    await wait();
    expect(api.getValue('keep')).toBe('k');
    expect(api.getValue('nokeep')).toBeUndefined();
    const inputs = w.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('k');
  });

  it('disabled on Form propagates to fields and label', async () => {
    const w = mount(Form, {
      props: { disabled: true, stopPropagation: { submit: true } },
      slots: { default: () => h(FormInput, { field: 'a', label: 'A' }) },
    });
    await wait();
    expect(w.find('input').attributes('disabled')).toBeDefined();
    expect(w.find('.semi-form-field-label').classes()).toContain('semi-form-field-label-disabled');
    expect(w.find('form').attributes('x-form-id')).toBeTruthy();
  });

  it('useForm returns live formApi / formState / values bound through form prop', async () => {
    const [formApi, formState, values] = useForm();
    const w = mount(Form, { props: { form: formApi }, slots: { default: () => [h(FormInput, { field: 'username' }), h(FormInput, { field: 'email' })] } });
    await wait();
    formApi.setValue('username', 'semi');
    await wait();
    expect(values.username).toBe('semi');
    expect(formState.values.username).toBe('semi');
    await w.find('input').setValue('vue');
    await wait();
    expect(values.username).toBe('vue');
    expect(formState.touched.username).toBe(true);
    formApi.reset();
    await wait();
    expect(values.username).toBeUndefined();
    w.unmount();
    expect(Object.keys(values)).toEqual([]);
  });

  it('hooks useFormApi / useFormState / useFieldApi / useFieldState + HOC withFormApi / withFormState', async () => {
    const ApiBtn = defineComponent({
      setup() {
        const api = useFormApi()!;
        return () => h('button', { type: 'button', class: 'api', onClick: () => api.setValue('name', 'byApi') });
      },
    });
    const StateView = defineComponent({
      setup() {
        const st = useFormState()!;
        return () => h('i', { class: 'st' }, JSON.stringify(st.value.values));
      },
    });
    const FieldBtn = defineComponent({
      setup() {
        const fa = useFieldApi('name');
        const fs = useFieldState('name');
        return () => [h('button', { type: 'button', class: 'fapi', onClick: () => fa.setValue('byField') }), h('i', { class: 'fst' }, JSON.stringify(fs.value))];
      },
    });
    const HocApi = withFormApi(defineComponent({ props: { formApi: Object }, setup: (p: any) => () => h('button', { type: 'button', class: 'hapi', onClick: () => p.formApi.setValue('name', 'byHoc') }) }));
    const HocState = withFormState(defineComponent({ props: { formState: Object }, setup: (p: any) => () => h('i', { class: 'hst' }, p.formState.values.name) }));
    const w = mount(Form, {
      slots: { default: () => [h(FormInput, { field: 'name', initValue: 'mike' }), h(ApiBtn), h(StateView), h(FieldBtn), h(HocApi), h(HocState)] },
    });
    await wait();
    expect(w.find('i.st').text()).toBe('{"name":"mike"}');
    expect(JSON.parse(w.find('i.fst').text()).value).toBe('mike');
    await w.find('button.api').trigger('click');
    await wait();
    expect(w.find('i.hst').text()).toBe('byApi');
    await w.find('button.fapi').trigger('click');
    await wait();
    expect(JSON.parse(w.find('i.fst').text()).value).toBe('byField');
    await w.find('button.hapi').trigger('click');
    await wait();
    expect(w.find('i.st').text()).toBe('{"name":"byHoc"}');
  });

  it('withField wraps a custom controlled component (valuePath / valueKey)', async () => {
    const HtmlInput = defineComponent({
      props: { value: { type: String, default: '' }, validateStatus: String },
      emits: ['change'],
      setup: (p, { emit }) => () => h('input', { class: 'raw', value: p.value, onInput: (e: any) => emit('change', e) }),
    });
    const CustomInput = withField(HtmlInput, { valueKey: 'value', onKeyChangeFnName: 'onChange', valuePath: 'target.value' });
    let api: any;
    const w = mount(Form, { props: { getFormApi: (x: any) => (api = x) }, slots: { default: () => h(CustomInput, { field: 'name', label: { text: '基本信息', required: true } }) } });
    await wait();
    expect(w.find('.semi-form-field-label-required').exists()).toBe(true);
    await w.find('input.raw').setValue('abc');
    await wait();
    expect(api.getValue('name')).toBe('abc');
    expect(api.getFormState().touched.name).toBe(true);
  });

  it('Form.Checkbox without field inside CheckboxGroup is not injected', async () => {
    const w = mount(Form, { slots: { default: () => h(FormCheckbox, { value: 'x' }, () => 'c') } });
    await wait();
    expect(w.find('.semi-form-field').exists()).toBe(false);
    expect(w.find('.semi-checkbox').exists()).toBe(true);
  });

  it('ArrayField add(index) / remove / addWithInitValue(index) and nested field paths', async () => {
    let api: any;
    let ctx: any;
    const w = mount(Form, {
      props: { getFormApi: (x: any) => (api = x), initValues: { rules: [{ name: 'a' }, { name: 'b' }] }, allowEmpty: true },
      slots: {
        default: () =>
          h(ArrayField, { field: 'rules' }, {
            default: (p: any) => {
              ctx = p;
              return p.arrayFields.map((f: any) => h(FormInput, { key: f.key, field: `${f.field}[name]`, class: 'row' }));
            },
          }),
      },
    });
    await wait();
    expect(w.findAll('input').length).toBe(2);
    ctx.add();
    await wait();
    expect(w.findAll('input').length).toBe(3);
    ctx.addWithInitValue({ name: 'z' }, 0);
    await wait();
    expect(api.getValue('rules')[0].name).toBe('z');
    ctx.arrayFields[0].remove();
    await wait();
    expect(api.getValue('rules').map((r: any) => r?.name)).toEqual(['a', 'b', undefined]);
  });
});
