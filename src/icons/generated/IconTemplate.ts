import { convertIcon } from '../Icon';
const svg = { viewBox: "0 0 24 24", fill: "none", inner: "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5Zm1 3a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H6Zm-1 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8Zm9-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-4Z\" fill=\"currentColor\" />" };
export default convertIcon(svg, "template", "IconTemplate");
