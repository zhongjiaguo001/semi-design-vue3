import { defineComponent, h, ref, nextTick, createApp } from 'vue';
import type { App } from 'vue';
import cls from 'classnames';
import ToastListFoundation from '@douyinfe/semi-foundation/lib/es/toast/toastListFoundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/toast/constants';
import getUuid, { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/toast/toast.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import CSSAnimation from '../_cssAnimation';
import Toast from './Toast';
import useToast from './useToast';
import type { ToastTheme, ToastType } from './Toast';

export interface ToastConfigProps {
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  duration?: number;
  zIndex?: number;
  theme?: ToastTheme;
  getPopupContainer?: () => HTMLElement | null;
}

export interface ToastOptions extends ToastConfigProps {
  id?: string | number;
  content?: any;
  type?: ToastType;
  textMaxWidth?: string | number;
  style?: Record<string, any>;
  className?: string;
  showClose?: boolean;
  icon?: any;
  direction?: 'ltr' | 'rtl';
  stack?: boolean;
  motion?: boolean;
  onClose?: () => void;
  [key: string]: any;
}

export interface ToastInstance extends ToastOptions {
  id: string | number;
}

interface ToastListState {
  list: ToastInstance[];
  removedItems: ToastInstance[];
  updatedItems: ToastInstance[];
  mouseInSide: boolean;
}

/**
 * Renders the toast stack (React `ToastList`). Exposes has/add/update/remove/destroyAll/setStack.
 */
export const ToastList = defineComponent({
  name: 'ToastList',
  setup(_, { expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent<any, ToastListState>({} as any, {
      list: [],
      removedItems: [],
      updatedItems: [],
      mouseInSide: false,
    });
    const innerWrapperRef = ref<HTMLElement | null>(null);
    const stack = ref(false);
    const toastRefs = new Map<string, any>();

    const adapter = {
      ...baseAdapter,
      updateToast: (list: ToastInstance[], removedItems: ToastInstance[], updatedItems: ToastInstance[]) => {
        state.list = list;
        state.removedItems = removedItems;
        state.updatedItems = updatedItems;
        // React restarts the close timer of updated toasts through a ref callback on re-render
        nextTick(() => {
          updatedItems.forEach((item) => toastRefs.get(item.id)?.restartCloseTimer?.());
        });
      },
      handleMouseInSideChange: (mouseInSide: boolean) => {
        state.mouseInSide = mouseInSide;
      },
      getInputWrapperRect: () => innerWrapperRef.value?.getBoundingClientRect() ?? null,
    };
    const foundation = new (ToastListFoundation as any)(adapter);

    const handleMouseEnter = () => {
      if (stack.value) foundation.handleMouseInSideChange(true);
    };
    const handleMouseLeave = () => {
      if (stack.value) {
        const height = foundation.getInputWrapperRect()?.height;
        if (height) foundation.handleMouseInSideChange(false);
      }
    };

    const api = {
      has: (id: string | number) => foundation.hasToast(id),
      add: (opts: ToastInstance) => foundation.addToast(opts),
      update: (id: string | number, opts: ToastInstance) => foundation.updateToast(id, opts),
      remove: (id: string | number) => foundation.removeToast(id),
      destroyAll: () => foundation.destroyAll(),
      setStack: (value: boolean) => {
        stack.value = value;
      },
      getStack: () => stack.value,
      foundation,
    };
    expose(api);

    return () => {
      const { removedItems } = state;
      const list = Array.from(new Set([...state.list, ...removedItems]));
      return h(
        'div',
        {
          class: cls({
            [`${cssClasses.PREFIX}-innerWrapper`]: true,
            [`${cssClasses.PREFIX}-innerWrapper-hover`]: state.mouseInSide,
          }),
          ref: innerWrapperRef,
          onMouseenter: handleMouseEnter,
          onMouseleave: handleMouseLeave,
        },
        list.map((item, index) => {
          const isRemoved = removedItems.find((removedItem) => removedItem.id === item.id) !== undefined;
          const animationState = isRemoved ? 'leave' : 'enter';
          return h(
            CSSAnimation,
            {
              key: item.id,
              motion: item.motion !== false,
              animationState,
              startClassName: isRemoved ? `${cssClasses.PREFIX}-animation-hide` : `${cssClasses.PREFIX}-animation-show`,
              onAnimationEnd: () => {
                // Only act on the leave animation end (guarded by the animationState captured at render time)
                if (animationState !== 'leave') return;
                if (!state.removedItems.some((removed) => removed.id === item.id)) return;
                state.removedItems = state.removedItems.filter((removed) => removed.id !== item.id);
              },
            },
            {
              default: ({ animationClassName, animationEventsNeedBind }: any) => {
                const { className, style, motion: _m, onClose, ...rest } = item;
                return h(Toast, {
                  ...rest,
                  onClose,
                  stack: stack.value,
                  stackExpanded: state.mouseInSide,
                  positionInList: { length: list.length, index },
                  className: cls({ [className as string]: Boolean(className), [animationClassName]: true }),
                  onAnimationStart: animationEventsNeedBind.onAnimationstart,
                  onAnimationEnd: animationEventsNeedBind.onAnimationend,
                  style: { ...(style || {}) },
                  close: (id: string | number) => api.remove(id),
                  ref: (inst: any) => {
                    if (inst) toastRefs.set(item.id, inst);
                    else toastRefs.delete(item.id);
                  },
                });
              },
            }
          );
        })
      );
    };
  },
});

export interface ToastApi {
  create: (opts: ToastOptions) => string | number;
  info: (opts: ToastOptions | string) => string | number;
  success: (opts: ToastOptions | string) => string | number;
  warning: (opts: ToastOptions | string) => string | number;
  error: (opts: ToastOptions | string) => string | number;
  close: (id: string | number) => void;
  destroyAll: () => void;
  config: (opts: ToastConfigProps) => void;
  getWrapperId: () => string | null;
  useToast: typeof useToast;
  defaultOpts: ToastOptions;
}

const POSITIONS = ['top', 'left', 'bottom', 'right'] as const;

/** React `createBaseToast`: an independent toast manager backed by a singleton Vue app */
export function createBaseToast(): ToastApi {
  let app: App | null = null;
  let instance: any = null;
  let wrapperId: string | null = null;
  const defaultOpts: ToastOptions = { motion: true, zIndex: 1010, content: '' };

  const applyPosition = (node: HTMLElement, opts: ToastOptions) => {
    POSITIONS.forEach((pos) => {
      if (pos in opts) {
        const val = opts[pos];
        (node.style as any)[pos] = typeof val === 'number' ? `${val}px` : val;
      }
    });
  };

  const api: ToastApi = {
    defaultOpts,
    useToast,
    create(opts: ToastOptions) {
      const id = opts.id ?? getUuid('toast');
      const mergedOpts: ToastOptions = { ...defaultOpts, ...opts };
      if (!instance) {
        const div = document.createElement('div');
        if (!wrapperId) {
          // React: getUuid('toast-wrapper').slice(0, 26) - a short random id avoids same-millisecond collisions
          wrapperId = getUuidShort({ prefix: 'toast-wrapper' });
        }
        div.className = cssClasses.WRAPPER;
        div.id = wrapperId;
        div.style.zIndex = String(typeof opts.zIndex === 'number' ? opts.zIndex : mergedOpts.zIndex);
        applyPosition(div, mergedOpts);
        const container = mergedOpts.getPopupContainer ? mergedOpts.getPopupContainer() : null;
        (container || document.body).appendChild(div);
        app = createApp(ToastList);
        instance = app.mount(div);
        instance.setStack(Boolean(mergedOpts.stack));
        instance.add({ ...mergedOpts, id });
      } else {
        const node = document.querySelector(`#${wrapperId}`) as HTMLElement | null;
        node && applyPosition(node, mergedOpts);
        if (Boolean(mergedOpts.stack) !== instance.getStack()) {
          instance.setStack(Boolean(mergedOpts.stack));
        }
        if (instance.has(id)) {
          instance.update(id, { ...mergedOpts, id });
        } else {
          instance.add({ ...mergedOpts, id });
        }
      }
      return id;
    },
    close(id: string | number) {
      instance && instance.remove(id);
    },
    destroyAll() {
      if (instance) {
        instance.destroyAll();
        const wrapper = wrapperId ? document.querySelector(`#${wrapperId}`) : null;
        app?.unmount();
        app = null;
        if (wrapper) {
          wrapper.parentNode?.removeChild(wrapper);
        }
        instance = null;
        wrapperId = null;
      }
    },
    getWrapperId() {
      return wrapperId;
    },
    info(opts) {
      if (typeof opts === 'string') opts = { content: opts };
      return api.create({ ...defaultOpts, ...opts, type: 'info' });
    },
    warning(opts) {
      if (typeof opts === 'string') opts = { content: opts };
      return api.create({ ...defaultOpts, ...opts, type: 'warning' });
    },
    error(opts) {
      if (typeof opts === 'string') opts = { content: opts };
      return api.create({ ...defaultOpts, ...opts, type: 'error' });
    },
    success(opts) {
      if (typeof opts === 'string') opts = { content: opts };
      return api.create({ ...defaultOpts, ...opts, type: 'success' });
    },
    config(opts: ToastConfigProps) {
      POSITIONS.forEach((pos) => {
        if (pos in opts) defaultOpts[pos] = opts[pos];
      });
      if (typeof opts.theme === 'string' && (strings.themes as readonly string[]).includes(opts.theme)) {
        defaultOpts.theme = opts.theme;
      }
      if (typeof opts.zIndex === 'number') defaultOpts.zIndex = opts.zIndex;
      if (typeof opts.duration === 'number') defaultOpts.duration = opts.duration;
      if (typeof opts.getPopupContainer === 'function') defaultOpts.getPopupContainer = opts.getPopupContainer;
    },
  };
  return api;
}

export class ToastFactory {
  static create(config?: ToastConfigProps): ToastApi {
    const newToast = createBaseToast();
    config && newToast.config(config);
    return newToast;
  }
}

