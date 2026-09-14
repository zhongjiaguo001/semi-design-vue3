import { convertIcon } from '../Icon';
const svg = { viewBox: "0 0 24 24", fill: "none", inner: "<path d=\"M3 3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3Z\" fill=\"currentColor\" /><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M3 9.5c0-.28.22-.5.5-.5h17c.28 0 .5.22.5.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5ZM8 12a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Z\" fill=\"currentColor\" />" };
export default convertIcon(svg, "archive", "IconArchive");
