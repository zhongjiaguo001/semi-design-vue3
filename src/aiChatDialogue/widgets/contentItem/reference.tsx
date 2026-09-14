import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import { IconCode, IconWord, IconExcel, IconPdf, IconSendMsgStroked, IconVideo } from '../../../icons/generated';
import Image from '../../../image/Image';

const prefixCls = cssClasses.PREFIX_REFERENCES;
const referencePrefixCls = cssClasses.PREFIX_REFERENCE;
const { DOCUMENT_TYPES, IMAGE_TYPES, PDF_TYPES, EXCEL_TYPES, CODE_TYPES, VIDEO_TYPES } = strings;

export const ReferenceWidget = defineComponent({
  name: 'AIChatDialogueReference',
  props: {
    references: { type: Array as PropType<any[]>, default: () => [] },
  },
  setup(props) {
    const renderReferenceIcon = (name?: string) => {
      if (!name) return null;
      const extension = name.split('.').pop();
      let icon: any = null;
      let type = '';
      if (DOCUMENT_TYPES.includes(extension)) {
        icon = h(IconWord, { size: 'small' });
        type = 'word';
      } else if (PDF_TYPES.includes(extension)) {
        icon = h(IconPdf, { size: 'small' });
        type = 'pdf';
      } else if (EXCEL_TYPES.includes(extension)) {
        icon = h(IconExcel, { size: 'small' });
        type = 'excel';
      } else if (CODE_TYPES.includes(extension)) {
        icon = h(IconCode, { size: 'small' });
        type = 'code';
      } else if (VIDEO_TYPES.includes(extension)) {
        icon = h(IconVideo, { size: 'small' });
        type = 'video';
      }
      return icon ? h('span', { class: cls(`${referencePrefixCls}-icon`, { [`${referencePrefixCls}-icon-${type}`]: type }) }, [icon]) : null;
    };
    const isImage = (name?: string) => (name ? IMAGE_TYPES.includes(name.split('.').pop()) : false);
    return () =>
      h(
        'div',
        { class: prefixCls },
        (props.references || []).map((reference: any) =>
          h('div', { class: referencePrefixCls, key: reference.id }, [
            h(IconSendMsgStroked),
            h('span', { class: `${referencePrefixCls}-content` }, [
              renderReferenceIcon(reference.name),
              reference.url && isImage(reference.name) ? h(Image, { class: `${referencePrefixCls}-img`, src: reference.url, width: 16, height: 16 }) : null,
              h('span', { class: `${referencePrefixCls}-name` }, reference.name || reference.content),
            ]),
          ])
        )
      );
  },
});

export default ReferenceWidget;
