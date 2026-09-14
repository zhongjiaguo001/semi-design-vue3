<script setup lang="ts">
import { ref, computed, h } from 'vue';
import * as dateFns from 'date-fns';
import range from 'lodash/range';
import { DatePicker, Button, Tabs, TabPane, Space, Text, Tooltip, IconBulb, IconClose, IconChevronDown } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const log = (...args: any[]) => console.log(...args);

/* ---------- 日期范围时间选择 ---------- */
const rangePickerValue = [new Date('2022-08-08 00:00'), new Date('2022-08-09 12:00')];

/* ---------- 周选择 ---------- */
const handleWeekChange = (date: any) => console.log('date changed', date);
const startOfWeekMon = (date?: Date) => dateFns.startOfWeek(date as Date, { weekStartsOn: 1 });
const endOfWeekMon = (date?: Date) => dateFns.endOfWeek(date as Date, { weekStartsOn: 1 });
const endOfNextWeekMon = (date?: Date) => dateFns.add(dateFns.endOfWeek(date as Date, { weekStartsOn: 1 }), { days: 7 });
const plus6Days = (date?: Date) => dateFns.add(date as Date, { days: 6 });

/* ---------- 带有快捷方式的日期时间选择 ---------- */
const presets = [
  { text: 'Today', start: new Date(), end: new Date() },
  {
    text: 'Tomorrow',
    start: new Date(new Date().valueOf() + 1000 * 3600 * 24),
    end: new Date(new Date().valueOf() + 1000 * 3600 * 24),
  },
];

/* ---------- 渲染顶部/底部额外区域 ---------- */
const activeTab = ref('1');
const slotDate = ref<any>(undefined);
const uedDisabledDate = (currentDate?: Date) => Boolean(currentDate && currentDate.getDate() > 10 && currentDate.getDate() < 15);
const testDisabledDate = (currentDate?: Date) => Boolean(currentDate && currentDate.getDate() > 15 && currentDate.getDate() < 25);
const handleTabChange = (tab: string) => {
  activeTab.value = tab;
  slotDate.value = undefined;
};
const slotDisabledDate = computed(() => (activeTab.value === '1' ? uedDisabledDate : testDisabledDate));
const amberStyle = { color: 'rgba(var(--semi-amber-5), 1)' };
const textStyle = { color: 'var(--semi-color-text-2)' };

/* ---------- 禁用部分日期或时间 ---------- */
const today = () => new Date();
const nextValidMonth = () => {
  const nextValidDate = today();
  nextValidDate.setMonth((nextValidDate.getMonth() + 1) % 12);
  return nextValidDate;
};
const disabledTime = (date?: Date | Date[]) =>
  dateFns.isToday(date as Date)
    ? {
        disabledHours: () => [17, 18],
        disabledMinutes: (hour: number) => (19 === hour ? range(0, 10, 1) : []),
        disabledSeconds: (hour: number, minute: number) => (hour === 20 && minute === 20 ? range(0, 20, 1) : []),
      }
    : null;
const disabledTime2 = (_date?: Date | Date[], panelType?: string) => {
  if (panelType === 'left') {
    return { disabledHours: () => [17, 18] };
  }
  return { disabledHours: () => [12, 13, 14, 15, 16, 17, 18] };
};
const disabledBefore28 = (date?: Date) => {
  const deadDate = today();
  const month = deadDate.getMonth();
  deadDate.setDate(28);
  deadDate.setMonth((month + 1) % 12);
  return (date as Date).getTime() < deadDate.getTime();
};
const disabledBeforeStart = (date?: Date, options?: any) => {
  const { rangeStart } = options || {};
  if (!rangeStart) return false;
  const startDate = dateFns.parseISO(rangeStart);
  return dateFns.isBefore(date as Date, startDate);
};
const focusToday = new Date();
const disabledByFocus = (date?: Date, options?: any) => {
  const { rangeInputFocus } = options || {};
  const baseDate = dateFns.set(focusToday, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  if (rangeInputFocus === 'rangeStart') {
    const disabledStart = dateFns.subDays(baseDate, 2);
    const disabledEnd = dateFns.addDays(baseDate, 2);
    return disabledStart <= (date as Date) && (date as Date) <= disabledEnd;
  } else if (rangeInputFocus === 'rangeEnd') {
    const disabledStart = dateFns.subDays(baseDate, 3);
    const disabledEnd = dateFns.addDays(baseDate, 3);
    return disabledStart <= (date as Date) && (date as Date) <= disabledEnd;
  }
  return false;
};

/* ---------- 自定义触发器 ---------- */
const triggerDate = ref<Date | null>(new Date());
const triggerFormat = 'yyyy-MM-dd';
const onTriggerChange = (date: any) => {
  triggerDate.value = date;
};
const onTriggerClear = (e?: Event) => {
  e && e.stopPropagation();
  triggerDate.value = null;
};
const triggerIcon = computed(() => (triggerDate.value ? h(IconClose, { onClick: onTriggerClear }) : h(IconChevronDown)));
const triggerRender = ({ placeholder }: any) =>
  h(Button, { theme: 'light', icon: triggerIcon.value, iconPosition: 'right' }, () => (triggerDate.value && dateFns.format(triggerDate.value, triggerFormat)) || placeholder);

const triggerRangeDate = ref<Date[] | undefined>(undefined);
const triggerRangeFormat = 'yyyy-MM-dd HH:mm:ss';
const onTriggerRangeChange = (date: any) => {
  triggerRangeDate.value = date;
  console.log(date);
};
const onTriggerRangeClear = (e?: Event) => {
  e && e.stopPropagation();
  triggerRangeDate.value = undefined;
};
const triggerRangeIcon = computed(() => (triggerRangeDate.value ? h(IconClose, { onClick: onTriggerRangeClear }) : h(IconChevronDown)));
const triggerRangeContent = () => {
  const date = triggerRangeDate.value;
  if (Array.isArray(date) && date.length) {
    return `${dateFns.format(date[0], triggerRangeFormat)} ~ ${dateFns.format(date[1], triggerRangeFormat)}`;
  }
  return '请选择日期时间范围';
};
const triggerRangeRender = () => h(Button, { theme: 'light', icon: triggerRangeIcon.value, iconPosition: 'right' }, () => triggerRangeContent());

/* ---------- 自定义日期显示内容 ---------- */
const dateStyle = {
  width: '100%',
  height: '100%',
  border: '1px solid var(--semi-color-primary)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
const renderDate = (dayNumber?: number | string, _fullDate?: string) => {
  if (dayNumber === 1) {
    return h(Tooltip, { content: 'Always Day 1' }, () => h('div', { style: dateStyle }, dayNumber));
  }
  return dayNumber;
};

/* ---------- 自定义日期格子渲染 ---------- */
const renderFullDate = (dayNumber?: number | string, _fullDate?: string, dayStatus?: any) => {
  const { isInRange, isHover, isSelected, isSelectedStart, isSelectedEnd } = dayStatus || {};
  const prefix = 'components-datepicker-demo';
  const dateCls = {
    [`${prefix}-day-inrange`]: isInRange,
    [`${prefix}-day-hover`]: isHover,
    [`${prefix}-day-selected`]: isSelected,
    [`${prefix}-day-selected-start`]: isSelectedStart,
    [`${prefix}-day-selected-end`]: isSelectedEnd,
  };
  const dayStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: '80%',
    borderRadius: 'var(--semi-border-radius-circle)',
  };
  return h('div', { style: dayStyle, class: dateCls }, dayNumber);
};

/* ---------- Methods ---------- */
const pickerRef = ref<any>(null);
const handleClickOutside = () => console.log('click outside');
</script>

<template>
  <DemoBlock title="如何引入" code="import { DatePicker } from 'semi-design-vue'" />

  <DemoBlock title="基本使用" desc="最基本的日期选择，onChange 回调返回 Date 与格式化字符串。">
    <DatePicker @change="(date, dateString) => log(dateString)" />
  </DemoBlock>

  <DemoBlock title="小尺寸" desc="使用 density 可以控制日期面板的尺寸，compact 为小尺寸，default 为默认尺寸。">
    <div>
      <DatePicker type="dateTime" density="compact" />
      <br />
      <br />
      <DatePicker type="dateRange" density="compact" :style="{ width: '260px' }" />
    </div>
  </DemoBlock>

  <DemoBlock title="多个日期选择" desc="将 multiple 设为 true，可以多选日期。">
    <DatePicker :multiple="true" :style="{ width: '240px' }" />
  </DemoBlock>

  <DemoBlock title="日期与时间选择" desc="将 type 设定为 dateTime，可以选择日期时间；通过 timePickerOpts 可开启时间列表无限循环。">
    <h4>默认日期与时间选择</h4>
    <DatePicker type="dateTime" />
    <br />
    <br />
    <h4>开启时间列表无限循环</h4>
    <DatePicker type="dateTime" :timePickerOpts="{ scrollItemProps: { mode: 'wheel', cycled: true } }" />
  </DemoBlock>

  <DemoBlock title="日期范围选择" desc="将 type 设定为 dateRange，可以选择日期范围。只有开始和结束日期都被选择后才会触发 onChange。">
    <DatePicker type="dateRange" :style="{ width: '260px' }" @change="log" />
  </DemoBlock>

  <DemoBlock title="日期范围时间选择" desc="将 type 设定为 dateTimeRange，可以选择日期时间范围；通过 defaultPickerValue 指定默认面板日期时间。">
    <DatePicker type="dateTimeRange" :style="{ width: '400px', marginBottom: '8px' }" @change="log" />
    <DatePicker type="dateTimeRange" :style="{ width: '400px' }" :defaultPickerValue="rangePickerValue" @change="log" />
  </DemoBlock>

  <DemoBlock title="内嵌输入框" desc="使用 insetInput 可以控制日期面板是否展示内嵌输入框，默认为 false。">
    <div>
      <DatePicker type="date" insetInput />
      <br />
      <br />
      <DatePicker type="dateTime" insetInput />
      <br />
      <br />
      <DatePicker type="dateRange" insetInput :style="{ width: '260px' }" />
      <br />
      <br />
      <DatePicker type="dateTimeRange" insetInput :style="{ width: '400px' }" />
      <br />
      <br />
      <DatePicker type="month" placeholder="请选择年月" insetInput :style="{ width: '140px' }" />
      <br />
      <br />
      <DatePicker type="monthRange" placeholder="请选择年月范围" insetInput :style="{ width: '200px' }" />
      <br />
      <br />
      <DatePicker type="date" position="bottomLeft" insetInput />
      <br />
      <br />
      <DatePicker type="dateTime" format="yyyy-MM-dd HH:mm" insetInput />
    </div>
  </DemoBlock>

  <DemoBlock title="同步切换双面板月份" desc="在范围选择的场景中，开启 syncSwitchMonth 则允许双面板同步切换。默认为 false。">
    <DatePicker :syncSwitchMonth="true" type="dateTimeRange" :style="{ width: '400px' }" />
  </DemoBlock>

  <DemoBlock title="切换面板日期的回调" desc="onPanelChange 回调函数会在面板的月份或年份切换改变时被调用。">
    <DatePicker :syncSwitchMonth="true" type="dateTimeRange" :style="{ width: '400px' }" @panelChange="(date, dateString) => log(date, dateString)" />
  </DemoBlock>

  <DemoBlock title="周选择" desc="dateRange 搭配 startDateOffset 和 endDateOffset 可以进行单击范围选择，如周选择、双周选择。">
    <div>
      <h4>选择自然周</h4>
      <DatePicker :style="{ width: '260px' }" type="dateRange" :weekStartsOn="1" :startDateOffset="startOfWeekMon" :endDateOffset="endOfWeekMon" @change="handleWeekChange" />
      <br />
      <br />
      <h4>选择双周</h4>
      <DatePicker :style="{ width: '260px' }" type="dateRange" :weekStartsOn="1" :startDateOffset="startOfWeekMon" :endDateOffset="endOfNextWeekMon" @change="handleWeekChange" />
      <br />
      <br />
      <h4>选择当前日和后6日</h4>
      <DatePicker :style="{ width: '260px' }" type="dateRange" :weekStartsOn="1" :endDateOffset="plus6Days" @change="handleWeekChange" />
      <br />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock title="年月选择" desc="将 type 设定为 month，可以进行年月选择。">
    <DatePicker :defaultValue="new Date()" type="month" :style="{ width: '140px' }" />
  </DemoBlock>

  <DemoBlock title="年月范围选择" desc="将 type 设定为 monthRange，可以进行年月范围选择。暂不支持小尺寸与快捷面板。">
    <DatePicker type="monthRange" :style="{ width: '200px' }" />
  </DemoBlock>

  <DemoBlock title="确认日期时间选择" desc="type 为 dateTime / dateTimeRange 时，传递 needConfirm 需要确认后才写入值；支持 onConfirm 和 onCancel 回调。">
    <DatePicker
      type="dateTime"
      :needConfirm="true"
      @confirm="(...args) => log('Confirmed: ', ...args)"
      @cancel="(...args) => log('Canceled: ', ...args)"
      @change="(...args) => log('Changed: ', ...args)"
    />
  </DemoBlock>

  <DemoBlock title="带有快捷方式的日期时间选择" desc="通过 presets 设定快捷日期选择，presetPosition 控制快捷面板位置。">
    <DatePicker type="dateTime" :presets="presets" presetPosition="left" />
  </DemoBlock>

  <DemoBlock title="渲染顶部/底部额外区域" desc="通过 topSlot 和 bottomSlot 可以自定义渲染顶部和底部额外区域；leftSlot / rightSlot 渲染左右额外区域。">
    <div>
      <DatePicker :disabledDate="slotDisabledDate" v-model="slotDate" dropdownClassName="components-datepicker-demo-slot" placeholder="请选择排期">
        <template #topSlot>
          <Tabs size="small" :activeKey="activeTab" :style="{ padding: '12px 20px 0' }" @change="handleTabChange">
            <TabPane tab="UED 排期" itemKey="1" />
            <TabPane tab="测试排期" itemKey="2" />
          </Tabs>
        </template>
      </DatePicker>
      <br />
      <br />
      <DatePicker placeholder="请选择发版时间">
        <template #bottomSlot>
          <Space :style="{ padding: '12px 20px' }">
            <IconBulb :style="amberStyle" />
            <Text strong :style="textStyle">定版前请阅读</Text>
            <Text :link="{ href: 'https://semi.design/', target: '_blank' }">发版须知</Text>
          </Space>
        </template>
      </DatePicker>
      <br />
      <br />
      <DatePicker type="month" placeholder="请选择年月">
        <template #bottomSlot>
          <Space :style="{ padding: '12px 20px' }">
            <IconBulb :style="amberStyle" />
            <Text strong :style="textStyle">请阅读</Text>
            <Text :link="{ href: 'https://semi.design/', target: '_blank' }">须知</Text>
          </Space>
        </template>
      </DatePicker>
      <br />
      <br />
      <DatePicker density="compact" placeholder="小尺寸" dropdownClassName="components-datepicker-demo-slot">
        <template #topSlot>
          <Tabs size="small" :activeKey="activeTab" :style="{ padding: '8px 12px 0' }" @change="handleTabChange">
            <TabPane tab="UED 排期" itemKey="1" />
            <TabPane tab="测试排期" itemKey="2" />
          </Tabs>
        </template>
        <template #bottomSlot>
          <Space :style="{ padding: '8px 12px' }">
            <IconBulb :style="amberStyle" />
            <Text strong :style="textStyle">定版前请阅读</Text>
            <Text :link="{ href: 'https://semi.design/', target: '_blank' }">发版须知</Text>
          </Space>
        </template>
      </DatePicker>
      <br />
      <br />
      <DatePicker type="dateTimeRange" :style="{ width: '400px' }">
        <template #bottomSlot>
          <Space :style="{ padding: '12px 20px' }">
            <IconBulb :style="amberStyle" />
            <Text strong :style="textStyle">定版前请阅读</Text>
            <Text :link="{ href: 'https://semi.design/', target: '_blank' }">发版须知</Text>
          </Space>
        </template>
      </DatePicker>
      <br />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock title="禁用日期选择" desc="通过 disabled 禁用整个选择器。">
    <DatePicker disabled type="dateTime" :defaultValue="new Date()" />
  </DemoBlock>

  <DemoBlock title="禁用部分日期或时间" desc="传入 disabledDate 可以禁用指定日期，传入 disabledTime 可以禁用指定时间，配合 defaultPickerValue 可以指定面板打开时所处的年月。">
    <div>
      <div>
        <h4>禁用时间：禁用今天下午5-6点</h4>
        <DatePicker type="dateTime" :hideDisabledOptions="false" :disabledTime="disabledTime" />
      </div>
      <div>
        <h4>禁用时间：两个面板禁用不同时间</h4>
        <DatePicker type="dateTimeRange" :hideDisabledOptions="false" :disabledTime="disabledTime2" :style="{ width: '400px' }" />
      </div>
      <div>
        <h4>禁用日期：禁用下个月28号之前的所有日期</h4>
        <DatePicker type="dateTimeRange" :disabledDate="disabledBefore28" :defaultPickerValue="nextValidMonth()" :style="{ width: '400px' }" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="禁用部分日期或时间 - 2" desc="在 type 包含 range 时，可以根据当前选择动态禁止日期（options.rangeStart）。">
    <div>
      <h4>动态禁用日期：禁止选择之前的日期</h4>
      <DatePicker type="dateRange" :disabledDate="disabledBeforeStart" :style="{ width: '260px' }" />
    </div>
  </DemoBlock>

  <DemoBlock title="禁用部分日期或时间 - 3" desc="范围选择时，可以根据 focus 状态禁用日期，focus 状态通过 options 中的 rangeInputFocus 参数传递。">
    <div>
      <h4>开始日期禁用今天前2日和后2日，结束日期禁用今天前3天和后3天</h4>
      <DatePicker :motion="false" type="dateRange" :disabledDate="disabledByFocus" :defaultPickerValue="focusToday" />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义显示格式" desc="可以通过 format 自定义显示格式。">
    <DatePicker format="yyyy年MM月dd日 HH:mm" type="dateTime" :defaultValue="new Date()" />
  </DemoBlock>

  <DemoBlock title="自定义触发器" desc="通过传递 triggerRender 方法你可以自定义触发器；默认的清除按钮将不生效，需自行提供清除按钮。">
    <DatePicker :value="triggerDate" :format="triggerFormat" :triggerRender="triggerRender" @change="onTriggerChange" />
  </DemoBlock>

  <DemoBlock title="自定义触发器 - 2" desc="范围选择 + 自定义触发器：面板打开后默认选择开始日期，传入空值时内部会重置焦点。">
    <DatePicker type="dateTimeRange" :value="triggerRangeDate" :triggerRender="triggerRangeRender" @change="onTriggerRangeChange" />
  </DemoBlock>

  <DemoBlock title="自定义日期显示内容" desc="renderDate: (dayNumber, fullDate) => VNode，自定义日期内容。">
    <DatePicker :renderDate="renderDate" />
  </DemoBlock>

  <DemoBlock title="自定义日期格子渲染" desc="renderFullDate: (dayNumber, fullDate, dayStatus) => VNode，自定义日期格子的渲染内容。">
    <DatePicker :style="{ width: '260px' }" type="dateRange" :renderFullDate="renderFullDate" />
  </DemoBlock>

  <DemoBlock title="Methods" desc="通过 ref 调用 open / close / focus / blur 方法；onClickOutSide 在点击非弹出层、触发器时回调。">
    <Space vertical align="start">
      <Space>
        <Button @click="pickerRef?.open()">open</Button>
        <Button @click="pickerRef?.close()">close</Button>
        <Button @click="pickerRef?.focus()">focus</Button>
        <Button @click="pickerRef?.blur()">blur</Button>
      </Space>
      <div>
        <DatePicker ref="pickerRef" type="dateTime" @clickOutSide="handleClickOutside" />
      </div>
    </Space>
  </DemoBlock>
</template>

<style>
.components-datepicker-demo-slot .semi-tabs-content {
  padding: 0;
}
.components-datepicker-demo-slot .semi-tabs-bar-line.semi-tabs-bar-top {
  border-bottom: none;
}
.components-datepicker-demo-day-inrange,
.components-datepicker-demo-day-hover {
  background: var(--semi-color-primary-light-hover);
}
.components-datepicker-demo-day-selected,
.components-datepicker-demo-day-selected-start,
.components-datepicker-demo-day-selected-end {
  color: var(--semi-color-bg-2);
  background: var(--semi-color-primary);
}
</style>
