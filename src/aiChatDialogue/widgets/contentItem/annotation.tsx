import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import { IconChevronRight } from '../../../icons/generated';
import Avatar, { AvatarGroup } from '../../../avatar/Avatar';
import { useLocale } from '../../../locale';

const prefixCls = cssClasses.PREFIX_ANNOTATION;

export const AnnotationWidget = defineComponent({
  name: 'AIChatDialogueAnnotation',
  props: {
    maxCount: { type: Number, default: 15 },
    annotation: { type: Array as PropType<any[]>, default: () => [] },
    onClick: { type: Function as PropType<(e?: MouseEvent, item?: any[]) => void>, default: undefined },
    description: { type: String, default: undefined },
  },
  setup(props) {
    const { locale } = useLocale('AIChatDialogue');
    return () => {
      const loc = locale.value || {};
      const handleClick = (e?: MouseEvent) => props.onClick?.(e, props.annotation);
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
          h('div', { class: `${prefixCls}-content` }, [
            h(
              AvatarGroup,
              {
                maxCount: props.maxCount,
                size: 'extra-extra-small',
                overlapFrom: 'end',
                renderMore: (restNumber: number) =>
                  h(Avatar, { class: `${prefixCls}-content-logo-renderMore`, size: 'extra-extra-small', alt: 'more' }, () => `+${restNumber}`),
              },
              () =>
                (props.annotation || []).map((item: any, index: number) =>
                  item.logo
                    ? h(Avatar, { class: `${prefixCls}-content-logo`, key: index, src: item.logo, alt: item.title })
                    : null
                )
            ),
            h('div', { class: `${prefixCls}-content-description` }, props.description || `${(props.annotation || []).length} ${loc.annotationText || ''}`),
            h('div', { class: `${prefixCls}-content-icon` }, [h(IconChevronRight)]),
          ]),
        ]
      );
    };
  },
});

export default AnnotationWidget;
