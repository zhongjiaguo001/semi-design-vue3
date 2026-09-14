<script setup lang="ts">
import { h, defineComponent } from 'vue';
import {
  Icon,
  IconHome,
  IconEmoji,
  IconSpin,
  IconSearch,
  IconHelpCircle,
  IconAlertCircle,
  IconMinusCircle,
  IconPlusCircle,
  IconPlus,
  IconRefresh,
  IconLikeHeart,
  IconFlag,
  IconLock,
  IconUnlock,
  IconAIWandLevel2,
  IconAIFilledLevel2,
  IconAIBellLevel3,
  IconAIWandLevel3,
  IconAIFilledLevel3,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Icon, IconHome, IconAIWandLevel2 } from 'semi-design-vue';`;

// 尺寸
const types = [IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh];
const sizes = ['extra-small', 'small', 'default', 'large', 'extra-large'] as const;

// 自定义图标：与官方示例相同的 svg
const CustomIcon = defineComponent({
  name: 'CustomIcon',
  setup() {
    return () =>
      h('svg', { width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
        h('circle', { cx: '12', cy: '12', r: '11', fill: '#FBCD2C' }),
        h('mask', { id: 'mask0', 'mask-type': 'alpha', maskUnits: 'userSpaceOnUse', x: '1', y: '1', width: '22', height: '22' }, [
          h('circle', { cx: '12', cy: '12', r: '11', fill: '#A2845E' }),
        ]),
        h('g', { mask: 'url(#mask0)' }, [
          h('path', {
            'fill-rule': 'evenodd',
            'clip-rule': 'evenodd',
            d: 'M11.9996 17.7963C13.7184 17.7963 15.2479 16.3561 16.0881 14.2048C16.6103 13.9909 17.1072 13.3424 17.334 12.4957C17.629 11.3948 17.5705 10.4118 16.7665 10.1059C16.6885 6.27115 15.1754 4.78714 11.9996 4.78714C8.82412 4.78714 7.31097 6.27097 7.2328 10.1052C6.42711 10.4103 6.36828 11.394 6.66349 12.4957C6.89064 13.3435 7.38849 13.9926 7.91145 14.2056C8.7518 16.3565 10.2811 17.7963 11.9996 17.7963ZM20.0126 23C20.34 23 20.5906 22.7037 20.4686 22.3999C19.6099 20.2625 16.1444 18.6636 12 18.6636C7.85555 18.6636 4.39008 20.2625 3.53142 22.3999C3.40937 22.7037 3.65999 23 3.9874 23H20.0126Z',
            fill: 'white',
          }),
        ]),
      ]);
  },
});
</script>

<template>
  <DemoBlock title="如何引入" desc="图标为独立 Vue 组件，与 Icon 包装组件一起从包根导出。" :code="importCode" />

  <DemoBlock title="基础使用" desc="直接引入图标组件使用。">
    <IconHome />
  </DemoBlock>

  <DemoBlock title="旋转" desc="图标组件自带尺寸、旋转（rotate）、spin 功能。">
    <div>
      <IconHome size="small" />
      <IconEmoji :rotate="180" />
      <IconSpin spin />
    </div>
  </DemoBlock>

  <DemoBlock
    title="尺寸"
    desc="size 支持 extra-small (8x8)、small (12x12)、default (16x16)、large (20x20)、extra-large (24x24)；inherit 时继承当前字体大小。"
  >
    <div v-for="(Type, i) in types" :key="i" style="margin-bottom: 4px">
      <component :is="Type" v-for="size in sizes" :key="size" :size="size" />
    </div>
  </DemoBlock>

  <DemoBlock title="颜色" desc="单色图标自动继承外部容器的 color；也可以通过 style 修改图标颜色。">
    <div>
      <div style="color: #e91e63">
        <IconLikeHeart size="extra-large" />
        <IconFlag size="extra-large" />
      </div>
      <br />
      <div>
        <IconLock :style="{ color: '#6A3AC7' }" size="extra-large" />
        <IconUnlock :style="{ color: '#9C27B0' }" size="extra-large" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="双色图标" desc="双色图标可以通过 fill 属性设置颜色，支持 string 以及 string[]。">
    <div>
      <IconAIWandLevel2
        :fill="['var(--semi-color-danger)', 'var(--semi-color-success)']"
        :style="{ marginRight: '10px' }"
        size="extra-large"
      />
      <IconAIFilledLevel2 fill="var(--semi-color-success)" size="extra-large" />
    </div>
  </DemoBlock>

  <DemoBlock title="多色按钮" desc="多色图标可传入四个颜色，通过 fill 属性设置，支持 string 以及 string[]。">
    <div>
      <IconAIBellLevel3 :style="{ marginRight: '10px' }" size="extra-large" />
      <IconAIWandLevel3
        :fill="['var(--semi-color-danger)', 'var(--semi-color-success)', 'var(--semi-color-primary)', 'var(--semi-color-warning)']"
        :style="{ marginRight: '10px' }"
        size="extra-large"
      />
      <IconAIFilledLevel3 :fill="['var(--semi-color-primary)', 'var(--semi-color-success)']" size="extra-large" />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义图标" desc="可以将自定义 svg 组件传入 Icon 的 svg 属性（或默认插槽）。Icon 支持 size、rotate、spin 等属性。">
    <div>
      <Icon :svg="CustomIcon" />
      <Icon :svg="CustomIcon" :rotate="180" />
      <Icon>
        <CustomIcon />
      </Icon>
    </div>
  </DemoBlock>

  <DemoBlock
    title="使用 svgr / Vite 将 svg 转成组件"
    desc="官网示例用 @svgr/webpack 把 svg 转成 React 组件。Vue 项目可用 vite-svg-loader，或把 svg 写成组件后传给 Icon 的 svg（见上方「自定义图标」）。"
    code="// vite.config.ts
plugins: [vue(), svgLoader()]

import { Icon } from 'semi-design-vue';
import StarIcon from './star.svg';

<Icon :svg=&quot;StarIcon&quot; />"
  />

  <DemoBlock
    title="ARIA"
    desc="Icon 的 role 为 img，aria-label 默认为图标名（如 IconHome 为 home），可通过 aria-label 传入更语义化的名字；内部 svg 为装饰元素，默认 aria-hidden。"
  >
    <IconHome aria-label="back to homepage" />
  </DemoBlock>
</template>

