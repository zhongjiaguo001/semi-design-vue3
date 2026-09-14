import ModalComponent, { modalProps, modalEmits } from './Modal';
import ModalContent, { modalContentProps } from './ModalContent';
import ConfirmModal, { confirmModalProps } from './ConfirmModal';
import confirm, { withConfirm, withError, withInfo, withSuccess, withWarning, destroyAll, destroyFns } from './confirm';
import useModal from './useModal';
import type { ConfirmProps, ModalHandle } from './confirm';
import type { UseModalResult } from './useModal';

export type ModalStatic = typeof ModalComponent & {
  info: (props: ConfirmProps) => ModalHandle;
  success: (props: ConfirmProps) => ModalHandle;
  error: (props: ConfirmProps) => ModalHandle;
  warning: (props: ConfirmProps) => ModalHandle;
  confirm: (props: ConfirmProps) => ModalHandle;
  destroyAll: () => void;
  useModal: typeof useModal;
};

const Modal = ModalComponent as ModalStatic;
Modal.info = (props) => confirm(withInfo(props));
Modal.success = (props) => confirm(withSuccess(props));
Modal.error = (props) => confirm(withError(props));
Modal.warning = (props) => confirm(withWarning(props));
Modal.confirm = (props) => confirm(withConfirm(props));
Modal.destroyAll = destroyAll;
Modal.useModal = useModal;

export { Modal, ModalContent, ConfirmModal, modalProps, modalEmits, modalContentProps, confirmModalProps, confirm, useModal, destroyFns, withConfirm, withError, withInfo, withSuccess, withWarning };
export type { ConfirmProps, ModalHandle, UseModalResult };
export type { ModalSize, OKType, Directions } from './Modal';
export type { ConfirmType } from './ConfirmModal';
export default Modal;
