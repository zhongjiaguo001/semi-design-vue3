<script setup lang="ts">
import { h, ref } from 'vue';
import { SideSheet, Button, Radio, RadioGroup, TextArea, Form, Option, Typography, Banner } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { SideSheet } from 'semi-design-vue';`;

// 基本
const basicVisible = ref(false);
const basicChange = () => {
  basicVisible.value = !basicVisible.value;
};

// 自定义位置
const placementVisible = ref(false);
const placement = ref<'top' | 'bottom' | 'left' | 'right'>('right');
const placementChange = () => {
  placementVisible.value = !placementVisible.value;
};
const changePlacement = (e: any) => {
  placement.value = e.target.value;
};

// 自定义尺寸
const sizeVisible = ref(false);
const size = ref<'small' | 'medium' | 'large'>('small');
const sizeChange = () => {
  sizeVisible.value = !sizeVisible.value;
};
const changeSize = (e: any) => {
  size.value = e.target.value;
};

// 可操作的外部区域
const outsideVisible = ref(false);
const outsideValue = ref('');

// 渲染在指定容器
const containerVisible = ref(false);
const getContainer = () => document.querySelector('.sidesheet-container') as HTMLElement;

// 自定义内容区域
const customVisible = ref(false);
const showCustom = () => {
  customVisible.value = true;
};
const handleCustomCancel = () => {
  customVisible.value = false;
};
const customTitle = () => h(Typography.Title, { heading: 4 }, () => '创建资源包');
const bannerDescription = () =>
  h('div', [
    h(Typography.Text, { strong: true }, () => '当前部署环境：线上部署'),
    h('br'),
    h(Typography.Text, null, () => '请选择正确的SCM构建产物，防止出现不符合预期的发布操作。'),
  ]);
const initDate = new Date();
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本" desc="默认侧边栏从右滑出，支持点击遮罩区关闭。">
    <Button @click="basicChange">Open SideSheet</Button>
    <SideSheet title="滑动侧边栏" :visible="basicVisible" @cancel="basicChange">
      <p>This is the content of a basic sidesheet.</p>
      <p>Here is more content...</p>
    </SideSheet>
  </DemoBlock>

  <DemoBlock title="自定义位置" desc="可以通过设置 placement 属性设置侧边栏滑出位置，支持 top, bottom, left, right。">
    <RadioGroup :value="placement" @change="changePlacement">
      <Radio value="right">right</Radio>
      <Radio value="left">left</Radio>
      <Radio value="top">top</Radio>
      <Radio value="bottom">bottom</Radio>
    </RadioGroup>
    <br />
    <br />
    <Button @click="placementChange">Open SideSheet</Button>
    <SideSheet title="滑动侧边栏" :visible="placementVisible" @cancel="placementChange" :placement="placement">
      <p>This is the content of a basic sidesheet.</p>
      <p>Here is more content...</p>
    </SideSheet>
  </DemoBlock>

  <DemoBlock title="自定义尺寸" desc="通过 size 设置尺寸：small(448px)、medium(684px)、large(920px)，仅在 placement 为 left / right 时生效；也可通过 width 自行设置宽度。">
    <RadioGroup :value="size" @change="changeSize">
      <Radio value="small">small</Radio>
      <Radio value="medium">medium</Radio>
      <Radio value="large">large</Radio>
    </RadioGroup>
    <br />
    <br />
    <Button @click="sizeChange">Open SideSheet</Button>
    <SideSheet title="滑动侧边栏" :visible="sizeVisible" @cancel="sizeChange" :size="size">
      <p>This is the content of a basic sidesheet.</p>
      <p>Here is more content...</p>
    </SideSheet>
  </DemoBlock>

  <DemoBlock title="可操作的外部区域" desc="当 mask=false 时允许对外部区域进行操作；disableScroll=false 时外部区域依然可滚动。">
    <Button @click="outsideVisible = true">Open SideSheet</Button>
    <TextArea placeholder="Please enter something" :style="{ marginTop: '12px' }" @change="(v: string) => (outsideValue = v)" />
    <SideSheet
      title="可操作外部的侧边栏"
      :visible="outsideVisible"
      @cancel="outsideVisible = false"
      :mask="false"
      :disableScroll="false"
    >
      <p>这里是输入的内容：</p>
      <p>{{ outsideValue }}</p>
    </SideSheet>
  </DemoBlock>

  <DemoBlock title="渲染在指定容器" desc="通过 getPopupContainer 指定父级 DOM，弹层将会渲染至该 DOM 中（容器需设置 overflow: hidden）。">
    <div
      :style="{
        height: '320px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '2px',
        padding: '24px',
        textAlign: 'center',
        background: 'var(--semi-color-fill-0)',
      }"
      class="sidesheet-container"
    >
      <span>Render in this</span>
      <br />
      <br />
      <Button @click="containerVisible = true">Open SideSheet</Button>
      <SideSheet
        title="渲染在指定容器内部"
        :visible="containerVisible"
        @cancel="containerVisible = false"
        :width="220"
        :getPopupContainer="getContainer"
      >
        <p>This is the content of a basic sidesheet.</p>
        <p>Here is more content...</p>
      </SideSheet>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义内容区域" desc="可以通过自定义 title、footer 等创建出丰富的内容样式。">
    <Button @click="showCustom">More Information</Button>
    <SideSheet
      :title="customTitle"
      :headerStyle="{ borderBottom: '1px solid var(--semi-color-border)' }"
      :bodyStyle="{ borderBottom: '1px solid var(--semi-color-border)' }"
      :visible="customVisible"
      :closeIcon="null"
      @cancel="handleCustomCancel"
    >
      <template #footer>
        <div :style="{ display: 'flex', justifyContent: 'flex-end' }">
          <Button :style="{ marginRight: '8px' }">重置</Button>
          <Button theme="solid">提交</Button>
        </div>
      </template>
      <Form>
        <Form.DatePicker
          field="date"
          type="dateTime"
          :initValue="initDate"
          :style="{ width: '272px' }"
          :label="{ text: '创建时间', required: true }"
        />
        <Form.RadioGroup field="type" label="目标操作系统" direction="horizontal" initValue="all">
          <Radio value="all">全平台</Radio>
          <Radio value="ios">iOS</Radio>
          <Radio value="android">Android</Radio>
          <Radio value="web">Web</Radio>
        </Form.RadioGroup>
        <Form.RadioGroup field="origin" label="资源包来源" direction="horizontal" initValue="scm">
          <Radio value="scm">从SCM上传</Radio>
          <Radio value="manual">手动上传</Radio>
        </Form.RadioGroup>
        <Banner :fullMode="false" :icon="null" type="warning" bordered :description="bannerDescription" />
        <br />
        <Form.Select
          field="users"
          :label="{ text: '创建用户', required: true }"
          :style="{ width: '100%' }"
          multiple
          :initValue="['1', '2', '3', '4']"
        >
          <Option value="1">曲晨一</Option>
          <Option value="2">夏可曼</Option>
          <Option value="3">曲晨三</Option>
          <Option value="4">蔡妍</Option>
        </Form.Select>
      </Form>
    </SideSheet>
  </DemoBlock>
</template>
