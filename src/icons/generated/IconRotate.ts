import { convertIcon } from '../Icon';
const svg = { viewBox: "0 0 24 24", fill: "none", inner: "<path d=\"M14.2 2.2A1 1 0 0 0 12.8.8l-2.5 2.5a1 1 0 0 0 0 1.4l2.5 2.5a1 1 0 1 0 1.4-1.4l-.79-.8H16a5 5 0 0 1 5 5v2a1 1 0 1 0 2 0v-2a7 7 0 0 0-7-7h-2.59l.8-.8Z\" fill=\"currentColor\" /><path d=\"M3 10c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z\" fill=\"currentColor\" />" };
export default convertIcon(svg, "rotate", "IconRotate");
