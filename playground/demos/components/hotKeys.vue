<script setup lang="ts">
import { ref, h } from 'vue';
import { HotKeys, Modal, Tag, Input } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const Keys = (HotKeys as any).Keys as Record<string, string>;

// 基本用法
const basicVisible = ref(false);
const basicHotKeys = [Keys.Control, 'Shift', Keys.A];

// 自定义内容 (content)
const contentVisible = ref(false);
const contentHotKeys = [Keys.Control, 'Shift', Keys.B];

// 自定义内容 (render)
const renderVisible = ref(false);
const renderHotKeys = [Keys.Control, Keys.R];
const newHotKeys = h(Tag, null, () => 'Press Ctrl+R to Open Modal');

// 阻止默认事件
const preventVisible = ref(false);
const preventHotKeys = [Keys.Meta, Keys.S];

// 修改监听挂载DOM
const targetVisible = ref(false);
const targetHotKeys = ['Control', 'q'];
const inputRef = ref<any>(null);
const getListenerTarget = () => {
  const inst = inputRef.value;
  const el = inst && typeof inst.getInputElement === 'function' ? inst.getInputElement() : inst?.$el;
  return (el as HTMLElement) || document.body;
};
</script>

<template>
  <DemoBlock title="如何引入" desc="HotKeys 从 2.66.0 开始支持" code="import { HotKeys } from 'semi-design-vue';" />

  <DemoBlock
    title="说明"
    desc="快捷键仅支持修饰键 Shift、Control、Meta、Alt 与其他键的组合。Meta 在 macOS 为 Command，Windows 为 Win。与系统常用快捷键（如 Ctrl/Meta + C）冲突时，可通过 preventDefault 控制默认事件是否触发。"
  />

  <DemoBlock title="基本用法" desc="通过 hotKeys 传入快捷键组合，通过 @hotKey 绑定快捷键处理函数。按下 Ctrl + Shift + A，唤起 Modal。默认在 document.body 监听，全局生效。">
    <div>
      <HotKeys :hotKeys="basicHotKeys" @hotKey="basicVisible = true" />
      <Modal title="Dialog" :visible="basicVisible" :onOk="() => { basicVisible = false; }" :onCancel="() => { basicVisible = false; }" @update:visible="(v: boolean) => (basicVisible = v)">
        This is the Modal opened by hotkey: {{ basicHotKeys.join('+') }}.
      </Modal>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义内容" desc="通过 content 传入渲染的字符">
    <div>
      <HotKeys :hotKeys="contentHotKeys" :content="['Ctrl', 'Shift', 'B']" @hotKey="contentVisible = true" />
      <Modal title="Dialog" :visible="contentVisible" :onOk="() => { contentVisible = false; }" :onCancel="() => { contentVisible = false; }" @update:visible="(v: boolean) => (contentVisible = v)">
        This is the Modal opened by hotkey: {{ contentHotKeys.join('+') }}.
      </Modal>
    </div>
  </DemoBlock>

  <DemoBlock title="自定义内容 - 2" desc="通过 render 传入代替渲染的元素（也可使用 #render 插槽）">
    <div>
      <HotKeys :hotKeys="renderHotKeys" :render="newHotKeys" @hotKey="renderVisible = true" />
      <Modal title="Dialog" :visible="renderVisible" :onOk="() => { renderVisible = false; }" :onCancel="() => { renderVisible = false; }" @update:visible="(v: boolean) => (renderVisible = v)">
        This is the Modal opened by hotkey: {{ renderHotKeys.join('+') }}.
      </Modal>
    </div>
  </DemoBlock>

  <DemoBlock title="阻止默认事件" desc="通过设置 preventDefault 控制默认事件是否触发">
    <div>
      <HotKeys :hotKeys="preventHotKeys" preventDefault @hotKey="preventVisible = true" />
      <br />
      <HotKeys :hotKeys="[Keys.Control, Keys.S]" preventDefault @hotKey="preventVisible = true" />
      <Modal title="Dialog" :visible="preventVisible" :onOk="() => { preventVisible = false; }" :onCancel="() => { preventVisible = false; }" @update:visible="(v: boolean) => (preventVisible = v)">
        This is the Modal opened by hotkey: Meta/Control + S.
      </Modal>
    </div>
  </DemoBlock>

  <DemoBlock title="修改监听挂载DOM" desc="快捷键默认在 body 监听，通过 getListenerTarget 修改快捷键监听挂载的 DOM（此处仅在 Input 聚焦时按 Ctrl + Q 生效）">
    <div>
      <Input ref="inputRef" placeholder="test for target" />
      <HotKeys :hotKeys="targetHotKeys" :getListenerTarget="getListenerTarget" @hotKey="targetVisible = true" />
      <Modal title="Dialog" :visible="targetVisible" :onOk="() => { targetVisible = false; }" :onCancel="() => { targetVisible = false; }" @update:visible="(v: boolean) => (targetVisible = v)">
        This is the Modal opened by hotkey: {{ targetHotKeys.join('+') }}.
      </Modal>
    </div>
  </DemoBlock>
</template>
