# Porting conventions (React semi-ui → Vue 3)

This library reuses `@douyinfe/semi-foundation` (framework agnostic logic + compiled CSS) untouched
and re-implements only the React "adapter" layer (`@douyinfe/semi-ui`) with Vue 3.

Reference React sources are installed at `/tmp/semiprobe/node_modules/@douyinfe/semi-ui/lib/es/<component>/`
and foundations at `/tmp/semiprobe/node_modules/@douyinfe/semi-foundation/lib/es/<component>/`
(`foundation.js`, `foundation.d.ts` = adapter interface, `constants.js`, `<name>.css`).

## Component skeleton

```ts
import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import XFoundation from '@douyinfe/semi-foundation/lib/es/x/foundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/x/constants';
import '@douyinfe/semi-foundation/lib/es/x/x.css';
import { useBaseComponent } from '../_base/useBaseComponent';

const X = defineComponent({
  name: 'X',
  inheritAttrs: false,
  props: xProps,
  emits: [...],
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, { ...initialState }, { modelProp: 'value' });
    const adapter = { ...baseAdapter, /* component specific adapter methods from foundation.d.ts */ };
    const foundation = new (XFoundation as any)(adapter);
    foundation.init();                      // or onMounted(() => foundation.init()) when DOM is needed
    onBeforeUnmount(() => foundation.destroy());
    return () => h('div', {...});
  },
});
(X as any).elementType = 'X';            // when React sets `elementType`
export default X;
```

Rules:

- `useBaseComponent(props, state, { modelProp })` returns the React-like adapter (`getProp/getProps/getState/setState/...`).
  - `propsView` implements React `key in props` semantics: only props explicitly passed by the parent are "in" it. Use it for controlled checks (`'value' in propsView`).
  - `modelProp: 'value'` transparently aliases Vue `modelValue` (`v-model`) to that prop.
  - `state` is `reactive`; adapter `setState` merges into it and runs the callback on `nextTick`.
- React `props.onXxx` callbacks become `emit('xxx', ...)`. Emit names: camelCase of the React name minus `on` (`onVisibleChange` → `visibleChange`, `onEnterPress` → `enterPress`). Also emit `update:modelValue` / `update:<prop>` for the controlled prop so `v-model` works.
- React `children` → default slot. React node props (`content`, `extra`, `title`, `icon`, `prefix`...) are accepted both as **prop** (string / VNode / component / render fn — pass through `normalizeNode()` from `_utils`) and as a **named slot** of the same name; slot wins.
- React `className` / `style` → use `attrs.class` / `attrs.style` (component has `inheritAttrs: false` and spreads the rest of `attrs` on the root or the inner input as React does). Keep the React `className` prop name only where it is applied to an inner element (e.g. `contentClassName`, `wrapperClassName`).
- React `x-semi-prop` attributes are kept for parity.
- Context (`React.createContext`) → `provide/inject` with a `reactive` value (see `checkbox/context.ts`, `radio/Radio.tsx`).
- Portals → `_portal/Portal.tsx`. Popups → build on `tooltip/Tooltip.tsx` (Popover is the example).
- `getDerivedStateFromProps` / `componentDidUpdate` → `watch` on the relevant props.
- Controlled `<input>`/`<textarea>`: after handling an input event, re-sync the DOM value to `state` on `nextTick` (see `Input.tsx#syncDomValue`), because Vue does not force the DOM back like React.
- `React.Children.map` / `cloneElement` → `flattenChildren(slots.default?.())` + `cloneVNode(vnode, extraProps, true)` from `_utils`.
- Icons: `import { IconXxx } from '../icons/generated'` (Vue components generated from semi-icons). Custom `SpinIcon` is in `spin/icon.tsx`.
- Locale: `const { locale } = useLocale('Modal')` returns computed locale slices (`locale.value.confirm`).
- Export: `src/<component>/index.ts` exports default + named + `<name>Props` + types; add the exports to `src/index.ts`.

## Tests

Vitest + @vue/test-utils + jsdom (`test/setup.ts` polyfills `matchMedia`, `ResizeObserver`, `:hover`, canvas).
Every component gets `src/<component>/<component>.test.ts` covering **every prop / slot / emit** listed in the React
propTypes/defaultProps plus the exposed instance methods. Assert on the Semi CSS classes (`semi-<component>-...`),
rendered DOM and emitted payloads. Popup tests: `attachTo: document.body`, use `motion: false`, wait with
`await sleep(120); await flushPromises(); await nextTick();` (see `tooltip/tooltip.test.ts`).
Run `npx vitest run src/<component>` until green; then `npx vitest run` must stay green.
