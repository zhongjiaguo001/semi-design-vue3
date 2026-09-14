<script setup lang="ts">
import { Banner } from '@/index';
defineProps<{ name: string }>();
</script>

<template>
  <Banner
    v-if="name === 'vchart'"
    type="warning"
    title="VChart 未移植"
    description="按需求跳过了 VChart。官网文档：https://semi.design/zh-CN/show/vchart"
  />
</template>
