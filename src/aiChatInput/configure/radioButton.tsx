import { RadioGroup } from '../../radio';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import getConfigureItem from './getConfigureItem';

export default getConfigureItem(RadioGroup, {
  className: `${cssClasses.PREFIX}-footer-configure-radio-button`,
  valuePath: 'target.value',
  defaultProps: {
    type: 'button',
  },
});
