<script setup lang="ts">
import { ref } from 'vue';
import { Pagination } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Pagination } from 'semi-design-vue';`;

// 页码受控
const page = ref(3);
function onPageChange(currentPage: number) {
  page.value = currentPage;
}
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本" desc="基础分页，通过 total 设置总条数，pageSize 设置每页容量">
    <div>
      <Pagination :total="30" :style="{ marginBottom: '12px' }" />
      <Pagination :total="80" :style="{ marginBottom: '12px' }" />
      <Pagination :total="200" :style="{ marginBottom: '12px' }" />
      <Pagination :total="80" :pageSize="30" :style="{ marginBottom: '12px' }" />
    </div>
  </DemoBlock>

  <DemoBlock title="禁用" desc="通过 disabled 设置禁用">
    <Pagination :total="30" disabled :style="{ marginBottom: '12px' }" />
  </DemoBlock>

  <DemoBlock title="总页数显示" desc="通过 showTotal 属性控制是否展示总页数">
    <div>
      <Pagination :total="80" showTotal :style="{ marginBottom: '12px' }" />
      <Pagination :total="200" showTotal :style="{ marginBottom: '12px' }" />
    </div>
  </DemoBlock>

  <DemoBlock title="指定当前页码" desc="可以通过 defaultCurrentPage 指定当前激活的页码">
    <div>
      <Pagination :total="80" showTotal :defaultCurrentPage="3" />
    </div>
  </DemoBlock>

  <DemoBlock title="每页容量切换" desc="通过设置 showSizeChanger 为 true，允许通过 Select 组件快速切换每页容量">
    <div>
      <Pagination :total="80" showSizeChanger :style="{ marginBottom: '12px' }" />
      <Pagination :total="300" showSizeChanger />
    </div>
  </DemoBlock>

  <DemoBlock
    title="快速跳转至某页"
    desc="通过设置 showQuickJumper 为 true，允许通过 Input 控件输入页码快速跳转；失焦或回车时跳转，超出总页数会自动跳到最后一页"
  >
    <div>
      <Pagination :total="80" showQuickJumper :style="{ marginBottom: '12px' }" />
      <Pagination :total="300" showQuickJumper />
    </div>
  </DemoBlock>

  <DemoBlock title="页码受控" desc="传入 currentPage 后，分页器即为受控组件，一般配合 @pageChange 使用（也可直接 v-model:currentPage）">
    <div>
      <Pagination :total="200" :currentPage="page" @pageChange="onPageChange" />
      <div style="margin-top: 8px; color: var(--semi-color-text-2)">当前页码：{{ page }}</div>
    </div>
  </DemoBlock>

  <DemoBlock title="预设每页容量可选值" desc="传入 pageSizeOpts 数组，指定切换每页容量的可选值">
    <div>
      <Pagination :total="300" showSizeChanger :style="{ marginBottom: '12px' }" :pageSizeOpts="[50, 80, 90, 200]" />
      <Pagination :total="300" showSizeChanger :pageSizeOpts="[10, 20, 50, 200]" />
    </div>
  </DemoBlock>

  <DemoBlock title="迷你版本" desc="size 设置为 small">
    <Pagination :total="90" size="small" />
  </DemoBlock>

  <DemoBlock title="迷你版本 - hoverShowPageSelect" desc="开启 hoverShowPageSelect，可以 hover 页码快速切换">
    <Pagination :total="90" size="small" hoverShowPageSelect />
  </DemoBlock>
</template>
