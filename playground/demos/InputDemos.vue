<script setup lang="ts">
import { ref } from 'vue';
import { PinCode, Rating, TimePicker, ColorPicker } from '@/index';
import DemoBlock from '../DemoBlock.vue';

defineProps<{ name: string }>();

const time = ref<any>(null);
const pin = ref('');
const rate = ref(3);
const colorValue = ref<any>({ hex: '#0064fa' });
</script>

<template>
  <template v-if="name === 'timePicker'">
    <DemoBlock title="如何引入" code="import { TimePicker } from 'semi-design-vue'" />
    <DemoBlock title="基本用法">
      <TimePicker v-model="time" />
    </DemoBlock>
  </template>

  <template v-else-if="name === 'rating'">
    <DemoBlock title="如何引入" code="import { Rating } from 'semi-design-vue'" />
    <DemoBlock title="基本用法">
      <Rating v-model="rate" />
    </DemoBlock>
    <DemoBlock title="允许半星">
      <Rating allowHalf :defaultValue="2.5" />
    </DemoBlock>
  </template>

  <template v-else-if="name === 'pinCode'">
    <DemoBlock title="如何引入" code="import { PinCode } from 'semi-design-vue'" />
    <DemoBlock title="基本用法" desc="分段验证码。">
      <PinCode v-model="pin" />
    </DemoBlock>
  </template>

  <template v-else-if="name === 'colorPicker'">
    <DemoBlock title="如何引入" code="import { ColorPicker } from 'semi-design-vue'" />
    <DemoBlock title="基本用法">
      <ColorPicker v-model="colorValue" />
    </DemoBlock>
  </template>

</template>
