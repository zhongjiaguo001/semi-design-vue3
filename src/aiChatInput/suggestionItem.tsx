import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';

const prefixCls = cssClasses.PREFIX;

const SuggestionItem = defineComponent({
  name: 'AIChatInputSuggestionItem',
  props: {
    suggestion: { type: [String, Object] as PropType<any>, default: undefined },
    renderSuggestionItem: { type: Function as PropType<(props: any) => any>, default: undefined },
    isActive: { type: Boolean, default: false },
    onClick: { type: Function as PropType<(suggestion: any) => void>, default: undefined },
    index: { type: Number, default: 0 },
    onMouseEnter: { type: Function as PropType<(index: number) => void>, default: undefined },
  },
  setup(props) {
    return () => {
      const content = typeof props.suggestion === 'string' ? props.suggestion : props.suggestion?.content;
      const className = cls(`${prefixCls}-suggestion-item`, {
        [`${prefixCls}-suggestion-item-active`]: props.isActive,
      });
      const handleClick = () => props.onClick?.(props.suggestion);
      const handleMouseEnter = () => props.onMouseEnter?.(props.index);
      if (props.renderSuggestionItem) {
        return props.renderSuggestionItem({
          suggestion: props.suggestion,
          className,
          onClick: handleClick,
          onMouseEnter: handleMouseEnter,
        });
      }
      return h('div', { class: className, onClick: handleClick, onMouseEnter: handleMouseEnter }, content);
    };
  },
});

export default SuggestionItem;
