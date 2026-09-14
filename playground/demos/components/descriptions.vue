<script setup lang="ts">
import { h } from 'vue';
import { Descriptions, DescriptionsItem, Tag, Card, Space, IconArrowUp } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Descriptions, DescriptionsItem } from 'semi-design-vue';
// DescriptionsItem 也可通过 Descriptions.Item 访问`;

// 基本用法
const basicData = [
  { key: '实际用户数量', value: '1,480,000' },
  {
    key: '7天留存',
    value: () =>
      h('div', ['98%', h(IconArrowUp, { size: 'small', style: { color: 'var(--semi-color-success)', marginLeft: '2px' } })]),
  },
  { key: '安全等级', value: '3级' },
  { key: '垂类标签', value: () => h(Tag, { style: { margin: 0 } }, () => '电商') },
  { key: '认证状态', value: '未认证' },
];

// 设置对齐方式
const alignData = [
  { key: '实际用户数量', value: '1,480,000' },
  { key: '7天留存', value: '98%' },
  { key: '安全等级', value: '3级' },
  { key: '垂类标签', value: () => h(Tag, { style: { margin: 0 } }, () => '电商') },
  { key: '认证状态', value: '未认证' },
];
const aligns = ['center', 'justify', 'left', 'plain'] as const;
const cardStyle = { margin: '10px' };

// 设置布局模式
const layoutData = [
  { key: '抖音号', value: 'SemiDesign' },
  { key: '主播类型', value: '自由主播' },
  { key: '安全等级', value: '3级' },
  {
    key: '垂类标签',
    value: () =>
      h(Space, null, () => [
        h(Tag, { size: 'small', shape: 'circle', color: 'amber' }, () => '互联网资讯'),
        h(Tag, { size: 'small', shape: 'circle', color: 'violet' }, () => '编程'),
      ]),
  },
  { key: '作品数量', value: '88888888' },
  { key: '认证状态', value: '这是一个很长很长很长很长很长很长很长很长很长的值', span: 3 },
];
const horizontalData = [
  { key: '抖音号', value: 'SemiDesign' },
  { key: '主播类型', value: '自由主播' },
  { key: '安全等级', value: '3级' },
  { key: '垂类标签', value: () => h(Tag, { size: 'small', shape: 'circle', color: 'violet' }, () => '编程') },
  { key: '作品数量', value: '88888888' },
  { key: '认证状态', value: '这是一个很长很长很长很长很长很长很长很长很长的值', span: 3 },
  { key: '上次直播时间', value: '2024-05-01 12:00:00', span: 3 },
];

// 双行显示
const rowData = [
  { key: '实际用户数量', value: '1,480,000' },
  {
    key: '7天留存',
    value: () => h('span', ['98%', h(IconArrowUp, { size: 'small', style: { color: 'red', marginLeft: '4px' } })]),
  },
  { key: '安全等级', value: '3级' },
];
const rowStyle = {
  boxShadow: 'var(--semi-shadow-elevated)',
  backgroundColor: 'var(--semi-color-bg-2)',
  borderRadius: '4px',
  padding: '10px',
  marginRight: '20px',
  width: '600px',
};

// 自定义 Key 样式
const keyStyle = { width: '100px', textAlign: 'right' as const };
const keyStyleData = [
  { key: '用户名', value: '张三', keyStyle },
  { key: '电子邮箱', value: 'zhangsan@example.com', keyStyle },
  { key: '联系电话', value: '138-0000-0000', keyStyle },
  { key: '地址', value: '北京市朝阳区', keyStyle },
];
const jsxKeyStyle = { width: '120px', color: 'var(--semi-color-primary)' };
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="通过 data 以 { key, value } 数组传入数据；key、value 均支持字符串或渲染函数（返回 VNode）。">
    <Descriptions :data="basicData" />
  </DemoBlock>

  <DemoBlock title="设置对齐方式" desc="通过 align 选择对齐方式：center、justify、left、plain，默认 center；row 为 true 时该配置无效。">
    <div style="display: flex; flex-wrap: wrap">
      <Card v-for="a in aligns" :key="a" shadows="always" :style="cardStyle">
        <Descriptions :align="a" :data="alignData" />
      </Card>
    </div>
  </DemoBlock>

  <DemoBlock title="JSX 写法" desc="除了 data 之外，也可以用子组件 Descriptions.Item（DescriptionsItem）声明数据，Item 应当是 Descriptions 的直接子元素。">
    <Descriptions>
      <DescriptionsItem itemKey="实际用户数量">1,480,000</DescriptionsItem>
      <DescriptionsItem itemKey="7天留存">98%</DescriptionsItem>
      <DescriptionsItem itemKey="安全等级">3级</DescriptionsItem>
      <DescriptionsItem itemKey="垂类标签">电商</DescriptionsItem>
      <DescriptionsItem itemKey="认证状态">未认证</DescriptionsItem>
    </Descriptions>
  </DemoBlock>

  <DemoBlock title="设置布局模式" desc="通过 layout 设置布局模式，默认 vertical 纵向布局；span 可指定单元格跨越的列数。">
    <Descriptions layout="vertical" align="plain" :data="layoutData" :column="4" />
  </DemoBlock>

  <DemoBlock title="设置布局模式 - horizontal" desc="layout 为 horizontal 时为横向布局，可配合 column 指定每行最大列数。">
    <Descriptions layout="horizontal" align="plain" :data="horizontalData" :column="5" />
  </DemoBlock>

  <DemoBlock title="双行显示" desc="设置 row 可双行显示，size 支持 small、medium、large，默认 medium，此时 align 不再生效。">
    <div>
      <Descriptions :data="rowData" row size="small" :style="rowStyle" />
      <br />
      <Descriptions :data="rowData" row :style="rowStyle" />
      <br />
      <Descriptions :data="rowData" row size="large" :style="rowStyle" />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义 Key 样式" desc="通过 keyStyle 自定义 key 的样式，例如固定宽度、右对齐实现整齐排列。">
    <Descriptions :data="keyStyleData" align="center" />
  </DemoBlock>

  <DemoBlock title="自定义 Key 样式 - JSX 写法" desc="keyStyle 同样可配合 Descriptions.Item 子组件写法使用。">
    <Descriptions align="center">
      <DescriptionsItem itemKey="姓名" :keyStyle="jsxKeyStyle">李四</DescriptionsItem>
      <DescriptionsItem itemKey="年龄" :keyStyle="jsxKeyStyle">28</DescriptionsItem>
      <DescriptionsItem itemKey="职业" :keyStyle="jsxKeyStyle">前端工程师</DescriptionsItem>
    </Descriptions>
  </DemoBlock>
</template>
