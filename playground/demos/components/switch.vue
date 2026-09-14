<script setup lang="ts">
import { ref } from 'vue';
import { Switch, Space, Title } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Switch } from 'semi-design-vue';`;

const log = (v: boolean) => console.log(v);

// 带文本 - 2：文本说明放在 Switch 外部
const open = ref<boolean | undefined>(undefined);

// 受控组件
const checked = ref(true);
const onControlledChange = (v: boolean) => {
  checked.value = v;
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本" desc="通过 change 事件监听状态变化，通过 defaultChecked 或受控的 checked 指定选中状态；通过 aria-label 描述开关作用。">
    <div>
      <Switch aria-label="a switch for demo" @change="log" />
      <br />
      <Switch :defaultChecked="true" aria-label="a switch for semi demo" @change="log" />
    </div>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="通过 size 指定尺寸。">
    <div>
      <Space style="margin-bottom: 10px; display: block">
        <Switch size="small" aria-label="a switch for demo" />
        <Switch :defaultChecked="true" size="small" aria-label="a switch for demo" />
        <Switch size="small" loading aria-label="a switch for demo" />
        <Switch size="small" loading :defaultChecked="true" aria-label="a switch for demo" />
      </Space>
      <Space style="margin-bottom: 10px; display: block">
        <Switch />
        <Switch :defaultChecked="true" aria-label="a switch for demo" />
        <Switch loading aria-label="a switch for demo" />
        <Switch loading :defaultChecked="true" aria-label="a switch for demo" />
      </Space>
      <Space>
        <Switch size="large" />
        <Switch :defaultChecked="true" size="large" />
        <Switch size="large" loading />
        <Switch size="large" loading :defaultChecked="true" />
      </Space>
    </div>
  </DemoBlock>

  <DemoBlock title="不可用" desc="disabled 禁用开关。">
    <div>
      <Switch disabled aria-label="a switch for demo" />
      <br />
      <Switch disabled :checked="true" aria-label="a switch for demo" />
    </div>
  </DemoBlock>

  <DemoBlock title="带文本" desc="通过 checkedText 与 uncheckedText 设置开关时的文本；size='small' 时无效。">
    <div>
      <Switch checkedText="开" uncheckedText="关" />
      <Switch checkedText="｜" uncheckedText="〇" style="margin-left: 5px" />
      <br />
      <br />
      <Switch defaultChecked checkedText="开" uncheckedText="关" />
      <Switch defaultChecked checkedText="｜" uncheckedText="〇" style="margin-left: 5px" />
      <br />
      <br />
      <Switch checkedText="开" uncheckedText="关" size="large" />
      <Switch checkedText="｜" uncheckedText="〇" size="large" style="margin-left: 5px" />
      <br />
      <br />
      <Switch defaultChecked checkedText="开" uncheckedText="关" size="large" />
      <Switch defaultChecked checkedText="｜" uncheckedText="〇" size="large" style="margin-left: 5px" />
    </div>
  </DemoBlock>

  <DemoBlock title="带文本 - 2" desc="相比内嵌文本，更推荐将文本说明放置在 Switch 外部。">
    <div style="display: flex; align-items: center">
      <Title :heading="6" style="margin: 8px">{{ open ? '已开启' : '已关闭' }}</Title>
      <Switch :checked="open" aria-label="a switch for demo" @change="(v: boolean) => (open = v)" />
    </div>
  </DemoBlock>

  <DemoBlock title="受控组件" desc="组件是否选中完全取决于传入的 checked 值，配合 change 回调使用。">
    <Switch :checked="checked" aria-label="a switch for demo" @change="onControlledChange" />
  </DemoBlock>

  <DemoBlock title="加载中" desc="设置 loading 开启加载中状态。">
    <div>
      <Switch loading />
      <br />
      <Switch loading :defaultChecked="true" />
    </div>
  </DemoBlock>
</template>
