<script setup lang="ts">
import { h, ref } from 'vue';
import {
  Image,
  ImagePreview,
  Button,
  Divider,
  Tooltip,
  IconUploadError,
  IconChevronLeft,
  IconChevronRight,
  IconMinus,
  IconPlus,
  IconRotate,
  IconDownload,
  IconRealSizeStroked,
  IconWindowAdaptionStroked,
  IconInfoCircle,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Image, ImagePreview } from 'semi-design-vue';`;

const abstract = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/abstract.jpg';
const abstractSmall = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/abstract-small.jpeg';
const abstractBig = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/abstract-big.png';
const sky = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/sky.jpg';
const greenleaf = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/greenleaf.jpg';
const colorful = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/colorful.jpg';

const srcList = [abstract, sky, greenleaf, colorful];
const srcList3 = [abstract, sky, greenleaf];
const srcList2 = [abstract, sky];

const timestamp = ref('');
const visible1 = ref(false);
const visible2 = ref(false);

const previewContainer = () => document.getElementById('image-preview-container');

const renderPreviewMenu = (props: any) => {
  const {
    ratio,
    disabledPrev,
    disabledNext,
    disableZoomIn,
    disableZoomOut,
    disableDownload,
    onDownload,
    onNext,
    onPrev,
    onRotateLeft,
    onRatioClick,
    onZoomIn,
    onZoomOut,
  } = props;
  return h('div', {
    style: {
      background: 'grey',
      height: '40px',
      width: '280px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderRadius: '3px',
    },
  }, [
    h(Button, { icon: IconChevronLeft, type: 'tertiary', disabled: disabledPrev, onClick: !disabledPrev ? onPrev : undefined }),
    h(Button, { icon: IconChevronRight, type: 'tertiary', disabled: disabledNext, onClick: !disabledNext ? onNext : undefined }),
    h(Button, { icon: IconMinus, type: 'tertiary', disabled: disableZoomOut, onClick: !disableZoomOut ? onZoomOut : undefined }),
    h(Button, { icon: IconPlus, type: 'tertiary', disabled: disableZoomIn, onClick: !disableZoomIn ? onZoomIn : undefined }),
    h(Button, { icon: ratio === 'adaptation' ? IconRealSizeStroked : IconWindowAdaptionStroked, type: 'tertiary', onClick: onRatioClick }),
    h(Button, { icon: IconRotate, type: 'tertiary', onClick: onRotateLeft }),
    h(Button, { icon: IconDownload, type: 'tertiary', disabled: disableDownload, onClick: !disableDownload ? onDownload : undefined }),
  ]);
};

const renderPreviewMenuItems = (props: any) => {
  const { menuItems } = props;
  const customNode = h(Tooltip, { content: '我是一个自定义操作' }, () => h(IconInfoCircle, { size: 'large' }));
  return h('div', {
    style: { display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.75)', alignItems: 'center', padding: '5px 16px', borderRadius: '4px' },
  }, [
    ...(menuItems.slice(0, 3) || []),
    h(Divider, { layout: 'vertical' }),
    ...(menuItems.slice(3, 7) || []),
    h(Divider, { layout: 'vertical' }),
    ...(menuItems.slice(7) || []),
    h(Divider, { layout: 'vertical' }),
    customNode,
  ]);
};

const renderHeader = (title: any) =>
  h('div', { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
    h('span', { style: { background: 'black', padding: '0 10px' } }, ['自定义标题：', title]),
  ]);
</script>

<template>
  <DemoBlock title="如何引入" desc="Image, ImagePreview 从 v2.20.0 版本开始支持。" :code="importCode" />

  <DemoBlock title="基本用法" desc="src 指定图片路径即可预览，width / height 指定宽高。">
    <Image :width="360" :height="200" :src="abstract" />
  </DemoBlock>

  <DemoBlock title="加载失败的占位图" desc="fallback 自定义加载失败占位，支持 string 和节点。">
    <div :style="{ display: 'flex', alignItems: 'center', flexDirection: 'column' }">
      <span>加载失败默认样式</span>
      <Image :width="200" :height="200" src="https://load-error.jpeg" />
      <br />
      <span>自定义加载失败占位图</span>
      <Image :width="200" :height="200" src="https://load-error.jpeg" :fallback="h(IconUploadError, { style: { fontSize: '50px' } })" />
    </div>
  </DemoBlock>

  <DemoBlock title="渐进加载" desc="大图可通过 placeholder 实现渐进加载。">
    <Image
      :width="300"
      :height="200"
      :src="`${abstractBig}?${timestamp}`"
      :placeholder="h(Image, { src: abstractSmall, width: 300, height: 200, preview: false })"
    />
    <br />
    <Button theme="solid" :style="{ marginTop: '10px' }" @click="timestamp = String(Date.now())">Reload</Button>
  </DemoBlock>

  <DemoBlock title="自定义预览图片" desc="Image 的 src 与 preview.src 可以不同。">
    <Image :width="300" :height="200" :src="abstractSmall" :preview="{ src: abstractBig }" />
  </DemoBlock>

  <DemoBlock title="多图预览" desc="使用 ImagePreview 包裹 Image 即可多图预览。">
    <ImagePreview>
      <Image v-for="(s, index) in srcList" :key="index" :src="s" :width="200" :alt="`lamp${index + 1}`" :style="{ marginRight: '5px' }" />
    </ImagePreview>
  </DemoBlock>

  <DemoBlock title="单独使用预览组件" desc="visible + visibleChange 控制是否预览，src 传入单图或图片数组。">
    <Button @click="visible1 = true">Preview single Image</Button>
    <ImagePreview :src="sky" :visible="visible1" @visibleChange="(v: boolean) => (visible1 = v)" />
    <br />
    <Button :style="{ marginTop: '20px' }" @click="visible2 = true">Preview multiple Images</Button>
    <ImagePreview :src="srcList" :visible="visible2" @visibleChange="(v: boolean) => (visible2 = v)" />
  </DemoBlock>

  <DemoBlock title="渲染在指定容器" desc="getPopupContainer 指定父级 DOM（需 position: relative）。">
    <div id="image-preview-container" :style="{ height: '400px', position: 'relative' }">
      <ImagePreview :getPopupContainer="previewContainer" :style="{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <Image v-for="(s, index) in srcList3" :key="index" :src="s" :width="200" :alt="`lamp${index + 1}`" :style="{ marginRight: '5px' }" />
      </ImagePreview>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义预览底部操作区" desc="renderPreviewMenu 自定义底部；v2.40.0 起可用 menuItems 基于默认操作区扩展。">
    <ImagePreview :renderPreviewMenu="renderPreviewMenu">
      <Image v-for="(s, index) in srcList3" :key="index" :src="s" :width="200" :alt="`lamp${index + 1}`" :style="{ marginRight: '5px' }" />
    </ImagePreview>
    <br />
    <ImagePreview :renderPreviewMenu="renderPreviewMenuItems">
      <Image v-for="(s, index) in srcList3" :key="index" :src="s" :width="200" :alt="`lamp${index + 1}`" />
    </ImagePreview>
  </DemoBlock>

  <DemoBlock title="自定义预览顶部展示区" desc="renderHeader 自定义顶部。">
    <ImagePreview :renderHeader="renderHeader">
      <Image
        v-for="(s, index) in srcList2"
        :key="index"
        :src="s"
        :width="200"
        :alt="`lamp${index + 1}`"
        :preview="{ previewTitle: `lamp${index + 1}` }"
        :style="{ marginRight: '5px' }"
      />
    </ImagePreview>
  </DemoBlock>
</template>
