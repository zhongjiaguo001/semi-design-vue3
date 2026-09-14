<script setup lang="ts">
import { h, ref, computed } from 'vue';
import type { VNodeChild } from 'vue';
import {
  Tabs,
  TabPane,
  TabItem,
  Button,
  ButtonGroup,
  RadioGroup,
  Radio,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  IconFile,
  IconGlobe,
  IconHelpCircle,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Tabs, TabPane } from 'semi-design-vue';
// 子项：<TabPane> 或 <Tabs.TabPane>；自定义标签栏可复用 <TabItem>`;

const preStyle = {
  margin: '24px 0',
  padding: '20px',
  border: 'none',
  whiteSpace: 'normal',
  borderRadius: 'var(--semi-border-radius-medium)',
  color: 'var(--semi-color-text-1)',
  backgroundColor: 'var(--semi-color-fill-0)',
} as const;

// ---------- 基本用法（tabList 方式） ----------
const tabList = [
  { tab: '文档', itemKey: '1' },
  { tab: '快速起步', itemKey: '2' },
  { tab: '帮助', itemKey: '3' },
];
const contentList = ['文档', '快速起步', '帮助'];
const cardKey = ref('1');
const slashKey = ref('1');

// ---------- More ----------
const tenTabs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const moreConfig = {
  count: 4,
  render: () => h(Button, { type: 'tertiary' }, () => 'Click to show More'),
  dropdownProps: { trigger: 'click', position: 'bottomRight' },
};

// ---------- 垂直的标签栏 ----------
const verticalType = ref<'line' | 'card' | 'button'>('line');

// ---------- 自定义滚动箭头渲染 ----------
const arrowActiveKey = ref('Tab-0');
const arrowStyle = {
  width: '32px',
  height: '32px',
  margin: '0 12px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '100%',
  background: 'rgba(var(--semi-grey-1), 1)',
  color: 'var(--semi-color-text)',
  cursor: 'pointer',
};
const renderArrow = (items: any[], pos: 'start' | 'end', handleArrowClick: () => void): VNodeChild =>
  h(
    Dropdown,
    {
      render: () =>
        h(DropdownMenu, null, () =>
          items.map((item) => h(DropdownItem, { key: item.itemKey, onClick: () => (arrowActiveKey.value = item.itemKey) }, () => item.itemKey))
        ),
    },
    () => h('div', { style: arrowStyle, onClick: handleArrowClick }, pos === 'start' ? '←' : '→')
  );

// ---------- 自动溢出检测 ----------
const autoCount = ref(8);
const autoTabs = computed(() => Array.from({ length: autoCount.value }, (_, i) => ({ tab: `Tab-${i + 1}`, itemKey: `${i}`, content: `Content of Tab ${i + 1}` })));

// ---------- 标签栏内容扩展 ----------
const onExtraClick = () => alert('you have clicked me!');

// ---------- 标签栏二次封装 ----------
const renderTabBar = (tabBarProps: Record<string, any>, DefaultTabBar: any) =>
  h('div', { class: 'tab-bar-box' }, [`这是二次封装的Tab Bar，当前ActiveKey：${tabBarProps.activeKey}`, h(DefaultTabBar, tabBarProps)]);

// ---------- 拖拽排序（原生 HTML5 drag events + TabItem） ----------
const dragActiveKey = ref('1');
const dragItems = ref([
  { itemKey: '1', tab: '文档', content: '文档内容' },
  { itemKey: '2', tab: '表格', content: '表格内容' },
  { itemKey: '3', tab: '幻灯片', content: '幻灯片内容' },
  { itemKey: '4', tab: '表单', content: '表单内容' },
]);
const draggingKey = ref<string | null>(null);
const arrayMove = (arr: any[], from: number, to: number) => {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};
const onDrop = (overKey: string) => {
  const active = draggingKey.value;
  draggingKey.value = null;
  if (!active || active === overKey) return;
  const oldIndex = dragItems.value.findIndex((i) => i.itemKey === active);
  const newIndex = dragItems.value.findIndex((i) => i.itemKey === overKey);
  dragItems.value = arrayMove(dragItems.value, oldIndex, newIndex);
};
const renderDraggableTabBar = (tabBarProps: Record<string, any>) => {
  const { type = 'line', size = 'medium', tabPosition = 'top' } = tabBarProps;
  const barCls = `semi-tabs-bar semi-tabs-bar-${type} semi-tabs-bar-${tabPosition}`;
  return h(
    'div',
    { class: barCls, role: 'tablist' },
    dragItems.value.map((item) =>
      h(TabItem, {
        key: item.itemKey,
        itemKey: item.itemKey,
        tab: item.tab,
        selected: dragActiveKey.value === item.itemKey,
        size,
        type,
        tabPosition,
        onClick: (key: string) => (dragActiveKey.value = key),
        draggable: 'true',
        style: { cursor: 'grab', opacity: draggingKey.value === item.itemKey ? 0.5 : 1, display: 'inline-flex' },
        onDragstart: (e: DragEvent) => {
          draggingKey.value = item.itemKey;
          e.dataTransfer?.setData('text/plain', item.itemKey);
        },
        onDragover: (e: DragEvent) => e.preventDefault(),
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          onDrop(item.itemKey);
        },
        onDragend: () => (draggingKey.value = null),
      })
    )
  );
};

// ---------- 动态更新 ----------
let newTabIndex = 0;
const panes = ref([
  { title: 'Tab 1', content: 'Content of Tab Pane 1', itemKey: '1' },
  { title: 'Tab 2', content: 'Content of Tab Pane 2', itemKey: '2' },
]);
const dynamicActiveKey = ref(panes.value[0].itemKey);
const addPane = () => {
  const index = newTabIndex++;
  panes.value.push({ title: `New Tab ${index}`, content: 'New Tab Pane', itemKey: `newTab${index}` });
  dynamicActiveKey.value = `newTab${index}`;
};
const removePane = () => {
  if (panes.value.length > 1) {
    panes.value.pop();
    dynamicActiveKey.value = panes.value[panes.value.length - 1].itemKey;
  }
};

// ---------- 关闭 ----------
const closableTabs = ref([
  { tab: '文档', itemKey: '1', text: '文档', closable: true },
  { tab: '快速起步', itemKey: '2', text: '快速起步', closable: true },
  { tab: '帮助', itemKey: '3', text: '帮助', closable: false },
]);
const closeTab = (key: string) => {
  const idx = closableTabs.value.findIndex((t) => t.itemKey === key);
  if (idx >= 0) closableTabs.value.splice(idx, 1);
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="线条式标签栏（type='line'），通过 <TabPane> 逐项传入；默认选中第一项。">
    <div>
      <Tabs type="line">
        <TabPane tab="文档" itemKey="1">
          <h3>文档</h3>
          <p :style="{ lineHeight: 1.8 }">
            Semi Design 是由抖音前端团队与 UED
            团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的
            Web 应用。
          </p>
          <p :style="{ lineHeight: 1.8 }">区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有以下优势：</p>
          <ul>
            <li><p>Semi Design 以内容优先进行设计。</p></li>
            <li><p>更容易地自定义主题。</p></li>
            <li><p>适用国际化场景。</p></li>
            <li><p>效率场景加入人性化关怀。</p></li>
          </ul>
        </TabPane>
        <TabPane tab="快速起步" itemKey="2">
          <h3>快速起步</h3>
          <pre :style="preStyle"><code>yarn add @douyinfe/semi-ui</code></pre>
        </TabPane>
        <TabPane tab="帮助" itemKey="3">
          <h3>帮助</h3>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-0)', fontWeight: 600 }">Q：有新组件需求、或者现有组件feature不能满足业务需求？</p>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-1)' }">右上角问题反馈，提交issue，label选择Feature Request / New Component Request 我们会高优处理这些需求。</p>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-0)', fontWeight: 600 }">Q：对组件的使用有疑惑？</p>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-1)' }">欢迎进我们的客服lark群进行咨询提问。</p>
        </TabPane>
      </Tabs>
    </div>
  </DemoBlock>

  <DemoBlock title="基本用法 - 按钮式" desc="type='button' 按钮式标签栏。">
    <Tabs type="button">
      <TabPane tab="文档" itemKey="1">文档</TabPane>
      <TabPane tab="快速起步" itemKey="2">快速起步</TabPane>
      <TabPane tab="帮助" itemKey="3">帮助</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="基本用法 - 卡片式" desc="type='card' 卡片式，通过 tabList 传入标签页数组，内容由默认插槽按 activeKey 渲染。">
    <Tabs type="card" :tabList="tabList" @change="(key: string) => (cardKey = key)">
      <div>{{ contentList[Number(cardKey) - 1] }}</div>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="基本用法 - 斜线式" desc="type='slash' 斜线式，通过 tabList 传入标签页数组。">
    <Tabs type="slash" :tabList="tabList" @change="(key: string) => (slashKey = key)">
      <div>{{ contentList[Number(slashKey) - 1] }}</div>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="带图标的" desc="有图标的标签栏：tab 可以是任意节点，也可以使用 #tab 插槽。">
    <Tabs>
      <TabPane itemKey="1">
        <template #tab><span><IconFile />文档</span></template>
        文档
      </TabPane>
      <TabPane itemKey="2">
        <template #tab><span><IconGlobe />快速起步</span></template>
        快速起步
      </TabPane>
      <TabPane itemKey="3">
        <template #tab><span><IconHelpCircle />帮助</span></template>
        帮助
      </TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="更多选项收入 More 展示" desc="more 传入数字，表示收入下拉菜单的 Tab 数量。">
    <Tabs :more="4" :style="{ width: '60%', margin: '20px' }" type="card">
      <TabPane v-for="i in tenTabs" :key="i" :tab="`Tab-${i}`" :itemKey="`Tab-${i}`">Content of card tab {{ i }}</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="更多选项收入 More 展示 - 高级配置" desc="more 传入对象：count、render（自定义 Trigger）、dropdownProps（透传给下拉菜单）。">
    <Tabs :more="moreConfig" :style="{ width: '60%', margin: '20px' }" type="card">
      <TabPane v-for="i in tenTabs" :key="i" :tab="`Tab-${i}`" :itemKey="`Tab-${i}`">Content of card tab {{ i }}</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="垂直的标签栏" desc="type 为 line / card / button 支持 tabPosition='left' 垂直模式。">
    <RadioGroup v-model="verticalType" type="button" :style="{ display: 'flex', width: '200px', justifyContent: 'center' }">
      <Radio value="line">Line</Radio>
      <Radio value="card">Card</Radio>
      <Radio value="button">Button</Radio>
    </RadioGroup>
    <br />
    <br />
    <Tabs tabPosition="left" :type="verticalType">
      <TabPane itemKey="1">
        <template #tab><span><IconFile />文档</span></template>
        <div :style="{ padding: '0 24px' }">
          <h3>文档</h3>
          <p :style="{ lineHeight: 1.8 }">
            Semi Design 是由抖音前端团队与 UED
            团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的
            Web 应用。
          </p>
          <p :style="{ lineHeight: 1.8 }">区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有以下优势：</p>
        </div>
      </TabPane>
      <TabPane itemKey="2">
        <template #tab><span><IconGlobe />快速起步</span></template>
        <div :style="{ padding: '0 24px' }">
          <h3>快速起步</h3>
          <pre :style="{ ...preStyle, borderRadius: '6px' }"><code>yarn add @douyinfe/semi-ui</code></pre>
        </div>
      </TabPane>
      <TabPane itemKey="3">
        <template #tab><span><IconHelpCircle />帮助</span></template>
        <div :style="{ padding: '0 24px' }">
          <h3>帮助</h3>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-0)', fontWeight: 600 }">Q：有新组件需求、或者现有组件feature不能满足业务需求？</p>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-1)' }">右上角问题反馈，提交issue，label选择Feature Request / New Component Request 我们会高优处理这些需求。</p>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-0)', fontWeight: 600 }">Q：对组件的使用有疑惑？</p>
          <p :style="{ lineHeight: 1.8, color: 'var(--semi-color-text-1)' }">欢迎进我们的客服lark群进行咨询提问。</p>
        </div>
      </TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="滚动折叠" desc="设置 collapsible 支持滚动折叠，目前只支持 horizontal 模式。">
    <Tabs :style="{ width: '60%', margin: '20px' }" type="card" collapsible>
      <TabPane v-for="i in tenTabs" :key="i" :tab="`Tab-${i}`" :itemKey="`Tab-${i}`">Content of card tab {{ i }}</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="滚动折叠 - 自定义滚动箭头渲染" desc="通过 renderArrow(items, pos, handleArrowClick, defaultNode) 自定义左右切换箭头。">
    <Tabs
      :renderArrow="renderArrow"
      :style="{ width: '50%', margin: '20px' }"
      :activeKey="arrowActiveKey"
      type="card"
      collapsible
      @change="(k: string) => (arrowActiveKey = k)"
    >
      <TabPane v-for="i in tenTabs" :key="i" :tab="`Tab-${i}`" :itemKey="`Tab-${i}`">Content of card tab {{ i }}</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="滚动折叠 - 修改切换箭头的渲染位置" desc="通过 arrowPosition 修改溢出指示器的位置，可选 start / both / end。">
    <Tabs :style="{ width: '60%', margin: '20px' }" type="card" collapsible arrowPosition="start">
      <TabPane v-for="i in tenTabs" :key="i" :tab="`Tab-${i}`" :itemKey="`Tab-${i}`">Content of card tab {{ i }}</TabPane>
    </Tabs>
    <Tabs :style="{ width: '60%', margin: '20px' }" type="card" collapsible arrowPosition="both">
      <TabPane v-for="i in tenTabs" :key="i" :tab="`Tab-${i}`" :itemKey="`Tab-${i}`">Content of card tab {{ i }}</TabPane>
    </Tabs>
    <Tabs :style="{ width: '60%', margin: '20px' }" type="card" collapsible arrowPosition="end">
      <TabPane v-for="i in tenTabs" :key="i" :tab="`Tab-${i}`" :itemKey="`Tab-${i}`">Content of card tab {{ i }}</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="自动溢出检测" desc="collapsible='auto'：Tab 溢出容器时自动进入折叠模式，容器变宽或 Tab 减少后自动退出。">
    <div>
      <div :style="{ marginBottom: '12px' }">
        <Button :style="{ marginRight: '8px' }" @click="autoCount = Math.max(3, autoCount - 2)">减少 Tab</Button>
        <Button @click="autoCount = Math.min(15, autoCount + 2)">增加 Tab</Button>
        <span :style="{ marginLeft: '12px' }">当前 Tab 数量: {{ autoCount }}</span>
      </div>
      <div :style="{ border: '1px solid var(--semi-color-border)', padding: '12px', marginBottom: '16px' }">
        <p :style="{ marginBottom: '8px', color: 'var(--semi-color-text-2)', fontSize: '12px' }">collapsible="auto" - 自动检测溢出</p>
        <Tabs type="card" collapsible="auto">
          <TabPane v-for="t in autoTabs" :key="t.itemKey" :tab="t.tab" :itemKey="t.itemKey">{{ t.content }}</TabPane>
        </Tabs>
      </div>
      <div :style="{ border: '1px solid var(--semi-color-border)', padding: '12px', maxWidth: '400px' }">
        <p :style="{ marginBottom: '8px', color: 'var(--semi-color-text-2)', fontSize: '12px' }">固定宽度 400px，测试较窄容器</p>
        <Tabs type="card" collapsible="auto">
          <TabPane v-for="t in autoTabs" :key="t.itemKey" :tab="t.tab" :itemKey="t.itemKey">{{ t.content }}</TabPane>
        </Tabs>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="禁用" desc="禁用标签栏中的某一个标签页。">
    <Tabs defaultActiveKey="1">
      <TabPane tab="文档" itemKey="1">文档</TabPane>
      <TabPane tab="快速起步" itemKey="2" disabled>快速起步</TabPane>
      <TabPane tab="帮助" itemKey="3">帮助</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="标签栏内容扩展" desc="传入 tabBarExtraContent（prop 或同名插槽）可以在标签栏右侧添加附加操作。">
    <Tabs defaultActiveKey="1">
      <template #tabBarExtraContent>
        <Button @click="onExtraClick">Extra Action</Button>
      </template>
      <TabPane tab="文档" itemKey="1">文档</TabPane>
      <TabPane tab="快速起步" itemKey="2">快速起步</TabPane>
      <TabPane tab="帮助" itemKey="3">帮助</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="标签栏二次封装" desc="传入 renderTabBar(tabBarProps, DefaultTabBar) 函数可对标签栏进行二次封装。">
    <Tabs defaultActiveKey="1" :renderTabBar="renderTabBar">
      <TabPane tab="文档" itemKey="1">文档</TabPane>
      <TabPane tab="快速起步" itemKey="2">快速起步</TabPane>
      <TabPane tab="帮助" itemKey="3">帮助</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock
    title="拖拽排序"
    desc="通过 renderTabBar 自定义整条标签栏并复用内置 TabItem；官方示例使用 @dnd-kit（React 专用），这里改用原生 HTML5 拖拽事件实现排序。"
  >
    <Tabs type="line" v-model:activeKey="dragActiveKey" :renderTabBar="renderDraggableTabBar">
      <TabPane v-for="item in dragItems" :key="item.itemKey" :tab="item.tab" :itemKey="item.itemKey">
        <div :style="{ padding: '20px' }">{{ item.content }}</div>
      </TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="动态更新" desc="通过绑定事件，可以使标签栏动态更新。">
    <Tabs defaultActiveKey="1" :activeKey="dynamicActiveKey" @change="(k: string) => (dynamicActiveKey = k)">
      <template #tabBarExtraContent>
        <ButtonGroup>
          <Button @click="addPane">新增</Button>
          <Button @click="removePane">删除</Button>
        </ButtonGroup>
      </template>
      <TabPane v-for="pane in panes" :key="pane.itemKey" :tab="pane.title" :itemKey="pane.itemKey">{{ pane.content }}</TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="关闭" desc="只有卡片样式的页签支持关闭选项，使用 closable 开启；关闭时触发 tabClose 事件。">
    <Tabs type="card" defaultActiveKey="1" @tabClose="closeTab">
      <TabPane v-for="t in closableTabs" :key="t.itemKey" :closable="t.closable" :tab="t.tab" :itemKey="t.itemKey">{{ t.text }}</TabPane>
    </Tabs>
  </DemoBlock>
</template>
