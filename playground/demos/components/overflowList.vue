<script setup lang="ts">
import { h, ref } from 'vue';
import type { VNodeChild } from 'vue';
import { OverflowList, Tag, Slider, IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { OverflowList } from 'semi-design-vue';`;

type Item = { icon: () => VNodeChild; key: string };

const iconStyle = { marginRight: '4px' };
const items: Item[] = [
  { icon: () => h(IconAlarm, { style: iconStyle }), key: 'alarm' },
  { icon: () => h(IconBookmark, { style: iconStyle }), key: 'bookmark' },
  { icon: () => h(IconCamera, { style: iconStyle }), key: 'camera' },
  { icon: () => h(IconDuration, { style: iconStyle }), key: 'duration' },
  { icon: () => h(IconEdit, { style: iconStyle }), key: 'edit' },
  { icon: () => h(IconFolder, { style: iconStyle }), key: 'folder' },
];

/* 折叠模式 - 默认 */
const width1 = ref(100);
const renderOverflow1 = (overflow: Item[]) =>
  overflow.length ? h(Tag, { style: { flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' } }, () => `+${overflow.length}`) : null;
const renderItem = (item: Item) =>
  h(Tag, { color: 'blue', key: item.key, style: { marginRight: '8px', flex: '0 0 auto' } }, () => [item.icon(), item.key]);

/* 折叠模式 - 方向 */
const width2 = ref(100);
const renderOverflow2 = (overflow: Item[]) =>
  overflow.length
    ? h(Tag, { style: { marginRight: '8px', flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' } }, () => `+${overflow.length}`)
    : null;

/* 折叠模式 - 最小展示的数目 */
const width3 = ref(100);

/* 滚动模式 */
const width4 = ref(100);
const renderScrollOverflow = (overflow: Item[][]) =>
  overflow.map((list, idx) =>
    h(
      Tag,
      { key: idx === 0 ? 'start' : 'end', style: { marginRight: '8px', marginLeft: '8px', flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' } },
      () => `+${list.length}`
    )
  );
const renderScrollItem = (item: Item) =>
  h('span', { key: item.key, class: 'item-cls' }, [
    h(Tag, { color: 'blue', style: { marginRight: '8px', flex: '0 0 auto' } }, () => [item.icon(), item.key]),
  ]);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="折叠模式 - 默认" desc="通过 renderMode=&quot;collapse&quot;（默认）来实现内容的折叠。拖动滑块改变容器宽度，溢出的项目折叠为 +N。">
    <div>
      <Slider :step="1" v-model="width1" />
      <br />
      <br />
      <div :style="{ width: `${width1}%` }">
        <OverflowList :items="items" :overflowRenderer="renderOverflow1" :visibleItemRenderer="renderItem" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="折叠模式 - 方向" desc="collapse 模式下支持 collapseFrom 设置折叠方向。">
    <div>
      <Slider :step="1" v-model="width2" />
      <br />
      <br />
      <div :style="{ width: `${width2}%` }">
        <OverflowList :items="items" collapseFrom="start" :overflowRenderer="renderOverflow2" :visibleItemRenderer="renderItem" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="折叠模式 - 最小展示的数目" desc="collapse 模式下支持 minVisibleItems 设置最小展示的数目。">
    <div>
      <Slider :step="1" v-model="width3" />
      <br />
      <br />
      <div :style="{ width: `${width3}%` }">
        <OverflowList :items="items" :minVisibleItems="3" :overflowRenderer="renderOverflow1" :visibleItemRenderer="renderItem" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="滚动模式"
    desc="通过 renderMode=&quot;scroll&quot; 来使用滚动模式的折叠列表。如果需要 scrollIntoView，可以通过选择器 document.querySelector(`.item-cls[data-scrollkey=&quot;${key}&quot;]`) 来选取。overflowRenderer 收到 [起始溢出项, 末尾溢出项] 两个数组。"
  >
    <div>
      <Slider :step="1" v-model="width4" />
      <br />
      <br />
      <div :style="{ width: `${width4}%` }">
        <OverflowList :items="items" renderMode="scroll" :overflowRenderer="renderScrollOverflow" :visibleItemRenderer="renderScrollItem" />
      </div>
    </div>
  </DemoBlock>
</template>
