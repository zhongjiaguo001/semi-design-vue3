import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import Image from '../image/Image';
import Progress from '../progress/Progress';
import { IconAlertCircle, IconBriefStroked, IconClear } from '../icons/generated';

const { PREFIX_ATTACHMENT } = cssClasses;
const { PIC_SUFFIX_ARRAY, PIC_PREFIX } = strings;

export const FileAttachment = defineComponent({
  name: 'FileAttachment',
  props: {
    url: { type: String, default: undefined },
    name: { type: String, default: undefined },
    size: { type: [String, Number] as PropType<any>, default: undefined },
    type: { type: String, default: undefined },
  },
  setup(props) {
    return () =>
      h('a', { href: props.url, target: '_blank', class: `${PREFIX_ATTACHMENT}-file`, rel: 'noreferrer' }, [
        h(IconBriefStroked, { size: 'extra-large', class: `${PREFIX_ATTACHMENT}-file-icon` }),
        h('div', { class: `${PREFIX_ATTACHMENT}-file-info` }, [
          h('span', { class: `${PREFIX_ATTACHMENT}-file-title` }, props.name),
          h('span', { class: `${PREFIX_ATTACHMENT}-file-metadata` }, [
            h('span', { class: `${PREFIX_ATTACHMENT}-file-type` }, props.type),
            props.type ? ' · ' : '',
            props.size,
          ]),
        ]),
      ]);
  },
});

export const ImageAttachment = defineComponent({
  name: 'ImageAttachment',
  props: { src: { type: String, default: undefined } },
  setup(props) {
    return () => h(Image, { class: `${PREFIX_ATTACHMENT}-img`, width: 60, height: 60, src: props.src });
  },
});

const Attachment = defineComponent({
  name: 'ChatAttachment',
  props: {
    className: { type: String, default: undefined },
    attachment: { type: Array as PropType<any[]>, default: () => [] },
    showClear: { type: Boolean, default: true },
    onClear: { type: Function as PropType<(item: any) => void>, default: undefined },
  },
  setup(props) {
    return () =>
      h(
        'div',
        { class: cls(PREFIX_ATTACHMENT, props.className) },
        (props.attachment || []).map((item: any) => {
          const { percent, status } = item;
          const suffix = item?.name?.split('.').pop();
          const isImg = item?.fileInstance?.type?.startsWith(PIC_PREFIX) || PIC_SUFFIX_ARRAY.includes(suffix);
          const realType = suffix ?? item?.fileInstance?.type?.split('/').pop();
          const showProcess = !(percent === 100 || typeof percent === 'undefined') && status === strings.FILE_STATUS.UPLOADING;
          return h('div', { class: `${PREFIX_ATTACHMENT}-item`, key: item.uid }, [
            isImg ? h(ImageAttachment, { src: item.url }) : h(FileAttachment, { url: item.url, name: item.name, size: item.size, type: realType }),
            props.showClear
              ? h(IconClear, { size: 'large', class: `${PREFIX_ATTACHMENT}-clear`, onClick: () => props.onClear?.(item) })
              : null,
            showProcess ? h(Progress, { percent, type: 'circle', size: 'small', width: 30, class: `${PREFIX_ATTACHMENT}-process`, 'aria-label': 'upload progress' }) : null,
            [strings.FILE_STATUS.UPLOAD_FAIL, strings.FILE_STATUS.VALID_FAIL].includes(status) ? h(IconAlertCircle, { class: `${PREFIX_ATTACHMENT}-fail` }) : null,
          ]);
        })
      );
  },
});

export default Attachment;
