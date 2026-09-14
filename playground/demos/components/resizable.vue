<script setup lang="ts">
import { h, ref } from 'vue';
import {
  Resizable,
  ResizeGroup,
  ResizeItem,
  ResizeHandler,
  Switch,
  Title,
  Button,
  Toast,
  IconHandle,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Resizable, ResizeItem, ResizeHandler, ResizeGroup } from 'semi-design-vue';`;

const bg = { backgroundColor: 'rgba(var(--semi-grey-1), 1)' };
const border = { border: 'var(--semi-color-border) 1px solid' };
const itemStyle = { ...bg, ...border };

const text = ref('Drag edge to resize');
const enableLeft = ref(false);
const size = ref({ width: 200, height: 100 });
const groupText = ref('Drag to resize');
const nestText = ref('Drag to resize');
const nestText2 = ref('Drag to resize');
const dirText = ref('drag to resize');
const direction = ref<'horizontal' | 'vertical'>('horizontal');

const toastStart = { content: 'resize start', duration: 1, stack: true };
const toastEnd = { content: 'resize end', duration: 1, stack: true };

const rightHandle = () =>
  h('div', { style: { height: '100%', display: 'flex', alignItems: 'center', width: 'fit-content' } }, [h(IconHandle)]);
</script>

<template>
  <DemoBlock title="如何引入" desc="Resizable 从 2.69.0 开始支持。" :code="importCode" />

  <DemoBlock title="单个组件 基本使用" desc="defaultSize 设置初始大小；onResizeStart / onChange / onResizeEnd 为拖拽回调。">
    <div style="width: 500px">
      <Resizable
        :style="bg"
        :defaultSize="{ width: '60%', height: 300 }"
        :onChange="() => (text = 'resizing')"
        :onResizeStart="() => Toast.info(toastStart)"
        :onResizeEnd="() => { Toast.info(toastEnd); text = 'Drag edge to resize'; }"
      >
        <div style="margin-left: 20%">{{ text }}</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="控制伸缩方向" desc="enable 开启/关闭特定方向，默认均为 true。">
    <div style="width: 500px; height: 60%">
      <div :style="{ display: 'flex', alignItems: 'center', margin: '8px' }">
        <Switch :checked="enableLeft" @change="(v: boolean) => (enableLeft = v)" />
        <Title :heading="6" :style="{ margin: '8px' }">{{ enableLeft ? 'able' : 'disable' }}</Title>
      </div>
      <Resizable :style="bg" :enable="{ left: enableLeft }" :defaultSize="{ width: 200, height: 200 }">
        <div style="margin-left: 20%">enable.left:{{ enableLeft }}</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="设置变化比例" desc="ratio 设置拖动和实际变化的比例。">
    <div style="width: 500px; height: 60%">
      <Resizable :style="bg" :ratio="2" :defaultSize="{ width: 200, height: 200 }">
        <div style="margin-left: 20%">ratio=2</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="锁定横纵比" desc="lockAspectRatio 为 boolean 或 number；true 锁定初始比，number 为指定比。">
    <div style="width: 500px; height: 60%">
      <Resizable :style="{ ...bg, marginBottom: '10px' }" :defaultSize="{ width: 400, height: 300 }" lockAspectRatio>
        <div style="margin-left: 20%">lock</div>
      </Resizable>
      <Resizable :style="bg" :defaultSize="{ width: 200, height: (200 * 9) / 16 }" :lockAspectRatio="16 / 9">
        <div style="margin-left: 20%">16 / 9</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="设置最大，最小宽高" desc="maxHeight / maxWidth / minHeight / minWidth。">
    <div style="width: 500px; height: 60%">
      <Resizable :style="bg" :maxWidth="200" :maxHeight="300" :minWidth="50" :minHeight="50" :defaultSize="{ width: 100, height: 100 }">
        <div style="margin-left: 20%">width在50到200之间，height在50到300之间</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="受控宽高" desc="size 控制元素宽高，配合 onChange。">
    <div style="width: 500px; height: 60%">
      <Button @click="size = { width: Number(size.width) + 10, height: Number(size.height) + 10 }">set += 10</Button>
      <Resizable :style="{ ...bg, marginTop: '10px' }" :size="size" :onChange="(s: any) => (size = s)">
        <div style="margin-left: 20%">受控</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="设置缩放值" desc="scale 整体缩放元素。">
    <div :style="{ width: '500px', height: '60%', transform: 'scale(0.5)', transformOrigin: '0 0' }">
      <Resizable :style="bg" :defaultSize="{ width: '60%', height: '60%' }" :scale="0.5">
        <div style="margin-left: 20%">scale 0.5</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="根据元素限制元素宽高" desc="boundElement 支持 'parent' | 'window'。">
    <div :style="{ width: '300px', height: '300px', border: 'var(--semi-color-border) 1px solid' }">
      <Resizable :style="{ marginLeft: '20%', ...bg }" :defaultSize="{ width: '60%', height: 200 }" boundElement="parent">
        <div style="margin-left: 20%">bound：parent</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义边角 handler 样式" desc="handleNode 设置各方向拖动节点；handleStyle / handleClass 设置样式。">
    <div style="width: 500px; height: 60%">
      <Resizable
        :style="{ marginLeft: '20%', ...bg, ...border }"
        :defaultSize="{ width: '60%', height: 300 }"
        :handleNode="{ right: rightHandle }"
      >
        <div style="margin-left: 20%">right</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="允许阶段性调整宽高" desc="grid 对齐增量，snap 绝对像素，snapGap 为跳到下一目标的最小间隙。">
    <div style="width: 500px; height: 60%">
      <Resizable :style="{ marginLeft: '20%', ...bg, ...border }" :defaultSize="{ width: '60%', height: 300 }" :grid="[100, 100]" :snapGap="20">
        <div style="margin-left: 20%">snap</div>
      </Resizable>
    </div>
  </DemoBlock>

  <DemoBlock title="组合组件 基本使用" desc="ResizeGroup 父元素需要主轴方向尺寸。direction 为 horizontal / vertical。ResizeItem 支持 min / max / defaultSize。">
    <div style="width: 1000px; height: 100px">
      <ResizeGroup direction="horizontal">
        <ResizeItem :style="itemStyle" defaultSize="400px" min="10%" :onChange="() => (groupText = 'resizing')" :onResizeEnd="() => (groupText = 'Drag to resize')">
          <div style="margin-left: 20%">{{ groupText }} min:10%</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem :style="itemStyle" defaultSize="20%" min="10%" max="30%" :onChange="() => (groupText = 'resizing')">
          <div style="margin-left: 20%">{{ groupText }} min:10% max:30%</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem :style="itemStyle" :defaultSize="0.5" :onChange="() => (groupText = 'resizing')">
          <div style="margin-left: 20%">{{ groupText }}</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem :style="itemStyle" :defaultSize="1" :onChange="() => (groupText = 'resizing')">
          <div style="margin-left: 20%">{{ groupText }}</div>
        </ResizeItem>
      </ResizeGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="嵌套使用" desc="可在 vertical / horizontal 之间嵌套。">
    <div style="width: 1000px; height: 400px">
      <ResizeGroup direction="vertical">
        <ResizeItem :style="bg" defaultSize="20%">
          <div style="margin-left: 20%">header</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize="80%">
          <ResizeGroup direction="horizontal">
            <ResizeItem :style="itemStyle" defaultSize="25%" :onChange="() => (nestText = 'resizing')">
              <div style="margin-left: 20%">tab</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem :style="itemStyle" defaultSize="75%" :onChange="() => (nestText = 'resizing')">
              <div style="margin-left: 20%">{{ nestText }}</div>
            </ResizeItem>
          </ResizeGroup>
        </ResizeItem>
      </ResizeGroup>
    </div>
    <br />
    <div style="width: 1000px; height: 400px">
      <ResizeGroup direction="vertical">
        <ResizeItem defaultSize="80%">
          <ResizeGroup direction="horizontal">
            <ResizeItem :style="itemStyle" defaultSize="25%" min="10%" max="30%">
              <div style="margin-left: 20%">{{ nestText2 }} min:10% max:30%</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem :style="border" defaultSize="50%">
              <div style="height: 100%">
                <ResizeGroup direction="vertical">
                  <ResizeItem :style="itemStyle" defaultSize="33%" min="10%" :onChange="() => (nestText2 = 'resizing')" :onResizeEnd="() => (nestText2 = 'Drag to resize')">
                    <div style="margin-left: 20%">{{ nestText2 }} min:10%</div>
                  </ResizeItem>
                  <ResizeHandler />
                  <ResizeItem :style="itemStyle" defaultSize="33%" min="10%" max="40%">
                    <div style="margin-left: 20%">{{ nestText2 }} min:10% max:40%</div>
                  </ResizeItem>
                  <ResizeHandler />
                  <ResizeItem :style="itemStyle">
                    <div style="margin-left: 20%">{{ nestText2 }}</div>
                  </ResizeItem>
                </ResizeGroup>
              </div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem :style="itemStyle" defaultSize="1" max="30%">
              <div style="margin-left: 20%">{{ nestText2 }} max:30%</div>
            </ResizeItem>
          </ResizeGroup>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize="20%">
          <ResizeGroup direction="horizontal">
            <ResizeItem :style="itemStyle" defaultSize="50%">
              <div style="margin-left: 20%">tab</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem :style="itemStyle" defaultSize="50%">
              <div style="margin-left: 20%">content</div>
            </ResizeItem>
          </ResizeGroup>
        </ResizeItem>
      </ResizeGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="动态方向">
    <div style="width: 400px; height: 300px">
      <Button @click="direction = direction === 'horizontal' ? 'vertical' : 'horizontal'">{{ direction }}</Button>
      <ResizeGroup :direction="direction">
        <ResizeItem :defaultSize="5" :onChange="() => (dirText = 'resizing')" :onResizeEnd="() => (dirText = 'drag to resize')">
          <ResizeGroup direction="horizontal">
            <ResizeItem :style="bg" :onChange="() => (dirText = 'resizing')" :onResizeEnd="() => (dirText = 'drag to resize')">
              <div :style="{ marginLeft: '20%', padding: '5px' }">{{ dirText }}</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem :style="bg" :onChange="() => (dirText = 'resizing')">
              <div :style="{ marginLeft: '20%', padding: '5px' }">{{ dirText }}</div>
            </ResizeItem>
          </ResizeGroup>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem :style="bg" :defaultSize="1.3" :onChange="() => (dirText = 'resizing')">
          <div :style="{ marginLeft: '20%', padding: '5px' }">{{ dirText }}</div>
        </ResizeItem>
      </ResizeGroup>
    </div>
  </DemoBlock>
</template>
