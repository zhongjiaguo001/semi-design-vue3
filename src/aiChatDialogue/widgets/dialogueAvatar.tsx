import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import Avatar from '../../avatar/Avatar';

const { PREFIX } = cssClasses;

const DialogueAvatar = defineComponent({
  name: 'AIChatDialogueAvatar',
  props: {
    role: { type: Object as PropType<any>, default: undefined },
    continueSend: { type: Boolean, default: false },
    message: { type: Object as PropType<any>, default: undefined },
    customRenderFunc: { type: Function as PropType<(props: any) => any>, default: undefined },
  },
  setup(props) {
    return () => {
      const { role = {}, customRenderFunc, continueSend, message } = props;
      const node = h(Avatar, {
        class: cls(`${PREFIX}-avatar`, { [`${PREFIX}-avatar-hidden`]: continueSend }),
        src: role.avatar,
        size: 'extra-small',
      });
      if (typeof customRenderFunc === 'function') return customRenderFunc({ role, defaultAvatar: node, message });
      return node;
    };
  },
});

export default DialogueAvatar;
