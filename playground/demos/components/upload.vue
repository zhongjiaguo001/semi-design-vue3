<script setup lang="ts">
import { h, ref } from 'vue';
import {
  Avatar,
  Button,
  Cropper,
  IconPlus,
  IconUpload,
  Modal,
  Space,
  Toast,
  Upload,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Upload } from 'semi-design-vue';`;
const action = 'https://api.semi.design/upload';
const pic = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/dy.png';

const defaultList = [
  { uid: '1', name: 'dy.png', status: 'success', size: '130KB', preview: true, url: pic },
  { uid: '2', name: 'semi-design-docs.pdf', status: 'success', size: '236KB', url: pic },
];
const longName = [{ uid: '1', name: 'this-is-a-very-very-long-filename-for-tooltip-demo.png', status: 'success', size: '12KB', url: pic }];

const controlledList = ref([...defaultList]);
const manualRef = ref<any>(null);
const cropSrc = ref('');
const cropVisible = ref(false);
const cropperRef = ref<any>(null);

const beforeUpload = ({ file }: any) => {
  if (file.fileInstance?.size > 1024 * 20) {
    Toast.error({ content: '文件过大（演示）' });
    return { autoRemove: false, shouldUpload: false };
  }
  return true;
};
const afterUpload = ({ file }: any) => ({ ...file, name: `uploaded-${file.name}` });
const customRequest = ({ fileInstance, onSuccess, onError, onProgress }: any) => {
  let p = 0;
  const t = window.setInterval(() => {
    p += 30;
    onProgress({ total: 100, loaded: Math.min(p, 100) });
    if (p >= 100) {
      window.clearInterval(t);
      onSuccess({ status: 'success' });
    }
  }, 200);
};
const previewFile = (file: any) => h('span', { style: { color: 'var(--semi-color-primary)' } }, file.name);
const renderFileOperation = () => h(Button, { size: 'small', theme: 'borderless' }, () => '自定义操作');
const fileListTitleFn = ({ total }: any) => `已选 ${total} 个文件`;

const onPickCrop = ({ fileInstance }: any) => {
  if (fileInstance?.type?.startsWith('image/')) {
    cropSrc.value = URL.createObjectURL(fileInstance);
    cropVisible.value = true;
  }
  return { shouldUpload: false, autoRemove: true };
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本" desc="children 内放置 Button，点击后选择文件并自动上传。">
    <Upload :action="action">
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="文件名超长省略" desc="showTooltip 为 boolean 或 Tooltip 配置对象。">
    <Space vertical align="start">
      <Upload :action="action" :showTooltip="false" :defaultFileList="longName">
        <Button :icon="IconUpload" theme="light">不弹出提示</Button>
      </Upload>
      <Upload :action="action" :showTooltip="{ position: 'top' }" :defaultFileList="longName">
        <Button :icon="IconUpload" theme="light">自定义 Tooltip</Button>
      </Upload>
    </Space>
  </DemoBlock>

  <DemoBlock title="添加提示文本" desc="prompt / promptPosition。">
    <Upload :action="action" prompt="支持 png、jpg" promptPosition="right">
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="点击头像触发上传">
    <Upload :action="action" accept="image/*" :showUploadList="false">
      <Avatar :src="pic" />
    </Upload>
  </DemoBlock>

  <DemoBlock title="自定义上传属性" desc="data / headers / withCredentials / name。">
    <Upload :action="action" name="file" :data="{ extra: 'semi' }" :headers="{ 'X-Demo': '1' }" withCredentials>
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="上传文件类型" desc="accept。">
    <Upload :action="action" accept="image/*">
      <Button :icon="IconUpload" theme="light">仅图片</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="上传文件夹" desc="directory。">
    <Upload :action="action" directory>
      <Button :icon="IconUpload" theme="light">选择文件夹</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="一次选中多个文件" desc="multiple。">
    <Upload :action="action" multiple>
      <Button :icon="IconUpload" theme="light">多选</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="限制文件总数量" desc="limit，超出触发 onExceed。">
    <Upload :action="action" :limit="2" @exceed="() => Toast.warning({ content: '最多 2 个文件' })">
      <Button :icon="IconUpload" theme="light">最多 2 个</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="限制上传文件大小" desc="maxSize / minSize（KB），onSizeError。">
    <Upload :action="action" :maxSize="20" :minSize="0" @sizeError="() => Toast.error({ content: '超出大小限制' })">
      <Button :icon="IconUpload" theme="light">max 20KB</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="自定义列表操作区" desc="renderFileOperation。">
    <Upload :action="action" :defaultFileList="defaultList" :renderFileOperation="renderFileOperation">
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="自定义文件列表标题" desc="fileListTitle 可以是字符串或函数。">
    <Space vertical align="start" style="width: 100%">
      <Upload :action="action" fileListTitle="待上传文件" :defaultFileList="defaultList">
        <Button :icon="IconUpload" theme="light">字符串标题</Button>
      </Upload>
      <Upload :action="action" :fileListTitle="fileListTitleFn" :defaultFileList="defaultList">
        <Button :icon="IconUpload" theme="light">函数标题</Button>
      </Upload>
    </Space>
  </DemoBlock>

  <DemoBlock title="自定义预览逻辑" desc="previewFile。">
    <Upload :action="action" :defaultFileList="defaultList" :previewFile="previewFile">
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="默认文件列表">
    <Upload :action="action" :defaultFileList="defaultList">
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="受控组件">
    <Upload :action="action" :fileList="controlledList" @change="({ fileList }: any) => (controlledList = fileList)">
      <Button :icon="IconUpload" theme="light">受控列表</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="图片墙" desc="listType='picture'。defaultFileList 读 url 展示。showPicInfo 显示信息。">
    <Space vertical align="start">
      <Upload :action="action" listType="picture" accept="image/*" multiple :defaultFileList="[{ uid: '1', name: 'dy.png', status: 'success', url: pic }]">
        <IconPlus size="extra-large" />
      </Upload>
      <Upload :action="action" listType="picture" showPicInfo accept="image/*" :defaultFileList="[{ uid: '1', name: 'dy.png', status: 'success', size: '130KB', url: pic }]">
        <IconPlus size="extra-large" />
      </Upload>
    </Space>
  </DemoBlock>

  <DemoBlock title="图片墙放大预览" desc="onPreviewClick。">
    <Upload :action="action" listType="picture" accept="image/*" :defaultFileList="[{ uid: '1', name: 'dy.png', status: 'success', url: pic }]" @previewClick="(file: any) => Toast.info({ content: file.url || file.name })">
      <IconPlus size="extra-large" />
    </Upload>
  </DemoBlock>

  <DemoBlock title="图片墙设置宽高" desc="picWidth / picHeight。">
    <Upload :action="action" listType="picture" :picWidth="80" :picHeight="80" accept="image/*" :defaultFileList="[{ uid: '1', name: 'dy.png', status: 'success', url: pic }]">
      <IconPlus size="extra-large" />
    </Upload>
  </DemoBlock>

  <DemoBlock title="禁用">
    <Upload :action="action" disabled :defaultFileList="defaultList">
      <Button :icon="IconUpload" theme="light" disabled>禁用</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="手动触发上传" desc="uploadTrigger='custom'，调用 ref.upload()。">
    <Space>
      <Upload ref="manualRef" :action="action" uploadTrigger="custom">
        <Button :icon="IconUpload" theme="light">选择文件</Button>
      </Upload>
      <Button theme="solid" @click="manualRef?.upload?.()">开始上传</Button>
    </Space>
  </DemoBlock>

  <DemoBlock title="拖拽上传" desc="draggable。">
    <Upload :action="action" draggable dragMainText="点击或拖拽文件到这里" dragSubText="支持 png、jpg" />
  </DemoBlock>

  <DemoBlock title="上传前自定义校验" desc="beforeUpload 可返回 false 或 { shouldUpload, autoRemove }。">
    <Upload :action="action" :beforeUpload="beforeUpload">
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="上传后更新文件信息" desc="afterUpload 返回值会合并进 fileItem。">
    <Upload :action="action" :afterUpload="afterUpload">
      <Button :icon="IconUpload" theme="light">点击上传</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="自定义请求" desc="customRequest 接管 xhr。">
    <Upload :customRequest="customRequest">
      <Button :icon="IconUpload" theme="light">模拟进度</Button>
    </Upload>
  </DemoBlock>

  <DemoBlock title="图片裁切" desc="官网 Upload.crop 尚未接入 Vue Upload。可用 Cropper 组合：选择图片后弹出裁切。">
    <Upload :action="action" accept="image/*" :beforeUpload="onPickCrop">
      <Button :icon="IconUpload" theme="light">选择图片裁切</Button>
    </Upload>
    <Modal v-model:visible="cropVisible" title="裁切图片" :width="520">
      <Cropper v-if="cropSrc" ref="cropperRef" :src="cropSrc" :aspectRatio="1" style="height: 320px" />
    </Modal>
    <p style="margin: 8px 0 0; color: var(--semi-color-text-2); font-size: 13px">自定义裁切：aspectRatio / shape='round' 等见 Cropper 组件。</p>
    <Cropper :src="pic" shape="round" :aspectRatio="1" style="height: 200px; width: 200px; margin-top: 8px" />
  </DemoBlock>
</template>
