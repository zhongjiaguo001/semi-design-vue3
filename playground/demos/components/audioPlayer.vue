<script setup lang="ts">
import { AudioPlayer } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { AudioPlayer } from 'semi-design-vue';`;

const cover = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/abstract.jpg';
const audio1 = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/components/audio1.mp3';
const audio2 = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/components/audio2.mp3';

// 基本用法
const audioUrl = audio2;
const audioUrlArr = [audio1, audio2];
const audioUrlObj = { src: audio1, title: '音频标题', cover };
const audioUrlArrObj = [
  { src: audio1, title: '音频标题1', cover },
  { src: audio2, title: '音频标题2', cover },
];

// 隐藏工具栏
const audioUrlObjNoCover = { src: audio1, title: '音频标题' };
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="基本使用，通过 audioUrl 传入音频地址。audioUrl 可以传入字符串、字符串数组、对象、对象数组。"
  >
    <div style="width: 100%">
      <div style="margin-top: 10px">
        <AudioPlayer :auto-play="false" :audio-url="audioUrl" />
      </div>
      <div style="margin-top: 10px">
        <AudioPlayer :auto-play="false" :audio-url="audioUrlObj" />
      </div>
      <div style="margin-top: 10px">
        <AudioPlayer :auto-play="false" :audio-url="audioUrlArr" />
      </div>
      <div style="margin-top: 10px">
        <AudioPlayer :auto-play="false" :audio-url="audioUrlArrObj" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="隐藏工具栏" desc="showToolbar 设置为 false，则隐藏工具栏。">
    <div style="width: 100%">
      <AudioPlayer :auto-play="false" :audio-url="audioUrlObjNoCover" :show-toolbar="false" />
    </div>
  </DemoBlock>

  <DemoBlock title="主题" desc="通过 theme 设置音频播放器主题，支持 light 和 dark，默认 dark。">
    <div style="width: 100%">
      <AudioPlayer :audio-url="audioUrlArrObj" theme="light" />
    </div>
  </DemoBlock>
</template>
