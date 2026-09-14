<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { format as formatDate } from 'date-fns';
import { Button, ConfigProvider, IconClock, Select, SelectOption, Tag, TimePicker } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const log = (...args: any[]) => console.log(...args);

// 受控组件
const controlledValue = ref<Date | null>(null);
const onControlledChange = (time: any) => {
  log(time);
  controlledValue.value = time;
};

// 设置面板头部，底部
const open = ref(false);
const closePanel = () => (open.value = false);
const onOpenChange = (isOpen: boolean) => {
  open.value = isOpen;
  log(isOpen);
};
const rangeFooters = [
  h(Button, { key: '1', onClick: () => log('start footer') }, () => 'start footer'),
  h(Button, { key: '2', onClick: () => log('end footer') }, () => 'end footer'),
];

// Range 模式下分别禁用左右面板
const disabledTime = (value: any, panelType: 'left' | 'right') => {
  const start = Array.isArray(value) ? value[0] : value;
  if (panelType === 'right' && start instanceof Date) {
    const hh = start.getHours();
    const mm = start.getMinutes();
    return {
      disabledHours: () => Array.from({ length: hh }, (_, i) => i),
      disabledMinutes: (hour: number) => (hour === hh ? Array.from({ length: mm }, (_, i) => i) : []),
    };
  }
  return {};
};

// 自定义触发器
const formatToken = 'HH:mm:ss';
const triggerTime = ref<Date | null>(new Date());
const triggerRender = ({ placeholder }: { placeholder?: string }) =>
  h(
    Tag,
    {
      color: 'cyan',
      size: 'large',
      shape: 'circle',
      style: { padding: '12px', paddingRight: '16px', fontSize: '14px' },
      theme: 'light',
      prefixIcon: h(IconClock),
    },
    () => (triggerTime.value ? formatDate(triggerTime.value, formatToken) : placeholder)
  );

// 时区设置
const timeZone = ref<string | undefined>('GMT+08:00');
const defaultTimestamp = 1581599305265;
const gmtList = computed(() => {
  const list: string[] = [];
  for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
    const prefix = hourOffset >= 0 ? '+' : '-';
    const hOffset = Math.abs(hourOffset);
    list.push(`GMT${prefix}${String(hOffset).padStart(2, '0')}:00`);
  }
  return list;
});
</script>

<template>
  <DemoBlock title="如何引入" code="import { TimePicker } from '@/index';" />

  <DemoBlock title="基础使用" desc="点击 TimePicker，然后可以在浮层中选择或者输入某一时间。">
    <TimePicker />
  </DemoBlock>

  <DemoBlock title="无限滚动" desc="ScrollItem 默认模式为 normal，通过 scrollItemProps 应用回无限滚动效果。">
    <TimePicker :scrollItemProps="{ mode: 'wheel', cycled: true }" />
  </DemoBlock>

  <DemoBlock title="受控组件" desc="当使用 value 而不是 defaultValue 时，作为受控组件使用。value 和 onChange 需要配合使用。">
    <TimePicker :value="controlledValue" @change="onControlledChange" />
  </DemoBlock>

  <DemoBlock title="不同的 Format 格式" desc="浮层中的列会随着 format 变化；format 遵循 date-fns 的 format 格式。">
    <TimePicker format="HH:mm" defaultValue="10:24" />
  </DemoBlock>

  <DemoBlock title="设置面板头部，底部" desc="panelHeader / panelFooter 设置面板头部与底部 addon，range 模式下可传数组分别设置左右面板。">
    <div>
      <TimePicker :open="open" panelHeader="Time Select" @openChange="onOpenChange">
        <template #panelFooter>
          <Button @click="closePanel">close</Button>
        </template>
      </TimePicker>
      <br /><br />
      <TimePicker type="timeRange" :panelHeader="['start header', 'end header']" :panelFooter="rangeFooters" />
    </div>
  </DemoBlock>

  <DemoBlock title="禁用时间选择" desc="disabled 禁用全部操作。">
    <TimePicker defaultValue="12:08:23" disabled />
  </DemoBlock>

  <DemoBlock title="设置步长" desc="可以使用 hourStep, minuteStep, secondStep 按步长展示可选的时分秒。">
    <TimePicker :minuteStep="15" :secondStep="10" />
  </DemoBlock>

  <DemoBlock title="12 小时制" desc="12 小时制的时间选择器，默认的 format 为 h:mm:ss a。">
    <div>
      <TimePicker use12Hours /><br /><br />
      <TimePicker use12Hours format="a h:mm" />
    </div>
  </DemoBlock>

  <DemoBlock title="时间范围" desc="传入 type=&quot;timeRange&quot; 开启时间范围选择。">
    <div>
      <TimePicker type="timeRange" :defaultValue="['10:23:15', '12:38:32']" /><br /><br />
      <TimePicker type="timeRange" use12Hours format="a h:mm" :defaultValue="['上午 08:11', '下午 11:21']" />
    </div>
  </DemoBlock>

  <DemoBlock title="Range 模式下分别禁用左右面板（disabledTime）" desc="type=timeRange 时，通过 disabledTime(value, panelType) 对左右面板分别应用不同的禁用规则：选择开始时间后，右侧面板禁用早于开始时间的选项。">
    <TimePicker type="timeRange" :disabledTime="disabledTime" />
  </DemoBlock>

  <DemoBlock title="自定义触发器" desc="通过 triggerRender 方法自定义触发器。">
    <TimePicker :value="triggerTime" :format="formatToken" :triggerRender="triggerRender" @change="(time: any) => (triggerTime = time)" />
  </DemoBlock>

  <DemoBlock title="时区设置" desc="Semi 所有关于时区的配置都收敛在 ConfigProvider 中。">
    <ConfigProvider :timeZone="timeZone">
      <div style="width: 300px">
        <h5 style="margin: 10px">Select Time Zone:</h5>
        <Select placeholder="请选择时区" style="width: 300px" :value="timeZone" showClear @select="(value: any) => (timeZone = value)">
          <SelectOption v-for="gmt in gmtList" :key="gmt" :value="gmt">{{ gmt }}</SelectOption>
        </Select>
        <br />
        <br />
        <h5 style="margin: 10px">TimePicker:</h5>
        <TimePicker :defaultValue="defaultTimestamp" @change="(date: any, dateString: any) => log('TimePicker changed: ', date, dateString)" />
      </div>
    </ConfigProvider>
  </DemoBlock>
</template>
