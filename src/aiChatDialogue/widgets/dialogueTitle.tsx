import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';

const { PREFIX } = cssClasses;

const DialogueTitle = defineComponent({
  name: 'AIChatDialogueTitle',
  props: {
    role: { type: Object as PropType<any>, default: undefined },
    message: { type: Object as PropType<any>, default: undefined },
    customRenderFunc: { type: Function as PropType<(props: any) => any>, default: undefined },
  },
  setup(props) {
    return () => {
      const title = h('span', { class: `${PREFIX}-title` }, props.role?.name);
      if (typeof props.customRenderFunc === 'function') {
        return props.customRenderFunc({ role: props.role, message: props.message, defaultTitle: title });
      }
      return title;
    };
  },
});

export default DialogueTitle;
