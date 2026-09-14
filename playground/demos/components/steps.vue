<script setup lang="ts">
import { ref } from 'vue';
import { Steps, Step, Button, IconHome, IconLock } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Steps, Step } from 'semi-design-vue';
// 也可以使用 Steps.Step`;

const log = (i: number) => console.log(i);

// 处理进度
const processCurrent = ref(0);
const processSteps = [
  { title: 'First', content: 'First-content' },
  { title: 'Second', content: 'Second-content' },
  { title: 'Last', content: 'Last-content' },
];
const next = () => {
  processCurrent.value += 1;
};
const prev = () => {
  processCurrent.value -= 1;
};

// onChange 回调
const changeCurrent = ref(1);
const changeSteps = [
  { title: 'First', content: 'First-content' },
  { title: 'Second', content: 'Second-content' },
  { title: 'Last', content: 'Last-content' },
];
const onChange = (index: number) => {
  changeCurrent.value = index;
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="默认步骤条（旧版）" desc="建议使用简易版 steps（新版），旧版后续会逐渐 deprecate">
    <Steps :current="1" @change="log">
      <Step title="Finished" description="This is a description" />
      <Step title="In Progress" description="This is a description" />
      <Step title="Waiting" description="This is a description" />
    </Steps>
  </DemoBlock>

  <DemoBlock title="简单步骤条（新版）" desc='通过设置 type="basic" 显示为简洁风格步骤条'>
    <Steps type="basic" :current="1" @change="log">
      <Step title="Finished" description="This is a description" />
      <Step title="In Progress" description="This is a description" />
      <Step title="Waiting" description="This is a description" />
    </Steps>
  </DemoBlock>

  <DemoBlock title="导航步骤条" desc='通过设置 type="nav" 显示为导航风格步骤条，宽度按内容撑开，Step 仅支持 title、class、style'>
    <div style="display: flex; justify-content: center">
      <Steps type="nav" :current="1" style="margin: auto" @change="log">
        <Step title="注册账号" />
        <Step title="这个项目的文字比较多多多多" />
        <Step title="产品用途" />
        <Step title="期待尝试功能" />
      </Steps>
    </div>
  </DemoBlock>

  <DemoBlock title="迷你尺寸步骤条" desc='通过设置 size="small" 显示迷你尺寸步骤条'>
    <Steps type="basic" size="small" :current="1" @change="log">
      <Step title="Finished" description="This is a description" />
      <Step title="In Progress" description="This is a description" />
      <Step title="Waiting" description="This is a description" />
    </Steps>
  </DemoBlock>

  <DemoBlock title="迷你尺寸步骤条 - 2" desc="导航步骤条的迷你尺寸">
    <div style="display: flex; justify-content: center">
      <Steps type="nav" size="small" :current="1" style="margin: auto" @change="log">
        <Step title="注册账号" />
        <Step title="这个项目的文字比较多多多多" />
        <Step title="产品用途" />
        <Step title="期待尝试功能" />
      </Steps>
    </div>
  </DemoBlock>

  <DemoBlock title="处理进度" desc="配合内容及按钮使用，表示一个流程的处理进度">
    <div>
      <Steps type="basic" :current="processCurrent" @change="log">
        <Step v-for="item in processSteps" :key="item.title" :title="item.title" />
      </Steps>
      <div class="steps-content" style="margin-top: 4px; margin-bottom: 4px">{{ processSteps[processCurrent].content }}</div>
      <div class="steps-action">
        <Button v-if="processCurrent < processSteps.length - 1" type="primary" @click="next">Next</Button>
        <Button v-if="processCurrent === processSteps.length - 1" type="primary" @click="() => console.log('Processing complete!')">Done</Button>
        <Button v-if="processCurrent > 0" style="margin-left: 8px" @click="prev">Previous</Button>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="竖直方向的步骤条" desc="通过设置 direction，使用竖直方向的步骤条">
    <Steps direction="vertical" :current="1" style="width: 300px" @change="log">
      <Step title="Finished" description="This is a description" />
      <Step title="In Progress" description="This is a description" />
      <Step title="Waiting" description="This is a description" />
    </Steps>
  </DemoBlock>

  <DemoBlock title="竖直方向的步骤条 - 2" desc="简单步骤条的竖直方向">
    <Steps direction="vertical" type="basic" :current="1" @change="log">
      <Step title="Finished" description="This is a description" />
      <Step title="In Progress" description="This is a description" />
      <Step title="Waiting" description="This is a description" />
    </Steps>
  </DemoBlock>

  <DemoBlock title="指定步骤状态" desc="步骤运行错误，使用 Steps 的 status 属性来指定当前步骤的状态">
    <Steps type="basic" :current="1" status="error" @change="log">
      <Step title="Finished" description="This is a description" />
      <Step title="In Process" description="This is a description" />
      <Step title="Waiting" description="This is a description" />
    </Steps>
  </DemoBlock>

  <DemoBlock title="自定义图标/状态" desc="通过 Step 的 icon 属性启用自定义图标；通过 Step 的 status 属性自定义每个 step 的状态">
    <Steps type="basic" @change="log">
      <Step status="finish" title="已完成" />
      <Step status="error" title="错误" />
      <Step status="warning" title="警告" />
      <Step status="process" title="正在进行">
        <template #icon><IconHome size="extra-large" /></template>
      </Step>
      <Step status="wait" title="等待">
        <template #icon><IconLock size="extra-large" /></template>
      </Step>
    </Steps>
  </DemoBlock>

  <DemoBlock title="onChange 回调" desc="onChange 接收一个 number 类型的参数，该参数等于 initial + current；点击步骤可切换">
    <div>
      <Steps type="basic" :current="changeCurrent" @change="onChange">
        <Step v-for="item in changeSteps" :key="item.title" :title="item.title" />
      </Steps>
      <div style="margin-top: 8px">当前：{{ changeSteps[changeCurrent].content }}</div>
    </div>
  </DemoBlock>
</template>
