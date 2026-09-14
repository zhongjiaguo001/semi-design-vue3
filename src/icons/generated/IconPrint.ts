import { convertIcon } from '../Icon';
const svg = { viewBox: "0 0 24 24", fill: "none", inner: "<path d=\"M7 2a2 2 0 0 0-2 2v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H7Z\" fill=\"currentColor\" /><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M2 12a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2H4a2 2 0 0 1-2-2v-5Zm16 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 15h8v6H8v-6Z\" fill=\"currentColor\" />" };
export default convertIcon(svg, "print", "IconPrint");
