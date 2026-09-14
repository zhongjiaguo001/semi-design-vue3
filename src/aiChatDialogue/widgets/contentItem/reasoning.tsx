import { defineComponent, h, ref } from 'vue';
import type { PropType } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import { IconChevronDown, IconChevronUp, IconAISearchLevel2 } from '../../../icons/generated';
import Collapsible from '../../../collapsible/Collapsible';
import MarkdownRender from '../../../markdownRender/MarkdownRender';
import { useLocale } from '../../../locale';

const prefixCls = cssClasses.PREFIX_REASONING;

export const ReasoningWidget = defineComponent({
  name: 'AIChatDialogueReasoning',
  props: {
    status: { type: String, default: undefined },
    summary: { type: Array as PropType<Array<{ text?: string; type?: string }>>, default: undefined },
    content: { type: Array as PropType<Array<{ text?: string; type?: string }>>, default: undefined },
    markdownRenderProps: { type: Object as PropType<any>, default: undefined },
    customRenderer: { type: Function as PropType<(props: any) => any>, default: undefined },
  },
  setup(props) {
    const { locale } = useLocale('AIChatDialogue');
    const isOpen = ref(props.status !== 'completed');
    const getText = () => {
      if (props.summary?.length) return props.summary.map((item) => item.text).join('\n');
      if (props.content?.length) return props.content.map((item) => item.text).join('\n');
      return '';
    };
    const handleClick = () => {
      isOpen.value = !isOpen.value;
    };
    return () => {
      const loc = locale.value || {};
      const title = props.status === 'completed' ? loc.reasoning?.completed : loc.reasoning?.thinking;
      return h(
        'div',
        {
          role: 'button',
          tabindex: 0,
          class: `${prefixCls}-wrapper`,
          onClick: handleClick,
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          },
        },
        [
          h('div', { class: `${prefixCls}-header` }, [
            h('div', { class: `${prefixCls}-header-prefix` }, [h(IconAISearchLevel2)]),
            h('div', { class: `${prefixCls}-header-title` }, title),
            h('div', { class: `${prefixCls}-header-suffix` }, [isOpen.value ? h(IconChevronUp) : h(IconChevronDown)]),
          ]),
          h(Collapsible, { isOpen: isOpen.value }, () =>
            h('div', { class: `${prefixCls}-content` }, [
              props.customRenderer
                ? props.customRenderer(props)
                : h(MarkdownRender, { format: 'md', raw: getText(), ...(props.markdownRenderProps || {}) }),
            ])
          ),
        ]
      );
    };
  },
});

export default ReasoningWidget;
