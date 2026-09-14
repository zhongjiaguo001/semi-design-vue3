<script setup lang="ts">
import { h, ref } from 'vue';
import { Notification, Button, ButtonGroup, Text, IconToutiaoLogo, IconVigoLogo } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Notification } from 'semi-design-vue';`;

const baseOpts = {
  title: 'Hi, Bytedance',
  content: 'ies dance dance dance',
  duration: 3,
};

const posOpts = {
  duration: 3,
  position: 'topRight' as const,
  content: 'semi-ui-notification',
  title: 'Hi bytedance',
};

const lightOpts = {
  title: 'Hi, Bytedance',
  content: 'Hi, Bytedance dance dance',
  duration: 3,
  theme: 'light' as const,
};

const linkOpts = {
  title: 'This is a title',
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

const ids = ref<(string | number)[]>([]);
const showManual = () => {
  const id = Notification.info({ content: 'Not auto close', title: 'Hi', duration: 0 });
  ids.value = [...ids.value, id];
};
const hideManual = () => {
  const next = [...ids.value];
  const id = next.shift();
  if (id != null) Notification.close(id);
  ids.value = next;
};

const showUpdate = () => {
  const id = Notification.open({
    title: 'Hi, Bytedance',
    content: 'ies dance dance dance',
    duration: 3,
  });
  setTimeout(() => {
    Notification.open({
      title: 'Hi, Bytedance',
      content: 'updated',
      duration: 10,
      id,
    });
  }, 1000);
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="普通通知" desc="最基本的用法，3s 后自动关闭。">
    <Button
      @click="
        Notification.open({
          title: 'Hi, Bytedance',
          content: 'ies dance dance dance',
          duration: 3,
        })
      "
    >
      Display Notification
    </Button>
  </DemoBlock>

  <DemoBlock
    title="不同位置弹出"
    desc="可以从多个不同位置弹出：默认右上角 topRight。可选值：top、bottom、topLeft、topRight、bottomLeft、bottomRight。"
  >
    <ButtonGroup>
      <Button @click="Notification.info({ ...posOpts, position: 'top' })">top</Button>
      <Button @click="Notification.info({ ...posOpts, position: 'topLeft' })">topLeft</Button>
      <Button @click="Notification.info(posOpts)">topRight</Button>
    </ButtonGroup>
    <br />
    <br />
    <ButtonGroup>
      <Button @click="Notification.info({ ...posOpts, position: 'bottom' })">bottom</Button>
      <Button @click="Notification.info({ ...posOpts, position: 'bottomRight' })">bottomRight</Button>
      <Button @click="Notification.info({ ...posOpts, position: 'bottomLeft' })">bottomLeft</Button>
    </ButtonGroup>
  </DemoBlock>

  <DemoBlock title="带有图标的通知" desc="包括成功、失败、警告、提示。">
    <h5>默认的图标</h5>
    <Button type="primary" :style="{ margin: '4px' }" @click="Notification.success(baseOpts)">Success</Button>
    <Button :style="{ margin: '4px' }" @click="Notification.info(baseOpts)">Info</Button>
    <Button type="warning" :style="{ margin: '4px' }" @click="Notification.warning(baseOpts)">Warning</Button>
    <Button type="danger" :style="{ margin: '4px' }" @click="Notification.error(baseOpts)">Error</Button>
    <h5>自定义图标</h5>
    <Button
      :icon="IconToutiaoLogo"
      :style="{ marginRight: '5px' }"
      @click="Notification.info({ ...baseOpts, icon: h(IconToutiaoLogo, { style: { color: 'red' } }) })"
    />
    <Button
      :icon="IconVigoLogo"
      :style="{ marginRight: '5px' }"
      @click="Notification.info({ ...baseOpts, icon: h(IconVigoLogo) })"
    />
    <Button
      :icon="IconVigoLogo"
      @click="Notification.info({ ...baseOpts, icon: h(IconVigoLogo, { style: { color: 'pink' } }) })"
    />
  </DemoBlock>

  <DemoBlock title="多色样式" desc="theme 设置浅色填充样式，默认为 normal 的白色模式。">
    <Button @click="Notification.info(lightOpts)">Info</Button>
    <br />
    <br />
    <Button @click="Notification.success(lightOpts)">Success</Button>
    <br />
    <br />
    <Button type="warning" @click="Notification.warning(lightOpts)">Warning</Button>
    <br />
    <br />
    <Button type="danger" @click="Notification.error(lightOpts)">Error</Button>
  </DemoBlock>

  <DemoBlock title="链接文本" desc="配合 Typography 可以自定义操作区链接文本。">
    <Button @click="Notification.info(linkOpts)">Display Notification</Button>
  </DemoBlock>

  <DemoBlock title="修改延时" desc="自定义时长 10s，默认时长为 3s。">
    <Button @click="Notification.info({ content: 'Hi, Bytedance dance dance', duration: 10 })">Close After 10s</Button>
  </DemoBlock>

  <DemoBlock title="手动关闭" desc="设置 duration 为 0 时，通知将不会自动关闭，此时只能手动关闭。">
    <Button type="primary" @click="showManual">Show Notification</Button>
    <br />
    <br />
    <Button type="primary" @click="hideManual">Hide Notification</Button>
  </DemoBlock>

  <DemoBlock title="更新内容" desc="可以通过唯一的 id 来更新内容。>=2.45.0">
    <Button @click="showUpdate">Display Notification</Button>
  </DemoBlock>
</template>
