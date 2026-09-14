import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import Avatar from '../../avatar/Avatar';
import { normalizeNode } from '../../_utils';

const { PREFIX_CHAT_BOX } = cssClasses;

const ChatBoxAvatar = defineComponent({
  name: 'ChatBoxAvatar',
  props: {
    role: { type: Object as PropType<any>, default: undefined },
    continueSend: { type: Boolean, default: false },
    message: { type: Object as PropType<any>, default: undefined },
    customRenderFunc: { type: Function as PropType<(props: any) => any>, default: undefined },
  },
  setup(props) {
    return () => {
      const { role = {}, customRenderFunc, continueSend, message } = props;
      const { avatar, color } = role;
      const isAvatarString = typeof avatar === 'string';
      const node = h(
        Avatar,
        {
          class: cls(`${PREFIX_CHAT_BOX}-avatar`, { [`${PREFIX_CHAT_BOX}-avatar-hidden`]: continueSend }),
          src: isAvatarString ? avatar : undefined,
          size: 'extra-small',
          color,
        },
        () => (!isAvatarString ? normalizeNode(avatar) : null)
      );
      if (typeof customRenderFunc === 'function') return customRenderFunc({ role, defaultAvatar: node, message });
      return node;
    };
  },
});

export default ChatBoxAvatar;
