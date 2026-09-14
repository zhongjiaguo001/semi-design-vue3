<script setup lang="ts">
import { h, ref } from 'vue';
import { JsonViewer, Button, Rating, Popover, Tag, Image, IconSearch } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { JsonViewer } from 'semi-design-vue';`;

const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;

const longData = `{
    "name": "Semi",
    "version": "0.0.0",
    "description": "Semi Design is a design system that defines a set of mid_back design and front_end basic components."
}`;

const formatData = `{
  "name": "Semi",
  "version": "0.0.0"
}`;

const formatRef = ref<any>(null);
const onFormat = () => {
  console.log(formatRef.value?.format());
};

const customData = `{
  "name": "Semi",
  "version": "2.7.4",
  "rating": 5,
  "tags": ["design", "react", "ui"],
  "image": "https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/abstract.jpg"
}`;

const customRenderRule = [
  {
    match: 'Semi',
    render: (content: string) =>
      h(Popover, { showArrow: true, content: '我是用户自定义的渲染', trigger: 'hover' }, () => h('span', content)),
  },
  {
    match: (value: any) => value == 5,
    render: (content: string) => h(Rating, { defaultValue: Number(content), size: 10, disabled: true }),
  },
  {
    match: (_value: any, path: string) => path === 'root.tags[0]' || path === 'root.tags[1]' || path === 'root.tags[2]',
    render: (content: string) => h(Tag, { size: 'small', shape: 'circle' }, () => content),
  },
  {
    match: new RegExp('^http'),
    render: (content: string) =>
      h(
        Popover,
        {
          showArrow: true,
          trigger: 'hover',
          // content 为原始字符串，包含引号，因此需要去除引号才可以作为合法的 url
          content: () => h(Image, { width: 100, height: 100, src: content.replace(/^"|"$/g, '') }),
        },
        () => h('span', content)
      ),
  },
];

const customOptions = {
  formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' },
  customRenderRule,
  readOnly: true,
  autoWrap: true,
};

const renderSearchButton = (defaultButton: any, controls: any) =>
  h('div', { style: { position: 'absolute', top: '10px', right: '10px', zIndex: 10 } }, [
    !controls.showSearchBar
      ? h(Button, { icon: h(IconSearch), onClick: controls.onToggleSearchBar }, () => '搜索')
      : defaultButton,
  ]);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="传入 height 和 width 设置组件尺寸，通过 value 传入 Json 字符串。JsonViewer 为非受控组件，需要获取值时可通过 ref 调用 getValue()。"
  >
    <div style="margin-bottom: 16px">
      <JsonViewer :height="100" :width="700" :value="data" />
    </div>
  </DemoBlock>

  <DemoBlock title="设置行高" desc="配置 options 的 lineHeight 参数，设置固定行高（单位：px）。">
    <div>
      <div style="margin-bottom: 12px; overflow: hidden">
        <JsonViewer :height="100" :width="700" :value="data" :options="{ lineHeight: 20 }" />
      </div>
      <div style="margin-bottom: 12px; overflow: hidden">
        <JsonViewer :height="120" :width="700" :value="data" :options="{ lineHeight: 24 }" />
      </div>
      <div style="margin-bottom: 12px; overflow: hidden">
        <JsonViewer :height="120" :width="700" :value="data" :options="{ lineHeight: 26 }" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="自动换行" desc="配置 options 的 autoWrap 参数，设置为 true 时组件会根据内容长度自动换行。">
    <div style="margin-bottom: 16px">
      <JsonViewer :height="120" :width="700" :value="longData" :options="{ autoWrap: true }" />
    </div>
  </DemoBlock>

  <DemoBlock
    title="格式化配置"
    desc="配置 options 的 formatOptions（tabSize / insertSpaces / eol），点击按钮通过 ref 调用 format() 格式化当前内容。"
  >
    <div>
      <Button @click="onFormat">格式化</Button>
      <div style="margin-bottom: 16px; margin-top: 16px">
        <JsonViewer
          ref="formatRef"
          :height="100"
          :width="700"
          :value="formatData"
          :options="{ formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' } }"
        />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="自定义渲染规则"
    desc="通过 options.customRenderRule 自定义 JSON 内容的渲染方式（仅在 readOnly 模式下生效）。match 支持字符串 / 正则 / 函数 (value, path, tokenType)，render 返回 VNode。"
  >
    <div>
      <div style="margin-bottom: 16px; margin-top: 16px">
        <JsonViewer :height="200" :width="600" :value="customData" :show-search="false" :options="customOptions" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义搜索按钮" desc="通过 renderSearchButton 属性自定义搜索按钮的渲染方式，实现固定位置、自定义样式等需求。">
    <div style="margin-bottom: 16px">
      <JsonViewer :height="200" :width="700" :value="data" :render-search-button="renderSearchButton" />
    </div>
  </DemoBlock>
</template>
