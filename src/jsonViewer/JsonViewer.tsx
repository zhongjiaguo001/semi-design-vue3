import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, Teleport, Fragment } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import JsonViewerFoundation from '@douyinfe/semi-foundation/lib/es/jsonViewer/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/jsonViewer/constants';
import '@douyinfe/semi-foundation/lib/es/jsonViewer/jsonViewer.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, toCssStyle } from '../_utils';
import { useLocale } from '../locale';
import Button from '../button/Button';
import { ButtonGroup } from '../button/buttonGroup';
import Input from '../input/Input';
import DragMove from '../dragMove/DragMove';
import { IconCaseSensitive, IconChevronLeft, IconChevronRight, IconClose, IconRegExp, IconSearch, IconWholeWord } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;

export const jsonViewerProps = {
  value: { type: String, default: '' },
  width: { type: [Number, String] as PropType<number | string>, default: 400 },
  height: { type: [Number, String] as PropType<number | string>, default: 400 },
  showSearch: { type: Boolean, default: true },
  options: { type: Object as PropType<Record<string, any>>, default: () => ({ readOnly: false, autoWrap: true }) },
  limitSearchButtonBounds: { type: Boolean, default: false },
  renderSearchButton: { type: Function as PropType<(defaultSearchButton: any, searchControls: any) => any>, default: undefined },
  /** React parity: (value, el) => HTMLElement, rendered inside the core hover tooltip */
  renderTooltip: { type: Function as PropType<(value: string, el: HTMLElement) => HTMLElement | null | undefined>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const jsonViewerEmits = ['change', 'update:value', 'update:modelValue'];

const JsonViewer = defineComponent({
  name: 'JsonViewer',
  inheritAttrs: false,
  props: jsonViewerProps,
  emits: jsonViewerEmits,
  setup(props, { attrs, emit, expose }) {
    const { locale } = useLocale('JsonViewer');
    const editorRef = ref<HTMLDivElement | null>(null);
    const searchInputRef = ref<any>(null);
    const replaceInputRef = ref<any>(null);
    let isComposing = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeRafId: number | null = null;
    let lastObservedWidth: number | null = null;
    let isDragging = false;

    const { state, adapter: baseAdapter } = useBaseComponent(
      props as any,
      {
        searchOptions: { caseSensitive: false, wholeWord: false, regex: false },
        showSearchBar: false,
        customRenderMap: new Map<HTMLElement, any>(),
      },
      { modelProp: 'value' }
    );

    const getSearchInputEl = () => {
      const inst = searchInputRef.value;
      return inst?.$el?.querySelector?.('input') || inst?.querySelector?.('input') || inst;
    };

    const adapter = {
      ...baseAdapter,
      getEditorRef: () => editorRef.value,
      getSearchRef: () => getSearchInputEl(),
      notifyChange: (value: string) => {
        emit('change', value);
        emit('update:value', value);
        emit('update:modelValue', value);
      },
      notifyHover: (value: string, el: HTMLElement) => props.renderTooltip?.(value, el),
      notifyCustomRender: (customRenderMap: Map<HTMLElement, any>) => {
        // React's setState always re-renders; the core reuses the same Map instance, so clone it
        // to make Vue's reactivity pick up new entries after every visible-lines render.
        state.customRenderMap = new Map(customRenderMap);
      },
      setSearchOptions: (key: string) => {
        state.searchOptions = { ...state.searchOptions, [key]: !state.searchOptions[key] };
        searchHandler();
      },
      showSearchBar: () => {
        state.showSearchBar = !state.showSearchBar;
        state.searchOptions = { caseSensitive: false, wholeWord: false, regex: false };
      },
    };
    const foundation = new (JsonViewerFoundation as any)(adapter);

    const teardownResizeObserver = () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
        resizeRafId = null;
      }
      lastObservedWidth = null;
    };

    const setupResizeObserver = () => {
      if (!props.options?.autoWrap) {
        teardownResizeObserver();
        return;
      }
      const el = editorRef.value;
      if (!el || typeof ResizeObserver === 'undefined') return;
      teardownResizeObserver();
      lastObservedWidth = el.getBoundingClientRect().width;
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries && entries[0];
        if (!entry) return;
        const nextWidth = entry.contentRect?.width;
        if (typeof nextWidth !== 'number') return;
        if (lastObservedWidth !== null && Math.abs(nextWidth - lastObservedWidth) < 0.5) return;
        lastObservedWidth = nextWidth;
        if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
        resizeRafId = requestAnimationFrame(() => {
          resizeRafId = null;
          const jsonViewer: any = foundation.jsonViewer;
          if (jsonViewer && jsonViewer._view && jsonViewer._view._measuredHeights) {
            jsonViewer._view._measuredHeights = {};
          }
          foundation.jsonViewer?.layout();
        });
      });
      resizeObserver.observe(el);
    };

    const portalKeys = new WeakMap<HTMLElement, number>();
    let portalSeq = 0;
    const getPortalKey = (el: HTMLElement) => {
      let k = portalKeys.get(el);
      if (k === undefined) {
        k = ++portalSeq;
        portalKeys.set(el, k);
      }
      return k;
    };

    const bindHover = () => {
      const emitter = foundation.jsonViewer?.emitter;
      if (!emitter?.on) return;
      emitter.on('hoverNode', (e: { value: string; target: HTMLElement }) => {
        const el = adapter.notifyHover(e.value, e.target);
        if (el instanceof HTMLElement) emitter.emit('renderHoverNode', { el });
      });
    };

    const searchHandler = () => {
      const el = getSearchInputEl();
      const value = el?.value;
      foundation.search(value);
    };

    onMounted(() => {
      try {
        foundation.init();
        bindHover();
        setupResizeObserver();
      } catch {
        /* json viewer core may be unavailable in some test envs */
      }
    });
    onBeforeUnmount(() => {
      teardownResizeObserver();
      foundation.jsonViewer?.dispose?.();
      foundation.destroy?.();
    });
    watch(
      () => [props.options, props.value],
      (next, prev) => {
        if (!prev) return;
        if (!isEqual(prev[0], next[0]) || next[1] !== prev[1]) {
          try {
            foundation.jsonViewer?.dispose?.();
            state.customRenderMap = new Map();
            foundation.init();
            bindHover();
            setupResizeObserver();
          } catch {
            /* ignore */
          }
        } else if ((prev[0] as any)?.autoWrap !== (next[0] as any)?.autoWrap) {
          setupResizeObserver();
        }
      },
      { deep: true }
    );

    expose({
      getValue: () => foundation.jsonViewer?.getModel?.()?.getValue?.(),
      format: () => foundation.jsonViewer?.format?.(),
      search: (...args: any[]) => foundation.search(...args),
      getSearchResults: () => foundation.getSearchResults(),
      prevSearch: (step?: number) => foundation.prevSearch(step),
      nextSearch: (step?: number) => foundation.nextSearch(step),
      replace: (text: string) => foundation.replace(text),
      replaceAll: (text: string) => foundation.replaceAll(text),
      foundation,
    });

    const getStyle = () => toCssStyle({ width: props.width, height: props.height });

    const renderSearchOptions = () => {
      const items = [
        { key: 'caseSensitive', icon: IconCaseSensitive },
        { key: 'regex', icon: IconRegExp },
        { key: 'wholeWord', icon: IconWholeWord },
      ];
      return h(
        'ul',
        { class: `${prefixCls}-search-options` },
        items.map(({ key, icon: Icon }) =>
          h(
            'li',
            {
              key,
              class: classNames(`${prefixCls}-search-options-item`, {
                [`${prefixCls}-search-options-item-active`]: (state.searchOptions as any)[key],
              }),
            },
            [h(Icon, { onClick: () => foundation.setSearchOptions(key) })]
          )
        )
      );
    };

    const renderSearchBar = (loc: any) =>
      h('div', { class: `${prefixCls}-search-bar` }, [
        h(Input, {
          placeholder: loc.search,
          class: `${prefixCls}-search-bar-input`,
          onChange: (_value: string, e: Event) => {
            e?.preventDefault?.();
            if (!isComposing) searchHandler();
          },
          onCompositionStart: () => {
            isComposing = true;
          },
          onCompositionEnd: () => {
            isComposing = false;
            searchHandler();
          },
          ref: searchInputRef,
        }),
        renderSearchOptions(),
        h(ButtonGroup, null, () => [
          h(Button, { icon: IconChevronLeft, onClick: (e: MouseEvent) => { e.preventDefault(); foundation.prevSearch(); } }),
          h(Button, { icon: IconChevronRight, onClick: (e: MouseEvent) => { e.preventDefault(); foundation.nextSearch(); } }),
        ]),
        h(Button, {
          icon: IconClose,
          size: 'small',
          theme: 'borderless',
          type: 'tertiary',
          onClick: () => foundation.showSearchBar(),
        }),
      ]);

    const renderReplaceBar = (loc: any) => {
      const readOnly = props.options?.readOnly;
      return h('div', { class: `${prefixCls}-replace-bar` }, [
        h(Input, { placeholder: loc.replace, class: `${prefixCls}-replace-bar-input`, ref: replaceInputRef }),
        h(
          Button,
          {
            style: { width: 'fit-content' },
            disabled: readOnly,
            onClick: () => {
              const el = replaceInputRef.value?.$el?.querySelector?.('input') || replaceInputRef.value;
              foundation.replace(el?.value);
            },
          },
          () => loc.replace
        ),
        h(
          Button,
          {
            style: { width: 'fit-content' },
            disabled: readOnly,
            onClick: () => {
              const el = replaceInputRef.value?.$el?.querySelector?.('input') || replaceInputRef.value;
              foundation.replaceAll(el?.value);
            },
          },
          () => loc.replaceAll
        ),
      ]);
    };

    const renderSearchBox = (loc: any) =>
      h('div', { class: `${prefixCls}-search-bar-container`, style: { position: 'absolute', top: '20px', right: '20px' } }, [
        renderSearchBar(loc),
        renderReplaceBar(loc),
      ]);

    return () => {
      const loc = locale.value || {};
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const defaultSearchButton = h(
        DragMove,
        {
          constrainer: props.limitSearchButtonBounds ? 'parent' : undefined,
          onMouseDown: () => {
            isDragging = false;
          },
          onMouseMove: () => {
            isDragging = true;
          },
        },
        () =>
          h('div', { style: { position: 'absolute', top: 0, left: typeof props.width === 'number' ? `${props.width}px` : props.width } }, [
            !state.showSearchBar
              ? h(Button, {
                  class: `${prefixCls}-search-bar-trigger`,
                  icon: IconSearch,
                  style: { position: 'absolute', top: '20px', right: '20px' },
                  onClick: (e: MouseEvent) => {
                    e.preventDefault();
                    if (isDragging) {
                      e.stopPropagation();
                      e.preventDefault();
                      return;
                    }
                    foundation.showSearchBar();
                  },
                })
              : renderSearchBox(loc),
          ])
      );
      const searchControls = {
        showSearchBar: state.showSearchBar,
        onToggleSearchBar: () => foundation.showSearchBar(),
        onSearch: (text: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) =>
          foundation.search(text, caseSensitive, wholeWord, regex),
        onPrevSearch: () => foundation.prevSearch(),
        onNextSearch: () => foundation.nextSearch(),
        onReplace: (text: string) => foundation.replace(text),
        onReplaceAll: (text: string) => foundation.replaceAll(text),
      };
      const searchUi = props.showSearch
        ? props.renderSearchButton
          ? props.renderSearchButton(defaultSearchButton, searchControls)
          : defaultSearchButton
        : null;
      const portals = Array.from(state.customRenderMap.entries()).map(([key, value]) =>
        h(Teleport, { to: key, key: getPortalKey(key) }, [value])
      );
      return h(Fragment, null, [
        h(
          'div',
          {
            style: { ...getStyle(), position: 'relative', ...(props.style || {}), ...(attrStyle || {}) },
            class: classNames(props.className, attrClass),
            ...getDataAttr(rest),
          },
          [
            h('div', { style: getStyle(), ref: editorRef, class: classNames(prefixCls, `${prefixCls}-background`) }),
            searchUi,
          ]
        ),
        portals,
      ]);
    };
  },
});

(JsonViewer as any).elementType = 'JsonViewer';
export default JsonViewer;
