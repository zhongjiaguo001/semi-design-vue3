<script setup lang="ts">
import { computed, ref } from 'vue';
import { Collapsible, Button, InputNumber } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Collapsible } from 'semi-design-vue';`;

// 基本用法
const basicOpen = ref(false);

// 自定义动画时间
const durationOpen = ref(false);
const duration = ref(250);

// 嵌套使用
const nestOpen = ref(false);
const nestChildOpen = ref(false);

// 自定义折叠高度
const heightOpen = ref(false);
const maskStyle = computed(() =>
  heightOpen.value
    ? {}
    : {
        WebkitMaskImage:
          'linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.2) 80%, transparent 100%)',
      }
);
const linkStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  textAlign: 'center',
  bottom: '-10px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

// Accessibility (aria-controls)
const collapseId = 'myCollapsible';
const ariaVisible = ref(false);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="通过 isOpen 来控制内容的展开或者折叠。">
    <div>
      <Button @click="basicOpen = !basicOpen">Toggle</Button>
      <Collapsible :isOpen="basicOpen">
        <ul>
          <li><p>Semi Design 以内容优先进行设计。</p></li>
          <li><p>更容易地自定义主题。</p></li>
          <li><p>适用国际化场景。</p></li>
          <li><p>效率场景加入人性化关怀。</p></li>
        </ul>
      </Collapsible>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义动画时间" desc="通过 duration 设置动画展开或者折叠的时间，也可以通过 motion 来关闭动画。">
    <div>
      <label>设置动画时间：</label>
      <InputNumber :min="0" :defaultValue="250" :style="{ width: '120px' }" :step="10" @change="(val: any) => (duration = Number(val) || 0)" />
      <br />
      <Button @click="durationOpen = !durationOpen">Toggle</Button>
      <Collapsible :isOpen="durationOpen" :duration="duration">
        <ul>
          <li><p>Semi Design 以内容优先进行设计。</p></li>
          <li><p>更容易地自定义主题。</p></li>
          <li><p>适用国际化场景。</p></li>
          <li><p>效率场景加入人性化关怀。</p></li>
        </ul>
      </Collapsible>
    </div>
  </DemoBlock>

  <DemoBlock title="嵌套使用" desc="Collapsible 可以嵌套使用，内层高度变化会自动反映到外层。">
    <div>
      <Button @click="nestOpen = !nestOpen">Toggle</Button>
      <br />
      <Collapsible :isOpen="nestOpen">
        <div>
          <span>Semi Design的设计原则包括：</span>
          <Button @click="nestChildOpen = !nestChildOpen">Toggle List</Button>
        </div>
        <Collapsible :isOpen="nestChildOpen">
          <ul>
            <li><p>Semi Design 以内容优先进行设计。</p></li>
            <li><p>更容易地自定义主题。</p></li>
            <li><p>适用国际化场景。</p></li>
            <li><p>效率场景加入人性化关怀。</p></li>
          </ul>
        </Collapsible>
      </Collapsible>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义折叠高度" desc="可以使用 collapseHeight 自定义收起的高度。">
    <div>
      <Button @click="heightOpen = !heightOpen">Toggle</Button>
      <div style="position: relative">
        <Collapsible :isOpen="heightOpen" :collapseHeight="60" :style="maskStyle">
          <ul>
            <li><p>Semi Design 以内容优先进行设计。</p></li>
            <li><p>更容易地自定义主题。</p></li>
            <li><p>适用国际化场景。</p></li>
            <li><p>效率场景加入人性化关怀。</p></li>
          </ul>
        </Collapsible>
        <a v-if="!heightOpen" :style="linkStyle" @click="heightOpen = !heightOpen">+ Show More</a>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="ARIA" desc="Collapsible 的 id 会设置到内容 wrapper 上，配合按钮的 aria-controls 指明控制关系。">
    <div>
      <Button :aria-controls="collapseId" @click="ariaVisible = !ariaVisible">{{ ariaVisible ? 'hide' : 'show' }}</Button>
      <Collapsible :isOpen="ariaVisible" :id="collapseId">
        <div>hide content</div>
      </Collapsible>
    </div>
  </DemoBlock>
</template>
