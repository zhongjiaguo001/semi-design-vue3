import { convertIcon } from '../Icon';
const svg = { viewBox: "0 0 24 24", fill: "none", inner: "<path d=\"M9 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z\" fill=\"currentColor\" /><path d=\"M9 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z\" fill=\"currentColor\" /><path d=\"M11 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z\" fill=\"currentColor\" /><path d=\"M15 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z\" fill=\"currentColor\" /><path d=\"M17 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z\" fill=\"currentColor\" /><path d=\"M15 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z\" fill=\"currentColor\" />" };
export default convertIcon(svg, "handle", "IconHandle");
