import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/form/constants';
import { isValid, generateValidatesFromRules, mergeOptions, transformTrigger, transformDefaultBooleanAPI, isRequired } from '@douyinfe/semi-foundation/lib/es/form/utils';
import cloneDeep from 'lodash/cloneDeep';
import * as ObjectUtil from '@douyinfe/semi-foundation/lib/es/utils/object';
import isPromise from '@douyinfe/semi-foundation/lib/es/utils/isPromise';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import type { CallOpts, WithFieldOption } from '@douyinfe/semi-foundation/lib/es/form/interface';
import ErrorMessage from './ErrorMessage';
import Label from './Label';
import { Col } from '../grid';
import { useFormUpdater, useArrayFieldState } from './context';
import { getDataAttr, normalizeNode } from '../_utils';

const prefix = cssClasses.PREFIX;

const fieldOnlyProps = {
  field: { type: String, default: undefined },
  label: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  labelPosition: { type: String, default: undefined },
  labelWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
  labelAlign: { type: String, default: undefined },
  labelCol: { type: Object, default: undefined },
  wrapperCol: { type: Object, default: undefined },
  noLabel: { type: Boolean, default: false },
  noErrorMessage: { type: Boolean, default: false },
  isInInputGroup: { type: Boolean, default: false },
  initValue: { type: [String, Number, Boolean, Object, Array] as PropType<any>, default: undefined },
  validate: { type: Function as PropType<(val: any, values: any) => any>, default: undefined },
  validator: { type: Function as PropType<(val: any, values: any) => any>, default: undefined },
  validateStatus: { type: String, default: undefined },
  trigger: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  allowEmptyString: { type: Boolean, default: undefined },
  allowEmpty: { type: Boolean, default: undefined },
  emptyValue: { type: [String, Number, Boolean, Object] as PropType<any>, default: '' },
  rules: { type: Array as PropType<any[]>, default: undefined },
  required: { type: Boolean, default: undefined },
  keepState: { type: Boolean, default: false },
  transform: { type: Function as PropType<(val: any) => any>, default: undefined },
  name: { type: String, default: undefined },
  fieldClassName: { type: String, default: undefined },
  fieldStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  convert: { type: Function as PropType<(val: any) => any>, default: undefined },
  stopValidateWithError: { type: Boolean, default: undefined },
  helpText: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  extraText: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  extraTextPosition: { type: String, default: undefined },
  pure: { type: Boolean, default: false },
  id: { type: String, default: undefined },
};

export function withField(Component: any, opts?: WithFieldOption) {
  const Fielded = defineComponent({
    name: `Form${(Component as any).name || 'Field'}`,
    inheritAttrs: false,
    props: fieldOnlyProps,
    setup(props, { attrs, slots, expose }) {
      const updater = useFormUpdater();
      const arrayFieldState = useArrayFieldState();
      const { options, shouldInject } = mergeOptions(opts, { ...props, ...attrs } as any);

      warning(typeof props.field === 'undefined' && options.shouldInject, "[Semi Form]: 'field' is required, please check your props of Field Component");

      if (!shouldInject) {
        return () => h(Component, { ...attrs }, slots);
      }

      if (!updater || typeof updater.getFormProps !== 'function') {
        warning(true, '[Semi Form]: Field Component must be use inside the Form, please check your dom declaration');
        return () => null;
      }

      const field = () => props.field as string;
      const formProps = () =>
        updater.getFormProps([
          'labelPosition',
          'labelWidth',
          'labelAlign',
          'labelCol',
          'wrapperCol',
          'disabled',
          'showValidateIcon',
          'extraTextPosition',
          'stopValidateWithError',
          'trigger',
          'allowEmpty',
        ]);

      const initValueInForm = typeof props.field !== 'undefined' ? updater.getValue(props.field) : undefined;
      const copiedInitValue = typeof props.initValue !== 'undefined' ? cloneDeep(props.initValue) : undefined;
      let initVal = typeof copiedInitValue !== 'undefined' ? copiedInitValue : initValueInForm;
      if (arrayFieldState) {
        if (typeof props.initValue !== 'undefined') {
          initVal = arrayFieldState.shouldUseInitValue ? copiedInitValue : typeof initValueInForm !== 'undefined' ? initValueInForm : copiedInitValue;
        } else {
          initVal = initValueInForm;
        }
      }

      const value = ref<any>(typeof initVal !== 'undefined' ? initVal : null);
      const error = ref<any>(undefined);
      const touched = ref<boolean | undefined>(undefined);
      const status = ref<string>(props.validateStatus || 'default');
      const isUnmounted = ref(false);
      let validatePromise: Promise<any> | null = null;
      let allowEmpty = props.allowEmpty || updater.getFormProps().allowEmpty;
      let keepState = props.keepState;
      if (keepState && arrayFieldState?.inArrayField) {
        warning(true, `[Semi Form]: 'keepState' is not supported on Field "${props.field}" inside <ArrayField/>. It will be ignored.`);
        keepState = false;
      }

      const getVal = () => value.value;
      const getError = () => error.value;
      const mergeTrigger = () => transformTrigger(props.trigger, formProps().trigger);

      const updateTouched = (isTouched: boolean, callOpts?: CallOpts) => {
        touched.value = isTouched;
        updater.updateStateTouched(field(), isTouched, callOpts);
      };
      const updateError = (errors: any, callOpts?: CallOpts) => {
        if (isUnmounted.value) return;
        if (errors === getError()) return;
        const isSilent = callOpts && callOpts.silent;
        if (!isSilent) {
          error.value = errors;
          status.value = !isValid(errors) ? 'error' : 'success';
        }
        updater.updateStateError(field(), errors, callOpts);
      };
      const updateValue = (val: any, callOpts?: CallOpts) => {
        value.value = val;
        updater.updateStateValue(field(), val, { ...callOpts, allowEmpty });
      };
      const reset = () => {
        const callOpts = { notNotify: true, notUpdate: true };
        updateValue(initVal !== null ? initVal : undefined, callOpts);
        updateError(undefined, callOpts);
        updateTouched(undefined as any, callOpts);
        status.value = 'default';
      };

      const _validateInternal = (val: any, callOpts: CallOpts) => {
        const latestRules = props.rules || [];
        const validator = generateValidatesFromRules(field(), latestRules);
        const mergeStop = transformDefaultBooleanAPI(props.stopValidateWithError, formProps().stopValidateWithError, false);
        const rootPromise = new Promise((resolve, reject) => {
          validator
            .validate({ [field()]: val }, { first: mergeStop }, () => undefined)
            .then(() => {
              if (isUnmounted.value || validatePromise !== rootPromise) return;
              status.value = 'success';
              updateError(undefined, callOpts);
              resolve({});
            })
            .catch((err: any) => {
              if (isUnmounted.value || validatePromise !== rootPromise) return;
              const { errors, fields } = err || {};
              if (errors && fields) {
                let messages = errors.map((e: any) => e.message);
                if (messages.length === 1) messages = messages[0];
                const hasRulesError = Array.isArray(errors) && errors.length > 0;
                if (hasRulesError) {
                  if (!callOpts?.silent) status.value = 'error';
                  updateError(messages, callOpts);
                  resolve(errors);
                }
              } else {
                if (!callOpts?.silent) status.value = 'error';
                updateError(err?.message, callOpts);
                resolve(err?.message);
              }
            });
        });
        validatePromise = rootPromise;
        return rootPromise;
      };

      const _validate = (val: any, values: any, callOpts: CallOpts) => {
        const rootPromise = new Promise((resolve) => {
          let maybePromisedErrors: any;
          try {
            const fieldValidator = props.validator || props.validate;
            maybePromisedErrors = fieldValidator!(val, values);
          } catch (err) {
            maybePromisedErrors = err;
          }
          if (maybePromisedErrors === undefined) {
            resolve({});
            updateError(undefined, callOpts);
          } else if (isPromise(maybePromisedErrors)) {
            maybePromisedErrors.then((result: any) => {
              if (isUnmounted.value || validatePromise !== rootPromise) return;
              if (isValid(result)) {
                updateError(undefined, callOpts);
                resolve(null);
              } else {
                updateError(result, callOpts);
                resolve(result);
              }
            });
          } else if (isValid(maybePromisedErrors)) {
            updateError(undefined, callOpts);
            resolve(null);
          } else {
            updateError(maybePromisedErrors, callOpts);
            resolve(maybePromisedErrors);
          }
        });
        validatePromise = rootPromise;
        return rootPromise;
      };

      const fieldValidate = (val: any, callOpts?: CallOpts) => {
        let finalVal = val;
        if (props.transform) finalVal = props.transform(val);
        if (props.validator || props.validate) return _validate(finalVal, updater.getValue(), callOpts);
        if (props.rules) return _validateInternal(finalVal, callOpts);
        return null;
      };

      const handleChange = (newValue: any, e?: any, ...other: any[]) => {
        let val = options.valuePath ? ObjectUtil.get(newValue, options.valuePath) : newValue;
        if (typeof props.convert === 'function') val = props.convert(val);
        if (!(props.allowEmptyString || allowEmpty) && val === props.emptyValue) val = undefined;
        const prevLocalVal = getVal();
        const prevFormVal = updater.getValue(field(), { needClone: true });
        const fnKey = options.onKeyChangeFnName;
        try {
          value.value = val;
          updater.updateStateValue(field(), val, { notNotify: true, notUpdate: true, allowEmpty });
          const userHandler = (attrs as any)[fnKey];
          if (typeof userHandler === 'function') {
            userHandler(newValue, e, ...other, updater.getValue());
          }
          touched.value = true;
          updater.updateStateTouched(field(), true, { notNotify: true, notUpdate: true });
          updater.updateStateValue(field(), val, { allowEmpty });
          if (mergeTrigger().includes('change')) fieldValidate(val);
        } catch (err) {
          value.value = prevLocalVal;
          updater.updateStateValue(field(), prevFormVal, { notNotify: true, notUpdate: true, allowEmpty });
          throw err;
        }
      };

      const handleBlur = (...e: any[]) => {
        (attrs as any).onBlur?.(...e);
        if (!touched.value) updateTouched(true);
        if (mergeTrigger().includes('blur')) fieldValidate(getVal());
      };

      const fieldApi = { setValue: updateValue, setTouched: updateTouched, setError: updateError, reset, validate: fieldValidate };
      // React: `required = isRequired(rules)` (mergeProps); an explicit `required` prop still wins
      const getRequired = () => (typeof props.required === 'boolean' ? props.required : isRequired(props.rules as any));
      // React `label` may be a plain object ({ text, extra, required, optional, ... }) spread into <Label>
      const isLabelObject = (label: any) =>
        Boolean(label) && typeof label === 'object' && !Array.isArray(label) && !('setup' in label) && !('render' in label) && !('__v_isVNode' in label) && !('shapeFlag' in label);
      const getLabelNode = () => (slots.label ? slots.label() : props.label);
      const getHelpText = () => (slots.helpText ? slots.helpText() : props.helpText);
      const getExtraText = () => (slots.extraText ? slots.extraText() : props.extraText);
      const getInnerSlots = () => {
        const { label: _ls, helpText: _hs, extraText: _es, ...innerSlots } = slots as any;
        return innerSlots;
      };

      onMounted(() => {
        isUnmounted.value = false;
        if (mergeTrigger().includes('mount')) fieldValidate(value.value);
        if (typeof props.field === 'undefined') return;
        updater.register(
          props.field,
          { value: getVal(), error: error.value, touched: touched.value, status: status.value },
          { field: props.field, fieldApi, keepState, allowEmpty: allowEmpty || props.allowEmptyString }
        );
      });
      watch(
        () => props.field,
        (next, prev) => {
          if (prev) updater.unRegister(prev);
          if (next) {
            updater.register(next, { value: getVal(), error: error.value, touched: touched.value, status: status.value }, { field: next, fieldApi, keepState, allowEmpty });
          }
        }
      );
      onBeforeUnmount(() => {
        isUnmounted.value = true;
        if (props.field) updater.unRegister(props.field);
      });

      expose({ fieldApi, getVal, getError });

      return () => {
        const fp = formProps();
        const mergeLabelPos = props.labelPosition || fp.labelPosition;
        const mergeLabelWidth = props.labelWidth || fp.labelWidth;
        const mergeLabelAlign = props.labelAlign || fp.labelAlign;
        const mergeLabelCol = props.labelCol || fp.labelCol;
        const mergeWrapperCol = props.wrapperCol || fp.wrapperCol;
        const mergeExtraPos = props.extraTextPosition || fp.extraTextPosition || 'bottom';
        const blockStatus = props.validateStatus ? props.validateStatus : status.value;
        const required = getRequired();
        const label = getLabelNode();
        const helpText = getHelpText();
        const extraText = getExtraText();
        const innerSlots = getInnerSlots();
        const a11yId = props.id ? props.id : props.field;
        const labelId = `${a11yId}-label`;
        const helpTextId = `${a11yId}-helpText`;
        const extraTextId = `${a11yId}-extraText`;
        const errorMessageId = `${a11yId}-errormessage`;
        const extraCls = classNames(`${prefix}-field-extra`, {
          [`${prefix}-field-extra-string`]: typeof extraText === 'string',
          [`${prefix}-field-extra-middle`]: mergeExtraPos === 'middle',
          [`${prefix}-field-extra-bottom`]: mergeExtraPos === 'bottom',
        });
        const extraContent = extraText ? h('div', { class: extraCls, id: extraTextId, 'x-semi-prop': 'extraText' }, [normalizeNode(extraText)]) : null;
        // React mergeProps strips props that would break the controlled data flow
        const { defaultChecked: _dc, defaultValue: _dv, checked: _ck, ...rest } = attrs as any;
        const newProps: Record<string, any> = {
          id: a11yId,
          disabled: fp.disabled,
          ...rest,
          onBlur: handleBlur,
          [options.onKeyChangeFnName]: handleChange,
          [options.valueKey]: value.value,
          validateStatus: blockStatus,
          'aria-required': required,
          'aria-labelledby': labelId,
        };
        if (props.name) newProps.name = props.name;
        if (helpText) newProps['aria-describedby'] = extraText ? `${helpTextId} ${extraTextId}` : helpTextId;
        else if (extraText) newProps['aria-describedby'] = extraTextId;
        if (status.value === 'error') {
          newProps['aria-errormessage'] = errorMessageId;
          newProps['aria-invalid'] = true;
        }
        const fieldCls = classNames({
          [`${prefix}-field`]: true,
          [`${prefix}-field-${props.name}`]: Boolean(props.name),
          [props.fieldClassName as string]: Boolean(props.fieldClassName),
        });
        if (mergeLabelPos === 'inset' && !props.noLabel) {
          newProps.insetLabel = label || props.field;
          newProps.insetLabelId = labelId;
          if (isLabelObject(label)) {
            newProps.insetLabel = (label as any).text;
            newProps.insetLabelId = labelId;
          }
        }
        // when used inside InputGroup, Label / ErrorMessage are rendered by the group
        if (props.isInInputGroup) {
          return h(Component, newProps, innerSlots);
        }
        if (props.pure) {
          newProps.class = classNames(rest.class, {
            [`${prefix}-field-pure`]: true,
            [`${prefix}-field-${props.name}`]: Boolean(props.name),
            [props.fieldClassName as string]: Boolean(props.fieldClassName),
          });
          return h(Component, newProps, innerSlots);
        }
        const withCol = mergeLabelCol && mergeWrapperCol;
        const labelColCls = mergeLabelAlign ? `${prefix}-col-${mergeLabelAlign}` : '';
        let labelNode: any = null;
        if (!props.noLabel && mergeLabelPos !== 'inset') {
          const needSpread = isLabelObject(label) ? label : {};
          labelNode = h(Label, {
            text: label || props.field,
            id: labelId,
            required,
            name: a11yId || props.name || props.field,
            width: mergeLabelWidth,
            align: mergeLabelAlign,
            disabled: fp.disabled,
            ...needSpread,
          });
        }
        const errNode = props.noErrorMessage
          ? null
          : h(ErrorMessage, {
              error: error.value,
              validateStatus: blockStatus,
              helpText,
              helpTextId,
              errorMessageId,
              showValidateIcon: fp.showValidateIcon,
            });
        const main = h('div', { class: `${prefix}-field-main` }, [
          mergeExtraPos === 'middle' ? extraContent : null,
          h(Component, newProps, innerSlots),
          errNode,
          mergeExtraPos === 'bottom' ? extraContent : null,
        ]);
        let body: any;
        if (withCol) {
          const labelCol = h(Col, { ...mergeLabelCol, class: labelColCls }, () => labelNode);
          body = [
            mergeLabelPos === 'top' ? h('div', { style: { overflow: 'hidden' } }, [labelCol]) : labelCol,
            h(Col, { ...mergeWrapperCol }, () => main),
          ];
        } else {
          body = [labelNode, main];
        }
        return h(
          'div',
          {
            class: fieldCls,
            style: props.fieldStyle,
            'x-label-pos': mergeLabelPos,
            'x-field-id': props.field,
            'x-extra-pos': mergeExtraPos,
            ...getDataAttr(attrs as any),
          },
          body
        );
      };
    },
  });
  return Fielded;
}

export default withField;
