<script setup lang="ts">
import { Row, Col } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Col, Row } from 'semi-design-vue';`;

const flexJustify: Array<{ label: string; justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around' }> = [
  { label: 'sub-element align left', justify: 'start' },
  { label: 'sub-element align center', justify: 'center' },
  { label: 'sub-element align right', justify: 'end' },
  { label: 'sub-element monospaced arrangement', justify: 'space-between' },
  { label: 'sub-element align full', justify: 'space-around' },
];

const flexAlign: Array<{
  label: string;
  justify: 'center' | 'space-around' | 'space-between';
  align: 'top' | 'middle' | 'bottom';
}> = [
  { label: 'Align Top', justify: 'center', align: 'top' },
  { label: 'Align Center', justify: 'space-around', align: 'middle' },
  { label: 'Align Bottom', justify: 'space-between', align: 'bottom' },
];
const heights = [100, 50, 120, 80];
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基础使用" desc="从堆叠到水平排列。使用单一的一组 Row 和 Col 栅格组件即可创建基本的栅格系统，所有 Col 必须放在 Row 内。">
    <div class="grid">
      <Row>
        <Col :span="24"><div class="col-content">col-24</div></Col>
      </Row>
      <br />
      <Row>
        <Col :span="12"><div class="col-content">col-12</div></Col>
        <Col :span="12"><div class="col-content">col-12</div></Col>
      </Row>
      <br />
      <Row>
        <Col :span="8"><div class="col-content">col-8</div></Col>
        <Col :span="8"><div class="col-content">col-8</div></Col>
        <Col :span="8"><div class="col-content">col-8</div></Col>
      </Row>
      <br />
      <Row>
        <Col :span="6"><div class="col-content">col-6</div></Col>
        <Col :span="6"><div class="col-content">col-6</div></Col>
        <Col :span="6"><div class="col-content">col-6</div></Col>
        <Col :span="6"><div class="col-content">col-6</div></Col>
      </Row>
    </div>
  </DemoBlock>

  <DemoBlock title="Gutter 间隔" desc="Row 的 gutter 设置栅格间隔；数组形式 [横向, 垂直]；对象形式 { xs, sm, md, lg } 支持响应式。深色为内容物区域，浅色为间隔。">
    <div class="grid grid-gutter">
      <p>horizontal</p>
      <hr />
      <Row :gutter="16">
        <Col v-for="i in 8" :key="i" :span="6">
          <div class="col-content">col-6</div>
        </Col>
      </Row>
      <p>vertical</p>
      <hr />
      <Row :gutter="[16, 24]">
        <Col v-for="i in 8" :key="i" :span="6">
          <div class="col-content">col-6</div>
        </Col>
      </Row>
    </div>
  </DemoBlock>

  <DemoBlock title="Offset 偏移" desc="通过 offset 设置栅格左侧的间隔格数。">
    <div class="grid">
      <Row>
        <Col :span="8"><div class="col-content">col-8</div></Col>
        <Col :span="8" :offset="8">
          <div class="col-content">col-8</div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col :span="6" :offset="6">
          <div class="col-content">col-6</div>
        </Col>
        <Col :span="6" :offset="6">
          <div class="col-content">col-6</div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col :span="12" :offset="6">
          <div class="col-content">col-12</div>
        </Col>
      </Row>
    </div>
  </DemoBlock>

  <DemoBlock title="Flex 布局" desc="type=flex 下，justify 可选 start / center / end / space-between / space-around。">
    <div class="grid">
      <template v-for="item in flexJustify" :key="item.justify">
        <p>{{ item.label }}</p>
        <Row type="flex" :justify="item.justify">
          <Col v-for="i in 4" :key="i" :span="4"><div class="col-content">col-4</div></Col>
        </Row>
      </template>
    </div>
  </DemoBlock>

  <DemoBlock title="Flex 子元素垂直对齐" desc="type=flex 下，align 可选 top / middle / bottom。">
    <div class="grid grid-flex">
      <template v-for="item in flexAlign" :key="item.align">
        <p>{{ item.label }}</p>
        <Row type="flex" :justify="item.justify" :align="item.align">
          <Col v-for="(hgt, i) in heights" :key="i" :span="4">
            <div class="col-content" :style="{ height: hgt + 'px' }">col-4</div>
          </Col>
        </Row>
      </template>
    </div>
  </DemoBlock>

  <DemoBlock title="Flex 元素排序" desc="通过 Flex 布局的 order 来改变元素的排序。">
    <div class="grid">
      <Row type="flex">
        <Col :span="6" :order="4"><div class="col-content">col-4</div></Col>
        <Col :span="6" :order="3"><div class="col-content">col-3</div></Col>
        <Col :span="6" :order="2"><div class="col-content">col-2</div></Col>
        <Col :span="6" :order="1"><div class="col-content">col-1</div></Col>
      </Row>
    </div>
  </DemoBlock>

  <DemoBlock title="响应式" desc="预设六个响应尺寸：xs, sm, md, lg, xl, xxl，可为栅格数或对象配置。">
    <div class="grid">
      <Row :gutter="{ xs: 16, sm: 16, md: 16, lg: 24, xl: 24, xxl: 24 }">
        <Col :xs="2" :sm="4" :md="6" :lg="8" :xl="10"><div class="col-content">Col</div></Col>
        <Col :xs="20" :sm="16" :md="12" :lg="8" :xl="4"><div class="col-content">Col</div></Col>
        <Col :xs="2" :sm="4" :md="6" :lg="8" :xl="10"><div class="col-content">Col</div></Col>
      </Row>
      <br />
      <Row>
        <Col :xs="{ span: 5, offset: 1 }" :lg="{ span: 6, offset: 2 }"><div class="col-content">Col</div></Col>
        <Col :xs="{ span: 11, offset: 1 }" :lg="{ span: 6, offset: 2 }"><div class="col-content">Col</div></Col>
        <Col :xs="{ span: 5, offset: 1 }" :lg="{ span: 6, offset: 2 }"><div class="col-content">Col</div></Col>
      </Row>
    </div>
  </DemoBlock>
</template>

<style scoped>
.grid :deep(.semi-row),
.grid :deep(.semi-row-flex) {
  text-align: center;
}
.grid :deep(.semi-col) {
  min-height: 30px;
  line-height: 30px;
  background: var(--semi-color-primary-light-default);
  outline: 1px solid var(--semi-color-primary-light-active);
}
.grid :deep(.semi-row-flex) .semi-col {
  margin-bottom: 8px;
}
.grid .col-content {
  color: var(--semi-color-text-0);
}
.grid-gutter :deep(.semi-col) {
  background: var(--semi-color-primary-light-default);
  outline: none;
}
.grid-gutter .col-content {
  background: var(--semi-color-primary);
  color: var(--semi-color-white, #fff);
  outline: none;
}
.grid-flex :deep(.semi-col) {
  background: transparent;
  outline: none;
  line-height: normal;
}
.grid-flex .col-content {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--semi-color-primary-light-default);
  outline: 1px solid var(--semi-color-primary-light-active);
}
.grid p {
  margin: 12px 0 4px;
  color: var(--semi-color-text-2);
}
</style>
