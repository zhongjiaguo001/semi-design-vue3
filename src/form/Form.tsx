import { defineComponent, h, onMounted, onBeforeUnmount, shallowRef, nextTick } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import FormFoundation from '@douyinfe/semi-foundation/lib/es/form/foundation';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/form/constants';
import { getUuidv4 } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import '@douyinfe/semi-foundation/lib/es/form/form.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { Row } from '../grid';
import { getDataAttr } from '../_utils';
import { provideFormApi, provideFormState, provideFormUpdater, useFieldApi, useFieldState, withFormApi, withFormState } from './context';
import withField from './withField';
import Slot from './Slot';
import Section from './Section';
import Label from './Label';
import ErrorMessage from './ErrorMessage';
import {
  FormInput,
  FormInputNumber,
  FormTextArea,
  FormSelect,
  FormCheckboxGroup,
  FormCheckbox,
  FormRadioGroup,
  FormRadio,
  FormDatePicker,
  FormSwitch,
  FormSlider,
  FormTimePicker,
  FormTreeSelect,
  FormCascader,
  FormRating,
  FormAutoComplete,
  FormUpload,
  FormTagInput,
  FormPinCode,
} from './field';
import useForm from './useForm';
import ArrayField from './arrayField';
import FormInputGroup from './group';
import type { FormState } from '@douyinfe/semi-foundation/lib/es/form/interface';

const prefix = cssClasses.PREFIX;

export const formProps = {
  ariaLabel: { type: String, default: undefined },
  allowEmpty: { type: Boolean, default: false },
  autoScrollToError: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: false },
  className: { type: String, default: undefined },
  component: { type: [Object, Function] as PropType<any>, default: undefined },
  disabled: { type: Boolean, default: false },
  extraTextPosition: { type: String as PropType<(typeof strings.EXTRA_POS)[number]>, default: undefined },
  getFormApi: { type: Function as PropType<(api: any) => void>, default: undefined },
  initValues: { type: Object as PropType<Record<string, any>>, default: undefined },
  validateFields: { type: Function as PropType<any>, default: undefined },
  validator: { type: Function as PropType<any>, default: undefined },
  layout: { type: String as PropType<(typeof strings.LAYOUT)[number]>, default: 'vertical' },
  labelPosition: { type: String as PropType<(typeof strings.LABEL_POS)[number]>, default: 'top' },
  labelWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
  labelAlign: { type: String as PropType<(typeof strings.LABEL_ALIGN)[number]>, default: undefined },
  labelCol: { type: Object, default: undefined },
  render: { type: Function as PropType<(props: any) => any>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  showValidateIcon: { type: Boolean, default: true },
  stopValidateWithError: { type: Boolean, default: false },
  stopPropagation: { type: Object as PropType<{ submit?: boolean; reset?: boolean }>, default: undefined },
  id: { type: String, default: undefined },
  wrapperCol: { type: Object, default: undefined },
  trigger: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  form: { type: Object as PropType<any>, default: undefined },
};

export const formEmits = ['submit', 'submitFail', 'change', 'reset', 'valueChange', 'errorChange'];

const Form = defineComponent({
  name: 'Form',
  inheritAttrs: false,
  props: formProps,
  emits: formEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { adapter: baseAdapter, state } = useBaseComponent(props as any, { formId: '' });
    warning(Boolean(props.component && props.render), '[Semi Form] You should not use <Form component> and <Form render> in ths same time; <Form render> will be ignored');

    const formStateRef = shallowRef<FormState>({ values: {}, errors: {}, touched: {} });
    const syncState = () => {
      formStateRef.value = foundation.getFormState();
      if (props.form && typeof props.form.__updateState === 'function') {
        props.form.__updateState(formStateRef.value);
      }
    };

    const adapter = {
      ...baseAdapter,
      cloneDeep,
      notifySubmit: (values: any, e: any) => emit('submit', values, e),
      notifySubmitFail: (errors: any, values: any, e: any) => emit('submitFail', errors, values, e),
      forceUpdate: (callback?: () => void) => {
        syncState();
        if (callback) nextTick(callback);
      },
      notifyChange: (formState: FormState) => emit('change', formState),
      notifyValueChange: (values: any, changedValues: any) => emit('valueChange', values, changedValues),
      notifyErrorChange: (errors: any, changedError: any) => emit('errorChange', errors, changedError),
      notifyReset: () => emit('reset'),
      initFormId: () => {
        state.formId = getUuidv4();
      },
      getInitValues: () => props.initValues,
      getFormProps: (keys?: undefined | string | string[]) => {
        if (typeof keys === 'undefined') return props;
        if (typeof keys === 'string') return (props as any)[keys];
        const out: Record<string, any> = {};
        keys.forEach((key) => {
          out[key] = (props as any)[key];
        });
        return out;
      },
      getAllErrorDOM: () => {
        const xId = props.id ? props.id : state.formId;
        return document.querySelectorAll(`form[x-form-id="${xId}"] .${cssClasses.PREFIX}-field-error-message`);
      },
      getFieldDOM: (field: string) => {
        const xId = props.id ? props.id : state.formId;
        return document.querySelector(`form[x-form-id="${xId}"] .${cssClasses.PREFIX}-field[x-field-id="${field}"]`);
      },
      getFieldErrorDOM: (field: string) => {
        const xId = props.id ? props.id : state.formId;
        return document.querySelector(
          `form[x-form-id="${xId}"] .${cssClasses.PREFIX}-field[x-field-id="${field}"] .${cssClasses.PREFIX}-field-error-message`
        );
      },
    };

    const foundation = new (FormFoundation as any)(adapter);
    const formApi = foundation.getFormApi();
    if (props.getFormApi) props.getFormApi(formApi);
    formStateRef.value = foundation.getFormState();

    provideFormUpdater(foundation.getModifyFormStateApi());
    provideFormApi(formApi);
    provideFormState(formStateRef);

    onMounted(() => {
      foundation.init();
      syncState();
      if (props.form && typeof props.form.__bind === 'function') props.form.__bind(formApi);
    });
    onBeforeUnmount(() => {
      foundation.destroy();
      if (props.form && typeof props.form.__unbind === 'function') props.form.__unbind();
    });

    const submit = (e: Event) => {
      e.preventDefault();
      if (props.stopPropagation?.submit) e.stopPropagation();
      foundation.submit(e);
    };
    const reset = (e: Event) => {
      e.preventDefault();
      if (props.stopPropagation?.reset) e.stopPropagation();
      foundation.reset();
    };

    expose({ formApi, foundation, submit: () => foundation.submit(), reset: () => foundation.reset() });

    return () => {
      const { layout, className, style, id, component, render, labelCol, wrapperCol } = props;
      const formId = id ? id : state.formId;
      const formCls = classNames(prefix, className, (attrs as any).class, {
        [`${prefix}-vertical`]: layout === 'vertical',
        [`${prefix}-horizontal`]: layout === 'horizontal',
      });
      const formState = formStateRef.value;
      const contentProps = { formState, formApi, values: formState.values };
      let content: any;
      if (component) content = h(component, contentProps);
      else if (render) content = render(contentProps);
      else content = slots.default?.(contentProps);
      const { class: _c, style: attrStyle, onSubmit: _s, onReset: _r, ...rest } = attrs as any;
      const formContent = h(
        'form',
        {
          style: [style, attrStyle],
          ...getDataAttr(rest),
          ...rest,
          onReset: reset,
          onSubmit: submit,
          class: formCls,
          id: formId,
          'x-form-id': formId,
          'aria-label': props.ariaLabel ?? rest['aria-label'],
        },
        content
      );
      return labelCol && wrapperCol ? h(Row, null, () => formContent) : formContent;
    };
  },
});

(Form as any).Input = FormInput;
(Form as any).TextArea = FormTextArea;
(Form as any).InputNumber = FormInputNumber;
(Form as any).Select = FormSelect;
(Form as any).Checkbox = FormCheckbox;
(Form as any).CheckboxGroup = FormCheckboxGroup;
(Form as any).Radio = FormRadio;
(Form as any).RadioGroup = FormRadioGroup;
(Form as any).DatePicker = FormDatePicker;
(Form as any).TimePicker = FormTimePicker;
(Form as any).Switch = FormSwitch;
(Form as any).Slider = FormSlider;
(Form as any).TreeSelect = FormTreeSelect;
(Form as any).Cascader = FormCascader;
(Form as any).Rating = FormRating;
(Form as any).AutoComplete = FormAutoComplete;
(Form as any).Upload = FormUpload;
(Form as any).TagInput = FormTagInput;
(Form as any).PinCode = FormPinCode;
(Form as any).Slot = Slot;
(Form as any).ErrorMessage = ErrorMessage;
(Form as any).Label = Label;
(Form as any).Section = Section;
(Form as any).ArrayField = ArrayField;
(Form as any).InputGroup = FormInputGroup;
(Form as any).useForm = useForm;
(Form as any).useFieldApi = useFieldApi;
(Form as any).useFieldState = useFieldState;
(Form as any).withFormApi = withFormApi;
(Form as any).withFormState = withFormState;
(Form as any).withField = withField;
(Form as any).elementType = 'Form';

export default Form;
