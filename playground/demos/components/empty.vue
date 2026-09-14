<script setup lang="ts">
import { h } from 'vue';
import { Empty, Button, Text } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Empty } from 'semi-design-vue';`;

/** Vue 端口未内置 @douyinfe/semi-illustrations，用色块 SVG 占位对照官网插画名。 */
function illus(color: string, caption: string) {
  return () =>
    h('svg', { width: 150, height: 150, viewBox: '0 0 150 150', 'aria-hidden': 'true' }, [
      h('rect', { width: 150, height: 150, rx: 16, fill: color, 'fill-opacity': 0.12 }),
      h('circle', { cx: 75, cy: 62, r: 28, fill: color, 'fill-opacity': 0.85 }),
      h('text', { x: 75, y: 118, 'text-anchor': 'middle', fill: color, 'font-size': 12 }, caption),
    ]);
}

const construction = illus('var(--semi-color-warning)', 'Construction');
const noContent = illus('var(--semi-color-tertiary)', 'NoContent');
const success = illus('var(--semi-color-success)', 'Success');
const failure = illus('var(--semi-color-danger)', 'Failure');
const noAccess = illus('var(--semi-color-warning)', 'NoAccess');
const notFound = illus('var(--semi-color-primary)', 'NotFound');
const noResult = illus('var(--semi-color-tertiary)', 'NoResult');
const idle = illus('var(--semi-color-link)', 'Idle');

const emptyStyle = { padding: '30px' };
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="image 设置占位图。官网从 @douyinfe/semi-illustrations 引入插画；Vue 端口用 SVG 占位。darkModeImage 可在暗色模式下切换。"
  >
    <Empty :image="construction" title="功能建设中" description="当前功能暂未开放，敬请期待。" />
  </DemoBlock>

  <DemoBlock title="自定义" desc="通过默认插槽自定义描述区操作；也可以不使用图片。">
    <Empty :image="noContent" title="空状态标题" description="开始创建你的第一个仪表盘吧！">
      <div>
        <Button type="primary" :style="{ padding: '6px 24px', marginRight: '12px' }">二级按钮</Button>
        <Button theme="solid" type="primary" :style="{ padding: '6px 24px' }">一级按钮</Button>
      </div>
    </Empty>
    <br />
    <Empty title="暂未找到匹配的筛选结果">
      <template #description>
        <span>
          <Text>试试 </Text>
          <Text link>重置筛选条件</Text>
        </span>
      </template>
    </Empty>
  </DemoBlock>

  <DemoBlock title="不同布局" desc="支持 vertical、horizontal，默认为 vertical。文本过长时推荐横向布局。">
    <Empty
      title="创建成功"
      :image="success"
      layout="horizontal"
      description="这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。"
      :style="{ width: '800px', margin: '0 auto' }"
    >
      <Button type="primary" theme="solid" :style="{ padding: '6px 24px' }">开始操作</Button>
    </Empty>
  </DemoBlock>

  <DemoBlock
    title="占位图插画(建设中)"
    desc="官网 @douyinfe/semi-illustrations 提供 Success / Failure / NoAccess / NoContent / NotFound / NoResult / Construction / Idle 及对应 Dark 版本。此处用同名 SVG 占位对照布局。"
  >
    <div :style="{ display: 'flex', flexWrap: 'wrap' }">
      <Empty :image="success" description="创建成功" :style="emptyStyle" />
      <Empty :image="failure" description="加载失败" :style="emptyStyle" />
      <Empty :image="noAccess" description="没有权限" :style="emptyStyle" />
      <Empty :image="noContent" description="暂无内容，请添加" :style="emptyStyle" />
      <Empty :image="notFound" description="页面404" :style="emptyStyle" />
      <Empty :image="noResult" description="搜索无结果" :style="emptyStyle" />
      <Empty :image="construction" description="建设中" :style="emptyStyle" />
      <Empty :image="idle" description="神游四方" :style="emptyStyle" />
    </div>
  </DemoBlock>
</template>
