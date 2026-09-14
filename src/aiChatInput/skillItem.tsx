import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import { normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;

const SkillItem = defineComponent({
  name: 'AIChatInputSkillItem',
  props: {
    skill: { type: Object as PropType<any>, default: undefined },
    renderSkillItem: { type: Function as PropType<(props: any) => any>, default: undefined },
    isActive: { type: Boolean, default: false },
    onClick: { type: Function as PropType<(skill: any) => void>, default: undefined },
    index: { type: Number, default: 0 },
    onMouseEnter: { type: Function as PropType<(index: number) => void>, default: undefined },
  },
  setup(props) {
    return () => {
      const className = cls(`${prefixCls}-skill-item`, {
        [`${prefixCls}-skill-item-active`]: props.isActive,
      });
      const handleClick = () => props.onClick?.(props.skill);
      const handleMouseEnter = () => props.onMouseEnter?.(props.index);
      if (props.renderSkillItem) {
        return props.renderSkillItem({
          skill: props.skill,
          className,
          onClick: handleClick,
          onMouseEnter: handleMouseEnter,
        });
      }
      return h('div', { class: className, onClick: handleClick, onMouseEnter: handleMouseEnter }, [
        normalizeNode(props.skill?.icon),
        h('div', { class: `${prefixCls}-skill-item-content` }, props.skill?.label),
      ]);
    };
  },
});

export default SkillItem;
