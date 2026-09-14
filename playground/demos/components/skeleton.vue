<script setup lang="ts">
import { h, ref } from 'vue';
import {
  Skeleton,
  Switch,
  Avatar,
  Button,
  Descriptions,
  Table,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Skeleton } from 'semi-design-vue';
// 子组件也可通过 Skeleton.Avatar / Title / Paragraph / Image / Button 访问`;

const loading = ref(true);
const showContent = () => {
  loading.value = !loading.value;
};

const imgSrc = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/dy.png';

const comboStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  width: '300px',
  marginBottom: '10px',
};

const avatarTitleStyle = { display: 'flex', alignItems: 'center' };
const avatarParaStyle = { display: 'flex', alignItems: 'flex-start' };

const tableData = {
  columns: [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Age', dataIndex: 'age' },
    { title: 'Address', dataIndex: 'address' },
  ],
  content: [
    { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park, New York No. 1 Lake Park' },
    { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
    { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
    { key: '4', name: 'Disabled User', age: 99, address: 'Sidney No. 1 Lake Park' },
  ],
};

const skColumns = [1, 2, 3].map((key) => ({
  title: h(Skeleton.Title, { style: { width: '0' } }),
  dataIndex: `${key}`,
}));
const skDataSource = [1, 2, 3, 4].map((key) => {
  const item: Record<string, any> = { key };
  [1, 2, 3].forEach((i) => {
    item[i] = h(Skeleton.Paragraph, { style: { width: `${50 * i}px` }, rows: 1 });
  });
  return item;
});
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本使用" desc="通过 loading 控制展示占位元素还是子组件；placeholder 可作为 prop 或同名插槽传入。">
    <span :style="{ display: 'flex', alignItems: 'center' }">
      <Switch @change="showContent" />
      <span :style="{ marginLeft: '10px' }">显示加载内容</span>
    </span>
    <br />
    <Skeleton :loading="loading">
      <template #placeholder>
        <Skeleton.Avatar />
      </template>
      <Avatar color="blue" :style="{ marginBottom: '10px' }">U</Avatar>
    </Skeleton>
    <br />
    <Skeleton :style="{ width: '200px', height: '150px' }" :loading="loading">
      <template #placeholder>
        <Skeleton.Image />
      </template>
      <img :src="imgSrc" height="150" alt="avatar" />
    </Skeleton>
    <br />
    <Skeleton :style="{ width: '80px' }" :loading="loading">
      <template #placeholder>
        <Skeleton.Title :style="{ marginBottom: '10px' }" />
      </template>
      <h4 :style="{ marginBottom: 0 }">Semi UI</h4>
    </Skeleton>
    <Skeleton :style="{ width: '240px' }" :loading="loading">
      <template #placeholder>
        <Skeleton.Paragraph :rows="2" />
      </template>
      <p :style="{ width: '240px' }">精心打磨每一个组件的用户体验，从用户的角度考虑每个组件的使用场景。</p>
    </Skeleton>
    <br />
    <Skeleton :loading="loading">
      <template #placeholder>
        <Skeleton.Button />
      </template>
      <Button>Button</Button>
    </Skeleton>
  </DemoBlock>

  <DemoBlock title="组合使用" desc="图片和标题。">
    <Skeleton :loading="true">
      <template #placeholder>
        <div>
          <Skeleton.Image :style="{ width: '200px', height: '150px' }" />
          <Skeleton.Title :style="{ width: '120px', marginTop: '10px' }" />
        </div>
      </template>
      <img :src="imgSrc" height="150" alt="avatar" />
      <h4>Semi UI</h4>
    </Skeleton>

  </DemoBlock>

  <DemoBlock title="组合使用 - 2" desc="统计数字。">
    <Skeleton :loading="true">
      <template #placeholder>
        <div>
          <Skeleton.Paragraph :rows="1" :style="{ width: '80px', marginBottom: '10px' }" />
          <Skeleton.Title :style="{ width: '120px' }" />
        </div>
      </template>
      <Descriptions :data="[{ key: '实际用户数量', value: '1,480,000' }]" row />
    </Skeleton>

  </DemoBlock>

  <DemoBlock title="组合使用 - 3" desc="头像和标题。">
    <Skeleton :loading="true">
      <template #placeholder>
        <div :style="avatarTitleStyle">
          <Skeleton.Avatar :style="{ marginRight: '12px' }" />
          <Skeleton.Title :style="{ width: '120px' }" />
        </div>
      </template>
      <Avatar color="blue" :style="{ marginRight: '12px' }">UI</Avatar>
      <span>Semi UI</span>
    </Skeleton>

  </DemoBlock>

  <DemoBlock title="组合使用 - 4" desc="居中段落和按钮。">
    <Skeleton :loading="true" :style="{ textAlign: 'center' }">
      <template #placeholder>
        <div :style="comboStyle">
          <Skeleton.Paragraph :style="comboStyle" :rows="3" />
          <Skeleton.Button />
        </div>
      </template>
      <div :style="{ textAlign: 'center' }">
        <p>Hi, Bytedance dance dance.</p>
        <p>Hi, Bytedance dance dance.</p>
        <Button>Button</Button>
      </div>
    </Skeleton>

  </DemoBlock>

  <DemoBlock title="组合使用 - 5" desc="头像、标题和段落。">
    <Skeleton :loading="true">
      <template #placeholder>
        <div :style="avatarParaStyle">
          <Skeleton.Avatar :style="{ marginRight: '12px' }" />
          <div>
            <Skeleton.Title :style="{ width: '120px', marginBottom: '12px', marginTop: '12px' }" />
            <Skeleton.Paragraph :style="{ width: '240px' }" :rows="3" />
          </div>
        </div>
      </template>
      <div :style="avatarParaStyle">
        <Avatar color="blue" :style="{ marginRight: '12px' }">UI</Avatar>
        <div>
          <h3>Semi UI</h3>
          <p>Hi, Bytedance dance dance.</p>
          <p>Hi, Bytedance dance dance.</p>
          <p>Hi, Bytedance dance dance.</p>
        </div>
      </div>
    </Skeleton>

  </DemoBlock>

  <DemoBlock title="组合使用 - 6" desc="表格。">
    <Skeleton :loading="true">
      <template #placeholder>
        <div :style="{ position: 'relative' }">
          <Table
            :style="{ backgroundColor: 'var(--semi-color-bg-1)' }"
            :columns="skColumns"
            :dataSource="skDataSource"
            :pagination="false"
          />
          <div :style="{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }" />
        </div>
      </template>
      <Table :columns="tableData.columns" :dataSource="tableData.content" :pagination="false" />
    </Skeleton>
  </DemoBlock>

  <DemoBlock title="加载动画" desc="通过设置 active 属性可以展示动画效果。">
    <Skeleton active :loading="true">
      <template #placeholder>
        <div :style="avatarParaStyle">
          <Skeleton.Avatar :style="{ marginRight: '12px' }" />
          <div>
            <Skeleton.Title :style="{ width: '120px', marginBottom: '12px', marginTop: '12px' }" />
            <Skeleton.Paragraph :style="{ width: '240px' }" :rows="3" />
          </div>
        </div>
      </template>
      <div :style="avatarParaStyle">
        <Avatar color="blue" :style="{ marginRight: '12px' }">UI</Avatar>
        <div>
          <h3>Semi UI</h3>
          <p>Hi, Bytedance dance dance.</p>
        </div>
      </div>
    </Skeleton>
  </DemoBlock>
</template>
