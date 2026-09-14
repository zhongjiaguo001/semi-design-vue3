<script setup lang="ts">
import { h, ref, provide, inject, defineComponent } from 'vue';
import type { InjectionKey } from 'vue';
import throttle from 'lodash/throttle';
import { Toast, ToastFactory, Button, Text } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Toast } from 'semi-design-vue';`;

const stackOpts = {
  content: 'Hi, Bytedance dance dance',
  duration: 3,
  stack: true,
};

const handleClose = () => {
  throttled.cancel();
};
const throttleOpts = {
  content: 'Hi, Bytedance dance dance',
  duration: 10,
  onClose: handleClose,
  stack: true,
};
const throttled = throttle(() => Toast.info(throttleOpts), 10000, { trailing: false });

const typeOpts = {
  content: 'Hi, Bytedance dance dance',
  duration: 3,
};

const lightOpts = {
  content: 'Hi, Bytedance dance dance',
  duration: 3,
  theme: 'light' as const,
};

const linkOpts = {
  content: () =>
    h('span', [
      h(Text, null, () => 'Hi, Bytedance dance dance'),
      h(Text, { link: true, style: { marginLeft: '12px' } }, () => '更多'),
    ]),
  duration: 3,
};

const multiLineOpts = {
  content: () =>
    h('div', [
      h('div', 'Hi, Bytedance dance dance'),
      h('div', { style: { marginTop: '8px' } }, [
        h(Text, { link: true }, () => '查看详情'),
        h(Text, { link: true, style: { marginLeft: '20px' } }, () => '一会再看'),
      ]),
    ]),
  duration: 3,
};

const toastId = ref<string | null>(null);
const destroyManual = () => {
  toastId.value = null;
};
const showManual = () => {
  if (toastId.value) return;
  toastId.value = Toast.info({
    content: 'Not auto close',
    duration: 0,
    onClose: destroyManual,
  });
};
const hideManual = () => {
  if (toastId.value) Toast.close(toastId.value);
  destroyManual();
};

const showUpdate = () => {
  const id = 'toastid';
  Toast.info({ content: 'Update Content By Id', id });
  setTimeout(() => {
    Toast.success({ content: 'Id By Content Update', id });
  }, 1000);
};

const ReachableKey: InjectionKey<string> = Symbol('ReachableContext');
provide(ReachableKey, 'Light');
const HookToastInner = defineComponent({
  name: 'HookToastInner',
  setup() {
    const name = inject(ReachableKey, '');
    const { toast, ToastHolder } = Toast.useToast();
    const show = () => {
      toast.success({
        duration: 0,
        content: `ReachableContext: ${name}`,
      });
    };
    return () =>
      h('div', [h(Button, { onClick: show }, () => 'Hook Toast'), h(ToastHolder)]);
  },
});

const ToastInCustomContainer = ToastFactory.create({
  getPopupContainer: () => document.getElementById('custom-toast-container'),
});
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="普通提示"
    desc="通过调用 Toast 的 method 弹出提示。推荐设置 stack，Hover 展开，可防止一次性弹出多个并列 Toast（v2.42.0）。"
  >
    <Button @click="Toast.info(stackOpts)">Display Toast</Button>
    <br />
    <br />
    <Button @click="throttled">Throttled Toast</Button>
  </DemoBlock>

  <DemoBlock title="其他提示类型" desc="包括成功、失败、警告。">
    <Button :style="{ color: 'var(--semi-color-success)' }" @click="Toast.success('Hi,Bytedance dance dance')">
      Success
    </Button>
    <br />
    <br />
    <Button type="warning" @click="Toast.warning(typeOpts)">Warning</Button>
    <br />
    <br />
    <Button type="danger" @click="Toast.error(typeOpts)">Error</Button>
  </DemoBlock>

  <DemoBlock title="多色样式" desc="theme 设置浅色填充样式，默认为 normal 的白色模式。">
    <Button @click="Toast.info(lightOpts)">Info</Button>
    <br />
    <br />
    <Button :style="{ color: 'var(--semi-color-success)' }" @click="Toast.success(lightOpts)">Success</Button>
    <br />
    <br />
    <Button type="warning" @click="Toast.warning(lightOpts)">Warning</Button>
    <br />
    <br />
    <Button type="danger" @click="Toast.error(lightOpts)">Error</Button>
  </DemoBlock>

  <DemoBlock title="链接文本" desc="配合 Typography 可以自定义链接文本。">
    <Button @click="Toast.info(linkOpts)">Display Toast</Button>
    <br />
    <br />
    <Button @click="Toast.info(multiLineOpts)">Display Multi-line Toast</Button>
  </DemoBlock>

  <DemoBlock title="修改延时" desc="自定义时长 10s，默认时长为 3s。">
    <Button @click="Toast.info({ content: 'Hi, Bytedance dance dance', duration: 10 })">Close After 10s</Button>
  </DemoBlock>

  <DemoBlock title="手动关闭" desc="当 duration 设置为 0 时，toast 不会自动关闭，必须手动关闭。">
    <Button type="primary" @click="showManual">Show Toast</Button>
    <br />
    <br />
    <Button type="primary" @click="hideManual">Hide Toast</Button>
  </DemoBlock>

  <DemoBlock title="更新消息内容" desc="可以通过唯一的 id 来更新内容。">
    <Button type="primary" @click="showUpdate">Update Content By Id</Button>
  </DemoBlock>

  <DemoBlock title="销毁所有" desc="Toast.destroyAll() 销毁当前全部 Toast。">
    <Button @click="Toast.info({ content: 'Toast A', duration: 0, stack: true })">Show A</Button>
    <Button :style="{ marginLeft: '8px' }" @click="Toast.success({ content: 'Toast B', duration: 0, stack: true })">
      Show B
    </Button>
    <Button :style="{ marginLeft: '8px' }" type="danger" @click="Toast.destroyAll()">destroyAll</Button>
  </DemoBlock>

  <DemoBlock
    title="消费 Context"
    desc="Vue 对应 Toast.useToast()，返回 { toast, ToastHolder }。把 ToastHolder 渲染在需要读取上下文的节点处。"
  >
    <component :is="HookToastInner" />
  </DemoBlock>

  <DemoBlock title="创建不同配置 Toast" desc="ToastFactory.create(config) 创建独立配置的 Toast（>= 1.23）。">
    <Button @click="Toast.info('Toast')">Default Toast</Button>
    <br />
    <br />
    <Button @click="ToastInCustomContainer.info('Toast in some container')">Toast in custom container</Button>
    <div id="custom-toast-container" class="custom-toast-container">custom container</div>
  </DemoBlock>
</template>

<style scoped>
.custom-toast-container {
  position: relative;
  min-height: 48px;
  margin-top: 12px;
  padding: 8px;
  border: 1px dashed var(--semi-color-border);
  color: var(--semi-color-text-2);
}
.custom-toast-container :deep(.semi-toast-wrapper) {
  position: relative;
}
</style>
