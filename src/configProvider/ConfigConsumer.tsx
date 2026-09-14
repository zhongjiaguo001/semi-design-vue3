import { defineComponent } from 'vue';
import { useConfigContext } from './context';

/**
 * Vue equivalent of React `ConfigConsumer` (= `ConfigContext.Consumer`).
 * The current ConfigProvider context value is handed to the default scoped slot:
 *
 *   <ConfigConsumer v-slot="{ timeZone, direction, screens, onBreakpoint }">...</ConfigConsumer>
 */
export default defineComponent({
  name: 'ConfigConsumer',
  setup(_, { slots }) {
    const context = useConfigContext();
    return () => slots.default?.(context);
  },
});
