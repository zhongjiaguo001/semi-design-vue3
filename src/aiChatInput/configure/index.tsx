import { defineComponent, h, reactive } from 'vue';
import { provideConfigure } from './context';
import ConfigureButton from './button';
import ConfigureSelect from './select';
import ConfigureMcp from './mcp';
import ConfigureRadioButton from './radioButton';
import getConfigureItem from './getConfigureItem';

const Configure = defineComponent({
  name: 'AIChatInputConfigure',
  inheritAttrs: false,
  props: {
    value: { type: Object, default: undefined },
    defaultValue: { type: Object, default: undefined },
    onChange: { type: Function, default: undefined },
    round: { type: Boolean, default: undefined },
  },
  setup(props, { slots, expose }) {
    const state = reactive({
      value: { ...(props.value || props.defaultValue || {}) } as Record<string, any>,
    });

    const onChange = (obj: Record<string, any>, init = false) => {
      state.value = { ...state.value, ...obj };
      if (!init) props.onChange?.(state.value, obj);
    };

    const onRemove = (field: string) => {
      const next: Record<string, any> = {};
      Object.keys(state.value || {}).forEach((key) => {
        if (key !== field) next[key] = state.value[key];
      });
      state.value = next;
      props.onChange?.(next);
    };

    const getConfigureValue = () => state.value;

    provideConfigure({
      get value() {
        return state.value;
      },
      onChange,
      onRemove,
    } as any);

    expose({ getConfigureValue, state });

    return () => h('div', { class: 'semi-aiChatInput-footer-configure' }, slots.default?.());
  },
});

(Configure as any).Button = ConfigureButton;
(Configure as any).Select = ConfigureSelect;
(Configure as any).Mcp = ConfigureMcp;
(Configure as any).RadioButton = ConfigureRadioButton;

export { getConfigureItem, ConfigureButton, ConfigureSelect, ConfigureMcp, ConfigureRadioButton };
export default Configure;
