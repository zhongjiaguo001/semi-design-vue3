import Select from '../../select/Select';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import getConfigureItem from './getConfigureItem';

export default getConfigureItem(Select, { className: `${cssClasses.PREFIX}-footer-configure-select` });
