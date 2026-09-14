<script setup lang="ts">
import { ref } from 'vue';
import { Banner, Layout, Button, Text } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Banner } from 'semi-design-vue';`;

const { Header, Footer, Content } = Layout;

const visible = ref(false);
const changeVisible = () => {
  visible.value = !visible.value;
};

const commonStyle = {
  height: '64px',
  lineHeight: '64px',
  background: 'var(--semi-color-fill-0)',
};

const titleStyle = { fontWeight: 600, fontSize: '14px', lineHeight: '20px' };
const bannerTypes = ['info', 'warning', 'danger', 'success'] as const;</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法">
    <Layout class="components-layout-demo banner-basic">
      <Header :style="commonStyle">Header</Header>
      <Banner
        v-if="visible"
        description="Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码"
        @close="changeVisible"
      />
      <Content :style="{ height: '300px', lineHeight: '300px' }">Content</Content>
      <Footer :style="commonStyle">Footer</Footer>
    </Layout>
    <Button
      :style="{ display: 'block', width: '120px', margin: '0 auto' }"
      @click="changeVisible"
    >
      {{ visible ? 'Hide Banner' : 'Show Banner' }}
    </Button>
  </DemoBlock>

  <DemoBlock title="不同类型" desc="支持 4 种类型：info、warning、danger、success。默认为 info。">
    <Banner type="info" description="Semi D2C 现已支持 Figma DevMode, 安装插件，随时查阅图层对应的前端代码" />
    <br />
    <Banner type="warning" description="当前使用 Figma UI Kit 为旧版，可能无法支持完整的 Design to code 能力" />
    <br />
    <Banner type="danger" description="当前使用 API 已过期，请尽快升级" />
    <br />
    <Banner type="success" description="Semi DSM, Make Semi Design to Any Design" />
  </DemoBlock>

  <DemoBlock
    title="非全屏模式"
    desc="设置 fullMode={false} 使用非全屏模式。通过 bordered 设置边框。icon / closeIcon 为 null 时不展示。"
  >
    <div class="components-banner-demo" style="width: 640px">
      <Banner
        v-for="t in bannerTypes"
        :key="t"
        :fullMode="false"
        :type="t"
        bordered
        :icon="null"
        :closeIcon="null"
      >
        <template #title>
          <div :style="titleStyle">不知道 AppKey？</div>
        </template>
        <template #description>
          <div>
            你可先联系对应的研发同学，确认是否已在
            <Text :link="{ href: 'https://semi.design/' }">应用云平台</Text>
            申请了应用，并填写对应的信息。
          </div>
        </template>
      </Banner>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义内容" desc="可以通过默认插槽自定义其他渲染内容。">
    <div style="width: 500px; padding: 20px; border: 1px solid var(--semi-color-border)">
      <Banner
        :fullMode="false"
        title="Title"
        type="warning"
        bordered
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat"
      >
        <div class="semi-modal-footer">
          <Button type="tertiary" theme="light">No, thanks.</Button>
          <Button type="warning">Sounds great!</Button>
        </div>
      </Banner>
    </div>
  </DemoBlock>
</template>

<style scoped>
.components-layout-demo {
  text-align: center;
  margin-bottom: 12px;
}
.components-banner-demo :deep(.semi-banner) {
  margin-bottom: 12px;
}
.components-banner-demo :deep(.semi-banner-info.semi-banner-bordered) {
  border: 1px solid var(--semi-color-primary-disabled);
}
.components-banner-demo :deep(.semi-banner-warning.semi-banner-bordered) {
  border: 1px solid var(--semi-color-warning-light-active);
}
.components-banner-demo :deep(.semi-banner-danger.semi-banner-bordered) {
  border: 1px solid var(--semi-color-danger-light-active);
}
.components-banner-demo :deep(.semi-banner-success.semi-banner-bordered) {
  border: 1px solid var(--semi-color-success-light-active);
}
</style>
