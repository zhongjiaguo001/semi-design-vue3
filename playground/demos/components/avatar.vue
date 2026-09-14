<script setup lang="ts">
import { h, cloneVNode } from 'vue';
import type { VNode } from 'vue';
import { Avatar, AvatarGroup, Popover, IconCamera, IconPlus } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Avatar, AvatarGroup } from 'semi-design-vue';`;

const dyImg = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/dy.png';

// 事件: hoverMask
const hoverStyle = {
  backgroundColor: 'var(--semi-color-overlay-bg)',
  height: '100%',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const hover = h('div', { style: hoverStyle }, [h(IconCamera)]);

// 顶部和底部 Slot
const liveTopSlot = { text: '直播', gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' };
const plusBottomSlot = { shape: 'circle' as const, bgColor: '#FE2C55', text: h(IconPlus) };
const textBottomSlot = { shape: 'square' as const, bgColor: '#FE2C55', text: '直播中' };

// 头像组: renderMore
const renderMore = (restNumber: number, restAvatars: VNode[]) => {
  const content = restAvatars.map((avatar, index) =>
    h('div', { style: { paddingBottom: '12px' }, key: index }, [
      cloneVNode(avatar, { size: 'extra-small' }),
      h('span', { style: { marginLeft: '8px', fontSize: '14px' } }, '这是段文字描述'),
    ])
  );
  return h(
    Popover,
    { content, autoAdjustOverflow: false, position: 'bottomRight', style: { padding: '12px 8px', paddingBottom: 0 } },
    { default: () => h(Avatar, null, () => `+${restNumber}`) }
  );
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="尺寸" desc="可以通过 size 属性设置图标大小，支持 extra-extra-small，extra-small，small，default，medium，large，extra-large。">
    <div>
      <Avatar size="extra-extra-small" style="margin: 4px" alt="User">U</Avatar>
      <Avatar size="extra-small" style="margin: 4px" alt="User">U</Avatar>
      <Avatar size="small" style="margin: 4px" alt="User">U</Avatar>
      <Avatar size="default" style="margin: 4px" alt="User">U</Avatar>
      <Avatar style="margin: 4px" alt="User">U</Avatar>
      <Avatar size="large" style="margin: 4px" alt="User">U</Avatar>
      <Avatar size="extra-large" style="margin: 4px" alt="User">U</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="颜色" desc="Avatar 支持默认色板的 15 种颜色和白色。也可以通过 style 来自定义颜色样式。默认为 grey。">
    <div>
      <Avatar style="margin: 4px" alt="Alice Swift">AS</Avatar>
      <Avatar color="red" style="margin: 4px" alt="Bob Matteo">BM</Avatar>
      <Avatar color="light-blue" style="margin: 4px" alt="Taylor Joy">TJ</Avatar>
      <Avatar style="color: #f56a00; background-color: #fde3cf; margin: 4px" alt="Zank Lance">ZL</Avatar>
      <Avatar style="background-color: #87d068; margin: 4px" alt="Youself Zhang">YZ</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="自适应字符大小" desc="字符类型的头像，字体大小会根据头像宽度自适应调整。使用 gap 调整字符头像距离左右两侧的像素大小。">
    <div>
      <Avatar style="margin: 4px">AS</Avatar>
      <Avatar style="margin: 4px" :gap="4">Semi</Avatar>
      <Avatar style="margin: 4px" :gap="10">Semi</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="图片" desc="可以通过 src 设置图片格式的头像。">
    <div>
      <Avatar alt="beautiful cat" :src="dyImg" style="margin: 4px" />
      <Avatar alt="cute cat" size="small" :src="dyImg" style="margin: 4px" />
    </div>
  </DemoBlock>

  <DemoBlock title="形状" desc="Avatar 支持 circle、square 两种形状，默认为 circle。">
    <div>
      <Avatar style="margin: 4px" alt="User">U</Avatar>
      <Avatar shape="square" style="margin: 4px" alt="User">U</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="事件" desc="Avatar 支持 click、mouseenter、mouseleave。其中 hover 状态下可以通过 hoverMask 属性传入覆盖层的内容。覆盖层无默认样式。">
    <Avatar :hoverMask="hover" color="red" alt="Bob Downton">BD</Avatar>
  </DemoBlock>

  <DemoBlock title="顶部和底部 Slot" desc="通过 topSlot / bottomSlot 配置顶部和底部 Slot，配合 border 与 contentMotion 使用。">
    <Avatar
      alt="beautiful cat"
      :src="dyImg"
      style="margin: 4px"
      size="large"
      :border="{ color: '#FE2C55', motion: true }"
      :contentMotion="true"
      :topSlot="liveTopSlot"
      :bottomSlot="plusBottomSlot"
    />
  </DemoBlock>

  <DemoBlock title="顶部" desc="topSlot 在不同尺寸下的展示。">
    <div>
      <Avatar color="amber" :topSlot="liveTopSlot">T</Avatar>
      <Avatar color="amber" size="large" :topSlot="liveTopSlot">T</Avatar>
      <Avatar color="amber" size="extra-large" :topSlot="liveTopSlot">T</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="底部" desc="bottomSlot 支持 square / circle 两种形状。">
    <div>
      <Avatar color="amber" :bottomSlot="textBottomSlot">T</Avatar>
      <Avatar color="amber" size="large" :bottomSlot="textBottomSlot">T</Avatar>
      <Avatar color="amber" size="extra-large" :bottomSlot="textBottomSlot">T</Avatar>
      <br />
      <br />
      <br />
      <Avatar color="amber" :bottomSlot="plusBottomSlot">T</Avatar>
      <Avatar color="amber" size="large" :bottomSlot="plusBottomSlot">T</Avatar>
      <Avatar color="amber" size="extra-large" :bottomSlot="plusBottomSlot">T</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="额外边框" desc="通过 border 开启额外边框。">
    <div>
      <Avatar color="amber" :border="true" style="margin-right: 8px">T</Avatar>
      <Avatar color="amber" :border="true" style="margin-right: 8px">T</Avatar>
      <Avatar color="amber" :border="true" style="margin-right: 8px">T</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="额外动效" desc="通过 border={motion:true} 和 contentMotion 开启边框和内容区域的额外动效">
    <div>
      <Avatar color="amber" :border="{ motion: true }" style="margin-right: 8px" :contentMotion="true">T</Avatar>
      <Avatar color="amber" :border="{ motion: true }" size="large" style="margin-right: 8px" :contentMotion="true">T</Avatar>
      <Avatar color="amber" :border="{ motion: true }" size="extra-large" style="margin-right: 8px" :contentMotion="true">T</Avatar>
    </div>
  </DemoBlock>

  <DemoBlock title="头像组" desc="可以通过 AvatarGroup 将 avatar 显示为组。">
    <div>
      <AvatarGroup>
        <Avatar color="red" alt="Lisa LeBlanc">LL</Avatar>
        <Avatar alt="Caroline Xiao">CX</Avatar>
        <Avatar color="amber" alt="Rafal Matin">RM</Avatar>
        <Avatar style="color: #f56a00; background-color: #fde3cf" alt="Zank Lance">ZL</Avatar>
        <Avatar style="background-color: #87d068" alt="Youself Zhang">YZ</Avatar>
      </AvatarGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="头像组 - maxCount" desc="可以通过 maxCount 设置展示的头像数量。">
    <div>
      <AvatarGroup :maxCount="3">
        <Avatar color="red" alt="Lisa LeBlanc">LL</Avatar>
        <Avatar alt="Caroline Xiao">CX</Avatar>
        <Avatar color="amber" alt="Rafal Matin">RM</Avatar>
        <Avatar style="color: #f56a00; background-color: #fde3cf" alt="Zank Lance">ZL</Avatar>
        <Avatar style="background-color: #87d068" alt="Youself Zhang">YZ</Avatar>
      </AvatarGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="头像组 - renderMore" desc="可以通过 renderMore 自定义 more 标签。">
    <AvatarGroup :maxCount="3" :renderMore="renderMore">
      <Avatar color="red" alt="Lisa LeBlanc">LL</Avatar>
      <Avatar alt="Caroline Xiao">CX</Avatar>
      <Avatar color="amber" alt="Rafal Matin">RM</Avatar>
      <Avatar style="color: #f56a00; background-color: #fde3cf" alt="Zank Lance">ZL</Avatar>
      <Avatar style="background-color: #87d068" alt="Youself Zhang">YZ</Avatar>
    </AvatarGroup>
  </DemoBlock>

  <DemoBlock title="头像组 - overlapFrom" desc="可以通过 overlapFrom 控制头像组的覆盖方式。可选值有 start 和 end，分别表示左边覆盖右边和右边覆盖左边。默认值为 start。">
    <div>
      <div>
        <AvatarGroup overlapFrom="start">
          <Avatar color="red" alt="Lisa LeBlanc">LL</Avatar>
          <Avatar alt="Caroline Xiao">CX</Avatar>
          <Avatar color="amber" alt="Rafal Matin">RM</Avatar>
          <Avatar style="color: #f56a00; background-color: #fde3cf" alt="Zank Lance">ZL</Avatar>
          <Avatar style="background-color: #87d068" alt="Youself Zhang">YZ</Avatar>
        </AvatarGroup>
      </div>
      <div>
        <AvatarGroup overlapFrom="end">
          <Avatar color="red" alt="Lisa LeBlanc">LL</Avatar>
          <Avatar alt="Caroline Xiao">CX</Avatar>
          <Avatar color="amber" alt="Rafal Matin">RM</Avatar>
          <Avatar style="color: #f56a00; background-color: #fde3cf" alt="Zank Lance">ZL</Avatar>
          <Avatar style="background-color: #87d068" alt="Youself Zhang">YZ</Avatar>
        </AvatarGroup>
      </div>
    </div>
  </DemoBlock>
</template>
