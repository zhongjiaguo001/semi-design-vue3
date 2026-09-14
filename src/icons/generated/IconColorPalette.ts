import { convertIcon } from '../Icon';
const svg = { viewBox: "0 0 24 24", fill: "none", inner: "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M2 4c0-1.1.9-2 2-2h5a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm6 13.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm11.59-8.91L16.4 5.4a2 2 0 0 0-2.82 0L13 6v12l6.59-6.59a2 2 0 0 0 0-2.82ZM22 16a2 2 0 0 0-2-2l-8 8h8a2 2 0 0 0 2-2v-4Z\" fill=\"currentColor\" />" };
export default convertIcon(svg, "color_palette", "IconColorPalette");
