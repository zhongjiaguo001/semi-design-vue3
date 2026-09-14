<script setup lang="ts">
import { ref } from 'vue';
import { Tag, TagGroup, SplitTagGroup, Space, RadioGroup, Radio, IconGithubLogo, IconSemiLogo, IconAIFilledLevel1, IconAIFilledLevel3 } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Tag, TagGroup, SplitTagGroup } from 'semi-design-vue';`;

const colors = [
  'amber', 'blue', 'cyan', 'green', 'grey', 'indigo',
  'light-blue', 'light-green', 'lime', 'orange', 'pink',
  'purple', 'red', 'teal', 'violet', 'yellow', 'white',
] as const;

const avatarSrc = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/dy.png';

// 不可见的
const visible = ref(false);
const onVisibleChange = (e: any) => {
  visible.value = !visible.value;
};

// TagGroup 使用
const tagList = [
  { color: 'light-blue', children: '抖音' },
  { color: 'cyan', children: '火山' },
  { color: 'violet', children: '剪映' },
  { color: 'white', children: '醒图' },
];
const tagList2 = [
  { color: 'white', children: 'Douyin', avatarSrc },
  { color: 'white', children: 'Hotsoon', avatarSrc },
  { color: 'white', children: 'Capcut', avatarSrc },
  { color: 'white', children: 'Xingtu', avatarSrc },
];
const divStyle = {
  backgroundColor: 'var(--semi-color-fill-0)',
  height: '35px',
  width: '300px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 10px',
  marginBottom: '30px',
};
const tagGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '350px',
};

// TagGroup 可关闭
const closableTagList = ref([
  { tagKey: '1', color: 'light-blue', children: '抖音', closable: true },
  { tagKey: '3', color: 'cyan', children: '剪映', closable: true },
  { tagKey: '2', color: 'violet', children: '醒图', closable: true },
  { tagKey: '4', color: 'teal', children: '轻颜相机', closable: true },
  { tagKey: '5', color: 'white', children: '飞书', closable: true },
]);
const tagListClick = (_value: any, _e: Event, tagKey: string | number) => {
  const newTagList = [...closableTagList.value];
  const closeTagIndex = newTagList.findIndex(t => t.tagKey === tagKey);
  newTagList.splice(closeTagIndex, 1);
  closableTagList.value = newTagList;
};

const preventClose = (_value: any, e: Event) => e.preventDefault();
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="基本标签用法，将内容使用 Tag 标签包裹即可。添加 closable 变为可关闭标签，在 close 事件中阻止默认事件可使其点击后依然显示不隐藏。">
    <div>
      <Space>
        <Tag> default tag </Tag>
        <Tag closable> Closable Tag </Tag>
        <Tag closable @close="preventClose">Closable Tag, Prevent Default</Tag>
      </Space>
    </div>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="默认定义了两种尺寸：大、小（默认）。">
    <Space>
      <Tag size="small" color="light-blue"> small tag </Tag>
      <Tag size="large" color="cyan"> large tag </Tag>
    </Space>
  </DemoBlock>

  <DemoBlock title="形状" desc="默认定义了两种形状：square（默认）、circle。">
    <Space>
      <Tag size="small" shape="circle" color="amber"> small circle tag </Tag>
      <Tag size="large" shape="circle" color="violet"> large circle tag </Tag>
    </Space>
  </DemoBlock>

  <DemoBlock title="配置图标" desc="通过配置 prefixIcon、suffixIcon，可以在内容前后添加 Icon 图标。">
    <Space>
      <Tag color="light-blue" size="large" shape="circle">
        <template #prefixIcon><IconGithubLogo /></template>
        Semi Design
      </Tag>
      <Tag color="cyan" size="large" shape="circle" :suffixIcon="IconSemiLogo">D2C: figma to code in one click</Tag>
    </Space>
  </DemoBlock>

  <DemoBlock title="颜色" desc="标签支持默认色板的 16 种颜色和白色，也可以通过 style 来自定义颜色样式。">
    <Space wrap>
      <Tag v-for="item in colors" :key="item" :color="item"> {{ item }} </Tag>
    </Space>
  </DemoBlock>

  <DemoBlock title="AI 风格 - 多彩标签" desc="设置 colorful 为 true 即可获得多彩的标签。多彩标签可通过 gradient 区分是否为渐变色。注意：多彩标签的字重和非多彩标签字重不同。">
    <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '30px' }">
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridGap: '10px', width: 'fit-content' }">
        <Tag colorful type="solid" shape="circle" gradient>
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="light" shape="circle" gradient>
          <template #prefixIcon><IconAIFilledLevel3 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="ghost" shape="circle" gradient>
          <template #prefixIcon><IconAIFilledLevel3 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="solid" shape="circle">
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="light" shape="circle">
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="ghost" shape="circle">
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
      </div>
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridGap: '10px', width: 'fit-content' }">
        <Tag colorful type="solid" gradient>
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="light" gradient>
          <template #prefixIcon><IconAIFilledLevel3 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="ghost" gradient>
          <template #prefixIcon><IconAIFilledLevel3 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="solid">
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="light">
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
        <Tag colorful type="ghost">
          <template #prefixIcon><IconAIFilledLevel1 size="small" /></template>
          AI
        </Tag>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="样式类型" desc="标签支持三种样式类型：浅色底色 light（默认）、白色底色 ghost、深色底色 solid，通过 type 配置。">
    <Space wrap>
      <Tag color="light-blue" size="large" shape="circle" type="light">
        <template #prefixIcon><IconGithubLogo /></template>
        Semi Design Light Tag
      </Tag>
      <Tag color="cyan" size="large" shape="circle" type="light">
        <template #suffixIcon><IconSemiLogo /></template>
        D2C: figma to code in one click
      </Tag>
      <Tag color="light-blue" size="large" shape="circle" type="ghost">
        <template #prefixIcon><IconGithubLogo /></template>
        Semi Design Ghost Tag
      </Tag>
      <Tag color="cyan" size="large" shape="circle" type="ghost">
        <template #suffixIcon><IconSemiLogo /></template>
        D2C: figma to code in one click
      </Tag>
      <Tag color="light-blue" size="large" shape="circle" type="solid">
        <template #prefixIcon><IconGithubLogo /></template>
        Semi Design Solid Tag
      </Tag>
      <Tag color="cyan" size="large" shape="circle" type="solid">
        <template #suffixIcon><IconSemiLogo /></template>
        D2C: figma to code in one click
      </Tag>
    </Space>
  </DemoBlock>

  <DemoBlock title="头像标签" desc="设置 avatarSrc 可以生成头像标签。结合 avatarShape 可以调整头像标签的形状，支持 square 和 circle。">
    <Space vertical align="start">
      <Tag :avatarSrc="avatarSrc">焦锐志</Tag>
      <Tag :avatarSrc="avatarSrc" size="large">焦锐志</Tag>
      <Tag :avatarSrc="avatarSrc" size="large" closable>焦锐志</Tag>
      <Tag :avatarSrc="avatarSrc" avatarShape="circle">焦锐志</Tag>
      <Tag :avatarSrc="avatarSrc" avatarShape="circle" size="large">焦锐志</Tag>
      <Tag :avatarSrc="avatarSrc" avatarShape="circle" size="large" closable>焦锐志</Tag>
    </Space>
  </DemoBlock>

  <DemoBlock title="不可见的" desc="通过 visible 属性控制标签是否可见。">
    <div>
      <RadioGroup type="button" :defaultValue="0" @change="onVisibleChange">
        <Radio :value="1">Show</Radio>
        <Radio :value="0">Hide</Radio>
      </RadioGroup>
      <div :style="{ marginTop: '10px' }">
        <Tag :visible="visible" size="large" color="light-blue">Invisible tag </Tag>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="TagGroup 使用" desc="在 TagGroup 内通过 tagList 传入 tags 配置，并设置 maxTagCount，超出数量限制后显示为 +N；设置 showPopover 控制 hover 到 +N 时是否通过 Popover 显示剩余内容。">
    <div :style="divStyle">
      <TagGroup :maxTagCount="3" :style="tagGroupStyle" :tagList="tagList" size="large" />
    </div>
    <div :style="divStyle">
      <TagGroup :maxTagCount="2" :style="tagGroupStyle" :tagList="tagList2" size="large" avatarShape="circle" showPopover />
    </div>
  </DemoBlock>

  <DemoBlock title="TagGroup 使用 - 可删除" desc="如果 TagGroup 中的标签可删除，用户需要在 tagClose 事件中处理传递给 TagGroup 的 tagList。">
    <div :style="divStyle">
      <TagGroup :maxTagCount="3" showPopover :style="tagGroupStyle" :tagList="closableTagList" size="large" @tagClose="tagListClick" />
    </div>
  </DemoBlock>

  <DemoBlock title="SplitTagGroup 组合标签" desc="使用 SplitTagGroup 可以将多个标签组合成一个整体，首尾标签会有圆角，中间标签圆角为 0，形成连续的视觉效果。">
    <Space vertical align="start">
      <SplitTagGroup>
        <Tag color="blue" type="solid">标签一</Tag>
        <Tag color="cyan" type="solid">标签二</Tag>
        <Tag color="teal" type="solid">标签三</Tag>
      </SplitTagGroup>

      <SplitTagGroup>
        <Tag color="violet" shape="circle">组合</Tag>
        <Tag color="purple" shape="circle">标签</Tag>
        <Tag color="pink" shape="circle">示例</Tag>
        <Tag color="red" shape="circle">效果</Tag>
      </SplitTagGroup>

      <SplitTagGroup>
        <Tag color="amber" type="light">浅色</Tag>
        <Tag color="orange" type="light">组合</Tag>
        <Tag color="yellow" type="light">标签</Tag>
      </SplitTagGroup>

      <SplitTagGroup>
        <Tag color="green" type="ghost">镂空</Tag>
        <Tag color="light-green" type="ghost">样式</Tag>
        <Tag color="lime" type="ghost">组合</Tag>
      </SplitTagGroup>
    </Space>
  </DemoBlock>
</template>
