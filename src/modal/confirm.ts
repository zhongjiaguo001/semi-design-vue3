import { createApp, h, shallowRef } from 'vue';
import type { App } from 'vue';
import _omit from 'lodash/omit';
import '@douyinfe/semi-foundation/lib/es/modal/modal.css';
import ConfirmModal from './ConfirmModal';
import { IconAlertCircle, IconAlertTriangle, IconHelpCircle, IconInfoCircle, IconTickCircle } from '../icons/generated';

export type ConfirmProps = Record<string, any>;

export interface ModalHandle {
  destroy: () => void;
  update: (newConfig: ConfirmProps) => void;
}

/** close functions of every imperatively-created modal (React `destroyFns`) */
export const destroyFns: Array<() => void> = [];

/**
 * React `confirm.js`: mount a ConfirmModal into a fresh container appended to `document.body`.
 * `destroy` hides the modal (the app is unmounted after the close animation), `update` merges new config.
 */
export default function confirm(props: ConfirmProps): ModalHandle {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const currentConfig = shallowRef<ConfirmProps>({ ...props });
  let app: App | null = null;

  const destroy = () => {
    if (app) {
      app.unmount();
      app = null;
    }
    if (div.parentNode) {
      div.parentNode.removeChild(div);
    }
    const idx = destroyFns.indexOf(close);
    if (idx >= 0) destroyFns.splice(idx, 1);
  };

  const Root = {
    name: 'SemiConfirmRoot',
    setup() {
      return () => {
        const { afterClose, ...rest } = currentConfig.value;
        return h(ConfirmModal, {
          ...rest,
          motion: props.motion,
          onAfterClose: () => {
            afterClose?.();
            destroy();
          },
        });
      };
    },
  };

  function close() {
    currentConfig.value = { ...currentConfig.value, visible: false };
  }
  function update(newConfig: ConfirmProps) {
    currentConfig.value = { ...currentConfig.value, ...newConfig };
  }

  app = createApp(Root);
  app.mount(div);
  destroyFns.push(close);
  return { destroy: close, update };
}

export function withInfo(props: ConfirmProps = {}): ConfirmProps {
  return { type: 'info', icon: h(IconInfoCircle), ...props };
}
export function withSuccess(props: ConfirmProps = {}): ConfirmProps {
  return { type: 'success', icon: h(IconTickCircle), ...props };
}
export function withWarning(props: ConfirmProps = {}): ConfirmProps {
  return { type: 'warning', icon: h(IconAlertTriangle), ...props };
}
export function withError(props: ConfirmProps = {}): ConfirmProps {
  return {
    type: 'error',
    icon: h(IconAlertCircle),
    okButtonProps: { type: 'danger', ...props.okButtonProps },
    ..._omit(props, ['okButtonProps']),
  };
}
export function withConfirm(props: ConfirmProps = {}): ConfirmProps {
  return { type: 'confirm', icon: h(IconHelpCircle), ...props };
}

export function destroyAll() {
  const fns = destroyFns.splice(0, destroyFns.length);
  fns.forEach((fn) => fn && fn());
}
