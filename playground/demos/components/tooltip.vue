<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import {
  Tooltip,
  Tag,
  Button,
  Input,
  Radio,
  RadioGroup,
  Space,
  Switch,
  Popconfirm,
  Title,
  Text,
  Paragraph,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Tooltip } from 'semi-design-vue';`;

// 注意事项：children 类型
const childStyle = { border: '2px solid var(--semi-color-border)', paddingLeft: '4px', paddingRight: '4px', borderRadius: '4px' };
// 单根元素的自定义组件（attrs 显式透传至底层 DOM，等价于 React forwardRef 组件）
const FCChildren = defineComponent({
  name: 'FCChildren',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => h('span', { ...attrs, style: childStyle }, 'Functional Component');
  },
});
// 单根元素的自定义组件（依赖 Vue 默认的 attrs 透传，等价于 React ClassComponent 透传 props）
const MyComponent = defineComponent({
  name: 'MyComponent',
  setup() {
    return () => h('span', { style: childStyle }, 'ClassComponent');
  },
});

// 位置
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

// 触发时机
const visible = ref(false);
const getTriggerContainer = () => document.querySelector('#tooltip-container') as HTMLElement;
const onVisibleRadioChange = (e: any) => {
  visible.value = e && typeof e === 'object' && 'target' in e ? e.target.value : e;
};

// condition 条件触发
const enabled = ref(true);
const conditionContent = computed(() => `condition is ${enabled.value ? 'true' : 'false'}`);
const onConditionChange = (v: boolean) => {
  enabled.value = v;
};

// 渲染至指定 DOM
const getWrapperContainer = () => document.querySelector('#tooltip-wrapper') as HTMLElement;
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="注意事项"
    desc="Tooltip 需要将 DOM 事件监听器应用到 children 中，如果子元素是自定义的组件，你需要确保它能将属性（attrs）透传至底层的单个根 DOM 元素，以便计算弹出层定位。支持：单根自定义组件（attrs 透传）、真实 DOM 节点（span、div、p...）。"
  >
    <Space>
      <Tooltip content="semi design">
        <FCChildren />
      </Tooltip>
      <Tooltip content="semi design">
        <MyComponent />
      </Tooltip>
      <Tooltip content="semi design">
        <span :style="childStyle">DOM</span>
      </Tooltip>
    </Space>
  </DemoBlock>

  <DemoBlock
    title="位置"
    desc="可以通过 position 配置弹出层方向以及对齐位置。配置为 top 时向上弹出；topLeft 时向上弹出且弹出层与 children 左对齐（当 arrowPointAtCenter=false 时）；topRight 时向上弹出且右对齐；其他方向同理。"
  >
    <div>
      <div :style="{ marginLeft: '80px', whiteSpace: 'nowrap' }">
        <Tooltip v-for="(pos, index) in tops" :key="index" :arrowPointAtCenter="false" :position="pos[0] as any">
          <template #content>
            <article>
              <p>hi bytedance</p>
              <p>hi bytedance</p>
            </article>
          </template>
          <Tag :style="{ margin: '8px', padding: '20px' }">{{ pos[1] }}</Tag>
        </Tooltip>
      </div>
      <div :style="{ width: '80px', float: 'left' }">
        <Tooltip v-for="(pos, index) in lefts" :key="index" :arrowPointAtCenter="false" :position="pos[0] as any">
          <template #content>
            <article>
              <p>hi bytedance</p>
              <p>hi bytedance</p>
            </article>
          </template>
          <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ pos[1] }}</Tag>
        </Tooltip>
      </div>
      <div :style="{ width: '40px', marginLeft: '300px' }">
        <Tooltip v-for="(pos, index) in rights" :key="index" :arrowPointAtCenter="false" :position="pos[0] as any">
          <template #content>
            <article>
              <p>hi bytedance</p>
              <p>hi bytedance</p>
            </article>
          </template>
          <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ pos[1] }}</Tag>
        </Tooltip>
      </div>
      <div :style="{ marginLeft: '80px', clear: 'both', whiteSpace: 'nowrap' }">
        <Tooltip v-for="(pos, index) in bottoms" :key="index" :arrowPointAtCenter="false" :position="pos[0] as any">
          <template #content>
            <article>
              <p>hi bytedance</p>
              <p>hi bytedance</p>
            </article>
          </template>
          <Tag :style="{ margin: '8px', padding: '20px', width: '60px' }">{{ pos[1] }}</Tag>
        </Tooltip>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="指向元素中心"
    desc="默认情况下 arrowPointAtCenter=true，小三角始终指向 children 元素中心位置。你可以将其设置为 false，此时小三角将不再保持指向元素中心，弹出层与 children 边缘对齐。"
  >
    <div>
      <Tooltip position="topLeft" content="semi design tooltip">
        <Button type="secondary" :style="{ marginRight: '8px' }">指向元素中心</Button>
      </Tooltip>
    </div>
    <div :style="{ marginTop: '20px' }">
      <Tooltip content="semi design tooltip" :arrowPointAtCenter="false" position="topLeft">
        <Button type="secondary" :style="{ marginRight: '8px', width: '120px' }">边缘对齐</Button>
      </Tooltip>
    </div>
  </DemoBlock>

  <DemoBlock
    title="触发时机"
    desc="配置触发展示的时机，默认为 hover，可选 hover / focus / click / custom / contextMenu。设为 custom 时，需要配合 visible 属性使用，此时显示与否完全受控。"
  >
    <div :style="{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }" id="tooltip-container">
      <div :style="{ width: '150%', height: '150%', paddingLeft: '50px', paddingTop: '50px' }">
        <Tooltip content="hi bytedance" :getPopupContainer="getTriggerContainer">
          <Button theme="solid" type="tertiary" :style="{ marginBottom: '20px' }">悬停显示</Button>
        </Tooltip>
        <br />
        <Tooltip content="hi bytedance" trigger="click" :getPopupContainer="getTriggerContainer">
          <Button :style="{ marginBottom: '20px' }">点击显示</Button>
        </Tooltip>
        <br />
        <Tooltip content="hi bytedance" trigger="focus" :getPopupContainer="getTriggerContainer">
          <Input :style="{ width: '100px', marginBottom: '20px' }" placeholder="聚焦显示" />
        </Tooltip>
        <br />
        <Tooltip content="hi bytedance" trigger="contextMenu" :getPopupContainer="getTriggerContainer">
          <Button theme="solid" type="secondary" :style="{ marginBottom: '20px' }">右键点击展示</Button>
        </Tooltip>
        <br />
        <Tooltip content="hi bytedance" trigger="custom" :visible="visible" :getPopupContainer="getTriggerContainer">
          <span :style="{ display: 'inline-block' }">
            <RadioGroup type="button" :value="visible" @change="onVisibleRadioChange">
              <Radio :value="true">受控显示</Radio>
              <Radio :value="false">受控隐藏</Radio>
            </RadioGroup>
          </span>
        </Tooltip>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="condition 条件触发"
    desc="当 condition=false 时，Tooltip 不响应 hover/click/focus 等触发行为（trigger 为 custom 时不受影响）。"
  >
    <Space align="center">
      <Text>condition</Text>
      <Switch :checked="enabled" @change="onConditionChange" />
      <Tooltip :content="conditionContent" trigger="hover" :condition="enabled">
        <Button>Hover me</Button>
      </Tooltip>
      <Tooltip :content="conditionContent" trigger="click" :condition="enabled">
        <Button>Click me</Button>
      </Tooltip>
    </Space>
  </DemoBlock>

  <DemoBlock title="覆盖特定样式" desc="你可以通过 className、style 为弹出层配置特定样式，例如覆盖默认的 maxWidth（240px）。">
    <div>
      <Tooltip :style="{ maxWidth: '320px' }" className="another-classname" content="hi semi semi semi semi semi semi semi">
        <Tag :style="{ marginRight: '8px' }">Custom Style And ClassName</Tag>
      </Tooltip>
    </div>
  </DemoBlock>

  <DemoBlock
    title="渲染至指定 DOM"
    desc="传入 getPopupContainer，弹层将会渲染至该函数返回的 DOM 中。这会改变浮层 DOM 树位置，但不会改变视图渲染位置。需要注意的是：返回的容器如果不是 document.body，position 需要设为 relative。"
  >
    <div id="tooltip-wrapper" :style="{ position: 'relative' }">
      <Tooltip position="right" content="浮层被渲染至#tooltip-wrapper元素中" trigger="click" :getPopupContainer="getWrapperContainer">
        <Tag>点击此处</Tag>
      </Tooltip>
    </div>
  </DemoBlock>

  <DemoBlock
    title="搭配 Popover 或 Popconfirm 使用"
    desc="Tooltip、Popconfirm、Popover 都需要劫持 children 的相关事件（mouseenter/mouseleave/click...），用于配置 trigger。如果直接嵌套使用会使外层 trigger 失效，需要在中间加一层元素（div 或 span）以防止 trigger 的事件劫持失效。"
  >
    <Popconfirm content="是否确认删除" title="确认" :style="{ width: '320px' }">
      <span :style="{ display: 'inline-block' }">
        <Tooltip content="删除评价">
          <Button type="danger">删除</Button>
        </Tooltip>
      </span>
    </Popconfirm>
  </DemoBlock>

  <DemoBlock
    title="仅当内容宽度超出时展示 Tooltip"
    desc="Semi 为这种场景提供了 Typography 组件，可以更简单快捷地满足需求。不需要自己再对 Tooltip 的出现做条件判断，详细的使用请参考 Typography 组件文档。"
  >
    <div>
      <Title :heading="5" :ellipsis="{ showTooltip: true }" :style="{ width: '250px' }">是一个很长很长很长很长5号标题</Title>
      <br />
      <Text link :ellipsis="{ showTooltip: true, pos: 'middle' }" :style="{ width: '150px' }">是一个很长很长很长很长的链接</Text>
      <br />
      <br />
      <Paragraph :ellipsis="{ rows: 3, showTooltip: { type: 'popover', opts: { style: { width: '300px' } } } }" :style="{ width: '300px' }">
        多行截断，展示 Popover：Semi Design 是由抖音前端团队与 UED
        团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的
        Web 应用。
      </Paragraph>
    </div>
  </DemoBlock>
</template>
