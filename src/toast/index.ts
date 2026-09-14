import ToastItem, { toastProps } from './Toast';
import { ToastFactory, createBaseToast, ToastList } from './ToastFactory';
import useToast from './useToast';
import type { ToastApi, ToastOptions, ToastConfigProps, ToastInstance } from './ToastFactory';
import type { UseToastResult } from './useToast';

/** the default (singleton) toast manager, the React `Toast` default export */
const Toast: ToastApi = ToastFactory.create();

export { Toast, ToastItem, ToastFactory, createBaseToast, ToastList, useToast, toastProps };
export type { ToastApi, ToastOptions, ToastConfigProps, ToastInstance, UseToastResult };
export type { ToastType, ToastTheme, ToastDirection } from './Toast';
export default Toast;
