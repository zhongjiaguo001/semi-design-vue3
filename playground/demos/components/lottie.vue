<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Lottie } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Lottie } from 'semi-design-vue';`;

const jsonURL =
  'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/lottie_demo.json';

// 基本用法 - 2：动画 JSON 打包到代码中（此处仅为演示，通过网络请求获取）
const data = ref<any>('');
onMounted(() => {
  fetch(jsonURL)
    .then(resp => resp.json())
    .then(json => {
      data.value = json;
    })
    .catch(() => {});
});

// 获取当前动画实例
const animationRef = ref<any>(null);
const instanceInfo = ref('');
const onGetAnimationInstance = (animation: any) => {
  console.log(animation);
  animationRef.value = animation;
  instanceInfo.value = animation ? `已获取 AnimationItem（renderer: ${animation.renderer?.rendererType ?? 'svg'}）` : '';
};
const play = () => animationRef.value?.play();
const pause = () => animationRef.value?.pause();
const stop = () => animationRef.value?.stop();

// 获取全局 Lottie
console.log('lottie', Lottie.getLottie());
const lottieVersion = ref('');
const onGetLottie = (lottie: any) => {
  console.log('lottie', lottie);
  lottieVersion.value = lottie?.version ?? '';
};

const paramsAnim = ref<any>(null);
const onParamsInstance = (animation: any) => {
  paramsAnim.value = animation;
};
</script>

<template>
  <DemoBlock title="如何引入" desc="Lottie 从 v2.62.0 开始支持" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="当 Lottie 动画资源 JSON 在 CDN 上时：向 params props 里传入 path = 你的 lottie json 的 URL 即可"
  >
    <div>
      <Lottie :params="{ path: jsonURL }" width="300px" height="300" />
    </div>
  </DemoBlock>

  <DemoBlock
    title="基本用法 - 2"
    desc="当 Lottie 动画资源 JSON 需要被打包到网站代码中时：向 params props 里传入 animationData = 你的 lottie json 对象即可（下方 Demo 请求 JSON 仅作为演示，实际项目中 json 应当被手动 import）"
  >
    <div>
      <Lottie :params="{ animationData: data }" width="300px" height="300px" />
    </div>
  </DemoBlock>

  <DemoBlock
    title="Params 其他常用参数"
    desc="params 会传给 lottie-web 的 lottie.loadAnimation。常用：renderer（默认 svg）、loop（默认 true）、autoplay（默认 true）、path 与 animationData 互斥。下面关闭 loop / autoplay，需手动 play。"
  >
    <div>
      <Lottie
        :params="{ path: jsonURL, loop: false, autoplay: false }"
        :get-animation-instance="onParamsInstance"
        width="300px"
        height="300px"
      />
      <div style="margin-top: 8px; display: flex; gap: 8px">
        <button type="button" @click="paramsAnim?.play()">play</button>
        <button type="button" @click="paramsAnim?.pause()">pause</button>
        <button type="button" @click="paramsAnim?.stop()">stop</button>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="获取当前动画实例"
    desc="使用 getAnimationInstance（prop 或 @get-animation-instance 事件）获取当前播放的动画的 animation 实例，实例上含有 play / pause / stop / setSpeed 等方法。"
  >
    <div>
      <Lottie :get-animation-instance="onGetAnimationInstance" :params="{ path: jsonURL }" width="300px" height="300px" />
      <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center">
        <button type="button" @click="play">play</button>
        <button type="button" @click="pause">pause</button>
        <button type="button" @click="stop">stop</button>
        <span>{{ instanceInfo }}</span>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="获取全局 Lottie"
    desc="使用 getLottie Props（或 @get-lottie 事件）获取全局 lottie，也可以使用静态方法 Lottie.getLottie() 来获取。"
  >
    <div>
      <Lottie :get-lottie="onGetLottie" :params="{ path: jsonURL }" width="300px" height="300px" />
      <div style="margin-top: 8px">lottie-web version: {{ lottieVersion || Lottie.getLottie()?.version }}</div>
    </div>
  </DemoBlock>
</template>
