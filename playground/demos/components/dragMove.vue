<script setup lang="ts">
import { ref } from 'vue';
import { DragMove, IconTransparentStroked } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { DragMove } from 'semi-design-vue';`;

// 限制拖动范围
const containerRef = ref<HTMLElement | null>(null);

// 自定义触发拖动的元素
const handlerRef = ref<HTMLElement | null>(null);
const handlerContainerRef = ref<HTMLElement | null>(null);

// 自定义拖动后的位置处理
const customContainerRef = ref<HTMLElement | null>(null);
const elementRef = ref<HTMLElement | null>(null);
let startPoint: { x: number; y: number } | null = null;

const customMove = (element: HTMLElement, top: number, left: number) => {
  const container = customContainerRef.value!;
  if (left + 100 > container.offsetWidth) {
    element.style.right = `${container.offsetWidth - left - element.offsetWidth}px`;
    element.style.left = 'auto';
  } else {
    element.style.left = left + 'px';
  }
  element.style.top = top + 'px';
};

const onMouseDown = (e: MouseEvent) => {
  startPoint = { x: e.clientX, y: e.clientY };
};

const onMouseUp = (e: MouseEvent) => {
  if (startPoint) {
    const { x, y } = startPoint;
    if (Math.abs(e.clientX - x) < 5 && Math.abs(e.clientY - y) < 5) {
      const el = elementRef.value!;
      if (el.style.width === '60px') {
        el.style.width = '100px';
      } else {
        el.style.width = '60px';
      }
    }
  }
  startPoint = null;
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="被 DragMove 包裹的元素将能够通过拖拽改变位置。">
    <div style="height: 120px; position: relative">
      <DragMove>
        <div
          :style="{
            backgroundColor: 'var(--semi-color-primary)',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            fontWeight: 500,
            position: 'absolute',
            color: 'rgba(var(--semi-white), 1)',
          }"
        >
          Drag me
        </div>
      </DragMove>
    </div>
  </DemoBlock>

  <DemoBlock title="限制拖动范围" desc="传入 constrainer，该函数返回限制可拖拽范围的元素（需为 relative 定位）。">
    <div
      ref="containerRef"
      :style="{
        backgroundColor: 'rgba(var(--semi-grey-2), 1)',
        width: '300px',
        height: '300px',
        padding: '5px',
        position: 'relative',
        color: 'rgba(var(--semi-white), 1)',
        fontWeight: 500,
      }"
    >
      <span>Constrainer</span>
      <DragMove :constrainer="() => containerRef!">
        <div
          :style="{
            backgroundColor: 'var(--semi-color-primary)',
            width: '80px',
            height: '80px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: '80px',
            left: '80px',
          }"
        >
          Drag me
        </div>
      </DragMove>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义触发拖动的元素" desc="可通过 handler 自定义触发拖动的元素；设置后仅点击 handler 部分可拖动。">
    <div
      ref="handlerContainerRef"
      :style="{
        backgroundColor: 'rgba(var(--semi-grey-2), 1)',
        width: '300px',
        height: '300px',
        padding: '5px',
        position: 'relative',
        color: 'rgba(var(--semi-white), 1)',
        fontWeight: 500,
      }"
    >
      <span>Constrainer</span>
      <DragMove :handler="() => handlerRef!" :constrainer="() => handlerContainerRef!">
        <div
          :style="{
            backgroundColor: 'var(--semi-color-primary)',
            width: '80px',
            height: '80px',
            borderRadius: '10px',
            position: 'absolute',
            top: '50px',
            left: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
        >
          <div ref="handlerRef" style="width: fit-content; height: fit-content">
            <IconTransparentStroked size="large" />
          </div>
        </div>
      </DragMove>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义拖动后的位置处理" desc="可通过 customMove 自定义拖动后的位置处理，组件内部仅返回计算后的位置，不做设置。">
    <span>蓝色色块点击可改变宽度，改变前后蓝色色块均不会超出范围限制 </span>
    <br /><br />
    <div
      ref="customContainerRef"
      :style="{
        backgroundColor: 'rgba(var(--semi-grey-2), 1)',
        width: '300px',
        height: '300px',
        position: 'relative',
        padding: '10px',
        color: 'rgba(var(--semi-white), 1)',
        fontWeight: 500,
      }"
    >
      <span>Constrainer</span>
      <DragMove :constrainer="() => customContainerRef!" :custom-move="customMove">
        <div
          ref="elementRef"
          :style="{
            backgroundColor: 'var(--semi-color-primary)',
            width: '60px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: '50px',
            left: '50px',
            borderRadius: '10px',
            padding: '5px',
          }"
          @mousedown="onMouseDown"
          @mouseup="onMouseUp"
        >
          Drag me
        </div>
      </DragMove>
    </div>
  </DemoBlock>
</template>
