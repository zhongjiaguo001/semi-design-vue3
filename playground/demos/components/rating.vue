<script setup lang="ts">
import { ref } from 'vue';
import { Rating, IconLikeHeart } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Rating } from 'semi-design-vue';`;

// 文案展现
const value = ref(0);
const change = (val: number) => {
  value.value = val;
};
const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="最简单的用法，支持两种尺寸 default、small；也支持传入 number 类型自定义尺寸">
    <div>
      <Rating :defaultValue="5" />
      <br />
      <br />
      <Rating size="small" :defaultValue="5" />
    </div>
  </DemoBlock>

  <DemoBlock title="半星" desc="通过设置 allowHalf 属性可以支持选择半星，并支持展示除 0.5 以外的小数">
    <div>
      <Rating allowHalf :defaultValue="3.5" />
      <br />
      <Rating allowHalf :defaultValue="3.65" disabled />
    </div>
  </DemoBlock>

  <DemoBlock title="只读" desc="通过设置 disabled 属性将无法进行交互">
    <Rating disabled :defaultValue="3" />
  </DemoBlock>

  <DemoBlock title="点击清除" desc="通过设置 allowClear 属性允许再次点击时清除数值，默认为 true">
    <div>
      <span>允许再次点击清除</span>
      <br />
      <Rating :allowClear="true" :defaultValue="3" />
      <br />
      <br />
      <span>禁止再次点击清除</span>
      <br />
      <Rating :allowClear="false" :defaultValue="3" />
    </div>
  </DemoBlock>

  <DemoBlock title="文案展现" desc="给评分组件加上文案展示（tooltips + 受控 value）">
    <div>
      <span>
        How was the help you received:
        <span v-if="value">{{ desc[value - 1] }}</span>
      </span>
      <br />
      <Rating :tooltips="desc" :value="value" @change="change" />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义" desc="自定义评分字符、个数及尺寸；自定义尺寸需要配合自定义的字符才能生效">
    <div>
      <Rating :style="{ color: 'red' }" :defaultValue="3">
        <template #character>
          <IconLikeHeart size="extra-large" />
        </template>
      </Rating>
      <br />
      <br />
      <Rating :style="{ color: 'red' }" :size="48" allowHalf :defaultValue="3">
        <template #character>
          <IconLikeHeart :style="{ fontSize: '48px' }" />
        </template>
      </Rating>
      <br />
      <br />
      <Rating character="赞" :size="18" :defaultValue="3" />
      <br />
      <br />
      <Rating :count="10" :defaultValue="6" />
    </div>
  </DemoBlock>
</template>
