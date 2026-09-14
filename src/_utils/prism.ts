import Prism from 'prismjs';

if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
}

export default Prism;
