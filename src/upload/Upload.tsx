import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import _pick from 'lodash/pick';
import UploadFoundation from '@douyinfe/semi-foundation/lib/es/upload/foundation';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/upload/constants';
import '@douyinfe/semi-foundation/lib/es/upload/upload.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { IconUpload } from '../icons/generated';
import { flattenChildren, getDataAttr, normalizeNode, toPx } from '../_utils';
import FileCard from './FileCard';
import type { FileItemStatus } from './FileCard';
import Modal from '../modal/Modal';
import Cropper from '../cropper/Cropper';

const prefixCls = cssClasses.PREFIX;

export type UploadListType = (typeof strings.LIST_TYPE)[number];
export type PromptPositionType = (typeof strings.PROMPT_POSITION)[number];
export type UploadTrigger = (typeof strings.UPLOAD_TRIGGER)[number];
export type ValidateStatus = 'default' | 'error' | 'warning' | 'success';

export interface FileItem {
  showReplace?: boolean;
  showRetry?: boolean;
  response?: any;
  event?: Event;
  status: FileItemStatus;
  name: string;
  size: string;
  uid: string;
  url?: string;
  fileInstance?: File;
  percent?: number;
  _sizeInvalid?: boolean;
  preview?: boolean;
  validateMessage?: any;
  shouldUpload?: boolean;
  [key: string]: any;
}

export interface CustomFile extends File {
  uid?: string;
  _sizeInvalid?: boolean;
  status?: string;
}

export interface BeforeUploadProps {
  file: FileItem;
  fileList: FileItem[];
}
export interface AfterUploadProps {
  response: any;
  file: FileItem;
  fileList: FileItem[];
}
export interface BeforeUploadObjectResult {
  shouldUpload?: boolean;
  status?: string;
  autoRemove?: boolean;
  validateMessage?: unknown;
  fileInstance?: CustomFile;
}
export interface AfterUploadResult {
  autoRemove?: boolean;
  status?: string;
  validateMessage?: unknown;
  name?: string;
  url?: string;
}
export interface CropProps {
  aspectRatio?: number;
  shape?: 'rect' | 'round' | 'roundRect';
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  quality?: number;
  fill?: string;
  modalTitle?: string;
  modalOkText?: string;
  modalCancelText?: string;
}
export interface CustomRequestArgs {
  fileName: string;
  data: Record<string, any>;
  file: FileItem;
  fileInstance: File;
  onProgress: (e: { total: number; loaded: number }) => void;
  onError: (userXhr: any, e?: any) => void;
  onSuccess: (response: any, e?: any) => void;
  withCredentials: boolean;
  action: string;
}

export const uploadProps = {
  accept: { type: String, default: undefined },
  action: { type: String, default: '' },
  addOnPasting: { type: Boolean, default: false },
  afterUpload: { type: Function as PropType<(props: AfterUploadProps) => AfterUploadResult>, default: undefined },
  beforeCrop: { type: Function as PropType<(file: File, fileList: File[]) => boolean | Promise<boolean>>, default: undefined },
  crop: { type: [Boolean, Object] as PropType<boolean | CropProps>, default: undefined },
  cropModalProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  onCropError: { type: Function as PropType<(error: Error) => void>, default: undefined },
  beforeClear: { type: Function as PropType<(fileList: FileItem[]) => boolean | Promise<boolean>>, default: () => true },
  beforeRemove: { type: Function as PropType<(file: FileItem, fileList: FileItem[]) => boolean | Promise<boolean>>, default: () => true },
  beforeUpload: { type: Function as PropType<(props: BeforeUploadProps) => boolean | BeforeUploadObjectResult | Promise<BeforeUploadObjectResult>>, default: undefined },
  capture: { type: [Boolean, String] as PropType<boolean | 'user' | 'environment'>, default: undefined },
  className: { type: String, default: undefined },
  customRequest: { type: Function as PropType<(args: CustomRequestArgs) => void>, default: undefined },
  data: { type: [Object, Function] as PropType<Record<string, any> | ((file: File) => Record<string, any>)>, default: undefined },
  defaultFileList: { type: Array as PropType<FileItem[]>, default: () => [] },
  directory: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  dragIcon: { type: [Object, Function, String] as PropType<any>, default: undefined },
  dragMainText: { type: [Object, Function, String] as PropType<any>, default: undefined },
  dragSubText: { type: [Object, Function, String] as PropType<any>, default: undefined },
  draggable: { type: Boolean, default: false },
  fileList: { type: Array as PropType<FileItem[]>, default: undefined },
  fileName: { type: String, default: undefined },
  fileListTitle: { type: [Object, Function, String] as PropType<any>, default: undefined },
  headers: { type: [Object, Function] as PropType<Record<string, any> | ((file: File) => Record<string, any>)>, default: undefined },
  hotSpotLocation: { type: String as PropType<'start' | 'end'>, default: 'end' },
  itemStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  limit: { type: Number, default: undefined },
  listType: { type: String as PropType<UploadListType>, default: 'list' },
  maxSize: { type: Number, default: undefined },
  minSize: { type: Number, default: undefined },
  multiple: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  previewFile: { type: Function as PropType<(fileItem: any) => VNodeChild>, default: undefined },
  prompt: { type: [Object, Function, String] as PropType<any>, default: undefined },
  promptPosition: { type: String as PropType<PromptPositionType>, default: 'right' },
  picWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
  picHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
  renderFileItem: { type: Function as PropType<(fileItem: any) => VNodeChild>, default: undefined },
  renderPicPreviewIcon: { type: Function as PropType<(fileItem: any) => VNodeChild>, default: undefined },
  renderFileOperation: { type: Function as PropType<(fileItem: any) => VNodeChild>, default: undefined },
  renderPicClose: { type: Function as PropType<(props: { className: string; remove: (e: MouseEvent) => void }) => VNodeChild>, default: undefined },
  renderPicInfo: { type: Function as PropType<(fileItem: any) => VNodeChild>, default: undefined },
  renderThumbnail: { type: Function as PropType<(fileItem: any) => VNodeChild>, default: undefined },
  showClear: { type: Boolean, default: true },
  showPicInfo: { type: Boolean, default: false },
  showReplace: { type: Boolean, default: false },
  showRetry: { type: Boolean, default: true },
  showUploadList: { type: Boolean, default: true },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  timeout: { type: Number, default: undefined },
  transformFile: { type: Function as PropType<(file: File) => CustomFile>, default: undefined },
  uploadTrigger: { type: String as PropType<UploadTrigger>, default: 'auto' },
  validateMessage: { type: [Object, Function, String] as PropType<any>, default: undefined },
  validateStatus: { type: String as PropType<ValidateStatus>, default: undefined },
  withCredentials: { type: Boolean, default: false },
  showTooltip: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: true },
};

export const uploadEmits = [
  'update:fileList',
  'acceptInvalid',
  'change',
  'clear',
  'drop',
  'error',
  'exceed',
  'fileChange',
  'openFileDialog',
  'previewClick',
  'progress',
  'remove',
  'retry',
  'sizeError',
  'success',
  'pastingError',
  'cropError',
];

interface UploadState {
  fileList: FileItem[];
  replaceIdx: number;
  inputKey: number;
  replaceInputKey: number;
  dragAreaStatus: string;
  localUrls: string[];
  cropperVisible: boolean;
  cropperFile: File | null;
  cropperSrc: string;
  pendingImageFiles: File[];
  nonImageFiles: File[];
  croppedFiles: File[];
  isReplaceOperation: boolean;
}

const Upload = defineComponent({
  name: 'Upload',
  inheritAttrs: false,
  props: uploadProps,
  emits: uploadEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, UploadState>(props as any, {
      fileList: props.defaultFileList || [],
      replaceIdx: -1,
      inputKey: Math.random(),
      replaceInputKey: Math.random(),
      dragAreaStatus: 'default',
      localUrls: [],
      cropperVisible: false,
      cropperFile: null,
      cropperSrc: '',
      pendingImageFiles: [],
      nonImageFiles: [],
      croppedFiles: [],
      isReplaceOperation: false,
    });
    const { locale } = useLocale('Upload');
    const inputRef = ref<HTMLInputElement | null>(null);
    const replaceInputRef = ref<HTMLInputElement | null>(null);
    const cropperRef = ref<any>(null);
    let pastingCb: ((e: any) => void) | null = null;
    let pasteEventCb: ((e: any) => void) | null = null;

    const isFileListControlled = () => 'fileList' in propsView;
    if (isFileListControlled()) state.fileList = props.fileList || [];

    /* ---------- image cropping (crop / beforeCrop / cropModalProps / onCropError) ---------- */
    let foundation: any;
    const isImageFile = (file: File) => Boolean(file && typeof file.type === 'string' && file.type.startsWith('image/'));
    const notifyCropError = (error: any) => {
      props.onCropError && props.onCropError(error);
      emit('cropError', error);
    };
    const dispatchUpload = (files: File[], isReplaceOperation: boolean) => {
      if (isReplaceOperation) foundation.handleReplaceChange(files);
      else foundation.handleChange(files);
    };
    const shouldCropFile = async (file: File, files: File[]) => {
      const { beforeCrop } = props;
      if (!beforeCrop) return true;
      try {
        const result = await beforeCrop(file, files);
        return result !== false;
      } catch (error) {
        notifyCropError(error);
        return false;
      }
    };
    const handleCropFiles = async (files: File[], isReplaceOperation = false) => {
      const imageFiles = files.filter(isImageFile);
      const nonImageFiles = files.filter((f) => !isImageFile(f));
      if (imageFiles.length === 0) {
        dispatchUpload(files, isReplaceOperation);
        return;
      }
      const shouldCrop = await shouldCropFile(imageFiles[0], files);
      if (!shouldCrop) {
        dispatchUpload(files, isReplaceOperation);
        return;
      }
      const queue = isReplaceOperation ? [imageFiles[0]] : imageFiles;
      const [first, ...rest] = queue;
      state.cropperVisible = true;
      state.cropperFile = first;
      state.cropperSrc = URL.createObjectURL(first);
      state.pendingImageFiles = rest;
      state.nonImageFiles = isReplaceOperation ? [] : nonImageFiles;
      state.croppedFiles = [];
      state.isReplaceOperation = isReplaceOperation;
    };
    const closeCropperAndReset = () => {
      if (state.cropperSrc) URL.revokeObjectURL(state.cropperSrc);
      state.cropperVisible = false;
      state.cropperFile = null;
      state.cropperSrc = '';
      state.pendingImageFiles = [];
      state.nonImageFiles = [];
      state.croppedFiles = [];
      state.isReplaceOperation = false;
      state.inputKey = Math.random();
      state.replaceInputKey = Math.random();
    };
    const handleCropOk = async () => {
      const { cropperFile, pendingImageFiles, nonImageFiles, croppedFiles, isReplaceOperation } = state;
      const { crop } = props;
      try {
        const cropperInstance = cropperRef.value;
        if (!cropperInstance || !cropperFile) throw new Error('Cropper instance not found');
        const canvas: HTMLCanvasElement = cropperInstance.getCropperCanvas();
        const cropConfig: CropProps = typeof crop === 'object' && crop ? crop : {};
        const quality = cropConfig.quality ?? 0.92;
        const type = cropperFile.type || 'image/png';
        const blob: Blob = await new Promise((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), type, quality);
        });
        const croppedFile = new File([blob], cropperFile.name, { type, lastModified: cropperFile.lastModified });
        const nextCropped = [...croppedFiles, croppedFile];
        if (pendingImageFiles.length > 0) {
          const [next, ...rest] = pendingImageFiles;
          if (state.cropperSrc) URL.revokeObjectURL(state.cropperSrc);
          state.cropperFile = next;
          state.cropperSrc = URL.createObjectURL(next);
          state.pendingImageFiles = rest;
          state.croppedFiles = nextCropped;
          return;
        }
        closeCropperAndReset();
        dispatchUpload([...nextCropped, ...nonImageFiles], isReplaceOperation);
      } catch (error) {
        notifyCropError(error);
      }
    };
    const handleCropCancel = () => closeCropperAndReset();
    const collectClipboardFiles = (e: ClipboardEvent) => {
      const files: File[] = [];
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return files;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      return files;
    };

    const adapter = {
      ...baseAdapter,
      notifyFileSelect: (files: CustomFile[]) => emit('fileChange', files),
      notifyError: (error: any, fileInstance: CustomFile, fileList: FileItem[], xhr: XMLHttpRequest) => emit('error', error, fileInstance, fileList, xhr),
      notifySuccess: (responseBody: any, file: CustomFile, fileList: FileItem[]) => emit('success', responseBody, file, fileList),
      notifyProgress: (percent: number, file: CustomFile, fileList: FileItem[]) => emit('progress', percent, file, fileList),
      notifyRemove: (file: CustomFile, fileList: FileItem[], fileItem: FileItem) => emit('remove', file, fileList, fileItem),
      notifySizeError: (file: CustomFile, fileList: FileItem[]) => emit('sizeError', file, fileList),
      notifyExceed: (fileList: File[]) => emit('exceed', fileList),
      updateFileList: (fileList: FileItem[], cb?: () => void) => {
        state.fileList = fileList;
        if (typeof cb === 'function') nextTick(cb);
      },
      notifyBeforeUpload: ({ file, fileList }: BeforeUploadProps) => (props.beforeUpload ? props.beforeUpload({ file, fileList }) : true),
      notifyAfterUpload: ({ response, file, fileList }: AfterUploadProps) => (props.afterUpload ? props.afterUpload({ response, file, fileList }) : {}),
      resetInput: () => {
        state.inputKey = Math.random();
      },
      resetReplaceInput: () => {
        state.replaceInputKey = Math.random();
      },
      isMac: () => navigator.platform.toUpperCase().indexOf('MAC') >= 0,
      registerPastingHandler: (cb?: (e: any) => void) => {
        pastingCb = (e: any) => {
          const { crop } = props;
          if (crop && e.type === 'keydown' && 'code' in e) {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCombineKeydown = isMac ? e.metaKey : e.ctrlKey;
            if (isCombineKeydown && e.code === 'KeyV') {
              const clipboard = (navigator as any).clipboard;
              if (clipboard && typeof clipboard.read === 'function') {
                (navigator as any).permissions
                  .query({ name: 'clipboard-read' })
                  .then((result: any) => {
                    if (result.state === 'granted' || result.state === 'prompt') {
                      clipboard
                        .read()
                        .then(async (clipboardItems: any[]) => {
                          const files: File[] = [];
                          for (const clipboardItem of clipboardItems) {
                            for (const type of clipboardItem.types) {
                              if (type.startsWith('image')) {
                                const blob = await clipboardItem.getType(type);
                                const buffer = await blob.arrayBuffer();
                                const format = type.split('/')[1];
                                files.push(new File([buffer], 'paste.' + format, { type }));
                              }
                            }
                          }
                          if (files.length > 0) {
                            if (files.some(isImageFile)) handleCropFiles(files);
                            else foundation.handleChange(files);
                          }
                        })
                        .catch((error: any) => emit('pastingError', error));
                    }
                  })
                  .catch((error: any) => emit('pastingError', error));
                return;
              }
            }
          }
          cb && cb(e);
        };
        document.body.addEventListener('keydown', pastingCb);
      },
      unRegisterPastingHandler: () => {
        if (pastingCb) {
          document.body.removeEventListener('keydown', pastingCb);
          pastingCb = null;
        }
      },
      registerPasteEventHandler: (cb?: (e: any) => void) => {
        pasteEventCb = (e: any) => {
          if (props.crop) {
            const files = collectClipboardFiles(e);
            if (files.length > 0 && files.some(isImageFile)) {
              e.preventDefault();
              handleCropFiles(files);
              return;
            }
          }
          cb && cb(e);
        };
        document.body.addEventListener('paste', pasteEventCb);
      },
      unRegisterPasteEventHandler: () => {
        if (pasteEventCb) {
          document.body.removeEventListener('paste', pasteEventCb);
          pasteEventCb = null;
        }
      },
      notifyPastingError: (error: any) => emit('pastingError', error),
      updateDragAreaStatus: (dragAreaStatus: string) => {
        state.dragAreaStatus = dragAreaStatus;
      },
      notifyChange: ({ currentFile, fileList }: { currentFile: FileItem | null; fileList: FileItem[] }) => {
        emit('update:fileList', fileList);
        emit('change', { currentFile, fileList });
      },
      updateLocalUrls: (urls: string[]) => {
        state.localUrls = urls;
      },
      notifyClear: () => emit('clear'),
      notifyPreviewClick: (file: any) => emit('previewClick', file),
      notifyDrop: (e: any, files: File[], fileList: FileItem[]) => emit('drop', e, files, fileList),
      notifyAcceptInvalid: (invalidFiles: File[]) => emit('acceptInvalid', invalidFiles),
      notifyBeforeRemove: (file: FileItem, fileList: FileItem[]) => props.beforeRemove(file, fileList),
      notifyBeforeClear: (fileList: FileItem[]) => props.beforeClear(fileList),
    };
    foundation = new (UploadFoundation as any)(adapter);
    // the foundation reads `onRetry` etc. through props; expose the emit-backed callbacks
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'onRetry') return (file: any) => emit('retry', file);
        if (key === 'onPreviewClick') return (file: any) => emit('previewClick', file);
        return Reflect.get(target, key);
      },
    });
    foundation._adapter.getProps = () => propsProxy;
    foundation._adapter.getProp = (key: string) => propsProxy[key];

    // getDerivedStateFromProps + componentDidUpdate for the controlled fileList
    watch(
      () => props.fileList,
      (fileList) => {
        if (isFileListControlled()) {
          state.fileList = fileList || [];
          foundation.syncLatestFileList(fileList || []);
        }
      },
      { deep: true }
    );

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    const onClick = () => {
      const isDisabled = Boolean(props.disabled);
      if (isDisabled || !inputRef.value) return;
      inputRef.value.click();
      emit('openFileDialog');
    };
    const onChange = (e: Event) => {
      const { files } = e.target as HTMLInputElement;
      if (props.crop && files && files.length > 0) {
        const fileArr = Array.from(files);
        if (fileArr.some(isImageFile)) {
          handleCropFiles(fileArr);
          return;
        }
      }
      foundation.handleChange(files);
    };
    const replace = (index: number) => {
      state.replaceIdx = index;
      nextTick(() => replaceInputRef.value && replaceInputRef.value.click());
    };
    const onReplaceChange = (e: Event) => {
      const { files } = e.target as HTMLInputElement;
      if (props.crop && files && files.length > 0) {
        const fileArr = Array.from(files);
        if (fileArr.some(isImageFile)) {
          handleCropFiles(fileArr, true);
          return;
        }
      }
      foundation.handleReplaceChange(files);
    };
    const clear = () => foundation.handleClear();
    const remove = (fileItem: FileItem) => foundation.handleRemove(fileItem);
    const insert = (files: CustomFile[], index?: number) => foundation.insertFileToList(files, index);
    const upload = () => foundation.manualUpload();
    const openFileDialog = () => onClick();
    const onDrop = (e: DragEvent) => {
      const { crop, directory, disabled } = props;
      if (disabled || directory || !crop) {
        foundation.handleDrop(e);
        return;
      }
      const files = e.dataTransfer && e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
      if (files.length === 0 || !files.some(isImageFile)) {
        foundation.handleDrop(e);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const fileList = getFileList().slice();
      state.dragAreaStatus = 'default';
      emit('drop', e, files, fileList);
      handleCropFiles(files);
    };
    const onDragOver = (e: DragEvent) => foundation.handleDragOver(e);
    const onDragLeave = (e: DragEvent) => foundation.handleDragLeave(e);
    const onDragEnter = (e: DragEvent) => foundation.handleDragEnter(e);

    expose({ foundation, insert, upload, openFileDialog, clear, remove, replace, inputRef, replaceInputRef, cropperRef, handleCropOk, handleCropCancel });

    const getFileList = () => (isFileListControlled() ? props.fileList || [] : state.fileList);

    const renderCropperModal = () => {
      const { cropperVisible, cropperSrc } = state;
      const { crop, cropModalProps } = props;
      if (!crop) return null;
      const cropConfig: CropProps = typeof crop === 'object' && crop ? crop : {};
      const { style: modalStyle, bodyStyle: modalBodyStyle, ...restModalProps } = cropModalProps || {};
      const modalTitle = cropConfig.modalTitle || locale.value?.cropTitle || '裁切图片';
      const modalOkText = cropConfig.modalOkText || locale.value?.cropOk || '确定';
      const modalCancelText = cropConfig.modalCancelText || locale.value?.cropCancel || '取消';
      return h(
        Modal,
        {
          ...restModalProps,
          width: 600,
          title: modalTitle,
          visible: cropperVisible,
          onOk: handleCropOk,
          onCancel: handleCropCancel,
          okText: modalOkText,
          cancelText: modalCancelText,
          class: `${prefixCls}-cropper-modal`,
          style: { height: '500px', ...(modalStyle || {}) },
          bodyStyle: { height: '400px', ...(modalBodyStyle || {}) },
        },
        {
          default: () =>
            cropperSrc
              ? h(Cropper, {
                  ref: cropperRef,
                  src: cropperSrc,
                  shape: cropConfig.shape || 'rect',
                  aspectRatio: cropConfig.aspectRatio,
                  minZoom: cropConfig.minZoom,
                  maxZoom: cropConfig.maxZoom,
                  zoomStep: cropConfig.zoomStep,
                  fill: cropConfig.fill,
                  style: { width: '100%', height: '100%' },
                })
              : null,
        }
      );
    };

    const renderFile = (file: FileItem, index: number) => {
      const { name, status, validateMessage, _sizeInvalid, uid } = file;
      const { previewFile, listType, itemStyle, showPicInfo, renderPicInfo, renderPicClose, renderPicPreviewIcon, renderFileOperation, renderFileItem, renderThumbnail, disabled, picWidth, picHeight, showTooltip } = props;
      const onRemove = () => remove(file);
      const onRetry = () => foundation.retry(file);
      const onReplace = () => replace(index);
      const hasPreviewClick = 'onPreviewClick' in propsView || Boolean((attrs as any).onPreviewClick);
      const fileCardProps: Record<string, any> = {
        ..._pick(props, ['showRetry', 'showReplace']),
        ...file,
        previewFile,
        listType,
        onRemove,
        onRetry,
        index,
        key: uid || `${name}${index}`,
        style: itemStyle,
        disabled,
        showPicInfo,
        renderPicInfo,
        renderPicPreviewIcon,
        renderPicClose,
        renderFileOperation,
        renderThumbnail,
        onReplace,
        onPreviewClick: hasPreviewClick ? () => foundation.handlePreviewClick(file) : undefined,
        picWidth,
        picHeight,
        showTooltip,
      };
      if (status === strings.FILE_STATUS_UPLOAD_FAIL && !validateMessage) {
        fileCardProps.validateMessage = locale.value?.fail;
      }
      if (_sizeInvalid && !validateMessage) {
        fileCardProps.validateMessage = locale.value?.illegalSize;
      }
      if (slots.fileItem) return slots.fileItem(fileCardProps);
      if (typeof renderFileItem === 'undefined') {
        return h(FileCard, fileCardProps);
      }
      return renderFileItem(fileCardProps);
    };

    const renderFileListPic = () => {
      const { showUploadList, limit, disabled, draggable, hotSpotLocation, picHeight, picWidth } = props;
      const { dragAreaStatus } = state;
      const fileList = getFileList();
      const showAddTriggerInList = limit ? limit > fileList.length : true;
      const dragAreaBaseCls = `${prefixCls}-drag-area`;
      const uploadAddCls = cls(`${prefixCls}-add`, { [`${prefixCls}-picture-add`]: true, [`${prefixCls}-picture-add-disabled`]: disabled });
      const fileListCls = cls(`${prefixCls}-file-list`, { [`${prefixCls}-picture-file-list`]: true });
      const dragAreaCls = cls({
        [`${dragAreaBaseCls}-legal`]: dragAreaStatus === strings.DRAG_AREA_LEGAL,
        [`${dragAreaBaseCls}-illegal`]: dragAreaStatus === strings.DRAG_AREA_ILLEGAL,
      });
      const mainCls = `${prefixCls}-file-list-main`;
      const addContentProps: Record<string, any> = {
        role: 'button',
        class: uploadAddCls,
        onClick,
        style: { height: toPx(picHeight), width: toPx(picWidth) },
      };
      if (draggable) {
        Object.assign(addContentProps, { onDrop, onDragover: onDragOver, onDragleave: onDragLeave, onDragenter: onDragEnter, class: cls(uploadAddCls, dragAreaCls) });
      }
      const addContent = h('div', { ...addContentProps, 'x-semi-prop': 'children' }, slots.default?.());
      if (!showUploadList || !fileList.length) {
        if (showAddTriggerInList) return addContent;
        return null;
      }
      return h('div', { class: fileListCls }, [
        h('div', { class: mainCls, role: 'list', 'aria-label': 'picture list' }, [
          showAddTriggerInList && hotSpotLocation === 'start' ? addContent : null,
          ...fileList.map((file, index) => renderFile(file, index)),
          showAddTriggerInList && hotSpotLocation === 'end' ? addContent : null,
        ]),
      ]);
    };

    const renderFileListDefault = () => {
      const { showUploadList, limit, disabled, fileListTitle } = props;
      const fileList = getFileList();
      const fileListCls = cls(`${prefixCls}-file-list`);
      const titleCls = `${prefixCls}-file-list-title`;
      const mainCls = `${prefixCls}-file-list-main`;
      const showTitle = limit !== 1 && fileList.length;
      const showClear = props.showClear && !disabled;
      if (!showUploadList || !fileList.length) return null;
      let titleContent: VNodeChild;
      const titleSlotOrProp = slots.fileListTitle ? slots.fileListTitle : fileListTitle;
      if (typeof titleSlotOrProp === 'function' && !(titleSlotOrProp as any).setup && !(titleSlotOrProp as any).render) {
        titleContent = titleSlotOrProp({ fileList, onClear: clear, clearText: locale.value?.clear });
      } else {
        titleContent = [
          h('span', { class: `${titleCls}-choosen` }, [normalizeNode(titleSlotOrProp) || locale.value?.selectedFiles]),
          showClear ? h('span', { role: 'button', tabindex: 0, onClick: clear, class: `${titleCls}-clear` }, locale.value?.clear) : null,
        ];
      }
      return h('div', { class: fileListCls }, [
        showTitle ? h('div', { class: titleCls }, [titleContent]) : null,
        h('div', { class: mainCls, role: 'list', 'aria-label': 'file list' }, fileList.map((file, index) => renderFile(file, index))),
      ]);
    };

    const renderFileList = () => {
      const { listType } = props;
      if (listType === strings.FILE_LIST_PIC) return renderFileListPic();
      if (listType === strings.FILE_LIST_DEFAULT) return renderFileListDefault();
      return null;
    };

    const renderDragArea = () => {
      const { dragAreaStatus } = state;
      const { disabled } = props;
      const children = flattenChildren(slots.default?.());
      const dragIcon = slots.dragIcon ? slots.dragIcon() : normalizeNode(props.dragIcon);
      const dragMainText = slots.dragMainText ? slots.dragMainText() : normalizeNode(props.dragMainText);
      const dragSubText = slots.dragSubText ? slots.dragSubText() : normalizeNode(props.dragSubText);
      const dragAreaBaseCls = `${prefixCls}-drag-area`;
      const dragAreaCls = cls(dragAreaBaseCls, {
        [`${dragAreaBaseCls}-legal`]: dragAreaStatus === strings.DRAG_AREA_LEGAL,
        [`${dragAreaBaseCls}-illegal`]: dragAreaStatus === strings.DRAG_AREA_ILLEGAL,
        [`${dragAreaBaseCls}-custom`]: children.length > 0,
      });
      return h(
        'div',
        {
          role: 'button',
          tabindex: 0,
          'aria-disabled': disabled,
          class: dragAreaCls,
          onDrop,
          onDragover: onDragOver,
          onDragleave: onDragLeave,
          onDragenter: onDragEnter,
          onClick,
        },
        children.length
          ? children
          : [
              h('div', { class: `${dragAreaBaseCls}-icon`, 'x-semi-prop': 'dragIcon' }, [dragIcon || h(IconUpload, { size: 'extra-large' })]),
              h('div', { class: `${dragAreaBaseCls}-text` }, [
                h('div', { class: `${dragAreaBaseCls}-main-text`, 'x-semi-prop': 'dragMainText' }, [dragMainText || locale.value?.mainText]),
                h('div', { class: `${dragAreaBaseCls}-sub-text`, 'x-semi-prop': 'dragSubText' }, [dragSubText]),
                h('div', { class: `${dragAreaBaseCls}-tips` }, [
                  dragAreaStatus === strings.DRAG_AREA_LEGAL ? h('span', { class: `${dragAreaBaseCls}-tips-legal` }, locale.value?.legalTips) : null,
                  dragAreaStatus === strings.DRAG_AREA_ILLEGAL ? h('span', { class: `${dragAreaBaseCls}-tips-illegal` }, locale.value?.illegalTips) : null,
                ]),
              ]),
            ]
      );
    };

    const renderAddContent = () => {
      const { draggable, listType, disabled } = props;
      if (listType === strings.FILE_LIST_PIC) return null;
      if (draggable) return renderDragArea();
      return h('div', { role: 'button', tabindex: 0, 'aria-disabled': disabled, class: cls(`${prefixCls}-add`), onClick }, slots.default?.());
    };

    return () => {
      const { style, className, multiple, accept, disabled, capture, listType, promptPosition, validateStatus, directory } = props;
      const prompt = slots.prompt ? slots.prompt() : normalizeNode(props.prompt);
      const validateMessage = slots.validateMessage ? slots.validateMessage() : normalizeNode(props.validateMessage);
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const uploadCls = cls(
        prefixCls,
        {
          [`${prefixCls}-picture`]: listType === strings.FILE_LIST_PIC,
          [`${prefixCls}-disabled`]: disabled,
          [`${prefixCls}-default`]: validateStatus === 'default',
          [`${prefixCls}-error`]: validateStatus === 'error',
          [`${prefixCls}-warning`]: validateStatus === 'warning',
          [`${prefixCls}-success`]: validateStatus === 'success',
        },
        className,
        attrClass
      );
      const dirProps = directory ? { directory: 'directory', webkitdirectory: 'webkitdirectory' } : {};
      return h('div', { class: uploadCls, style: [style, attrStyle], 'x-prompt-pos': promptPosition, ...getDataAttr(rest) }, [
        h('input', {
          key: state.inputKey,
          capture,
          multiple,
          accept,
          onChange,
          type: 'file',
          autocomplete: 'off',
          tabindex: -1,
          class: cls(`${prefixCls}-hidden-input`),
          ref: inputRef,
          ...dirProps,
        }),
        h('input', {
          key: state.replaceInputKey,
          multiple: false,
          accept,
          onChange: onReplaceChange,
          type: 'file',
          autocomplete: 'off',
          tabindex: -1,
          class: cls(`${prefixCls}-hidden-input-replace`),
          ref: replaceInputRef,
        }),
        renderAddContent(),
        prompt ? h('div', { class: cls(`${prefixCls}-prompt`), 'x-semi-prop': 'prompt' }, [prompt]) : null,
        validateMessage ? h('div', { class: cls(`${prefixCls}-validate-message`), 'x-semi-prop': 'validateMessage' }, [validateMessage]) : null,
        renderFileList(),
        renderCropperModal(),
      ]);
    };
  },
});
(Upload as any).__SemiComponentName__ = 'Upload';
(Upload as any).FileCard = FileCard;
(Upload as any).elementType = 'Upload';

export default Upload;
