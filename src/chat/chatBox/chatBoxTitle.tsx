import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/chat/constants';

const { PREFIX_CHAT_BOX } = cssClasses;

const ChatBoxTitle = defineComponent({
  name: 'ChatBoxTitle',
  props: {
    role: { type: Object as PropType<any>, default: undefined },
    message: { type: Object as PropType<any>, default: undefined },
    customRenderFunc: { type: Function as PropType<(props: any) => any>, default: undefined },
  },
  setup(props) {
    return () => {
      const title = h('span', { class: `${PREFIX_CHAT_BOX}-title` }, props.role?.name);
      if (typeof props.customRenderFunc === 'function') {
        return props.customRenderFunc({ role: props.role, message: props.message, defaultTitle: title });
      }
      return title;
    };
  },
});

export default ChatBoxTitle;
