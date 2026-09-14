<script setup lang="ts">
import { ref } from 'vue';
import { Anchor } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Anchor } from 'semi-design-vue';`;

// 文档站的标题没有 id，且页面内容区域自身滚动；这里每个示例配一个独立的滚动容器，
// 容器内有与 href 对应的 section（id 加示例前缀避免重复），并通过 getContainer 指定该容器。
type Sec = { id: string; title: string };
const mkSecs = (prefix: string, names: string[]): Sec[] => names.map((n) => ({ id: `${prefix}-${n}`, title: n }));

const basicSecs = mkSecs('basic', ['基本示例', '组件', '设计语言', '物料平台', '主题商店']);
const sizeSecs = mkSecs('size', ['组件', '设计语言', '物料平台', '主题商店']);
const sizeSmallSecs = mkSecs('size-small', ['组件', '设计语言', '物料平台', '主题商店']);
const railNames = ['尺寸', '滑轨主题', '设计语言', '物料平台', '主题商店'];
const railPrimarySecs = mkSecs('rail-primary', railNames);
const railTertiarySecs = mkSecs('rail-tertiary', railNames);
const railMutedSecs = mkSecs('rail-muted', railNames);
const collapseNames = ['动态展示', '组件', '头像', '按钮', '图标', '物料', '主题商店', '设计语言'];
const collapseOnSecs = mkSecs('collapse-on', collapseNames);
const collapseOffSecs = mkSecs('collapse-off', collapseNames);
const tooltipNames = ['显示工具提示', '组件', '设计语言', '物料平台', '主题商店'];
const tooltipSecs = mkSecs('tooltip', tooltipNames);
const positionSecs = mkSecs('position', ['工具提示位置', '组件', '设计语言', '物料平台', '主题商店']);
const fullSecs = mkSecs('full', ['基本示例', '综合使用', '尺寸', '滑轨主题', '动态展示', '显示工具提示', '工具提示位置', 'API参考', 'Anchor', 'Anchor.Link']);

const containers = ref<Record<string, HTMLElement | null>>({});
const setContainer = (key: string) => (el: any) => {
  containers.value[key] = el as HTMLElement | null;
};
const getContainerOf = (key: string) => () => containers.value[key] || (window as any);

const changeLog = ref<string[]>([]);
const onChange = (current: string, previous: string) => {
  changeLog.value = [`onChange: ${previous || '(none)'} -> ${current}`, ...changeLog.value].slice(0, 5);
};
const onClick = (_e: Event | null, link: string) => {
  changeLog.value = [`onClick: ${link}`, ...changeLog.value].slice(0, 5);
};

const fixedStyle = { position: 'fixed', right: '20px', top: '100px', width: '200px', zIndex: 3 } as any;
const showFixed = ref(false);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本示例" desc="使用 Link 可以创建锚点，点击它会跳转到指定位置。（本页示例右侧为可滚动内容区，锚点指向其中的段落。）">
    <div class="anchor-demo">
      <Anchor :get-container="getContainerOf('basic')" :offset-top="10" @change="onChange" @click="onClick">
        <Anchor.Link v-for="s in basicSecs" :key="s.id" :href="`#${s.id}`" :title="s.title" />
      </Anchor>
      <div :ref="setContainer('basic')" class="anchor-demo-scroll">
        <section v-for="s in basicSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
    <div class="anchor-demo-log">
      <div v-for="(l, i) in changeLog" :key="i">{{ l }}</div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="综合使用"
    desc="搭配 getContainer、targetOffset、style、offsetTop 完成一个拆箱即用的超链接导航栏：getContainer 设置滚动容器（默认 window）；targetOffset 设置滚动结束时锚点距离容器顶部的距离；style 自定义定位方式（默认 relative）；offsetTop 在滚动内容距离容器顶部达到指定偏移量时触发当前 Link 切换。"
  >
    <div class="anchor-demo">
      <div>
        <p>
          <span>请看右侧固定的 Anchor </span>
          <button class="anchor-demo-btn" @click="showFixed = !showFixed">{{ showFixed ? '隐藏固定 Anchor' : '显示固定 Anchor（position: fixed）' }}</button>
        </p>
        <Anchor
          :get-container="getContainerOf('full')"
          :offset-top="100"
          :target-offset="100"
          :style="showFixed ? fixedStyle : { width: '200px' }"
        >
          <Anchor.Link href="#full-基本示例" title="我是固定的 Anchor" />
          <Anchor.Link href="#full-综合使用" title="综合使用" />
          <Anchor.Link href="#full-尺寸" title="尺寸" />
          <Anchor.Link href="#full-滑轨主题" title="滑轨主题" />
          <Anchor.Link href="#full-动态展示" title="动态展示" />
          <Anchor.Link href="#full-显示工具提示" title="显示工具提示" />
          <Anchor.Link href="#full-工具提示位置" title="工具提示位置" />
          <Anchor.Link href="#full-API参考" title="API参考">
            <Anchor.Link href="#full-Anchor" title="Anchor" />
            <Anchor.Link href="#full-Anchor.Link" title="Anchor.Link" />
          </Anchor.Link>
        </Anchor>
      </div>
      <div :ref="setContainer('full')" class="anchor-demo-scroll">
        <section v-for="s in fullSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="Anchor 设置 size 可以控制锚点的尺寸。size='default'">
    <div class="anchor-demo">
      <Anchor size="default" :get-container="getContainerOf('size')">
        <Anchor.Link v-for="s in sizeSecs" :key="s.id" :href="`#${s.id}`" :title="s.title" />
      </Anchor>
      <div :ref="setContainer('size')" class="anchor-demo-scroll">
        <section v-for="s in sizeSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="尺寸 - small" desc="size='small'">
    <div class="anchor-demo">
      <Anchor size="small" :get-container="getContainerOf('size-small')">
        <Anchor.Link v-for="s in sizeSmallSecs" :key="s.id" :href="`#${s.id}`" :title="s.title" />
      </Anchor>
      <div :ref="setContainer('size-small')" class="anchor-demo-scroll">
        <section v-for="s in sizeSmallSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="滑轨主题" desc="Anchor 设置 railTheme 可以控制滑轨的主题色。默认值为 primary。railTheme='primary'">
    <div class="anchor-demo">
      <Anchor rail-theme="primary" :get-container="getContainerOf('rail-primary')" :target-offset="60" :offset-top="100">
        <Anchor.Link v-for="s in railPrimarySecs" :key="s.id" :href="`#${s.id}`" :title="s.title" />
      </Anchor>
      <div :ref="setContainer('rail-primary')" class="anchor-demo-scroll">
        <section v-for="s in railPrimarySecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="滑轨主题 - tertiary" desc="railTheme='tertiary'">
    <div class="anchor-demo">
      <Anchor rail-theme="tertiary" :get-container="getContainerOf('rail-tertiary')" :target-offset="60" :offset-top="100">
        <Anchor.Link v-for="s in railTertiarySecs" :key="s.id" :href="`#${s.id}`" :title="s.title" />
      </Anchor>
      <div :ref="setContainer('rail-tertiary')" class="anchor-demo-scroll">
        <section v-for="s in railTertiarySecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="滑轨主题 - muted" desc="railTheme='muted'">
    <div class="anchor-demo">
      <Anchor rail-theme="muted" :get-container="getContainerOf('rail-muted')" :target-offset="60" :offset-top="100">
        <Anchor.Link v-for="s in railMutedSecs" :key="s.id" :href="`#${s.id}`" :title="s.title" />
      </Anchor>
      <div :ref="setContainer('rail-muted')" class="anchor-demo-scroll">
        <section v-for="s in railMutedSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="动态展示" desc="Anchor 设置 autoCollapse 可以动态展示下一级锚点。默认值为 false。autoCollapse=true：仅展开当前激活分支的子锚点。">
    <div class="anchor-demo">
      <Anchor :auto-collapse="true" :get-container="getContainerOf('collapse-on')" :target-offset="60" :offset-top="100">
        <Anchor.Link href="#collapse-on-动态展示" title="1. 动态展示">
          <Anchor.Link href="#collapse-on-组件" title="1.1 组件">
            <Anchor.Link href="#collapse-on-头像" title="1.1.1 Avatar" />
            <Anchor.Link href="#collapse-on-按钮" title="1.1.2 Button" />
            <Anchor.Link href="#collapse-on-图标" title="1.1.3 Icon" />
          </Anchor.Link>
          <Anchor.Link href="#collapse-on-物料" title="1.2 物料" />
          <Anchor.Link href="#collapse-on-主题商店" title="1.3 主题商店" />
        </Anchor.Link>
        <Anchor.Link href="#collapse-on-设计语言" title="2. 设计语言" />
      </Anchor>
      <div :ref="setContainer('collapse-on')" class="anchor-demo-scroll">
        <section v-for="s in collapseOnSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="动态展示 - autoCollapse=false" desc="autoCollapse=false：始终展示全部层级。">
    <div class="anchor-demo">
      <Anchor :auto-collapse="false" :get-container="getContainerOf('collapse-off')" :target-offset="60" :offset-top="100">
        <Anchor.Link href="#collapse-off-动态展示" title="1. 动态展示">
          <Anchor.Link href="#collapse-off-组件" title="1.1 组件">
            <Anchor.Link href="#collapse-off-头像" title="1.1.1 Avatar" />
            <Anchor.Link href="#collapse-off-按钮" title="1.1.2 Button" />
            <Anchor.Link href="#collapse-off-图标" title="1.1.3 Icon" />
          </Anchor.Link>
          <Anchor.Link href="#collapse-off-物料" title="1.2 物料" />
          <Anchor.Link href="#collapse-off-主题商店" title="1.3 主题商店" />
        </Anchor.Link>
        <Anchor.Link href="#collapse-off-设计语言" title="2. 设计语言" />
      </Anchor>
      <div :ref="setContainer('collapse-off')" class="anchor-demo-scroll">
        <section v-for="s in collapseOffSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="显示工具提示" desc="Anchor 设置 showTooltip 可以在 Link 超出最大宽度时显示 Link 的文字内容。默认值为 false。">
    <div class="anchor-demo">
      <Anchor :show-tooltip="true" :get-container="getContainerOf('tooltip')" :target-offset="60" :offset-top="100">
        <Anchor.Link href="#tooltip-显示工具提示" title="工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。" />
        <Anchor.Link href="#tooltip-组件" title="组件" />
        <Anchor.Link href="#tooltip-设计语言" title="设计语言" />
        <Anchor.Link href="#tooltip-物料平台" title="物料平台" />
        <Anchor.Link href="#tooltip-主题商店" title="主题商店" />
      </Anchor>
      <div :ref="setContainer('tooltip')" class="anchor-demo-scroll">
        <section v-for="s in tooltipSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="工具提示位置" desc="Anchor 设置 position 可以设置 Tooltip 的显示位置。它仅在 showTooltip 为 true 时起作用。">
    <div class="anchor-demo">
      <Anchor :show-tooltip="true" position="right" :get-container="getContainerOf('position')" :target-offset="60" :offset-top="100">
        <Anchor.Link href="#position-工具提示位置" title="工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。" />
        <Anchor.Link href="#position-组件" title="组件" />
        <Anchor.Link href="#position-设计语言" title="设计语言" />
        <Anchor.Link href="#position-物料平台" title="物料平台" />
        <Anchor.Link href="#position-主题商店" title="主题商店" />
      </Anchor>
      <div :ref="setContainer('position')" class="anchor-demo-scroll">
        <section v-for="s in positionSecs" :id="s.id" :key="s.id" class="anchor-demo-section">
          <h4>{{ s.title }}</h4>
          <p>{{ s.title }} 的内容区域……</p>
        </section>
      </div>
    </div>
  </DemoBlock>
</template>

<style scoped>
.anchor-demo {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.anchor-demo-scroll {
  flex: 1;
  min-width: 0;
  height: 260px;
  overflow: auto;
  border: 1px solid var(--semi-color-border);
  border-radius: 6px;
  padding: 0 16px;
  background: var(--semi-color-fill-0);
}
.anchor-demo-section {
  height: 220px;
  border-bottom: 1px dashed var(--semi-color-border);
}
.anchor-demo-section h4 {
  margin: 12px 0 8px;
  color: var(--semi-color-text-0);
}
.anchor-demo-section p {
  margin: 0;
  color: var(--semi-color-text-2);
}
.anchor-demo-log {
  margin-top: 12px;
  font-size: 12px;
  color: var(--semi-color-text-2);
  font-family: monospace;
}
.anchor-demo-btn {
  margin-left: 8px;
  padding: 2px 8px;
  cursor: pointer;
}
</style>
