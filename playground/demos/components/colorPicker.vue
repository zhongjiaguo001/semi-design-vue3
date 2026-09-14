<script setup lang="ts">
import { ref } from 'vue';
import { ColorPicker, Button, colorStringToValue } from '@/index';
import type { ColorValue } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { ColorPicker } from 'semi-design-vue';`;

const log = (value: ColorValue) => {
  console.log(value);
};

// 默认值：静态工具函数 ColorPicker.colorStringToValue（亦作为命名导出 colorStringToValue） 将常见颜色字符串转换为 { hsva, rgba, hex } 对象
const defaultValue = colorStringToValue('rgb(57,197,187)');

// 受控
const controlled = ref<ColorValue>(colorStringToValue('#39c5bb'));
</script>

<template>
  <DemoBlock title="如何引入" desc="ColorPicker 从 v2.64.0 开始支持" :code="importCode" />

  <DemoBlock title="放在弹层" desc="usePopover 将颜色选择器放入 Popover 中渲染；默认 trigger 为一个色块，也可以通过默认插槽自定义 trigger">
    <div>
      <ColorPicker alpha usePopover @change="log" />
      <br />
      <div>自定义 trigger</div>
      <ColorPicker alpha usePopover @change="log">
        <Button> Trigger </Button>
      </ColorPicker>
    </div>
  </DemoBlock>

  <DemoBlock title="正常展示" desc="直接平铺渲染颜色选择器">
    <ColorPicker alpha @change="log" />
  </DemoBlock>

  <DemoBlock
    title="滴管取色器"
    desc="使用 eyeDropper={true} 开启滴管功能，支持从浏览器内或外部软件屏幕取色。开启此功能需要当前网页部署在 HTTPS 或 localhost 域名等安全 context 下，否则无效果。需用户浏览器版本 Chromium > 95"
  >
    <ColorPicker alpha eyeDropper @change="log" />
  </DemoBlock>

  <DemoBlock
    title="默认值"
    desc="onChange 返回的值同时包含 hsva hex rgba 三种格式；传入的 defaultValue(非受控) 和 value(受控) 也应当是同样的对象。可使用静态工具函数 ColorPicker.colorStringToValue 将 rgb(57,197,187) #39c5bb hsv(176,71,77) 等字符串转换为该对象"
  >
    <div>
      <ColorPicker :defaultValue="defaultValue" alpha @change="log" />
    </div>
  </DemoBlock>

  <DemoBlock title="受控" desc="通过传入 value 来受控使用（也支持 v-model）">
    <div>
      <ColorPicker :value="controlled" alpha @change="(v: ColorValue) => (controlled = v)" />
      <div style="margin-top: 8px">当前值: {{ controlled.hex }}</div>
    </div>
  </DemoBlock>

  <DemoBlock title="顶部和底部渲染额外元素" desc="使用 topSlot 和 bottomSlot（prop 或同名插槽）在顶部和底部渲染额外元素">
    <ColorPicker alpha @change="log">
      <template #topSlot>
        <div> TopSlot</div>
      </template>
      <template #bottomSlot>
        <div>Bottom Slot</div>
      </template>
    </ColorPicker>
  </DemoBlock>
</template>
