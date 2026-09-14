<script setup lang="ts">
import { ref } from 'vue';
import { ScrollList, ScrollItem, Button } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { ScrollList, ScrollItem } from 'semi-design-vue';`;

const selectIndex1 = ref(1);
const selectIndex2 = ref(1);
const selectIndex3 = ref(1);

const ampms = [{ value: '上午' }, { value: '下午' }];
const hours = new Array(12).fill(0).map((_itm, index) => ({ value: index + 1 }));
const minutes = new Array(60).fill(0).map((_itm, index) => ({
  value: index,
  disabled: Math.random() > 0.5,
}));

const onSelectAP = (data: any) => {
  if (data.type === 1) selectIndex1.value = data.index;
};
const onSelectHour = (data: any) => {
  console.log('You have choose the hour for: ', data.value);
  if (data.type === 2) selectIndex2.value = data.index;
};
const onSelectMinute = (data: any) => {
  console.log('You have choose the minute for: ', data.value);
  if (data.type === 3) selectIndex3.value = data.index;
};

const scrollStyle = { border: 'unset', boxShadow: 'unset' };
const handleClose = () => console.log('close');</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本使用"
    desc="滚动列表类似 iOS 滚动选择，支持滚到指定窗口与点击选择。cycled 开启无限循环。"
  >
    <ScrollList :style="scrollStyle" header="无限滚动列表">
      <template #footer>
        <Button size="small" type="primary" @click="handleClose">Ok</Button>
      </template>
      <ScrollItem mode="wheel" :cycled="false" :list="ampms" :type="1" :selectedIndex="selectIndex1" @select="onSelectAP" />
      <ScrollItem mode="wheel" :cycled="true" :list="hours" :type="2" :selectedIndex="selectIndex2" @select="onSelectHour" />
      <ScrollItem mode="wheel" :cycled="true" :list="minutes" :type="3" :selectedIndex="selectIndex3" @select="onSelectMinute" />
    </ScrollList>
  </DemoBlock>
</template>
