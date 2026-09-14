import { defineComponent, h, ref, watch, Fragment } from 'vue';
import type { PropType } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import { IconStoryStroked, IconChevronDown, IconChevronUp } from '../../../icons/generated';
import Collapsible from '../../../collapsible/Collapsible';
import { normalizeNode } from '../../../_utils';

const prefixCls = cssClasses.PREFIX_STEP;
const { PREFIX_CONTENT } = cssClasses;

export const DialogueStepWidget = defineComponent({
  name: 'AIChatDialogueStep',
  props: {
    steps: { type: Array as PropType<any[]>, default: () => [] },
  },
  setup(props) {
    const openIndexes = ref<Set<number>>(new Set((props.steps || []).map((_: any, i: number) => i)));
    watch(
      () => props.steps,
      (steps) => {
        openIndexes.value = new Set((steps || []).map((_: any, i: number) => i));
      }
    );
    const toggleOpen = (idx: number) => {
      const next = new Set(openIndexes.value);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      openIndexes.value = next;
    };
    return () =>
      h(
        'div',
        { class: `${prefixCls}-wrapper` },
        (props.steps || []).map((item: any, index: number) => {
          const { summary, status, actions } = item;
          const isOpen = openIndexes.value.has(index);
          const actionsLength = actions?.length || 0;
          return h(Fragment, { key: index }, [
            h(
              'div',
              {
                class: prefixCls,
                role: 'button',
                tabindex: 0,
                onClick: () => toggleOpen(index),
                onKeydown: (e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleOpen(index);
                  }
                },
              },
              [
                h('div', { class: `${prefixCls}-prefix` }, [
                  status === 'completed'
                    ? h(IconStoryStroked, { class: `${prefixCls}-completed` })
                    : h('span', { class: `${PREFIX_CONTENT}-loading` }, [
                        h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
                        h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
                        h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
                      ]),
                ]),
                h('div', { class: `${prefixCls}-summary` }, summary),
                actionsLength > 0 ? h('div', { class: `${prefixCls}-suffix` }, [isOpen ? h(IconChevronUp) : h(IconChevronDown)]) : null,
              ]
            ),
            h(Collapsible, { isOpen }, () =>
              h('div', { class: `${prefixCls}-panel` }, [
                h('div', { class: `${prefixCls}-line` }),
                h(
                  'div',
                  { class: `${prefixCls}-action-wrapper` },
                  (actions || []).map((action: any, i: number) =>
                    h('div', { key: i, class: `${prefixCls}-action` }, [
                      h('div', { class: `${prefixCls}-action-summary` }, action.summary),
                      h('div', { class: `${prefixCls}-action-desc` }, [normalizeNode(action.icon), action.description]),
                    ])
                  )
                ),
              ])
            ),
          ]);
        })
      );
  },
});

export default DialogueStepWidget;
