<script setup lang="ts">
import { Badge, Avatar, IconLock } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Badge } from 'semi-design-vue';`;

const style = {
  width: '42px',
  height: '42px',
  borderRadius: '4px',
};

const bgStyle = {
  padding: '8px',
};

const bgStyle2 = {
  padding: '8px 8px 3px 8px',
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="Badge 的基本类型为 count。如果传入 dot 则显示为小圆点，两者互斥，优先渲染小圆点。当传入是节点类型时，将直接渲染该节点。"
  >
    <div>
      <Badge :count="5">
        <Avatar color="blue" shape="square" :style="style">BM</Avatar>
      </Badge>
      <br />
      <br />
      <Badge dot>
        <Avatar color="blue" shape="square" :style="style">YL</Avatar>
      </Badge>
      <br />
      <br />
      <Badge>
        <template #count>
          <IconLock style="color: var(--semi-color-primary)" />
        </template>
        <Avatar color="light-blue" shape="square" :style="style">XZ</Avatar>
      </Badge>
      <br />
      <br />
      <Badge count="NEW">
        <Avatar color="light-blue" shape="square" :style="style">WF</Avatar>
      </Badge>
    </div>
  </DemoBlock>

  <DemoBlock
    title="设置显示数字最大值"
    desc="可以通过设置 overflowCount 值设置显示数字的最大值，当实际数值超过该值时将以 ${overflowCount}+ 的格式显示。"
  >
    <div>
      <Badge :count="99">
        <Avatar color="teal" shape="square" :style="style">ZH</Avatar>
      </Badge>
      <br />
      <br />
      <Badge :count="100">
        <Avatar color="teal" shape="square" :style="style">HS</Avatar>
      </Badge>
      <br />
      <br />
      <Badge :count="99" :overflowCount="10">
        <Avatar color="green" shape="square" :style="style">DY</Avatar>
      </Badge>
      <br />
      <br />
      <Badge :count="1000" :overflowCount="999">
        <Avatar color="green" shape="square" :style="style">TT</Avatar>
      </Badge>
    </div>
  </DemoBlock>

  <DemoBlock title="设置徽标位置" desc="可以通过设置 position 设置位置，支持：leftTop，leftBottom，rightTop（默认），rightBottom。">
    <div>
      <Badge count="VIP" position="rightTop" type="danger">
        <Avatar color="amber" shape="square" :style="style">ZH</Avatar>
      </Badge>
      <br />
      <br />
      <Badge count="VIP" position="rightBottom" type="danger">
        <Avatar color="amber" shape="square" :style="style">HS</Avatar>
      </Badge>
      <br />
      <br />
      <Badge count="VIP" position="leftTop" type="danger">
        <Avatar color="orange" shape="square" :style="style">DY</Avatar>
      </Badge>
      <br />
      <br />
      <Badge count="VIP" position="leftBottom" type="danger">
        <Avatar color="orange" shape="square" :style="style">TT</Avatar>
      </Badge>
    </div>
  </DemoBlock>

  <DemoBlock
    title="设置徽标样式"
    desc="可以通过设置 theme 和 type 设置徽标的样式。其中 theme 支持三种形式：solid, light, inverted。默认形式为 solid。"
  >
    <div style="display: flex">
      <div :style="bgStyle">
        <Badge :count="5" theme="solid">
          <Avatar color="indigo" shape="square" :style="style">XZ</Avatar>
        </Badge>
      </div>
      <div :style="bgStyle">
        <Badge :count="5" theme="light">
          <Avatar color="indigo" shape="square" :style="style">YB</Avatar>
        </Badge>
      </div>
      <div :style="bgStyle">
        <Badge :count="5" theme="inverted">
          <Avatar color="light-green" shape="square" :style="style">LX</Avatar>
        </Badge>
      </div>
      <br />
      <div :style="bgStyle">
        <Badge dot theme="solid">
          <Avatar color="light-green" shape="square" :style="style">YZ</Avatar>
        </Badge>
      </div>
      <div :style="bgStyle">
        <Badge dot theme="light">
          <Avatar color="lime" shape="square" :style="style">HW</Avatar>
        </Badge>
      </div>
      <div style="padding: 8px; border-radius: 4px; background-color: var(--semi-color-fill-0)">
        <Badge dot theme="inverted">
          <Avatar color="lime" shape="square" :style="style">XM</Avatar>
        </Badge>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="设置徽标样式 - 2"
    desc="type 支持如下类型：primary，secondary，tertiary，warning 和 danger。默认类型为 primary。"
  >
    <div style="display: flex">
      <div :style="bgStyle2">
        <Badge :count="5" type="primary">
          <Avatar color="violet" shape="square" :style="style">MR</Avatar>
        </Badge>
      </div>
      <div :style="bgStyle2">
        <Badge :count="5" type="secondary">
          <Avatar color="violet" shape="square" :style="style">YL</Avatar>
        </Badge>
      </div>
      <div :style="bgStyle2">
        <Badge :count="5" type="tertiary">
          <Avatar color="red" shape="square" :style="style">ZW</Avatar>
        </Badge>
      </div>
      <br />
      <div :style="bgStyle2">
        <Badge :count="5" type="warning">
          <Avatar color="red" shape="square" :style="style">JL</Avatar>
        </Badge>
      </div>
      <div :style="bgStyle2">
        <Badge :count="5" type="danger">
          <Avatar color="pink" shape="square" :style="style">RT</Avatar>
        </Badge>
      </div>
      <div :style="bgStyle2">
        <Badge dot type="primary">
          <Avatar color="pink" shape="square" :style="style">YF</Avatar>
        </Badge>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="独立使用" desc="当 Badge 作为独立元素时可以单独使用。">
    <div>
      <Badge :count="5" />
      <br />
      <br />
      <Badge count="NEW" theme="light" />
      <br />
      <br />
      <Badge :count="99" :overflowCount="10" type="danger" />
      <br />
      <br />
      <span><Badge dot type="primary" /> 进行中 processing</span>
      <br />
      <span><Badge dot type="tertiary" /> 信息 info</span>
      <br />
      <span><Badge dot type="success" /> 成功 success</span>
      <br />
      <span><Badge dot type="warning" /> 提醒 warning</span>
      <br />
      <span><Badge dot type="danger" /> 错误 error</span>
    </div>
  </DemoBlock>
</template>
