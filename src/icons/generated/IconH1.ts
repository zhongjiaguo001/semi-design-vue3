import { convertIcon } from '../Icon';
const svg = { viewBox: "0 0 24 24", fill: "none", inner: "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M3.5 2.5C4.33 2.5 5 3.17 5 4v6.5h6V4a1.5 1.5 0 0 1 3 0v16a1.5 1.5 0 0 1-3 0v-6.5H5V20a1.5 1.5 0 0 1-3 0V4c0-.83.67-1.5 1.5-1.5Z\" fill=\"currentColor\" /><path d=\"M19.43 19.59c0 .97.51 1.51 1.43 1.51.91 0 1.42-.54 1.42-1.52v-6.27c0-1.04-.66-1.7-1.67-1.7-.57 0-1.2.18-1.79.54l-.96.58c-.48.29-.73.65-.73 1.06 0 .57.4.96.96.96.28 0 .5-.08.95-.35l.38-.22h.01v5.4Z\" fill=\"currentColor\" />" };
export default convertIcon(svg, "h1", "IconH1");
