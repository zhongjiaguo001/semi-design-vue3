<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Progress, Button, Space, IconChevronLeft, IconChevronRight } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Progress } from 'semi-design-vue';`;

// 动态改变进度
const percent = ref(40);
const cirPerc = ref(40);

// 自定义进度条颜色
const colorPercent = ref(10);
const strokeArr = [
  { percent: 20, color: 'red' },
  { percent: 40, color: 'orange-9' },
  { percent: 60, color: 'light-green-8' },
  { percent: 80, color: 'hsla(125, 50%, 46% / 1)' },
];

// 自动补齐颜色区间
const gradPercent = ref(65);
const percentInterval = ref(0);
const gradStrokeArr = [
  { percent: 0, color: 'rgb(249, 57, 32)' },
  { percent: 50, color: '#46259E' },
  { percent: 100, color: 'hsla(125, 50%, 46% / 1)' },
];
const gradStrokeArrReverse = [
  { percent: 0, color: 'hsla(125, 50%, 46% / 1)' },
  { percent: 50, color: '#46259E' },
  { percent: 100, color: 'rgb(249, 57, 32)' },
];
let timer: ReturnType<typeof setTimeout> | null = null;
const schedule = () => {
  const p = percentInterval.value;
  timer = setTimeout(
    () => {
      percentInterval.value = p > 100 ? 0 : p + 3;
      schedule();
    },
    p === 0 || p > 100 ? 1200 : 290 - (p % 50) * 3
  );
};
onMounted(schedule);
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode">
    <pre style="margin: 0"><code>{{ importCode }}</code></pre>
  </DemoBlock>

  <DemoBlock title="标准的进度条" desc="stroke 控制填充色，percent 控制进度，size 控制尺寸，style 可自定义高度">
    <div style="width: 200px">
      <Progress :percent="10" stroke="var(--semi-color-warning)" aria-label="disk usage" />
      <br />
      <Progress :percent="25" stroke="var(--semi-color-danger)" aria-label="disk usage" />
      <br />
      <Progress :percent="50" aria-label="disk usage" />
      <br />
      <Progress :percent="80" aria-label="download progress" />
      <br />
      <Progress :percent="80" size="large" aria-label="disk usage" />
      <br />
      <Progress :percent="80" :style="{ height: '8px' }" aria-label="disk usage" />
    </div>
  </DemoBlock>

  <DemoBlock title="不确定状态的进度条" desc="indeterminate 展示不确定状态，percent 不再控制进度且不展示 showInfo 文本">
    <div style="width: 240px">
      <Progress indeterminate aria-label="正在加载" />
      <br />
      <Progress indeterminate size="large" aria-label="正在加载" />
      <div style="display: flex; align-items: center; gap: 16px; margin-top: 20px">
        <Progress indeterminate type="circle" aria-label="正在加载" />
        <Progress indeterminate type="circle" size="small" aria-label="正在加载" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="展示百分比文本" desc="showInfo 控制是否展示百分比数字，format 格式化展示文本">
    <div style="width: 200px">
      <Progress :percent="10" stroke="var(--semi-color-warning)" :show-info="true" aria-label="disk usage" />
      <br />
      <Progress :percent="25" stroke="var(--semi-color-danger)" :show-info="true" aria-label="disk usage" />
      <br />
      <Progress :percent="50" :show-info="true" aria-label="disk usage" />
      <br />
      <Progress :percent="50" :show-info="true" :format="(p: number) => p * 10 + '‰'" aria-label="disk usage" />
    </div>
  </DemoBlock>

  <DemoBlock title="垂直的进度条" desc="direction='vertical' 展示垂直进度条，style 传入 width 控制宽度">
    <div style="height: 100px; display: flex">
      <Progress :percent="10" direction="vertical" aria-label="disk usage" />
      <Progress :percent="25" direction="vertical" aria-label="disk usage" />
      <Progress :percent="50" direction="vertical" aria-label="disk usage" />
      <Progress :percent="80" direction="vertical" size="large" aria-label="disk usage" />
      <Progress :percent="80" direction="vertical" :style="{ width: '8px' }" aria-label="disk usage" />
    </div>
  </DemoBlock>

  <DemoBlock title="环形进度条" desc="type='circle' 展示环状，默认尺寸 72 x 72">
    <div>
      <Progress :percent="10" type="circle" :style="{ margin: '5px' }" aria-label="disk usage" />
      <Progress :percent="25" type="circle" :style="{ margin: '5px' }" aria-label="disk usage" />
      <Progress :percent="50" type="circle" :style="{ margin: '5px' }" aria-label="disk usage" />
      <Progress :percent="80" type="circle" :style="{ margin: '5px' }" aria-label="disk usage" />
    </div>
  </DemoBlock>

  <DemoBlock title="环形进度条 - 2" desc="通过 width 控制环形进度条的大小">
    <div>
      <Progress :percent="100" type="circle" :width="100" :style="{ margin: '5px' }" aria-label="disk usage" />
    </div>
    <div>
      <Progress :percent="100" type="circle" :width="100" :style="{ margin: '5px' }" stroke="var(--semi-color-danger)" aria-label="disk usage" />
    </div>
  </DemoBlock>

  <DemoBlock title="小号的环形进度条" desc="小号进度条默认尺寸为 24 x 24">
    <Progress :percent="10" type="circle" size="small" :style="{ margin: '5px' }" aria-label="disk usage" />
    <Progress :percent="25" type="circle" size="small" :style="{ margin: '5px' }" aria-label="disk usage" />
    <Progress :percent="50" type="circle" size="small" :style="{ margin: '5px' }" aria-label="disk usage" />
    <Progress :percent="80" type="circle" size="small" :style="{ margin: '5px' }" aria-label="disk usage" />
  </DemoBlock>

  <DemoBlock title="动态改变进度" desc="条状进度条：点击按钮增减 percent，数字带动画">
    <div>
      <Progress :percent="percent" show-info aria-label="disk usage" />
      <Button theme="light" :disabled="percent === 0" @click="percent -= 10">
        <template #icon><IconChevronLeft /></template>
      </Button>
      <Button theme="light" :disabled="percent >= 100" @click="percent += 10">
        <template #icon><IconChevronRight /></template>
      </Button>
    </div>
  </DemoBlock>

  <DemoBlock title="动态改变进度 - 2" desc="环形进度条：点击按钮增减 percent">
    <div>
      <div>
        <Progress :percent="cirPerc" type="circle" aria-label="disk usage" />
      </div>
      <Button theme="light" :disabled="cirPerc === 0" @click="cirPerc -= 10">
        <template #icon><IconChevronLeft /></template>
      </Button>
      <Button theme="light" :disabled="cirPerc >= 100" @click="cirPerc += 10">
        <template #icon><IconChevronRight /></template>
      </Button>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义中心文字内容" desc="format 函数自定义中心文字；showInfo=false 或 format 返回空字符串可隐藏">
    <Progress :percent="75" show-info type="circle" :format="(per: number) => per + 'Days'" :style="{ margin: '10px' }" aria-label="disk usage" />
    <Progress :percent="100" show-info type="circle" :format="() => 'Done'" :style="{ margin: '10px' }" aria-label="disk usage" />
    <Progress :percent="50" type="circle" :show-info="false" :style="{ margin: '10px' }" aria-label="disk usage" />
  </DemoBlock>

  <DemoBlock title="圆角/方角边缘" desc="strokeLinecap 控制环形进度条边缘形状">
    <Progress :percent="50" stroke-linecap="round" type="circle" :style="{ margin: '10px' }" aria-label="disk usage" />
    <Progress :percent="50" stroke-linecap="square" type="circle" :style="{ margin: '10px' }" aria-label="disk usage" />
  </DemoBlock>

  <DemoBlock title="自定义进度条颜色" desc="stroke 传入数组，按 percent 区间选择颜色（支持 Semi 色板 token）">
    <div>
      <Progress :percent="colorPercent" :stroke="strokeArr" show-info type="circle" :width="100" aria-label="disk usage" />
      <Progress :percent="colorPercent" :stroke="strokeArr" show-info :style="{ margin: '20px 0 10px' }" aria-label="disk usage" />
    </div>
    <Button theme="light" :disabled="colorPercent === 0" @click="colorPercent -= 10">
      <template #icon><IconChevronLeft /></template>
    </Button>
    <Button theme="light" :disabled="colorPercent === 100" @click="colorPercent += 10">
      <template #icon><IconChevronRight /></template>
    </Button>
  </DemoBlock>

  <DemoBlock title="自动补齐颜色区间" desc="strokeGradient 为 true 时自动补齐颜色区间，生成渐变色">
    <Space :spacing="20">
      <div>
        <Progress :percent="percentInterval" :stroke="gradStrokeArr" :stroke-gradient="true" show-info type="circle" :width="100" aria-label="file download speed" />
      </div>
      <div>
        <Progress :percent="percentInterval" :stroke="gradStrokeArrReverse" :stroke-gradient="true" show-info type="circle" :width="100" aria-label="file download speed" />
      </div>
    </Space>
    <div style="width: 100%; margin: 20px 0 10px">
      <Progress :percent="gradPercent" :stroke="gradStrokeArr" :stroke-gradient="true" show-info size="large" aria-label="file download speed" />
    </div>
    <Button theme="light" :disabled="gradPercent === 0" @click="gradPercent -= 5">
      <template #icon><IconChevronLeft /></template>
    </Button>
    <Button theme="light" :disabled="gradPercent === 100" @click="gradPercent += 5">
      <template #icon><IconChevronRight /></template>
    </Button>
  </DemoBlock>
</template>
