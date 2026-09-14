<script setup lang="ts">
import { h } from 'vue';
import type { VNode } from 'vue';
import { Breadcrumb, BreadcrumbItem, Tag, Text, Popover, IconHome, IconArticle, IconArrowRight, IconMore } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Breadcrumb } from 'semi-design-vue';
// 子项：<Breadcrumb.Item> 或 <BreadcrumbItem>`;

// 截断逻辑
const routes = ['首页', '当这个页面标题很长很长很长时需要省略', '详情页'];

// 路由对象
const objectRoutes = [
  {
    path: '/',
    href: '/',
    icon: h(IconHome, { size: 'small' }),
  },
  {
    path: '/breadcrumb',
    href: '/zh-CN/navigation/breadcrumb',
    name: 'breadcrumb',
    icon: h(IconArticle, { size: 'small' }),
  },
  'with icon',
];

// 自定义省略号区域 - renderMore
const moreSeparator = '-'; // 用于拼接 restItem 数组项的分隔符
const renderMore = (restItem: VNode[]) => {
  const content = () =>
    restItem.map((item, idx) => [
      item,
      idx !== restItem.length - 1 ? h('span', { style: { color: 'var(--semi-color-text-2)', marginRight: '6px' } }, moreSeparator) : null,
    ]);
  return h(Popover, { content, style: { padding: '12px' }, showArrow: true }, { default: () => h(IconMore) });
};

const onItemClick = (item: any, e: Event) => console.log(item, e);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="面包屑由若干 Breadcrumb.Item 组成，最后一项为当前页面。">
    <Breadcrumb>
      <BreadcrumbItem>Semi-ui</BreadcrumbItem>
      <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
      <BreadcrumbItem>Default</BreadcrumbItem>
    </Breadcrumb>
  </DemoBlock>

  <DemoBlock title="带图标的" desc="支持标题只显示图标或者同时显示图标和文本。">
    <Breadcrumb>
      <BreadcrumbItem>
        <template #icon><IconHome size="small" /></template>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <template #icon><IconArticle size="small" /></template>
        Breadcrumb
      </BreadcrumbItem>
      <BreadcrumbItem>With Icon</BreadcrumbItem>
    </Breadcrumb>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="默认为 compact，设置属性为 false 可使图标和文字尺寸增加。">
    <div>
      <Breadcrumb compact>
        <BreadcrumbItem>
          <template #icon><IconHome size="small" /></template>
        </BreadcrumbItem>
        <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
        <BreadcrumbItem>Loose</BreadcrumbItem>
      </Breadcrumb>
      <br />
      <Breadcrumb :compact="false">
        <BreadcrumbItem>
          <template #icon><IconHome size="small" /></template>
        </BreadcrumbItem>
        <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
        <BreadcrumbItem>Loose</BreadcrumbItem>
      </Breadcrumb>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义的分隔符" desc="默认为 /。separator 支持字符串或节点（prop / 插槽），Breadcrumb.Item 也可以单独覆盖分隔符。">
    <div>
      <Breadcrumb separator=">">
        <BreadcrumbItem>Semi-ui</BreadcrumbItem>
        <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
        <BreadcrumbItem>Default</BreadcrumbItem>
      </Breadcrumb>
      <br />
      <Breadcrumb>
        <template #separator><IconArrowRight size="small" /></template>
        <BreadcrumbItem>Semi-ui</BreadcrumbItem>
        <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
        <BreadcrumbItem>Default</BreadcrumbItem>
      </Breadcrumb>
      <br />
      <Tag>v>=1.16.0</Tag>
      <br />
      <Breadcrumb>
        <BreadcrumbItem separator=":">Semi-ui</BreadcrumbItem>
        <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
        <BreadcrumbItem>Default</BreadcrumbItem>
      </Breadcrumb>
    </div>
  </DemoBlock>

  <DemoBlock title="截断逻辑" desc="当级别名字溢出设定宽度后省略截断。可以通过 showTooltip 属性设置相关参数。默认宽度 150px，鼠标悬停时显示 Tooltip 完整显示级别名称。">
    <div>
      <Text size="small">默认行为</Text>
      <Breadcrumb :routes="routes" />
      <br />
      <Text size="small">省略但不显示Tooltip</Text>
      <Breadcrumb :showTooltip="false" :routes="routes" />
      <br />
      <Text size="small">不截断</Text>
      <Breadcrumb :showTooltip="{ width: 'auto' }" :routes="routes" />
      <br />
      <Text size="small">从标题中间开始省略</Text>
      <Breadcrumb :showTooltip="{ ellipsisPos: 'middle' }" :routes="routes" />
      <br />
      <Text size="small">自定义 Tooltip 参数</Text>
      <Breadcrumb :showTooltip="{ opts: { position: 'topLeft' } }" :routes="routes" />
    </div>
  </DemoBlock>

  <DemoBlock title="截断逻辑 - 2" desc="当路径层级超过 4 个级别，则：第二层至倒数第三层省略，点击省略号展开显示全部级别；如果过长则自动换行。可以通过 maxItemCount 来控制超过多少个级别进行折叠。">
    <Breadcrumb>
      <BreadcrumbItem>首页</BreadcrumbItem>
      <BreadcrumbItem>当层级很多的时候</BreadcrumbItem>
      <BreadcrumbItem>又一层</BreadcrumbItem>
      <BreadcrumbItem>再一层</BreadcrumbItem>
      <BreadcrumbItem>上上一层</BreadcrumbItem>
      <BreadcrumbItem>上一层</BreadcrumbItem>
      <BreadcrumbItem>详情页</BreadcrumbItem>
    </Breadcrumb>
  </DemoBlock>

  <DemoBlock title="自定义省略号区域" desc="组件内部提供了两种省略号区域渲染的类型，可通过 moreType 来设置，moreType 的可选值为 default 和 popover。">
    <Breadcrumb moreType="popover">
      <BreadcrumbItem>首页</BreadcrumbItem>
      <BreadcrumbItem>当层级很多的时候</BreadcrumbItem>
      <BreadcrumbItem>又一层</BreadcrumbItem>
      <BreadcrumbItem>再一层</BreadcrumbItem>
      <BreadcrumbItem>上上一层</BreadcrumbItem>
      <BreadcrumbItem>上一层</BreadcrumbItem>
      <BreadcrumbItem>详情页</BreadcrumbItem>
    </Breadcrumb>
  </DemoBlock>

  <DemoBlock title="自定义省略号区域 - 2" desc="如果想要为省略号区域自定义其他形式的渲染，则可以使用 renderMore 属性（或 #more 插槽，参数 restItem 为被折叠的项）。">
    <Breadcrumb :renderMore="(restItem) => renderMore(restItem)" @click="onItemClick">
      <BreadcrumbItem>首页</BreadcrumbItem>
      <BreadcrumbItem>当层级很多的时候</BreadcrumbItem>
      <BreadcrumbItem>又一层</BreadcrumbItem>
      <BreadcrumbItem>再一层</BreadcrumbItem>
      <BreadcrumbItem>上上一层</BreadcrumbItem>
      <BreadcrumbItem>上一层</BreadcrumbItem>
      <BreadcrumbItem>详情页</BreadcrumbItem>
    </Breadcrumb>
  </DemoBlock>

  <DemoBlock title="路由对象" desc="支持通过 routes 传入路由对象 { name, path, href, icon } 或字符串组成的数组，可配合 renderItem（或 #item 插槽）渲染节点。通过这样实现的 Breadcrumb 同样会进行截断处理。">
    <div>
      <Breadcrumb :routes="['Semi-ui', 'Breadcrumb', 'Default']" />
      <br />
      <Breadcrumb :routes="objectRoutes" />
      <br />
      <Breadcrumb :routes="['首页', '当这个页面标题很长时需要省略', '详情页']" />
    </div>
  </DemoBlock>
</template>
