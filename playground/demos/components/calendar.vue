<script setup lang="ts">
import { h, ref, computed } from 'vue';
import { Calendar, RadioGroup, Radio, DatePicker, Avatar } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Calendar } from 'semi-design-vue';`;

// 设置周起始日
const weekStart = ref<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);

// 事件渲染用法
const eventMode = ref<'day' | 'week' | 'month' | 'range'>('week');
const eventDisplayValue = ref<Date>(new Date(2019, 6, 23, 8, 32, 0));
const onChangeDate = (date: any) => {
  if (date instanceof Date) eventDisplayValue.value = date;
};
const dailyEventStyle = {
  borderRadius: '3px',
  boxSizing: 'border-box',
  border: 'var(--semi-color-primary) 1px solid',
  padding: '10px',
  backgroundColor: 'var(--semi-color-primary-light-default)',
  height: '100%',
  overflow: 'hidden',
};
const allDayStyle = {
  borderRadius: '3px',
  boxSizing: 'border-box',
  border: 'var(--semi-color-bg-1) 1px solid',
  padding: '2px 4px',
  backgroundColor: 'var(--semi-color-primary-light-active)',
  height: '100%',
  overflow: 'hidden',
};
const events = computed(() => {
  const isMonthView = eventMode.value === 'month';
  const dailyStyle = isMonthView ? allDayStyle : dailyEventStyle;
  return [
    {
      key: '0',
      start: new Date(2019, 5, 25, 14, 45, 0),
      end: new Date(2019, 6, 26, 6, 18, 0),
      children: h('div', { style: dailyStyle }, '6月25日 14:45 ~ 7月26日 6:18'),
    },
    {
      key: '1',
      start: new Date(2019, 6, 18, 10, 0, 0),
      end: new Date(2019, 6, 30, 8, 0, 0),
      children: h('div', { style: allDayStyle }, '7月18日 10:00 ~ 7月30日 8:00'),
    },
    {
      key: '2',
      start: new Date(2019, 6, 19, 20, 0, 0),
      end: new Date(2019, 6, 23, 14, 0, 0),
      children: h('div', { style: allDayStyle }, '7月19日 20:00 ~ 7月23日 14:00'),
    },
    {
      key: '3',
      start: new Date(2019, 6, 21, 6, 0, 0),
      end: new Date(2019, 6, 25, 6, 0, 0),
      children: h('div', { style: allDayStyle }, '7月21日 6:00 ~ 7月25日 6:00'),
    },
    {
      key: '4',
      allDay: true,
      start: new Date(2019, 6, 22, 8, 0, 0),
      children: h('div', { style: allDayStyle }, '7月22日 全天'),
    },
    {
      key: '5',
      start: new Date(2019, 6, 22, 9, 0, 0),
      end: new Date(2019, 6, 23, 23, 0, 0),
      children: h('div', { style: allDayStyle }, '7月22日 9:00 ~ 7月23日 23:00'),
    },
    {
      key: '6',
      start: new Date(2019, 6, 23, 8, 32, 0),
      end: new Date(2019, 6, 23, 8, 42, 0),
      children: h('div', { style: dailyStyle }, '7月23日 8:32'),
    },
    {
      key: '7',
      start: new Date(2019, 6, 23, 14, 30, 0),
      end: new Date(2019, 6, 23, 20, 0, 0),
      children: h('div', { style: dailyStyle }, '7月23日 14:30-20:00'),
    },
    {
      key: '8',
      start: new Date(2019, 6, 25, 8, 0, 0),
      end: new Date(2019, 6, 27, 6, 0, 0),
      children: h('div', { style: allDayStyle }, '7月25日 8:00 ~ 7月27日 6:00'),
    },
    {
      key: '9',
      start: new Date(2019, 6, 26, 10, 0, 0),
      end: new Date(2019, 6, 27, 16, 0, 0),
      children: h('div', { style: allDayStyle }, '7月26日 10:00 ~ 7月27日 16:00'),
    },
  ];
});
const eventRange = computed(() => (eventMode.value === 'range' ? [new Date(2019, 6, 23), new Date(2019, 6, 26)] : []));

// 自定义渲染事件
const customEventStyle = {
  position: 'absolute',
  left: '0',
  right: '0',
  borderRadius: '3px',
  boxSizing: 'border-box',
  border: 'var(--semi-color-primary) 1px solid',
  padding: '10px',
  backgroundColor: 'var(--semi-color-primary-light-default)',
  overflow: 'hidden',
};
const customDisplayValue = new Date(2019, 6, 23, 8, 32, 0);
const dateRender = (dateString?: string) => {
  if (dateString === new Date(2019, 6, 23).toString()) {
    return [
      h('div', { style: { ...customEventStyle, top: '500px', height: '50px' } }, '吃饭 🍰'),
      h('div', { style: { ...customEventStyle, top: '0', height: '400px' } }, '睡觉 😪'),
      h('div', { style: { ...customEventStyle, top: '700px', height: '100px' } }, '打豆豆 🎮'),
    ];
  }
  return null;
};

// 自定义渲染单元格样式
const importantDate = {
  position: 'absolute',
  left: '0',
  right: '0',
  top: '0',
  bottom: '0',
  backgroundColor: 'var(--semi-color-danger-light-default)',
};
const importDates = [new Date(2019, 6, 2), new Date(2019, 6, 8), new Date(2019, 6, 19), new Date(2019, 6, 23)];
const cellRender = (dateString?: string) => {
  if (importDates.filter((date) => date.toString() === dateString).length) {
    return h('div', { style: importantDate });
  }
  return null;
};

// 自定义日期文案
const avatarDisplayValue = new Date(2023, 4, 14);
const avatarColors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'lime'];
const renderDateDisplay = (date: Date) =>
  h('div', [h(Avatar, { color: avatarColors[date.getDay()] as any, size: 'small' }, () => String(date.getDate()))]);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="日视图" desc="日视图的日历模板，可通过 showCurrTime 控制是否显示当前时间的位置红线。">
    <Calendar mode="day" />
  </DemoBlock>

  <DemoBlock title="周视图" desc="周视图的日历模板，可通过 showCurrTime 控制是否显示当前时间的位置红线。">
    <Calendar mode="week" />
  </DemoBlock>

  <DemoBlock title="月视图" desc="月视图的日历模板。">
    <Calendar mode="month" />
  </DemoBlock>

  <DemoBlock
    title="设置周起始日"
    desc="可以通过 weekStartsOn 设置周几作为每周第一天，0 代表周日，1 代表周一，以此类推。默认为周日。对月视图、周视图生效。"
  >
    <div>
      <RadioGroup v-model="weekStart" aria-label="周起始日" type="button" name="demo-radio-group-vertical">
        <Radio :value="0">周日</Radio>
        <Radio :value="1">周一</Radio>
        <Radio :value="2">周二</Radio>
        <Radio :value="3">周三</Radio>
        <Radio :value="4">周四</Radio>
        <Radio :value="5">周五</Radio>
        <Radio :value="6">周六</Radio>
      </RadioGroup>
      <Calendar :style="{ marginTop: '20px' }" mode="month" :weekStartsOn="weekStart" />
    </div>
  </DemoBlock>

  <DemoBlock title="多日视图" desc="多日视图模式。range 必传，左闭右开。">
    <Calendar mode="range" :range="[new Date(2020, 8, 26), new Date(2020, 8, 31)]" />
  </DemoBlock>

  <DemoBlock title="事件渲染用法" desc="通过 events 传入需要渲染的事件，events 是一个由 event objects 组成的数组，具体形式请参考 events API。">
    <RadioGroup v-model="eventMode" type="button">
      <Radio value="day">日视图</Radio>
      <Radio value="week">周视图</Radio>
      <Radio value="month">月视图</Radio>
      <Radio value="range">多日视图</Radio>
    </RadioGroup>
    <br />
    <br />
    <DatePicker :value="eventDisplayValue" @change="onChangeDate" />
    <br />
    <br />
    <Calendar
      :height="400"
      :mode="eventMode"
      :displayValue="eventDisplayValue"
      :events="events"
      :minEventHeight="40"
      :range="eventRange"
    />
  </DemoBlock>

  <DemoBlock title="自定义渲染事件" desc="通过 dateGridRender 可以自定义渲染日期单元格/列。需要使用绝对定位。">
    <Calendar :height="700" mode="week" :displayValue="customDisplayValue" :dateGridRender="dateRender" />
  </DemoBlock>

  <DemoBlock
    title="自定义渲染单元格样式"
    desc="可以通过 dateGridRender 自定义单元格的背景，月视图的文字 zIndex 默认为 3，如需完全覆盖单元格可以设置更大的 zIndex 来实现。"
  >
    <Calendar :height="700" mode="month" :displayValue="customDisplayValue" :dateGridRender="cellRender" />
  </DemoBlock>

  <DemoBlock title="自定义日期文案" desc="可以通过 renderDateDisplay 自定义日期文案。">
    <Calendar :height="400" mode="week" :displayValue="avatarDisplayValue" :renderDateDisplay="renderDateDisplay" />
  </DemoBlock>
</template>
