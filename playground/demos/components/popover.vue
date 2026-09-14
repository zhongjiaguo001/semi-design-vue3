<script setup lang="ts">
import { ref, computed, defineComponent, h, onMounted } from 'vue';
import { Popover, Tag, Empty, Space, Button, Switch, Input, RadioGroup, Radio, Text, IconTickCircle, Tooltip, Popconfirm } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Popover } from 'semi-design-vue';`;

// ---- 注意事项: children 类型 ----
const childStyle = { border: '2px solid var(--semi-color-border)', paddingLeft: '4px', paddingRight: '4px', borderRadius: '4px' };

// 函数式组件：attrs 透传到底层 DOM（对应 React forwardRef 组件）
const FCChildren = (props: any, { attrs }: any) => h('span', { ...attrs, style: childStyle }, 'Functional Component');
FCChildren.inheritAttrs = false;

// defineComponent 组件：inheritAttrs 使 props 透传到根 DOM（对应 React Class Component）
const MyComponent = defineComponent({
  name: 'MyComponent',
  setup() {
    return () => h('span', { style: childStyle }, 'ClassComponent');
  },
});

// Vue 端口未内置 @douyinfe/semi-illustrations，使用 IconTickCircle 代替插画
const emptyStyle = { width: '400px', margin: '0 auto', display: 'flex', padding: '20px' };
const illustration = () => h(IconTickCircle, { style: { width: '150px', height: '150px', fontSize: '150px', color: 'var(--semi-color-success)' } });

// ---- 弹出位置 ----
const tops = [
  ['topLeft', 'TL'],
  ['top', 'Top'],
  ['topRight', 'TR'],
];
const lefts = [
  ['leftTop', 'LT'],
  ['left', 'Left'],
  ['leftBottom', 'LB'],
];
const rights = [
  ['rightTop', 'RT'],
  ['right', 'Right'],
  ['rightBottom', 'RB'],
];
const bottoms = [
  ['bottomLeft', 'BL'],
  ['bottom', 'Bottom'],
  ['bottomRight', 'BR'],
];

// ---- 受控显示 ----
const visible = ref(false);

// ---- condition 条件触发 ----
const enabled = ref(true);
const conditionContent = computed(() => `condition is ${enabled.value ? 'true' : 'false'}`);

// ---- 设置浮层背景色 ----
const colorfulStyle = {
  backgroundColor: 'rgba(var(--semi-blue-4),1)',
  borderColor: 'rgba(var(--semi-blue-4),1)',
  color: 'var(--semi-color-white)',
  borderWidth: '1px',
  borderStyle: 'solid',
};
const colorfulTagStyle = {
  backgroundColor: 'rgba(var(--semi-blue-4),1)',
  color: 'var(--semi-color-white)',
};
const getPopupParent = () => document.querySelector('#popup-parent') as HTMLElement;
// 官方示例 visible 常量为 true；这里在挂载后再置为 true，保证 #popup-parent 已存在于文档中
const colorfulVisible = ref(false);
onMounted(() => {
  colorfulVisible.value = true;
});

// ---- 初始化弹出层焦点位置 ----
// Input 组件实例暴露 getInputElement，将真实 <input> 绑定到 initialFocusRef
const bindFocusRef = (focusRef: any) => (el: any) => {
  focusRef.value = el && typeof el.getInputElement === 'function' ? el.getInputElement() : el;
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="注意事项"
    desc="Popover 需要将 DOM 事件监听器应用到 children 中，如果子元素是自定义的组件，需要确保它能将属性（attrs）透传至底层的 DOM 元素；支持函数式组件、defineComponent 组件与真实 DOM 节点作为 children。"
  >
    <Space>
      <Popover>
        <template #content>
          <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
        </template>
        <FCChildren />
      </Popover>
      <Popover>
        <template #content>
          <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
        </template>
        <MyComponent />
      </Popover>
      <Popover>
        <template #content>
          <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
        </template>
        <span :style="childStyle">DOM</span>
      </Popover>
    </Space>
  </DemoBlock>

  <DemoBlock
    title="基本使用"
    desc="将浮层的触发器 Trigger 作为 children，使用 Popover 包裹（如下的例子中触发器为 Tag 元素）。浮层内容通过 content 属性或 #content 插槽传入。"
  >
    <Popover>
      <template #content>
        <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
      </template>
      <Tag>悬停此处</Tag>
    </Popover>
  </DemoBlock>

  <DemoBlock title="弹出位置" desc="支持通过 position 设置浮层弹出方向，共支持十二个方向。">
    <div>
      <div style="margin-left: 80px; white-space: nowrap">
        <Popover v-for="(pos, index) in tops" :key="index" :position="pos[0] as any">
          <template #content>
            <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
          </template>
          <Tag style="margin: 8px; padding: 20px">{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="width: 80px; float: left">
        <Popover v-for="(pos, index) in lefts" :key="index" :position="pos[0] as any">
          <template #content>
            <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
          </template>
          <Tag style="margin: 8px; padding: 20px; width: 60px">{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="width: 40px; margin-left: 300px">
        <Popover v-for="(pos, index) in rights" :key="index" :position="pos[0] as any">
          <template #content>
            <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
          </template>
          <Tag style="margin: 8px; padding: 20px; width: 60px">{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="margin-left: 80px; clear: both; white-space: nowrap">
        <Popover v-for="(pos, index) in bottoms" :key="index" :position="pos[0] as any">
          <template #content>
            <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
          </template>
          <Tag style="margin: 8px; padding: 20px; width: 60px">{{ pos[1] }}</Tag>
        </Popover>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="受控显示" desc="设置 trigger='custom'，此场景下，Popover 的显示与否完全受到参数 visible 的控制。">
    <Popover :visible="visible" trigger="custom">
      <template #content>
        <Empty title="先进的设计 / 研发协作方式" :image="illustration" description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码" :style="emptyStyle" />
      </template>
      <RadioGroup type="button" :value="visible" @change="(e: any) => (visible = e.target.value)">
        <Radio :value="true">受控显示</Radio>
        <Radio :value="false">受控隐藏</Radio>
      </RadioGroup>
    </Popover>
  </DemoBlock>

  <DemoBlock
    title="condition 条件触发"
    desc="当 condition=false 时，Popover 不响应 hover/click/focus 等触发行为（trigger='custom' 不受影响）。"
  >
    <Space align="center">
      <Text>condition</Text>
      <Switch :checked="enabled" @change="(v: boolean) => (enabled = v)" />
      <Popover :content="conditionContent" :condition="enabled">
        <Button>Hover me</Button>
      </Popover>
      <Popover :content="conditionContent" trigger="click" :condition="enabled">
        <Button>Click me</Button>
      </Popover>
    </Space>
  </DemoBlock>

  <DemoBlock
    title="显示小三角"
    desc="通过设置 showArrow，Popover 同样也支持展示一个小三角。这种模式下浮层会拥有一个默认的样式，你可以通过传递 style 参数来覆盖掉。"
  >
    <div style="padding-left: 40px" class="tag-margin-right">
      <div style="margin-left: 40px; white-space: nowrap">
        <Popover v-for="(pos, index) in tops" :key="index" showArrow :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="width: 40px; float: left">
        <Popover v-for="(pos, index) in lefts" :key="index" showArrow :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="width: 40px; margin-left: 180px">
        <Popover v-for="(pos, index) in rights" :key="index" showArrow :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="margin-left: 40px; clear: both; white-space: nowrap">
        <Popover v-for="(pos, index) in bottoms" :key="index" showArrow :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="指向元素中心"
    desc="在显示小三角的条件（showArrow=true）下，可以传入 arrowPointAtCenter=true 使得小三角始终指向元素中心位置。"
  >
    <div style="padding-left: 40px" class="tag-margin-right">
      <div style="margin-left: 40px; white-space: nowrap">
        <Popover v-for="(pos, index) in tops" :key="index" showArrow arrowPointAtCenter :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="width: 40px; float: left">
        <Popover v-for="(pos, index) in lefts" :key="index" showArrow arrowPointAtCenter :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="width: 40px; margin-left: 180px">
        <Popover v-for="(pos, index) in rights" :key="index" showArrow arrowPointAtCenter :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
      <div style="margin-left: 40px; clear: both; white-space: nowrap">
        <Popover v-for="(pos, index) in bottoms" :key="index" showArrow arrowPointAtCenter :position="pos[0] as any">
          <template #content>
            <article>
              Hi ByteDancer, this is a popover.
              <br /> We have 2 lines.
            </article>
          </template>
          <Tag>{{ pos[1] }}</Tag>
        </Popover>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="设置浮层背景色"
    desc="如果你需要定制浮层的背景色或边框颜色，请务必单独声明 style 中的 backgroundColor 和 borderColor 属性，这样能够使得“小三角”也能应用相同的背景色和边框颜色。"
  >
    <div id="popup-parent" style="position: relative">
      <Popover :getPopupContainer="getPopupParent" trigger="custom" :visible="colorfulVisible" position="right" showArrow :style="colorfulStyle">
        <template #content>
          <article style="padding: 4px">Hi, Semi UI Popover.</article>
        </template>
        <Tag :style="colorfulTagStyle">Colorful Popover</Tag>
      </Popover>
    </div>
  </DemoBlock>

  <DemoBlock
    title="初始化弹出层焦点位置"
    desc="Popover content 支持传入函数（或使用作用域插槽 #content），它的入参是一个对象，将 initialFocusRef 绑定在可聚焦 DOM 或组件上，打开面板时会自动聚焦在该位置。"
  >
    <Popover trigger="click">
      <template #content="{ initialFocusRef }">
        <div style="padding: 12px">
          <Space>
            <Button>first focusable element</Button>
            <Input :ref="bindFocusRef(initialFocusRef)" placeholder="focus here" />
          </Space>
        </div>
      </template>
      <Button>click me</Button>
    </Popover>
  </DemoBlock>

  <DemoBlock
    title="搭配 Tooltip 或 Popconfirm 使用"
    desc="Tooltip、Popconfirm、Popover 都会劫持 children 事件。直接嵌套会使外层 trigger 失效，需要在中间加一层 div 或 span。"
  >
    <Popconfirm content="是否确认删除" title="确认" :style="{ width: '320px' }">
      <span style="display: inline-block">
        <Tooltip content="删除评价">
          <Button type="danger">删除</Button>
        </Tooltip>
      </span>
    </Popconfirm>
  </DemoBlock>
</template>
