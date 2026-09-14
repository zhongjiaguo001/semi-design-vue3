import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import { normalizeNode } from '../../_utils';

const { PREFIX_HINT } = cssClasses;

const Hint = defineComponent({
  name: 'AIChatDialogueHint',
  props: {
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    hints: { type: Array as PropType<string[]>, default: () => [] },
    selecting: { type: Boolean, default: false },
    onHintClick: { type: Function as PropType<(item: string) => void>, default: undefined },
    renderHintBox: { type: Function as PropType<(props: { content: string; index: number; onHintClick: () => void }) => any>, default: undefined },
  },
  setup(props) {
    return () =>
      h(
        'section',
        {
          class: cls(`${PREFIX_HINT}s`, { [props.className as string]: !!props.className, [`${PREFIX_HINT}s-selecting`]: props.selecting }),
          style: props.style,
        },
        (props.hints || []).map((item, index) => {
          if (props.renderHintBox) {
            return normalizeNode(props.renderHintBox({ content: item, index, onHintClick: () => props.onHintClick?.(item) }));
          }
          return h(
            'div',
            {
              role: 'button',
              tabindex: 0,
              class: `${PREFIX_HINT}-item`,
              key: index,
              onClick: () => props.onHintClick?.(item),
              onKeydown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') props.onHintClick?.(item);
              },
            },
            [h('div', { class: `${PREFIX_HINT}-content` }, item)]
          );
        })
      );
  },
});

export default Hint;
