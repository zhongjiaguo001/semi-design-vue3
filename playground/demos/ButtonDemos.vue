<script setup lang="ts">
import { ref } from 'vue';
import {
  Button,
  ButtonGroup,
  SplitButtonGroup,
  Dropdown,
  Typography,
  Text,
  IconCamera,
  IconSidebar,
  IconChevronDown,
  IconDelete,
  IconLink,
  IconAIFilledLevel1,
  IconAIFilledLevel2,
  IconAIFilledLevel3,
  IconTreeTriangleDown,
} from '@/index';
import DemoBlock from '../DemoBlock.vue';

const saveLoading = ref(false);
const delLoading = ref(true);
const splitMenu = [
  { node: 'item', name: '编辑项目' },
  { node: 'item', name: '重置项目' },
  { node: 'divider' },
  { node: 'item', name: '复制项目' },
  { node: 'item', name: '删除项目', type: 'danger' },
];
const groupSizes = ['large', 'default', 'small'] as const;
const groupTypes = ['primary', 'secondary', 'warning', 'danger'] as const;
</script>

<template>
  <DemoBlock
    title="如何引入"
    desc="从包中引入 Button、ButtonGroup、SplitButtonGroup。"
    code="import { Button, SplitButtonGroup } from 'semi-design-vue'"
  >
    <Text type="tertiary">见下方各示例。</Text>
  </DemoBlock>

  <DemoBlock
    title="按钮类型"
    desc="主按钮 primary（默认）、次要 secondary、第三 tertiary、警告 warning、危险 danger。"
    code="<Button>主要按钮</Button>
<Button type=&quot;secondary&quot;>次要按钮</Button>"
  >
    <div class="gap">
      <Button>主要按钮</Button>
      <Button type="secondary">次要按钮</Button>
      <Button type="tertiary">第三按钮</Button>
      <Button type="warning">警告按钮</Button>
      <Button type="danger">危险按钮</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="关于类型字体色值" desc="字体色值使用 CSS Variables：--semi-color-primary / secondary / tertiary / warning / danger。">
    <strong style="color: var(--semi-color-primary); margin-right: 10px">主要</strong>
    <strong style="color: var(--semi-color-secondary); margin-right: 10px">次要</strong>
    <strong style="color: var(--semi-color-tertiary); margin-right: 10px">第三</strong>
    <strong style="color: var(--semi-color-warning); margin-right: 10px">警告</strong>
    <strong style="color: var(--semi-color-danger); margin-right: 10px">危险</strong>
  </DemoBlock>

  <DemoBlock title="按钮主题 · 浅色 light" desc="默认主题为 light。">
    <div class="gap">
      <Button theme="light" type="primary">浅色主要</Button>
      <Button theme="light" type="secondary">浅色次要</Button>
      <Button theme="light" type="tertiary">浅色第三</Button>
      <Button theme="light" type="warning">浅色警告</Button>
      <Button theme="light" type="danger">浅色危险</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="按钮主题 · 深色 solid">
    <div class="gap">
      <Button theme="solid" type="primary">深色主要</Button>
      <Button theme="solid" type="secondary">深色次要</Button>
      <Button theme="solid" type="tertiary">深色第三</Button>
      <Button theme="solid" type="warning">深色警告</Button>
      <Button theme="solid" type="danger">深色危险</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="按钮主题 · 无背景 borderless">
    <div class="gap">
      <Button theme="borderless" type="primary">主要</Button>
      <Button theme="borderless" type="secondary">次要</Button>
      <Button theme="borderless" type="tertiary">第三</Button>
      <Button theme="borderless" type="warning">警告</Button>
      <Button theme="borderless" type="danger">危险</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="按钮主题 · 边框 outline">
    <div class="gap">
      <Button theme="outline" type="primary">主要</Button>
      <Button theme="outline" type="secondary">次要</Button>
      <Button theme="outline" type="tertiary">第三</Button>
      <Button theme="outline" type="warning">警告</Button>
      <Button theme="outline" type="danger">危险</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="large / default / small。">
    <div class="gap">
      <Button size="large">大尺寸</Button>
      <Button size="default">默认尺寸</Button>
      <Button size="small">小尺寸</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="块级按钮" desc="block 宽度与内容无关，占满父容器。">
    <Button block>块级按钮</Button>
  </DemoBlock>

  <DemoBlock title="图标按钮" desc="通过 icon 定义图标，iconPosition 可改为 right。">
    <div>
      <p><strong>默认状态：</strong></p>
      <Button :icon="IconCamera" aria-label="截屏" />
      <p style="margin-top: 12px"><strong>禁用状态：</strong></p>
      <Button disabled :icon="IconCamera" aria-label="截屏" />
      <p style="margin-top: 12px"><strong>复合类型：</strong></p>
      <div class="gap">
        <Button type="primary" :icon="IconCamera" />
        <Button type="secondary" :icon="IconCamera" />
        <Button type="warning" :icon="IconCamera" />
        <Button type="danger" :icon="IconCamera" />
      </div>
      <p style="margin-top: 12px"><strong>更改图标位置：</strong></p>
      <div class="gap">
        <Button :icon="IconSidebar" theme="solid">收起</Button>
        <Button :icon="IconChevronDown" theme="solid" iconPosition="right">展开选项</Button>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="链接按钮" desc="推荐用 Typography 的 link 实现文字链接。">
    <Text :link="{ href: 'https://semi.design/' }">链接文本</Text>
    <br /><br />
    <Text link :icon="IconLink" underline>带下划线的网页链接</Text>
  </DemoBlock>

  <DemoBlock title="禁用状态">
    <div class="gap">
      <Button disabled>禁用</Button>
      <Button disabled theme="borderless">无背景禁用</Button>
      <Button disabled theme="light">浅色禁用</Button>
      <Button disabled theme="solid" type="warning">深色警告禁用</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="加载状态" desc="loading=true 展示加载。disabled 优先级高于 loading。">
    <div class="gap" style="margin-bottom: 12px">
      <Button @click="saveLoading = false; delLoading = false">关闭加载态</Button>
      <Button @click="saveLoading = true; delLoading = true">开启加载态</Button>
    </div>
    <div class="gap">
      <Button :loading="saveLoading" @click="saveLoading = true">保存</Button>
      <Button :loading="delLoading" :icon="IconDelete" type="danger">删除</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="AI 风格 · 多彩按钮" desc="设置 colorful。type 仅支持 primary / tertiary，theme 全部可用。官网 AIButton 即此用法。">
    <div class="stack">
      <div class="gap">
        <Button colorful theme="solid" type="primary" :icon="IconAIFilledLevel1">Colorful</Button>
        <Button colorful theme="solid" type="primary" :loading="true">Colorful</Button>
        <Button colorful theme="solid" type="tertiary" :icon="IconAIFilledLevel3">Colorful</Button>
      </div>
      <div class="gap">
        <Button colorful theme="light" type="primary" :icon="IconAIFilledLevel2">Colorful</Button>
        <Button colorful theme="outline" type="primary" :icon="IconAIFilledLevel1">Colorful</Button>
        <Button colorful theme="borderless" type="primary" :icon="IconAIFilledLevel3">Colorful</Button>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="按钮组合" desc="ButtonGroup 可统一 size / disabled / type。">
    <div class="stack">
      <div class="gap">
        <ButtonGroup v-for="s in groupSizes" :key="s" :size="s">
          <Button>拷贝</Button>
          <Button>查询</Button>
          <Button>剪切</Button>
        </ButtonGroup>
      </div>
      <ButtonGroup disabled>
        <Button>拷贝</Button>
        <Button>查询</Button>
        <Button>剪切</Button>
      </ButtonGroup>
      <div class="gap">
        <ButtonGroup v-for="t in groupTypes" :key="t" :type="t">
          <Button>拷贝</Button>
          <Button>查询</Button>
          <Button>剪切</Button>
        </ButtonGroup>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="分裂按钮组合" desc="Button + Dropdown 场景使用 SplitButtonGroup。">
    <SplitButtonGroup>
      <Button theme="solid" type="primary">分裂按钮</Button>
      <Dropdown :menu="splitMenu" trigger="click" position="bottomRight">
        <Button theme="solid" type="primary" :icon="IconTreeTriangleDown" />
      </Dropdown>
    </SplitButtonGroup>
  </DemoBlock>
</template>

<style scoped>
.gap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
