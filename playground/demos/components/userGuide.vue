<script setup lang="ts">
import { ref, h } from 'vue';
import { UserGuide, Button, Space, Tag, Switch, Image, Text } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { UserGuide } from 'semi-design-vue';`;

// 官方示例在 render 时执行 document.querySelector；Vue 中目标元素在挂载后才存在，
// 因此 target 统一使用函数形式，在展示时再查询。
const q = (selector: string) => () => document.querySelector(selector) as Element;

const log = (...args: any[]) => console.log(...args);

// 基本用法
const basicVisible = ref(false);
const basicSteps = [
  { target: q('#basic-demo-1'), title: '新手引导', description: 'Hello ByteDancer!', position: 'bottom' as const },
  { target: q('#basic-demo-2'), title: 'Switch', description: 'This is a Semi Switch', position: 'bottom' as const },
  { target: q('#basic-demo-3'), title: 'Button', description: 'This is a Semi Button', position: 'bottom' as const },
];

// 主题
const themeVisible = ref(false);
const themeSteps = [
  { target: q('#theme-demo-1'), title: '新手引导', description: 'Hello ByteDancer!', position: 'bottom' as const },
  { target: q('#theme-demo-2'), title: 'Switch', description: 'This is a Semi Switch', position: 'bottom' as const },
  { target: q('#theme-demo-3'), title: 'Button', description: 'This is a Semi Button', position: 'bottom' as const },
];

// 气泡卡片弹出位置
const positionVisible = ref(false);
const positionSteps = [
  { target: q('#position-demo'), title: '新手引导', description: 'Hello ByteDancer!', position: 'top' as const },
  { target: q('#position-demo'), title: 'New Position', description: 'This is Right Position', position: 'right' as const },
  { target: q('#position-demo'), title: 'Hide Arrow', description: 'We hide the arrow', position: 'bottom' as const, showArrow: false },
];

// 设置高亮区域大小
const paddingVisible = ref(false);
const paddingSteps = [
  { target: q('#padding-demo-1'), title: '新手引导', description: 'Hello ByteDancer!' },
  { target: q('#padding-demo-2'), title: 'New Padding', description: 'This is 10px padding' },
  { target: q('#padding-demo-3'), title: 'Change Padding', spotlightPadding: 15, description: 'We change the Padding to 15px' },
];

// 定制按钮
const buttonVisible = ref(false);
const buttonSteps = [
  { target: q('#button-demo-1'), title: '新手引导', description: 'Hello ByteDancer!' },
  { target: q('#button-demo-2'), title: 'New Button Style', description: 'Button text is Next' },
  { target: q('#button-demo-3'), title: 'New finish button text', description: 'Button text is I know' },
];

// 受控
const controlledVisible = ref(false);
const controlledCurrent = ref(0);
const controlledSteps = [
  { target: q('#controlled-demo-1'), title: '新手引导', description: 'Hello ByteDancer!', position: 'bottom' as const },
  { target: q('#controlled-demo-2'), title: 'Switch', description: 'This is a Semi Switch', position: 'bottom' as const },
  { target: q('#controlled-demo-3'), title: 'Button', description: 'This is a Semi Button', position: 'bottom' as const },
];
const onControlledFinish = () => {
  controlledVisible.value = false;
  controlledCurrent.value = 0;
  log('引导完成');
};
const onControlledSkip = () => {
  controlledVisible.value = false;
  controlledCurrent.value = 0;
  log('跳过引导');
};

// 弹窗式引导
const modalVisible = ref(false);
const cover = (src: string) => () => h(Image, { width: '600px', height: '100%', src });
const modalSteps = [
  {
    title: '欢迎使用 Semi DSM!',
    description: () => h('div', null, ['你可以从已发布的主题出发，或者选择', h(Text, { strong: true }, () => '立即创造'), '来创造一个新的主题']),
    cover: cover('https://lf9-static.bytednsdoc.com/obj/eden-cn/nuhpxphk/dsm/dsm_welcome.png'),
    position: 'bottom' as const,
  },
  {
    title: '高可用的色盘',
    description: '选取主色后，我们的颜色算法会为你生成一套高可用的色盘',
    cover: cover('https://lf9-static.bytednsdoc.com/obj/eden-cn/nuhpxphk/dsm/dsm_console.png'),
    position: 'bottom' as const,
  },
  {
    title: '自由定制',
    description: '开始定制属于你的设计系统吧！',
    cover: cover('https://lf9-static.bytednsdoc.com/obj/eden-cn/nuhpxphk/dsm/dsm_palette.png'),
    position: 'bottom' as const,
  },
];

// 无遮罩
const maskVisible = ref(false);
const maskSteps = [{ target: q('#mask-demo'), title: 'No Mask', description: 'Hello ByteDancer!' }];
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="通过 steps 配置每一步的目标元素、标题与描述，visible 控制引导显示；onChange / onNext / onPrev / onFinish / onSkip 对应各回调。">
    <div>
      <Button @click="basicVisible = true">开始引导</Button>
      <br />
      <br />
      <Space>
        <Switch id="basic-demo-1" :defaultChecked="true" />
        <Tag id="basic-demo-2"> Default Tag </Tag>
        <Button id="basic-demo-3">确定</Button>
      </Space>
      <UserGuide
        mode="popup"
        :mask="true"
        :visible="basicVisible"
        :steps="basicSteps"
        @change="(current: number) => log('当前引导步骤', current)"
        @next="() => log('下一步引导')"
        @prev="() => log('上一步引导')"
        @finish="() => { basicVisible = false; log('引导完成'); }"
        @skip="() => { basicVisible = false; log('跳过引导'); }"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="主题" desc="popup 气泡卡片模式下提供两种主题 default 和 primary，通过 theme 属性设置。">
    <div>
      <Button @click="themeVisible = true">开始引导</Button>
      <br />
      <br />
      <Space>
        <Switch id="theme-demo-1" :defaultChecked="true" />
        <Tag id="theme-demo-2"> Default Tag </Tag>
        <Button id="theme-demo-3">确定</Button>
      </Space>
      <UserGuide
        mode="popup"
        :mask="true"
        :visible="themeVisible"
        theme="primary"
        :steps="themeSteps"
        @finish="() => { themeVisible = false; log('引导完成'); }"
        @skip="() => { themeVisible = false; log('跳过引导'); }"
      />
    </div>
  </DemoBlock>

  <DemoBlock
    title="气泡卡片弹出位置"
    desc="popup 气泡卡片模式下提供 12 种弹出位置（top、topLeft、topRight、left、leftTop、leftBottom、right、rightTop、rightBottom、bottom、bottomLeft、bottomRight），还可以通过 showArrow 属性设置是否显示箭头。"
  >
    <div>
      <Button id="position-demo" @click="positionVisible = true">开始引导</Button>
      <UserGuide
        mode="popup"
        :mask="true"
        :visible="positionVisible"
        :steps="positionSteps"
        @finish="() => { positionVisible = false; log('引导完成'); }"
        @skip="() => { positionVisible = false; log('跳过引导'); }"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="设置高亮区域大小" desc="通过 spotlightPadding 属性设置高亮区域的内边距，步骤上的 spotlightPadding 会覆盖全局配置。">
    <div>
      <Button @click="paddingVisible = true">开始引导</Button>
      <br />
      <br />
      <Space>
        <Switch id="padding-demo-1" :defaultChecked="true" />
        <Tag id="padding-demo-2"> Default Tag </Tag>
        <Button id="padding-demo-3">确定</Button>
      </Space>
      <UserGuide
        mode="popup"
        :mask="true"
        :visible="paddingVisible"
        :spotlightPadding="10"
        :steps="paddingSteps"
        @finish="() => { paddingVisible = false; log('引导完成'); }"
        @skip="() => { paddingVisible = false; log('跳过引导'); }"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="定制按钮" desc="通过 nextButtonProps 和 prevButtonProps 属性设置按钮的样式与文案，finishText 设置最后一步完成按钮的文本。">
    <div>
      <Button @click="buttonVisible = true">开始引导</Button>
      <br />
      <br />
      <Space>
        <Switch id="button-demo-1" :defaultChecked="true" />
        <Tag id="button-demo-2"> Default Tag </Tag>
        <Button id="button-demo-3">确定</Button>
      </Space>
      <UserGuide
        mode="popup"
        :mask="true"
        :visible="buttonVisible"
        :nextButtonProps="{ children: 'Next' }"
        :prevButtonProps="{ children: 'Prev', theme: 'borderless' }"
        finishText="我知道啦！"
        :steps="buttonSteps"
        @finish="() => { buttonVisible = false; log('引导完成'); }"
        @skip="() => { buttonVisible = false; log('跳过引导'); }"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="受控" desc="通过 current 属性设置当前引导步骤，配合 onChange 回调实现受控。">
    <div>
      <Button @click="controlledVisible = true">开始引导</Button>
      <br />
      <br />
      <Space>
        <Switch id="controlled-demo-1" :defaultChecked="true" />
        <Tag id="controlled-demo-2"> Default Tag </Tag>
        <Button id="controlled-demo-3">确定</Button>
      </Space>
      <UserGuide
        mode="popup"
        :mask="true"
        :visible="controlledVisible"
        :current="controlledCurrent"
        :steps="controlledSteps"
        @change="(current: number) => (controlledCurrent = current)"
        @finish="onControlledFinish"
        @skip="onControlledSkip"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="弹窗式引导" desc="通过 mode 属性设置为 modal 开启弹窗式引导，步骤可配置 cover 封面图。">
    <div>
      <Button @click="modalVisible = true">开始引导</Button>
      <UserGuide
        mode="modal"
        :mask="true"
        :visible="modalVisible"
        :steps="modalSteps"
        @change="(current: number) => log('当前引导步骤', current)"
        @next="() => log('下一步引导')"
        @prev="() => log('上一步引导')"
        @finish="() => { modalVisible = false; log('引导完成'); }"
        @skip="() => { modalVisible = false; log('跳过引导'); }"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="无遮罩" desc="通过 mask 属性设置为 false 开启无遮罩引导。">
    <div>
      <Button id="mask-demo" @click="maskVisible = true">开始引导</Button>
      <UserGuide
        mode="popup"
        :mask="false"
        :visible="maskVisible"
        :steps="maskSteps"
        @finish="() => { maskVisible = false; log('引导完成'); }"
        @skip="() => { maskVisible = false; log('跳过引导'); }"
      />
    </div>
  </DemoBlock>
</template>
