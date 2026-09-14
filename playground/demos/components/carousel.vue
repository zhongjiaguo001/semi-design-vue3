<script setup lang="ts">
import { h, ref } from 'vue';
import { Carousel, Title, Paragraph, Space, RadioGroup, Radio, IconArrowLeft, IconArrowRight } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Carousel } from 'semi-design-vue';`;

const style = { width: '100%', height: '400px' };
const titleStyle = { position: 'absolute', top: '100px', left: '100px', color: '#1C1F23' } as const;
const colorStyle = { color: '#1C1F23' };
const logoSrc = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/semi_logo.svg';

const imgList = [
  'https://lf3-static.bytednsdoc.com/obj/eden-cn/hjeh7pldnulm/SemiDocs/bg-1.png',
  'https://lf3-static.bytednsdoc.com/obj/eden-cn/hjeh7pldnulm/SemiDocs/bg-2.png',
  'https://lf3-static.bytednsdoc.com/obj/eden-cn/hjeh7pldnulm/SemiDocs/bg-3.png',
];

const textList = [
  ['Semi 设计管理系统', '从 Semi Design，到 Any Design', '快速定制你的设计系统，并应用在设计稿和代码中'],
  ['Semi 物料市场', '面向业务场景的定制化组件，支持线上预览和调试', '内容由 Semi Design 用户共建'],
  ['Semi Template', '高效的 Design2Code 设计稿转代码', '海量 Figma 设计模板一键转为真实前端代码'],
];

const textList2 = [
  ['Semi 设计管理系统', '从 Semi Design，到 Any Design', '快速定制你的设计系统，并应用在设计稿和代码中'],
  ['Semi 物料市场', '面向业务场景的定制化组件，支持线上预览和调试', '内容由 Semi Design 用户共建'],
  ['Semi 设计/代码模板', '高效的 Design2Code 设计稿转代码', '海量 Figma 设计模板一键转为真实前端代码'],
];

const textList3 = [
  ['Semi 设计管理系统', '从 Semi Design，到 Any Design', '快速定制你的设计系统，并应用在设计稿和代码中'],
  ['Semi 物料市场', '面向业务场景的定制化组件，支持线上预览和调试', '内容由 Semi Design 用户共建'],
  ['Semi 设计/代码模板', '高效的 Design2Code 设计稿转代码', '海量 Figma前端代码一键转'],
];

const bgStyle = (src: string) => ({ backgroundSize: 'cover', backgroundImage: `url("${src}")` });

// 主题切换
const theme = ref<'primary' | 'light' | 'dark'>('primary');

// 指示器
const indicatorSize = ref<'small' | 'medium'>('small');
const indicatorType = ref<'dot' | 'line' | 'columnar'>('dot');
const indicatorPosition = ref<'left' | 'center' | 'right'>('left');

// 箭头
const arrowType = ref<'always' | 'hover'>('always');
const showArrow = ref(true);

// 定制箭头
const arrowProps = {
  leftArrow: { children: h(IconArrowLeft, { size: 'large' }) },
  rightArrow: { children: h(IconArrowRight, { size: 'large' }) },
};

// 受控的轮播图
const activeIndex = ref(0);
const onControlledChange = (newActiveIndex: number) => {
  activeIndex.value = newActiveIndex;
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="基本用法">
    <Carousel :style="style" theme="dark">
      <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
        <Space vertical align="start" spacing="medium" :style="titleStyle">
          <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
          <Title :heading="2" :style="colorStyle">{{ textList[index][0] }}</Title>
          <Space vertical align="start">
            <Paragraph :style="colorStyle">{{ textList[index][1] }}</Paragraph>
            <Paragraph :style="colorStyle">{{ textList[index][2] }}</Paragraph>
          </Space>
        </Space>
      </div>
    </Carousel>
  </DemoBlock>

  <DemoBlock title="主题切换" desc="默认定义了三种主题： primary、light、dark">
    <div>
      <Carousel :style="style" :theme="theme" :autoPlay="false">
        <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
          <Space vertical align="start" spacing="medium" :style="titleStyle">
            <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
            <Title :heading="2" :style="colorStyle">{{ textList2[index][0] }}</Title>
            <Space vertical align="start">
              <Paragraph :style="colorStyle">{{ textList2[index][1] }}</Paragraph>
              <Paragraph :style="colorStyle">{{ textList2[index][2] }}</Paragraph>
            </Space>
          </Space>
        </div>
      </Carousel>
      <br />
      <Space>
        <div>主题</div>
        <RadioGroup v-model="theme" type="button">
          <Radio value="primary">primary</Radio>
          <Radio value="light">light</Radio>
          <Radio value="dark">dark</Radio>
        </RadioGroup>
      </Space>
    </div>
  </DemoBlock>

  <DemoBlock title="指示器" desc="指示器可以调节类型、位置、尺寸。类型：dot、line、columnar；位置：left、center、right；尺寸：small、medium">
    <div>
      <Carousel
        :style="style"
        :indicatorType="indicatorType"
        :indicatorPosition="indicatorPosition"
        :indicatorSize="indicatorSize"
        theme="dark"
        :autoPlay="false"
      >
        <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
          <Space vertical align="start" spacing="medium" :style="titleStyle">
            <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
            <Title :heading="2" :style="colorStyle">{{ textList3[index][0] }}</Title>
            <Space vertical align="start">
              <Paragraph :style="colorStyle">{{ textList3[index][1] }}</Paragraph>
              <Paragraph :style="colorStyle">{{ textList3[index][2] }}</Paragraph>
            </Space>
          </Space>
        </div>
      </Carousel>
      <br />
      <Space vertical align="start">
        <Space>
          <div>类型</div>
          <RadioGroup v-model="indicatorType" type="button">
            <Radio value="dot">dot</Radio>
            <Radio value="line">line</Radio>
            <Radio value="columnar">columnar</Radio>
          </RadioGroup>
        </Space>
        <Space>
          <div>位置</div>
          <RadioGroup v-model="indicatorPosition" type="button">
            <Radio value="left">left</Radio>
            <Radio value="center">center</Radio>
            <Radio value="right">right</Radio>
          </RadioGroup>
        </Space>
        <Space>
          <div>尺寸</div>
          <RadioGroup v-model="indicatorSize" type="button">
            <Radio value="small">small</Radio>
            <Radio value="medium">medium</Radio>
          </RadioGroup>
        </Space>
      </Space>
    </div>
  </DemoBlock>

  <DemoBlock title="箭头" desc="通过 showArrow 属性控制箭头是否可见；如果箭头可见，通过 arrowType 属性控制箭头展示的时机">
    <div>
      <Carousel :style="style" :showArrow="showArrow" :arrowType="arrowType" theme="dark" :autoPlay="false">
        <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
          <Space vertical align="start" spacing="medium" :style="titleStyle">
            <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
            <Title :heading="2" :style="colorStyle">{{ textList2[index][0] }}</Title>
            <Space vertical align="start">
              <Paragraph :style="colorStyle">{{ textList2[index][1] }}</Paragraph>
              <Paragraph :style="colorStyle">{{ textList2[index][2] }}</Paragraph>
            </Space>
          </Space>
        </div>
      </Carousel>
      <br />
      <Space vertical align="start">
        <Space>
          <div>展示箭头</div>
          <RadioGroup v-model="showArrow" type="button">
            <Radio :value="true">show</Radio>
            <Radio :value="false">hide</Radio>
          </RadioGroup>
        </Space>
        <Space>
          <div>展示时机</div>
          <RadioGroup v-model="arrowType" type="button">
            <Radio value="always">always</Radio>
            <Radio value="hover">hover</Radio>
          </RadioGroup>
        </Space>
      </Space>
    </div>
  </DemoBlock>

  <DemoBlock title="定制箭头" desc="通过 arrowProps 属性定制箭头样式和点击事件">
    <div>
      <Carousel theme="dark" :style="style" :autoPlay="false" :arrowProps="arrowProps">
        <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
          <Space vertical align="start" spacing="medium" :style="titleStyle">
            <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
            <Title :heading="2" :style="colorStyle">{{ textList2[index][0] }}</Title>
            <Space vertical align="start">
              <Paragraph :style="colorStyle">{{ textList2[index][1] }}</Paragraph>
              <Paragraph :style="colorStyle">{{ textList2[index][2] }}</Paragraph>
            </Space>
          </Space>
        </div>
      </Carousel>
    </div>
  </DemoBlock>

  <DemoBlock title="播放参数" desc="通过给 autoPlay 传入参数 interval 控制两张图片之间的时间间隔，传入 hoverToPause 控制鼠标放置在图片上时是否停止播放">
    <div>
      <Carousel :style="style" :autoPlay="{ interval: 1500, hoverToPause: true }" theme="dark">
        <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
          <Space vertical align="start" spacing="medium" :style="titleStyle">
            <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
            <Title :heading="2" :style="colorStyle">{{ textList2[index][0] }}</Title>
            <Space vertical align="start">
              <Paragraph :style="colorStyle">{{ textList2[index][1] }}</Paragraph>
              <Paragraph :style="colorStyle">{{ textList2[index][2] }}</Paragraph>
            </Space>
          </Space>
        </div>
      </Carousel>
    </div>
  </DemoBlock>

  <DemoBlock title="动画效果与切换速度" desc="通过给 animation 属性控制动画，可选值有 fade，slide；通过给 speed 属性控制两张图片之间的切换时间，单位为ms">
    <div>
      <Carousel :style="style" :speed="1000" animation="fade" theme="dark" :autoPlay="false">
        <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
          <Space vertical align="start" spacing="medium" :style="titleStyle">
            <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
            <Title :heading="2" :style="colorStyle">{{ textList2[index][0] }}</Title>
            <Space vertical align="start">
              <Paragraph :style="colorStyle">{{ textList2[index][1] }}</Paragraph>
              <Paragraph :style="colorStyle">{{ textList2[index][2] }}</Paragraph>
            </Space>
          </Space>
        </div>
      </Carousel>
    </div>
  </DemoBlock>

  <DemoBlock title="受控的轮播图" desc="通过 activeIndex 与 onChange（Vue 中为 @change 或 v-model:activeIndex）实现受控">
    <div>
      <Carousel :style="style" :activeIndex="activeIndex" :autoPlay="false" theme="dark" @change="onControlledChange">
        <div v-for="(src, index) in imgList" :key="index" :style="bgStyle(src)">
          <Space vertical align="start" spacing="medium" :style="titleStyle">
            <img :src="logoSrc" alt="semi_logo" style="width: 87px; height: 31px" />
            <Title :heading="2" :style="colorStyle">{{ textList2[index][0] }}</Title>
            <Space vertical align="start">
              <Paragraph :style="colorStyle">{{ textList2[index][1] }}</Paragraph>
              <Paragraph :style="colorStyle">{{ textList2[index][2] }}</Paragraph>
            </Space>
          </Space>
        </div>
      </Carousel>
    </div>
  </DemoBlock>
</template>
