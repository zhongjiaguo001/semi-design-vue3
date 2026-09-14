<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  Button,
  ButtonGroup,
  SplitButtonGroup,
  Dropdown,
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
import DemoBlock from '../../DemoBlock.vue';

const colorTypes: Array<[string, string]> = [
  ['primary', '主要'],
  ['secondary', '次要'],
  ['tertiary', '第三'],
  ['warning', '警告'],
  ['danger', '危险'],
];

// 加载状态
const saveLoading = ref(false);
const delLoading = ref(true);
const repLoading = ref(true);
const reset = (status: boolean) => {
  status = !!status;
  saveLoading.value = status;
  delLoading.value = status;
  repLoading.value = status;
};

// AI 风格 - 多彩按钮
const colorfulContents: Array<string | undefined> = ['Colorful', undefined];
const colorfulRows = [
  { theme: 'solid', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel3 },
  { theme: 'light', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
  { theme: 'outline', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel2 },
  { theme: 'borderless', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
] as const;

// 按钮组合
const groupSizes = ['large', 'default', 'small'] as const;
const groupTypes = ['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const;

// 分裂按钮组合
const menu = [
  { node: 'item', name: '编辑项目', onClick: () => console.log('编辑项目点击') },
  { node: 'item', name: '重置项目' },
  { node: 'divider' },
  { node: 'item', name: '复制项目' },
  { node: 'item', name: '从项目创建模版' },
  { node: 'divider' },
  { node: 'item', name: '删除项目', type: 'danger' },
] as any[];
const btnVisible = reactive<Record<number, boolean>>({ 1: false, 2: false, 3: false });
const handleVisibleChange = (key: number, visible: boolean) => {
  btnVisible[key] = visible;
};
</script>

<template>
  <DemoBlock
    title="如何引入"
    desc="从包中引入 Button、ButtonGroup、SplitButtonGroup。"
    code="import { Button, SplitButtonGroup } from 'semi-design-vue'"
  />

  <DemoBlock
    title="按钮类型"
    desc="主按钮 primary（默认）、次要 secondary、第三 tertiary、警告 warning、危险 danger。"
    code="<Button>主要按钮</Button>
<Button type=&quot;secondary&quot;>次要按钮</Button>
<Button type=&quot;tertiary&quot;>第三按钮</Button>
<Button type=&quot;warning&quot;>警告按钮</Button>
<Button type=&quot;danger&quot;>危险按钮</Button>"
  >
    <div class="btn-margin-right">
      <Button>主要按钮</Button>
      <Button type="secondary">次要按钮</Button>
      <Button type="tertiary">第三按钮</Button>
      <Button type="warning">警告按钮</Button>
      <Button type="danger">危险按钮</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="关于类型字体色值" desc="字体色值使用 CSS Variables：var(--semi-color-primary / secondary / tertiary / warning / danger)，可直接用于自定义元素。">
    <article>
      <strong
        v-for="([type, label], index) in colorTypes"
        :key="index"
        :style="{ color: `var(--semi-color-${type})`, marginRight: '10px' }"
      >
        {{ label }}
      </strong>
    </article>
  </DemoBlock>

  <DemoBlock title="浅色背景" desc="theme='light'（默认主题）。">
    <Button theme="light" type="primary" style="margin-right: 8px">浅色主要</Button>
    <Button theme="light" type="secondary" style="margin-right: 8px">浅色次要</Button>
    <Button theme="light" type="tertiary" style="margin-right: 8px">浅色第三</Button>
    <Button theme="light" type="warning" style="margin-right: 8px">浅色警告</Button>
    <Button theme="light" type="danger" style="margin-right: 8px">浅色危险</Button>
  </DemoBlock>

  <DemoBlock title="深色背景" desc="theme='solid'。">
    <Button theme="solid" type="primary" style="margin-right: 8px">深色主要</Button>
    <Button theme="solid" type="secondary" style="margin-right: 8px">深色次要</Button>
    <Button theme="solid" type="tertiary" style="margin-right: 8px">深色第三</Button>
    <Button theme="solid" type="warning" style="margin-right: 8px">深色警告</Button>
    <Button theme="solid" type="danger" style="margin-right: 8px">深色危险</Button>
  </DemoBlock>

  <DemoBlock title="无背景" desc="theme='borderless'。">
    <Button theme="borderless" type="primary" style="margin-right: 8px">主要</Button>
    <Button theme="borderless" type="secondary" style="margin-right: 8px">次要</Button>
    <Button theme="borderless" type="tertiary" style="margin-right: 8px">第三</Button>
    <Button theme="borderless" type="warning" style="margin-right: 8px">警告</Button>
    <Button theme="borderless" type="danger" style="margin-right: 8px">危险</Button>
  </DemoBlock>

  <DemoBlock title="边框模式" desc="theme='outline'。">
    <Button theme="outline" type="primary" style="margin-right: 8px">主要</Button>
    <Button theme="outline" type="secondary" style="margin-right: 8px">次要</Button>
    <Button theme="outline" type="tertiary" style="margin-right: 8px">第三</Button>
    <Button theme="outline" type="warning" style="margin-right: 8px">警告</Button>
    <Button theme="outline" type="danger" style="margin-right: 8px">危险</Button>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="large / default / small。">
    <div>
      <Button size="large" style="margin-right: 8px">大尺寸</Button>
      <Button size="default" style="margin-right: 8px">默认尺寸</Button>
      <Button size="small">小尺寸</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="块级按钮" desc="block 按钮具有预先定义好的宽度，与内容宽度无关。">
    <div>
      <Button block>块级按钮</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="图标按钮" desc="通过 icon 定义按钮图标，iconPosition 可改为 right。">
    <div>
      <strong>默认状态：</strong>
      <Button :icon="IconCamera" aria-label="截屏" />
      <br /><br />
      <strong>禁用状态：</strong>
      <Button disabled :icon="IconCamera" aria-label="截屏" />
      <br /><br />
      <strong>复合类型：</strong>
      <span class="btn-margin-right">
        <Button type="primary" :icon="IconCamera" aria-label="截屏" />
        <Button type="secondary" :icon="IconCamera" aria-label="截屏" />
        <Button type="warning" :icon="IconCamera" aria-label="截屏" />
        <Button type="danger" :icon="IconCamera" aria-label="截屏" />
      </span>
      <br /><br />
      <strong>更改主题：</strong>
      <Button :icon="IconCamera" theme="solid" style="margin-right: 10px" aria-label="截屏" />
      <Button :icon="IconCamera" theme="light" aria-label="截屏" />
      <br /><br />
      <strong>更改图标位置：</strong>
      <Button :icon="IconSidebar" theme="solid" style="margin-right: 10px">收起</Button>
      <Button :icon="IconChevronDown" theme="solid" iconPosition="right">展开选项</Button>
      <br /><br />
    </div>
  </DemoBlock>

  <DemoBlock title="链接按钮" desc="推荐使用 Typography 的 link 属性实现链接型文字按钮。">
    <div>
      <Text :link="{ href: 'https://semi.design/' }">链接文本</Text>
      <br />
      <br />
      <Text :link="{ href: 'https://semi.design/' }">打开网站</Text>
      <br />
      <br />
      <Text link :icon="IconLink" underline>带下划线的网页链接</Text>
    </div>
  </DemoBlock>

  <DemoBlock title="禁用状态" desc="disabled 禁用按钮。">
    <div class="btn-margin-right">
      <Button disabled>禁用</Button>
      <Button disabled theme="borderless">无背景禁用</Button>
      <Button disabled theme="light">浅色禁用</Button>
      <Button disabled theme="borderless" type="primary">无背景主要禁用</Button>
      <Button disabled theme="solid" type="warning">深色警告禁用</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="加载状态" desc="loading=true 展示加载态；disabled 状态优先级高于 loading。">
    <div>
      <div>
        <div class="btn-margin-right" style="display: inline-flex; align-items: center; padding-bottom: 14px">
          <Button @click="reset(false)">关闭加载态</Button>
          <Button @click="reset(true)">开启加载态</Button>
        </div>
      </div>
      <hr />
      <Button :loading="saveLoading" style="margin-right: 14px" @click="saveLoading = true">保存</Button>
      <Button :loading="delLoading" :icon="IconDelete" type="danger" style="margin-right: 14px" @click="delLoading = true">删除</Button>
      <div style="width: 200px; display: inline-block">
        <Button :loading="repLoading" type="warning" block theme="solid" @click="repLoading = true">撤销</Button>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="AI 风格 - 多彩按钮" desc="设置 colorful 即可获得多彩按钮；支持所有 theme，type 仅支持 primary 及 tertiary。">
    <div
      v-for="(content, ci) in colorfulContents"
      :key="ci"
      style="display: flex; row-gap: 16px; margin-top: 20px; margin-left: 10px; flex-direction: column"
    >
      <div v-for="row in colorfulRows" :key="row.theme" style="display: flex; column-gap: 16px">
        <Button colorful :theme="row.theme" type="primary" :icon="row.primaryIcon">{{ content }}</Button>
        <Button colorful :theme="row.theme" type="primary" loading>{{ content }}</Button>
        <Button colorful :theme="row.theme" type="primary" :icon="row.primaryIcon" disabled>{{ content }}</Button>
        <Button colorful :theme="row.theme" type="tertiary" :icon="row.tertiaryIcon">{{ content }}</Button>
        <Button colorful :theme="row.theme" type="tertiary" loading>{{ content }}</Button>
        <Button colorful :theme="row.theme" type="tertiary" :icon="row.tertiaryIcon" disabled>{{ content }}</Button>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="组合尺寸" desc="ButtonGroup 通过 size 统一设置按钮尺寸。">
    <div style="display: flex">
      <div v-for="size in groupSizes" :key="size" style="margin-right: 10px">
        <ButtonGroup :size="size">
          <Button>拷贝</Button>
          <Button>查询</Button>
          <Button>剪切</Button>
        </ButtonGroup>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="组合禁用" desc="ButtonGroup 通过 disabled 统一禁用。">
    <div style="display: flex">
      <div style="margin-right: 10px">
        <ButtonGroup disabled>
          <Button>拷贝</Button>
          <Button>查询</Button>
          <Button>剪切</Button>
        </ButtonGroup>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="组合类型" desc="ButtonGroup 通过 type 统一设置按钮类型。">
    <div style="display: flex">
      <div v-for="type in groupTypes" :key="type" style="margin-right: 10px">
        <ButtonGroup :type="type" aria-label="操作按钮组">
          <Button>拷贝</Button>
          <Button>查询</Button>
          <Button>剪切</Button>
        </ButtonGroup>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="基础使用" desc="分裂按钮组合：Button 与 Dropdown 结合时使用 SplitButtonGroup，增加按钮间隔并改变边框圆角。">
    <div>
      <SplitButtonGroup style="margin-right: 10px" aria-label="项目操作按钮组">
        <Button theme="solid" type="primary">分裂按钮</Button>
        <Dropdown :menu="menu" trigger="click" position="bottomRight" @visibleChange="(v: boolean) => handleVisibleChange(1, v)">
          <Button
            :style="btnVisible[1] ? { background: 'var(--semi-color-primary-hover)', padding: '8px 4px' } : { padding: '8px 4px' }"
            theme="solid"
            type="primary"
            :icon="IconTreeTriangleDown"
          />
        </Dropdown>
      </SplitButtonGroup>
      <SplitButtonGroup style="margin-right: 10px" aria-label="项目操作按钮组">
        <Button theme="light" type="primary">分裂按钮</Button>
        <Dropdown :menu="menu" trigger="click" position="bottomRight" @visibleChange="(v: boolean) => handleVisibleChange(2, v)">
          <Button
            :style="btnVisible[2] ? { background: 'var(--semi-color-fill-1)', padding: '8px 4px' } : { padding: '8px 4px' }"
            theme="light"
            type="primary"
            :icon="IconTreeTriangleDown"
          />
        </Dropdown>
      </SplitButtonGroup>
      <SplitButtonGroup aria-label="项目操作按钮组">
        <Button :style="btnVisible[3] ? { background: 'var(--semi-color-fill-0)' } : {}" theme="borderless" type="primary">分裂按钮</Button>
        <Dropdown :menu="menu" trigger="click" position="bottomRight" @visibleChange="(v: boolean) => handleVisibleChange(3, v)">
          <Button
            :style="btnVisible[3] ? { background: 'var(--semi-color-fill-1)', padding: '8px 4px' } : { padding: '8px 4px' }"
            theme="borderless"
            type="primary"
            :icon="IconTreeTriangleDown"
          />
        </Dropdown>
      </SplitButtonGroup>
    </div>
  </DemoBlock>
</template>

<style scoped>
.btn-margin-right {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>
