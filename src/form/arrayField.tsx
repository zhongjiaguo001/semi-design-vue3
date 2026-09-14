import { defineComponent, h, ref, watch, onBeforeUnmount, provide } from 'vue';
import type { PropType } from 'vue';
import { getUuidv4 } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import { isUndefined } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import * as ObjectUtil from '@douyinfe/semi-foundation/lib/es/utils/object';
import { ArrayFieldKey, useFormUpdater, useFormState } from './context';

export interface ArrayFieldChildrenProps {
  arrayFields: {
    key: string;
    field: string;
    remove: () => void;
  }[];
  add: (index?: number) => void;
  addWithInitValue: (lineObject: Record<string, any>, index?: number) => void;
}

export const arrayFieldProps = {
  initValue: { type: Array as PropType<any[]>, default: undefined },
  field: { type: String, default: undefined },
};

const filterArrayByIndex = (array: any[], index: number) => array.filter((_item, i) => i !== index);
const getUuidByArray = (array: any[]) => array.map(() => getUuidv4());
const getUpdateKey = (arrayField: any): string | undefined => {
  if (!arrayField) return undefined;
  if (arrayField && arrayField.updateKey) return arrayField.updateKey;
  return undefined;
};
const initValueAdapter = (initValue: any) => {
  if (Array.isArray(initValue)) return initValue;
  warning(!isUndefined(initValue), '[Semi Form ArrayField] initValue of ArrayField must be an array. Please check the type of your props');
  return [];
};
const generateKeys = (value: any[], oldKeys?: string[]) => {
  const val = initValueAdapter(value);
  const newKeys = getUuidByArray(val);
  return newKeys.map((key, i) => (oldKeys && oldKeys[i] ? oldKeys[i] : key));
};

const ArrayField = defineComponent({
  name: 'ArrayField',
  inheritAttrs: false,
  props: arrayFieldProps,
  setup(props, { slots }) {
    const updater = useFormUpdater();
    const formState = useFormState();
    const initValueInProps = props.initValue;
    const initValueInForm = updater ? updater.getValue(props.field) : undefined;
    const initValue = initValueInProps || initValueInForm;
    const keys = ref<string[]>(generateKeys(initValue));
    const cacheUpdateKey = ref<any>(null);
    const arrayFieldCtx = { shouldUseInitValue: true, inArrayField: true };

    if (updater) {
      arrayFieldCtx.shouldUseInitValue = !updater.getArrayField(props.field);
      const initValueCopyForFormState = cloneDeep(initValue);
      const initValueCopyForReset = cloneDeep(initValue);
      updater.registerArrayField(props.field, initValueCopyForReset);
      updater.updateStateValue(props.field, initValueCopyForFormState, { notNotify: true, notUpdate: true });
    }

    provide(ArrayFieldKey, arrayFieldCtx);

    onBeforeUnmount(() => {
      if (updater && props.field) updater.unRegisterArrayField(props.field);
    });

    const syncFromUpdater = () => {
      if (!updater || !props.field) return;
      const fieldValues = updater.getValue(props.field);
      const updateKey = getUpdateKey(updater.getArrayField(props.field));
      if (updateKey !== cacheUpdateKey.value) {
        keys.value = generateKeys(fieldValues, keys.value);
        cacheUpdateKey.value = updateKey;
        if (cacheUpdateKey.value !== null) arrayFieldCtx.shouldUseInitValue = false;
      }
    };

    watch(
      () => {
        const values = formState?.value?.values;
        const fieldVal = values && props.field ? ObjectUtil.get(values, props.field) : undefined;
        const updateKey = updater && props.field ? getUpdateKey(updater.getArrayField(props.field)) : undefined;
        return [fieldVal, updateKey];
      },
      syncFromUpdater,
      { deep: true }
    );

    const add = (index?: number) => {
      if (!updater) return;
      const newKey = getUuidv4();
      const next = keys.value.slice();
      const opts = { notNotify: true, notUpdate: true };
      if (typeof index === 'number') {
        const safeIndex = Math.max(0, Math.min(index, next.length));
        next.splice(safeIndex, 0, newKey);
        let currentValues = updater.getValue(props.field);
        if (Array.isArray(currentValues)) {
          currentValues = currentValues.slice();
          currentValues.splice(safeIndex, 0, undefined);
          updater.updateStateValue(props.field, currentValues, opts);
        }
        let currentErrors = updater.getError(props.field);
        if (Array.isArray(currentErrors)) {
          currentErrors = currentErrors.slice();
          currentErrors.splice(safeIndex, 0, undefined);
          updater.updateStateError(props.field, currentErrors, opts);
        }
      } else {
        next.push(newKey);
      }
      arrayFieldCtx.shouldUseInitValue = true;
      keys.value = next;
      const updateKey = new Date().valueOf();
      updater.updateArrayField(props.field, { updateKey });
      cacheUpdateKey.value = updateKey;
      return newKey;
    };

    const addWithInitValue = (rowVal: Record<string, any> | string, index?: number) => {
      if (!updater) return;
      const newArrayFieldVal = updater.getValue(props.field) ? updater.getValue(props.field).slice() : [];
      const cloneRowVal = cloneDeep(rowVal);
      if (typeof index === 'number') {
        const safeIndex = Math.max(0, Math.min(index, newArrayFieldVal.length));
        newArrayFieldVal.splice(safeIndex, 0, cloneRowVal);
      } else {
        newArrayFieldVal.push(cloneRowVal);
      }
      updater.updateStateValue(props.field, newArrayFieldVal, {});
      updater.updateArrayField(props.field, { updateKey: new Date().valueOf() });
    };

    const remove = (i: number) => {
      if (!updater) return;
      const newKeys = filterArrayByIndex(keys.value, i);
      const opts = { notNotify: true, notUpdate: true };
      let newArrayFieldError = updater.getError(props.field);
      if (Array.isArray(newArrayFieldError)) {
        newArrayFieldError = newArrayFieldError.slice();
        newArrayFieldError.splice(i, 1);
        updater.updateStateError(props.field, newArrayFieldError, opts);
      }
      let newArrayFieldValue = updater.getValue(props.field);
      if (Array.isArray(newArrayFieldValue)) {
        newArrayFieldValue = newArrayFieldValue.slice();
        newArrayFieldValue.splice(i, 1);
        updater.updateStateValue(props.field, newArrayFieldValue);
      }
      keys.value = newKeys;
    };

    return () => {
      const arrayFields = keys.value.map((key, i) => ({
        key,
        field: `${props.field}[${i}]`,
        remove: () => remove(i),
      }));
      const slotProps: ArrayFieldChildrenProps = { arrayFields, add, addWithInitValue };
      return slots.default?.(slotProps);
    };
  },
});

(ArrayField as any).elementType = 'ArrayField';
export default ArrayField;
