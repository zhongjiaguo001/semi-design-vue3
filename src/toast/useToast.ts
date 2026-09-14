import { defineComponent, h, shallowReactive } from 'vue';
import type { Component } from 'vue';
import getUuid from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import Toast from './Toast';
import type { ToastOptions } from './ToastFactory';

const defaultOpts: ToastOptions = { motion: true, zIndex: 1010, duration: 3 };

interface HookToastEntry {
  id: string;
  config: ToastOptions;
}

export interface UseToastResult {
  toast: {
    success: (config: ToastOptions) => string;
    info: (config: ToastOptions) => string;
    error: (config: ToastOptions) => string;
    warning: (config: ToastOptions) => string;
    open: (config: ToastOptions) => string;
    close: (id: string) => void;
  };
  /** render this component somewhere inside your tree (e.g. under ConfigProvider) */
  ToastHolder: Component;
}

/**
 * Vue counterpart of React `Toast.useToast()`: toasts are rendered by `ToastHolder`, so they inherit
 * ConfigProvider / LocaleProvider context from where the holder is placed. Newest toast first (as React).
 */
export default function useToast(): UseToastResult {
  const elements = shallowReactive<HookToastEntry[]>([]);

  const removeElement = (id: string) => {
    const idx = elements.findIndex((e) => e.id === id);
    if (idx >= 0) elements.splice(idx, 1);
  };

  const addToast = (config: ToastOptions) => {
    const id = getUuid('semi_toast_');
    elements.unshift({ id, config: { ...config, id } });
    return id;
  };

  const ToastHolder = defineComponent({
    name: 'ToastHolder',
    setup() {
      return () =>
        elements.length
          ? elements.map((entry) => {
              const { motion: _m, zIndex: _z, ...rest } = entry.config;
              return h(Toast, {
                key: entry.id,
                ...rest,
                close: () => removeElement(entry.id),
              });
            })
          : null;
    },
  });

  return {
    toast: {
      success: (config) => addToast({ ...defaultOpts, ...config, type: 'success' }),
      info: (config) => addToast({ ...defaultOpts, ...config, type: 'info' }),
      error: (config) => addToast({ ...defaultOpts, ...config, type: 'error' }),
      warning: (config) => addToast({ ...defaultOpts, ...config, type: 'warning' }),
      open: (config) => addToast({ ...defaultOpts, ...config, type: 'default' }),
      close: (id) => removeElement(id),
    },
    ToastHolder,
  };
}
