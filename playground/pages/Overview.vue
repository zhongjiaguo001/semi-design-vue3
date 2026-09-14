<script setup lang="ts">
import { Title, Paragraph, Card, Row, Col } from '@/index';
import { catalog } from '../catalog';

const emit = defineEmits<{ navigate: [key: string] }>();
</script>

<template>
  <article class="doc-article">
    <Title :heading="1">Overview 组件总览</Title>
    <Paragraph>分类与 https://semi.design/zh-CN/start/overview 对齐。点击卡片进入对应示例页。</Paragraph>
    <div v-for="group in catalog.filter((g) => g.key !== 'start')" :key="group.key" class="overview-group">
      <Title :heading="2">{{ group.title }}</Title>
      <Row :gutter="[16, 16]">
        <Col v-for="item in group.items" :key="item.key" :span="8">
          <div @click="emit('navigate', item.key)" style="height: 100%; cursor: pointer">
          <Card
            :title="item.title"
            shadows="hover"
            class="overview-card"
            :style="{ height: '100%' }"
          >
            <span class="overview-brief">{{ item.brief }}</span>
            <div v-if="item.skipped" class="overview-skip">未移植</div>
          </Card>
          </div>
        </Col>
      </Row>
    </div>
  </article>
</template>

<style scoped>
.overview-group {
  margin-bottom: 32px;
}
.overview-brief {
  color: var(--semi-color-text-2);
  font-size: 13px;
  line-height: 1.6;
}
.overview-skip {
  margin-top: 8px;
  color: var(--semi-color-warning);
  font-size: 12px;
}
</style>
