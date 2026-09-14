import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import _get from 'lodash/get';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import Button from '../button/Button';

export const footerProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  locale: { type: Object as PropType<any>, default: undefined },
  localeCode: { type: String, default: undefined },
  disabledConfirm: { type: Boolean, default: false },
};

export const footerEmits = ['cancelClick', 'confirmClick'];

const Footer = defineComponent({
  name: 'DatePickerFooter',
  inheritAttrs: false,
  props: footerProps,
  emits: footerEmits,
  setup(props, { emit }) {
    return () => {
      const { prefixCls, locale, disabledConfirm } = props;
      const wrapCls = classnames(`${prefixCls}-footer`);
      return h('div', { class: wrapCls }, [
        h(Button, { theme: 'borderless', onClick: (e: MouseEvent) => emit('cancelClick', e) }, () => _get(locale, 'footer.cancel', '')),
        h(Button, { theme: 'solid', onClick: (e: MouseEvent) => emit('confirmClick', e), disabled: disabledConfirm }, () => _get(locale, 'footer.confirm', '')),
      ]);
    };
  },
});

export default Footer;
