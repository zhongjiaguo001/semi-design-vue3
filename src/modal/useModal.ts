import { defineComponent, h, shallowReactive, shallowRef } from 'vue';
import type { Component } from 'vue';
import ConfirmModal from './ConfirmModal';
import { withConfirm, withError, withInfo, withSuccess, withWarning } from './confirm';
import type { ConfirmProps, ModalHandle } from './confirm';

let uuid = 0;

interface HookModalEntry {
  key: string;
  config: { value: ConfirmProps };
  afterClose: () => void;
}

export interface UseModalResult {
  modal: {
    info: (config: ConfirmProps) => ModalHandle;
    success: (config: ConfirmProps) => ModalHandle;
    error: (config: ConfirmProps) => ModalHandle;
    warning: (config: ConfirmProps) => ModalHandle;
    confirm: (config: ConfirmProps) => ModalHandle;
  };
  /** render this component somewhere inside your tree (e.g. under ConfigProvider) */
  ModalHolder: Component;
}

/**
 * Vue counterpart of React `Modal.useModal()`: modals created through `modal.xxx()` are rendered by
 * `ModalHolder`, so they inherit ConfigProvider / LocaleProvider context from where the holder is placed.
 */
export default function useModal(): UseModalResult {
  const elements = shallowReactive<HookModalEntry[]>([]);

  function patchElement(entry: HookModalEntry) {
    elements.push(entry);
    return () => {
      const idx = elements.indexOf(entry);
      if (idx >= 0) elements.splice(idx, 1);
    };
  }

  function getConfirmFunc(withFunc: (c: ConfirmProps) => ConfirmProps) {
    return function hookConfirm(config: ConfirmProps): ModalHandle {
      uuid += 1;
      const innerConfig = shallowRef<ConfirmProps>(withFunc(config));
      let closeFunc: () => void = () => undefined;
      const entry: HookModalEntry = {
        key: `semi-modal-${uuid}`,
        config: innerConfig,
        afterClose: () => {
          innerConfig.value.afterClose?.();
          closeFunc();
        },
      };
      closeFunc = patchElement(entry);
      return {
        destroy: () => {
          innerConfig.value = { ...innerConfig.value, visible: false };
        },
        update: (newConfig: ConfirmProps) => {
          innerConfig.value = { ...innerConfig.value, ...newConfig };
        },
      };
    };
  }

  const ModalHolder = defineComponent({
    name: 'ModalHolder',
    setup() {
      return () =>
        elements.map((entry) => {
          const { afterClose: _ac, ...rest } = entry.config.value;
          return h(ConfirmModal, { key: entry.key, ...rest, onAfterClose: entry.afterClose });
        });
    },
  });

  return {
    modal: {
      info: getConfirmFunc(withInfo),
      success: getConfirmFunc(withSuccess),
      error: getConfirmFunc(withError),
      warning: getConfirmFunc(withWarning),
      confirm: getConfirmFunc(withConfirm),
    },
    ModalHolder,
  };
}
