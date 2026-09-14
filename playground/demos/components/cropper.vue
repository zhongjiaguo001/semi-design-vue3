<script setup lang="ts">
import { ref } from 'vue';
import { Cropper, Button, Radio, RadioGroup, Slider } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Cropper } from 'semi-design-vue';`;

const src = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/image.png';
const abstractSrc = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/abstract.jpg';
const containerStyle = { width: '550px', height: '300px', margin: '20px' };
const actionStyle = {
  marginTop: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
};

const shape = ref<'rect' | 'round' | 'roundRect'>('rect');
const basicRef = ref<any>(null);
const basicUrl = ref('');
const cropBasic = () => {
  const canvas = basicRef.value?.getCropperCanvas?.();
  if (canvas) basicUrl.value = canvas.toDataURL();
};

const ratioRef = ref<any>(null);
const ratioUrl = ref('');
const cropRatio = () => {
  const canvas = ratioRef.value?.getCropperCanvas?.();
  if (canvas) ratioUrl.value = canvas.toDataURL();
};

const rotate = ref(0);
const zoom = ref(1);
const rzRef = ref<any>(null);
const rzUrl = ref('');
const cropRz = () => {
  const canvas = rzRef.value?.getCropperCanvas?.();
  if (canvas) rzUrl.value = canvas.toDataURL();
};

const boxRef = ref<any>(null);
const boxUrl = ref('');
const cropBox = () => {
  const canvas = boxRef.value?.getCropperCanvas?.();
  if (canvas) boxUrl.value = canvas.toDataURL();
};

const previewRotate = ref(0);
const previewZoom = ref(1);
const previewRef = ref<any>(null);
const previewUrl = ref('');
const previewEl = () => document.getElementById('previewWrapper') as HTMLElement;
const cropPreview = () => {
  const canvas = previewRef.value?.getCropperCanvas?.();
  if (canvas) previewUrl.value = canvas.toDataURL();
};
</script>

<template>
  <DemoBlock title="如何引入" desc="Cropper 从 v2.73.0 开始支持。" :code="importCode" />

  <DemoBlock title="基本用法" desc="src 设置被裁切图片；shape 设置裁切框形状，默认为方形。getCropperCanvas() 获取裁切结果。">
    <RadioGroup :value="shape" @change="(e: any) => (shape = e.target.value)">
      <Radio value="rect">rect</Radio>
      <Radio value="round">round</Radio>
      <Radio value="roundRect">roundRect</Radio>
    </RadioGroup>
    <Cropper ref="basicRef" :src="src" :style="containerStyle" :shape="shape" />
    <Button @click="cropBasic">裁切</Button>
    <br /><br />
    <img v-if="basicUrl" :src="basicUrl" :style="{ height: '400px' }" />
  </DemoBlock>

  <DemoBlock
    title="自定义裁切框比例"
    desc="defaultAspectRatio 仅影响初始比例；aspectRatio 固定比例，拖动时按该比例变化。"
  >
    <Cropper ref="ratioRef" :aspectRatio="3 / 4" :src="src" :style="containerStyle" />
    <Button @click="cropRatio">裁切</Button>
    <br /><br />
    <img v-if="ratioUrl" :src="ratioUrl" :style="{ height: '400px' }" />
  </DemoBlock>

  <DemoBlock title="受控旋转/缩放图片" desc="rotate / zoom 控制旋转和缩放，zoomChange 拿到最新 zoom。">
    <div id="cropper-container">
      <Cropper
        ref="rzRef"
        :src="src"
        :style="containerStyle"
        :rotate="rotate"
        :zoom="zoom"
        @zoomChange="(v: number) => (zoom = v)"
      />
      <div :style="actionStyle">
        <span>旋转</span>
        <Slider :style="{ width: '500px' }" :value="rotate" :step="1" :min="-360" :max="360" @change="(v: number) => (rotate = v)" />
      </div>
      <div :style="actionStyle">
        <span>缩放</span>
        <Slider :style="{ width: '500px' }" :value="zoom" :step="0.1" :min="0.1" :max="3" @change="(v: number) => (zoom = v)" />
      </div>
      <br />
      <Button @click="cropRz">裁切</Button>
      <br /><br />
      <img v-if="rzUrl" :src="rzUrl" :style="{ height: '400px' }" />
    </div>
  </DemoBlock>

  <DemoBlock title="裁切框设置" desc="cropperBoxStyle / cropperBoxClassName 自定义裁切框；showResizeBox 控制边角调整块。">
    <strong>showResizeBox = false，并修改边框颜色</strong>
    <Cropper
      ref="boxRef"
      :src="src"
      :style="containerStyle"
      :cropperBoxStyle="{ outlineColor: 'var(--semi-color-bg-0)' }"
      :showResizeBox="false"
    />
    <Button @click="cropBox">裁切</Button>
    <br /><br />
    <img v-if="boxUrl" :src="boxUrl" :style="{ height: '400px' }" />
  </DemoBlock>

  <DemoBlock title="实时预览裁切效果" desc="preview 指定预览容器，实时预览裁切效果。">
    <Cropper
      ref="previewRef"
      :src="abstractSrc"
      :style="containerStyle"
      :rotate="previewRotate"
      :zoom="previewZoom"
      :preview="previewEl"
      @zoomChange="(v: number) => (previewZoom = v)"
    />
    <div :style="actionStyle">
      <span>旋转</span>
      <Slider :style="{ width: '500px' }" :value="previewRotate" :step="1" :min="-360" :max="360" @change="(v: number) => (previewRotate = v)" />
    </div>
    <div :style="actionStyle">
      <span>缩放</span>
      <Slider :style="{ width: '500px' }" :value="previewZoom" :step="0.1" :min="0.1" :max="3" @change="(v: number) => (previewZoom = v)" />
    </div>
    <br />
    <div :style="{ display: 'flex' }">
      <div :style="{ width: '50%', flexGrow: 1 }">
        <strong>实时预览</strong>
        <div id="previewWrapper" :style="{ height: '300px', marginTop: '8px' }" />
      </div>
      <div :style="{ width: '50%', flexGrow: 1, paddingLeft: '10px' }">
        <Button @click="cropPreview">裁切</Button>
        <br /><br />
        <img v-if="previewUrl" :src="previewUrl" :style="{ width: '90%' }" />
      </div>
    </div>
  </DemoBlock>
</template>
