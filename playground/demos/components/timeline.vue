<script setup lang="ts">
import { h } from 'vue';
import { Timeline, IconAlertTriangle } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Timeline } from 'semi-design-vue';
// Timeline.Item 也可通过 TimelineItem 访问`;

const extra = '节点辅助说明信息';
const dataSource = [
  { time: '2019-07-14 10:35', extra, content: '第一个节点内容', type: 'ongoing' },
  {
    time: '2019-06-13 16:17',
    extra,
    content: () => h('span', { style: { fontSize: '18px' } }, '第二个节点内容'),
    color: 'pink',
  },
  {
    time: '2019-05-14 18:34',
    extra,
    dot: () => h(IconAlertTriangle),
    content: '第三个节点内容',
    type: 'warning',
  },
  { time: '2019-05-09 09:12', extra, content: '第四个节点内容', type: 'success' },
];
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法">
    <Timeline>
      <Timeline.Item time="2019-07-14 10:35">第一个节点内容</Timeline.Item>
      <Timeline.Item time="2019-06-13 16:17">第二个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-14 18:34">第三个节点内容</Timeline.Item>
    </Timeline>
  </DemoBlock>

  <DemoBlock title="节点类型" desc="type 对应原点颜色，可选 default、ongoing、success、warning、error。">
    <Timeline>
      <Timeline.Item time="2019-07-14 10:35" type="ongoing">审核中</Timeline.Item>
      <Timeline.Item time="2019-06-13 16:17" type="success">发布成功</Timeline.Item>
      <Timeline.Item time="2019-05-14 18:34" type="error">审核失败</Timeline.Item>
    </Timeline>
  </DemoBlock>

  <DemoBlock title="自定义节点" desc="dot 自定义图标，color 自定义圆点色值。">
    <Timeline>
      <Timeline.Item time="2019-07-14 10:35">默认样式的节点</Timeline.Item>
      <Timeline.Item time="2019-06-13 16:17" type="warning">
        <template #dot><IconAlertTriangle /></template>
        自定义图标
      </Timeline.Item>
      <Timeline.Item time="2019-05-14 18:34" color="pink">自定义节点颜色</Timeline.Item>
      <Timeline.Item time="2019-04-10 12:20">
        <span style="font-size: 18px">自定义节点样式</span>
      </Timeline.Item>
    </Timeline>
  </DemoBlock>

  <DemoBlock title="时间轴位置" desc="mode 可选 left、center、alternate、right。">
    <p class="tl-caption">时间轴在左侧（默认）</p>
    <Timeline mode="left">
      <Timeline.Item time="2019-07-14 10:35" :extra="extra">第一个节点内容</Timeline.Item>
      <Timeline.Item time="2019-06-13 16:17" :extra="extra">第二个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-14 18:34" :extra="extra">第三个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-09 09:12" :extra="extra">第四个节点内容</Timeline.Item>
    </Timeline>

    <p class="tl-caption">时间节点在左侧</p>
    <Timeline mode="center">
      <Timeline.Item time="2019-07-14 10:35" :extra="extra">第一个节点内容</Timeline.Item>
      <Timeline.Item time="2019-06-13 16:17" :extra="extra">第二个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-14 18:34" :extra="extra">第三个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-09 09:12" :extra="extra">第四个节点内容</Timeline.Item>
    </Timeline>

    <p class="tl-caption">交替展现</p>
    <Timeline mode="alternate">
      <Timeline.Item time="2019-07-14 10:35" :extra="extra">第一个节点内容</Timeline.Item>
      <Timeline.Item time="2019-06-13 16:17" :extra="extra">第二个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-14 18:34" :extra="extra">第三个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-09 09:12" :extra="extra">第四个节点内容</Timeline.Item>
    </Timeline>

    <p class="tl-caption">时间轴在右侧</p>
    <Timeline mode="right">
      <Timeline.Item time="2019-07-14 10:35" :extra="extra">第一个节点内容</Timeline.Item>
      <Timeline.Item time="2019-06-13 16:17" :extra="extra">第二个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-14 18:34" :extra="extra">第三个节点内容</Timeline.Item>
      <Timeline.Item time="2019-05-09 09:12" :extra="extra">第四个节点内容</Timeline.Item>
    </Timeline>
  </DemoBlock>

  <DemoBlock title="使用 dataSource">
    <Timeline mode="alternate" :dataSource="dataSource" />
  </DemoBlock>
</template>

<style scoped>
.tl-caption {
  margin: 16px 0 8px;
  color: var(--semi-color-text-2);
  font-size: 13px;
}
.tl-caption:first-child {
  margin-top: 0;
}
</style>
