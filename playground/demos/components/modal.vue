<script setup lang="ts">
import { h, ref, defineComponent } from 'vue';
import {
  Modal,
  Button,
  List,
  ListItem,
  DragMove,
  ConfigProvider,
  IconVigoLogo,
  IconSemiLogo,
  IconSend,
} from '@/index';
import en_GB from '@/locale/source/en_GB';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Modal } from 'semi-design-vue';`;

const basic = ref(false);
const fill = ref(false);
const mask = ref(false);
const texts = ref(false);
const btnProps = ref(false);
const footer = ref(false);
const styled = ref(false);
const custom = ref(false);
const full = ref(false);
const drag = ref(false);

const afterClose = () => console.log('After Close callback executed');

const customFooter = () =>
  h('div', { style: { textAlign: 'center' } }, [
    h(Button, { type: 'primary', theme: 'solid', style: { width: '240px', margin: '4px 50px' }, onClick: () => (custom.value = false) }, () => 'Continue'),
    h(Button, { type: 'primary', theme: 'borderless', style: { width: '240px', margin: '4px 50px' }, onClick: () => (custom.value = false) }, () => 'Learn more features'),
  ]);

const customData = [
  {
    icon: () => h(IconSemiLogo, { style: { fontSize: '48px' } }),
    title: 'Boost new feature adoption with Integration',
    content: 'Sample data is prepared for you to demostrate how Integration may be useful for your team',
  },
  {
    icon: () => h(IconVigoLogo, { style: { fontSize: '48px' } }),
    title: 'Introducing Dark Mode',
    content: 'Sample data is prepared for you to demostrate how Integration may be useful for your team',
  },
  {
    icon: () => h(IconSemiLogo, { style: { fontSize: '48px' } }),
    title: 'New List Component',
    content: 'Sample data is prepared for you to demostrate how Integration may be useful for your team',
  },
];

const renderCustomItem = (item: (typeof customData)[number]) =>
  h(ListItem, {
    header: item.icon,
    main: () =>
      h('div', [
        h('h6', { style: { margin: 0, fontSize: '16px' } }, item.title),
        h('p', { style: { marginTop: '4px', color: 'var(--semi-color-text-1)' } }, item.content),
      ]),
  });

const HookModalInner = defineComponent({
  name: 'HookModalInner',
  setup() {
    const { modal, ModalHolder } = Modal.useModal();
    const config = { title: 'This is a success message', content: 'Context consumer' };
    return () =>
      h('div', [
        h(Button, { onClick: () => modal.confirm(config) }, () => 'Confirm Modal'),
        h(ModalHolder),
      ]);
  },
});
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本">
    <Button @click="basic = true">打开弹窗</Button>
    <Modal
      title="基本对话框"
      :visible="basic"
      :onOk="() => { basic = false; console.log('Ok button clicked'); }"
      :onCancel="() => { basic = false; console.log('Cancel button clicked'); }"
      :afterClose="afterClose"
      :closeOnEsc="true"
    >
      This is the content of a basic modal.
      <br />
      More content...
    </Modal>
  </DemoBlock>

  <DemoBlock title="底部撑满" desc="footerFill 为 true 时底部按钮撑满排列。">
    <Button @click="fill = true">打开弹窗</Button>
    <Modal
      title="基本对话框"
      :visible="fill"
      footerFill
      :onOk="() => (fill = false)"
      :onCancel="() => (fill = false)"
    >
      This is the content of a basic modal.
      <br />
      More content...
    </Modal>
  </DemoBlock>

  <DemoBlock title="点击遮罩层不可关闭" desc="maskClosable 为 false 则不可通过点击遮罩层关闭。">
    <Button @click="mask = true">点击遮罩层不可关闭</Button>
    <Modal title="对话框标题" :visible="mask" :maskClosable="false" :onOk="() => (mask = false)" :onCancel="() => (mask = false)">
      <p>This is a modal that cannot be closed by clicking on the mask.</p>
      <p>More content...</p>
    </Modal>
  </DemoBlock>

  <DemoBlock title="自定义按钮文字" desc="okText / cancelText 自定义按钮文案。命令式调用也需用这两个属性设置 i18n 文本。">
    <Button @click="texts = true">自定义按钮文字</Button>
    <Modal
      title="自定义按钮文字"
      :visible="texts"
      okText="Sounds great!"
      cancelText="No, thanks."
      :onOk="() => (texts = false)"
      :onCancel="() => (texts = false)"
    >
      <p>This is a modal with customized button texts.</p>
      <p>More content...</p>
    </Modal>
  </DemoBlock>

  <DemoBlock title="自定义按钮属性" desc="okButtonProps / cancelButtonProps 自定义按钮属性。">
    <Button @click="btnProps = true">自定义按钮属性</Button>
    <Modal
      title="自定义按钮属性"
      :visible="btnProps"
      :okButtonProps="{ size: 'small', type: 'warning' }"
      :cancelButtonProps="{ size: 'small', disabled: true }"
      :onOk="() => (btnProps = false)"
      :onCancel="() => (btnProps = false)"
    >
      <p>This is a modal with customized button props.</p>
      <p>More content...</p>
    </Modal>
  </DemoBlock>

  <DemoBlock title="自定义对话框头部和页脚" desc="header / footer 自定义；设为 null 则不展示。">
    <Button @click="footer = true">自定义页脚样式</Button>
    <Modal title="自定义页脚" :visible="footer" :onOk="() => (footer = false)" :onCancel="() => (footer = false)">
      <template #footer>
        <Button type="primary" @click="footer = false">Yes, I Understand</Button>
      </template>
      <p>This is a modal with a customized footer.</p>
      <p>More content...</p>
    </Modal>
  </DemoBlock>

  <DemoBlock title="自定义对话框的样式" desc="style.top 或 centered 控制位置；maskStyle / bodyStyle 自定义遮罩和内容。">
    <Button @click="styled = true">自定义对话框样式</Button>
    <Modal
      title="自定义样式"
      :visible="styled"
      centered
      :bodyStyle="{ overflow: 'auto', height: '200px' }"
      :onOk="() => (styled = false)"
      :onCancel="() => (styled = false)"
    >
      <p :style="{ lineHeight: 1.8 }">
        Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
      </p>
      <p :style="{ lineHeight: 1.8 }">区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有以下优势：</p>
      <ul>
        <li><p>Semi Design 以内容优先进行设计。</p></li>
        <li><p>更容易地自定义主题。</p></li>
        <li><p>适用国际化场景。</p></li>
        <li><p>效率场景加入人性化关怀</p></li>
      </ul>
    </Modal>
  </DemoBlock>

  <DemoBlock title="自定义的对话框" desc="灵活使用 header、footer 实现完全自定义对话框。">
    <Button @click="custom = true">自定义对话框</Button>
    <Modal :header="null" :visible="custom" :footer="customFooter" :onOk="() => (custom = false)" :onCancel="() => (custom = false)">
      <h3 :style="{ textAlign: 'center', fontSize: '24px', margin: '40px' }">Semi Design New Features</h3>
      <List :dataSource="customData" :split="false" :renderItem="renderCustomItem" />
    </Modal>
  </DemoBlock>

  <DemoBlock title="全屏 Modal" desc="fullScreen 开启全屏对话框。">
    <Button @click="full = true">打开全屏弹窗</Button>
    <Modal title="全屏对话框标题" fullScreen :visible="full" :onOk="() => (full = false)" :onCancel="() => (full = false)">
      <p>This is a full screen modal</p>
      <p>More content...</p>
    </Modal>
  </DemoBlock>

  <DemoBlock title="命令式调用" desc="Modal.confirm / info / success / error / warning。可自定义 icon，其他 Modal props 均可传入。">
    <Button @click="Modal.info({ title: 'Here is some info', content: 'bla bla bla...' })">Info</Button>
    <br /><br />
    <Button @click="Modal.success({ title: 'This is a success message', content: 'bla bla bla...' })">Success</Button>
    <br /><br />
    <Button type="danger" @click="Modal.error({ title: 'Unfortunately, there is an error', content: 'bla bla bla...' })">Error</Button>
    <br /><br />
    <Button type="warning" @click="Modal.warning({ title: 'Warning: be cautious ahead', content: 'bla bla bla...' })">Warning</Button>
    <br /><br />
    <Button type="primary" @click="Modal.confirm({ title: 'Are you sure ?', content: 'bla bla bla...' })">Confirm</Button>
    <br /><br />
    <Button
      @click="
        Modal.info({
          title: 'This is a custom modal',
          content: 'bla bla bla...',
          icon: h(IconSend),
          cancelButtonProps: { theme: 'borderless' },
          okButtonProps: { theme: 'solid' },
        })
      "
    >
      Custom
    </Button>
  </DemoBlock>

  <DemoBlock title="Hooks 用法" desc="Vue 对应 Modal.useModal()，返回 { modal, ModalHolder }。把 ModalHolder 放在需要读取上下文的节点处。">
    <ConfigProvider :locale="en_GB as any">
      <component :is="HookModalInner" />
    </ConfigProvider>
  </DemoBlock>

  <DemoBlock title="可拖拽 Modal" desc="modalRender 自定义渲染；可拖拽通过 DragMove 实现。">
    <Button @click="drag = true">Open Modal</Button>
    <Modal
      title="可拖拽Modal"
      :visible="drag"
      centered
      :onCancel="() => (drag = false)"
      :modalRender="(modal: any) => h(DragMove, { positionStrategy: 'relative' }, () => modal)"
    >
      <p>This is the content of a basic sidesheet.</p>
      <p>Here is more content...</p>
    </Modal>
  </DemoBlock>
</template>
