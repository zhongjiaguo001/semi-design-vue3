<script setup lang="ts">
import { ref } from 'vue';
import { VideoPlayer, Select, Button } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { VideoPlayer } from 'semi-design-vue';`;

const src = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/vchart/landingPage/vchart-show-video.mp4';
const poster = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/poster2.jpeg';

// 设置菜单栏功能
const controlsList = ['play', 'time', 'volume', 'playbackRate', 'fullscreen'];

// 快进快退
const seekTime = ref(5);
const seekOptions = [
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
];

// 播放速率
const playbackRateList = [
  { label: '0.5x', value: 0.5 },
  { label: '1.0x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2 },
];

// 清晰度切换
const qualitySrc = ref(src);
const playList = [
  { src, quality: '1080p' },
  {
    src: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/video/vchart-show-video-480p.mp4',
    quality: '480p',
  },
];
const qualityList = [
  { label: '1080p', value: '1080p' },
  { label: '480p', value: '480p' },
];
const updateVideoSource = (quality: string) => {
  const source = playList.find((item) => item.quality === quality);
  if (source) qualitySrc.value = source.src;
};
const onQualityChange = (quality: string) => {
  console.log('quality change', quality);
  updateVideoSource(quality);
};

// 章节标记
const markers = [
  { start: 0, title: '片头' },
  { start: 4, title: '功能介绍' },
  { start: 38, title: 'Figma Plugin' },
  { start: 51, title: '片尾' },
];

// 使用 ref 控制
const videoRef1 = ref<HTMLVideoElement | null>(null);
const videoRef2 = ref<HTMLVideoElement | null>(null);
const handlePlayAll = () => {
  videoRef1.value?.play();
  videoRef2.value?.play();
};
const handlePauseAll = () => {
  videoRef1.value?.pause();
  videoRef2.value?.pause();
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="基本使用，通过 src 传入视频地址，通过 poster 传入视频封面地址">
    <VideoPlayer :height="630" :src="src" :poster="poster" />
  </DemoBlock>

  <DemoBlock
    title="设置菜单栏功能"
    desc="通过 controlsList 设置菜单栏的展示项，默认值为 ['play', 'next', 'time', 'volume', 'playbackRate', 'quality', 'route', 'mirror', 'fullscreen', 'pictureInPicture']"
  >
    <VideoPlayer :height="630" :src="src" :poster="poster" :controlsList="controlsList" />
  </DemoBlock>

  <DemoBlock title="循环播放" desc="通过 loop 设置循环播放">
    <VideoPlayer :height="630" :src="src" :poster="poster" :loop="true" />
  </DemoBlock>

  <DemoBlock title="快进快退" desc="通过 seekTime 设置快进快退时间，通过键盘左右键执行快进快退（需先聚焦播放器）">
    <div>
      <div>
        <span style="margin-bottom: 10px">请选择快进快退时间</span>
        <Select
          v-model="seekTime"
          :style="{ width: '100px', marginLeft: '10px' }"
          :optionList="seekOptions"
          placeholder="请选择快进快退时间"
        />
      </div>
      <VideoPlayer :height="630" :style="{ marginTop: '10px' }" :src="src" :poster="poster" :seekTime="seekTime" />
    </div>
  </DemoBlock>

  <DemoBlock title="播放速率" desc="通过 playbackRateList 设置速率选择列表">
    <VideoPlayer :height="630" :src="src" :poster="poster" :playbackRateList="playbackRateList" />
  </DemoBlock>

  <DemoBlock title="音量设置" desc="通过 volume 设置初始音量，值区间为 0 - 100，设置 muted 为 true 可以静音播放">
    <VideoPlayer :height="630" :src="src" :poster="poster" :muted="true" />
  </DemoBlock>

  <DemoBlock
    title="清晰度切换"
    desc="通过 qualityList 设置清晰度选择列表，defaultQuality 设置初始清晰度，onQualityChange 更新 src；线路切换同理（routeList / defaultRoute / onRouteChange）"
  >
    <VideoPlayer
      :height="630"
      :src="qualitySrc"
      :poster="poster"
      defaultQuality="1080p"
      :qualityList="qualityList"
      @qualityChange="onQualityChange"
    />
  </DemoBlock>

  <DemoBlock title="章节标记" desc="通过 markers 设置章节标记点">
    <VideoPlayer :height="630" :src="src" :poster="poster" :markers="markers" />
  </DemoBlock>

  <DemoBlock title="主题" desc="通过 theme 设置主题，主题仅影响背景色">
    <VideoPlayer :src="src" :poster="poster" :height="630" theme="light" />
  </DemoBlock>

  <DemoBlock title="使用 ref 控制" desc="通过 forwardRef 获取原生 video 元素，可以实现更灵活的控制，例如多个视频同步播放/暂停">
    <div>
      <div style="margin-bottom: 12px">
        <Button style="margin-right: 8px" @click="handlePlayAll">同时播放</Button>
        <Button @click="handlePauseAll">同时暂停</Button>
      </div>
      <div style="display: flex; gap: 12px">
        <VideoPlayer :forwardRef="videoRef1" :src="src" :poster="poster" :height="315" width="50%" />
        <VideoPlayer :forwardRef="videoRef2" :src="src" :poster="poster" :height="315" width="50%" />
      </div>
    </div>
  </DemoBlock>
</template>
