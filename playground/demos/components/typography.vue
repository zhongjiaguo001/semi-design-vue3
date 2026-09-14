<script setup lang="ts">
import { h } from 'vue';
import { Typography, Title, Text, Paragraph, Numeral, Tooltip, TextArea, Button, Toast, IconLink, IconSetting } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const titleStyle = { margin: '8px 0' };
const semiIntro =
  'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。';

// 数值组件 - 自定义 parser
function parserTCH(oldVal: string) {
  return oldVal
    .split(' ')
    .map((item) => (Number(item) ? `${item.replace(/(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1,')}+` : item))
    .join(' ');
}
const infos = [
  { type: 'Stars', min: '7100' },
  { type: 'Fork', min: '560' },
  { type: 'Downloads', min: '5000000' },
  { type: 'Contributors', min: '100' },
];
const bigNum = 1e5;
const byteA = 1024 * 1000;
const byteB = 2e12;

// 可复制文本
const timestamp = new Date().getTime() / 1000;
const copyToast = () => Toast.success({ content: '复制文本成功' });
const customCopyRender = (copied: boolean, doCopy: (e?: any) => void, config: Record<string, any>) =>
  h(Button, { size: 'small', onClick: doCopy }, () => h('span', copied ? '复制成功' : `点击复制:${config.content}`));

// 省略文本
const customRenderTooltip = (content: any, children: any) =>
  h(Tooltip, { content, style: { backgroundColor: 'var(--semi-color-primary)' } }, () => children);
const onExpand = (bool: boolean, e: Event) => console.log(bool, e);
</script>

<template>
  <DemoBlock title="如何引入" code="import { Typography, Title, Text, Paragraph, Numeral } from 'semi-design-vue'" />

  <DemoBlock title="标题组件" desc="通过设置 heading 可以展示不同级别的标题。">
    <div>
      <Title :style="titleStyle">h1. Semi Design</Title>
      <Title :heading="2" :style="titleStyle">h2. Semi Design</Title>
      <Title :heading="3" :style="titleStyle">h3. Semi Design</Title>
      <Title :heading="4" :style="titleStyle">h4. Semi Design</Title>
      <Title :heading="5" :style="titleStyle">h5. Semi Design</Title>
      <Title :heading="6" :style="titleStyle">h6. Semi Design</Title>
    </div>
  </DemoBlock>

  <DemoBlock title="文本组件" desc="内置不同样式的文本。可以通过 icon 属性传入图标，这种方式传入的图标默认与文本有间距，同时在链接文本的情况不会出现下划线符合设计规范。">
    <div>
      <Text>Text</Text>
      <br />
      <br />
      <Text type="secondary">Secondary</Text>
      <br />
      <br />
      <Text type="tertiary">Tertiary v>=1.2.0</Text>
      <br />
      <br />
      <Text type="quaternary">Quaternary v>=1.2.0</Text>
      <br />
      <br />
      <Text type="warning">Warning</Text>
      <br />
      <br />
      <Text type="danger">Danger</Text>
      <br />
      <br />
      <Text type="success">Success v>=1.7.0</Text>
      <br />
      <br />
      <Text disabled>Disabled</Text>
      <br />
      <br />
      <Text mark>Default Mark</Text>
      <br />
      <br />
      <Text code>Example Code</Text>
      <br />
      <br />
      <Text underline>Underline</Text>
      <br />
      <br />
      <Text delete>Deleted</Text>
      <br />
      <br />
      <Text strong>Strong</Text>
    </div>
  </DemoBlock>

  <DemoBlock title="文本组件 - 链接文本" desc="链接文本支持传入 object，将对应的属性挂在 <a> 标签上。v>=1.0 后默认不再有下划线，可以配合 underline 属性在 hover，active 态增加下划线的样式。">
    <div>
      <Text :link="{ href: 'https://semi.design/' }">链接文本</Text>
      <br />
      <br />
      <Text :link="{ href: 'https://semi.design/' }">打开网站</Text>
      <br />
      <br />
      <Text link underline>
        <template #icon><IconLink /></template>
        带下划线的网页链接
      </Text>
    </div>
  </DemoBlock>

  <DemoBlock title="段落组件" desc="段落组件拥有两种行距，可以通过设置 spacing='extended' 使用更宽松的行距。">
    <div>
      <Title :heading="5">默认行距</Title>
      <Paragraph>{{ semiIntro }}</Paragraph>
      <br />
      <Title :heading="5">宽松行距</Title>
      <Paragraph spacing="extended">{{ semiIntro }}</Paragraph>
    </div>
  </DemoBlock>

  <DemoBlock title="数值组件" desc="Numeral 组件在 Text 组件的基础上，添加了属性: rule, precision, truncate, parser，以提供需要单独处理文本中数值的能力。">
    <div>
      <Numeral :precision="1">
        <p>点赞量：1.6111e1 K</p>
      </Numeral>

      <p>
        播放量:
        <Numeral rule="numbers" :precision="1">2.4444e2</Numeral>
        K
      </p>

      <Numeral rule="percentages" :precision="2" :style="{ marginBottom: '12px' }">
        <p>好评率: 0.915</p>
      </Numeral>

      <Numeral rule="percentages" :style="{ marginBottom: '12px' }">这场比赛我的胜率是0.6，输的概率是0.4</Numeral>

      <Numeral rule="bytes-decimal" :precision="2" truncate="floor">
        <p>已使用: 1000</p>
        <p>未使用: {{ byteA }}</p>
      </Numeral>

      <Numeral rule="bytes-binary" :precision="2" truncate="floor">
        <p>已使用: 1024</p>
        <p>未使用: {{ byteB }}</p>
      </Numeral>
    </div>
  </DemoBlock>

  <DemoBlock title="数值组件 - 自定义 parser" desc="可以通过 parser 自定义解析规则。">
    <div>
      <Numeral :parser="parserTCH" component="div">
        Semi Design 重视我们的用户，加入并助力我们不断完善
        <p v-for="item in infos" :key="item.min">
          {{ item.type }}：
          <b :style="{ color: 'rgba(var(--semi-violet-5),1)' }">{{ item.min }}</b>
        </p>
      </Numeral>
      <br />
      <Numeral :link="{ href: 'https://semi.design', target: '_blank' }" :parser="parserTCH">现已服务 {{ bigNum }} 用户，前往官网 &gt;&gt;</Numeral>
    </div>
  </DemoBlock>

  <DemoBlock title="文本大小" desc="段落组件和文本组件支持两种尺寸，small（12px）和 normal（14px）和 inherit，默认为 normal。嵌套使用时，设置内层组件的 size 为 inherit 将继承外层组件的尺寸设置。">
    <div>
      <Text>正常文本</Text>
      <Paragraph spacing="extended">{{ semiIntro }}</Paragraph>
      <br />
      <Text size="small">小文本</Text>
      <Paragraph size="small">{{ semiIntro }}</Paragraph>
      <br />
      <Text size="small">
        这是一段文本，样式为 small
        <Text link size="inherit">这是一段链接，设置 size 为 inherit 继承外部样式设置</Text>
      </Text>
    </div>
  </DemoBlock>

  <DemoBlock title="可复制文本" desc="可通过配置 copyable 属性支持文本的复制。copyable 为 object 时可通过 copyable.content 指定复制内容，通过 copyable.render 自定义复制按钮的渲染逻辑。">
    <div>
      <Paragraph copyable>点击右边的图标复制文本。</Paragraph>
      <Paragraph :copyable="{ content: 'Hello, Semi Design!' }">点击复制文本。</Paragraph>
      <Paragraph :copyable="{ onCopy: copyToast }">点击右边的图标复制文本。</Paragraph>
      时间戳: <Numeral truncate="ceil" copyable underline>{{ timestamp }}s</Numeral>
      <Paragraph :copyable="{ icon: h(IconSetting, { style: { color: 'var(--semi-color-link)' } }) }">自定义复制节点</Paragraph>
      <Paragraph :copyable="{ content: 'Custom render!', render: customCopyRender }">自定义复制渲染</Paragraph>
      <br />
      <br />
      <Text type="secondary">粘贴区域：</Text>
      <br />
      <TextArea autosize :style="{ width: '320px', marginTop: '4px' }" :rows="3" />
    </div>
  </DemoBlock>

  <DemoBlock title="省略文本" desc="支持文本的省略，可以通过 ellipsis 配置相关参数（rows、pos、suffix、expandable、collapsible、showTooltip 等）。ellipsis 仅支持纯文本的截断，且需要明确的 width / maxWidth。">
    <div>
      <Title :heading="5" :ellipsis="{ showTooltip: true }" :style="{ width: '250px' }">是一个很长很长很长很长5号标题</Title>
      <br />
      <Text :ellipsis="{ showTooltip: { opts: { content: '这是自定义要展示的内容' } } }" :style="{ width: '150px' }">可以自定义浮层里的展示内容试试看吧</Text>
      <br />
      <!-- link 还可以传入 object，如 :link="{ href: 'https://semi.design/zh-CN/basic/typography', target: '_blank' }" -->
      <Text link :ellipsis="{ showTooltip: true, pos: 'middle' }" :style="{ width: '150px' }">是一个很长很长很长很长的链接</Text>
      <br />
      <Paragraph :ellipsis="{ suffix: '小尾巴' }" :style="{ width: '300px' }">有后缀的情况：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。</Paragraph>
      <br />
      <Paragraph :ellipsis="{ rows: 3 }" :style="{ width: '300px' }">这是一个多行截断的例子：{{ semiIntro }}</Paragraph>
      <br />
      <Paragraph :ellipsis="{ rows: 3, showTooltip: { type: 'popover', opts: { style: { width: '300px' } } } }" :style="{ width: '300px' }">多行截断，展示 Popover：{{ semiIntro }}</Paragraph>
      <br />
      <Paragraph :ellipsis="{ rows: 3, expandable: true, collapsible: true, collapseText: '折叠我吧', onExpand }" :style="{ width: '300px' }">支持展开和折叠：{{ semiIntro }}</Paragraph>
      <br />
      <Text :ellipsis="{ showTooltip: { opts: { content: '全英文设置了word-break' } }, pos: 'middle' }" :style="{ width: '150px', wordBreak: 'break-word' }">sssssssssssssssssssssssss</Text>
      <br />
      <br />
      <Title :heading="5" :ellipsis="{ showTooltip: { renderTooltip: customRenderTooltip } }" :style="{ width: '250px' }">这是一个自定义弹出层组件的省略文本，背景色是蓝色</Title>
    </div>
  </DemoBlock>

  <DemoBlock title="省略文本 - 超长文本换行" desc="当超长文本在弹出的 tooltip 没有换行时，可通过 showTooltip.opts 的 className / style 手动设置 word-break 等换行属性。">
    <div>
      <Text :ellipsis="{ showTooltip: { opts: { content: '架构|Semi-inf|graph.cheet.relation' } } }" :style="{ width: '150px' }">有问题的超长文本发生截断时可按需进行自定义配置</Text>
      <br />
      <Text :ellipsis="{ showTooltip: { opts: { content: '架构|Semi-inf|graph.cheet.relation', className: 'components-typography-demo' } } }" :style="{ width: '150px' }">覆盖类名超长文本发生截断时可使用类名覆盖进行自定义配置</Text>
      <br />
      <Text :ellipsis="{ showTooltip: { opts: { content: '架构|Semi-inf|graph.cheet.relation', style: { wordBreak: 'break-all' } } } }" :style="{ width: '150px' }">覆盖style超长文本发生截断时可使用style进行自定义配置</Text>
    </div>
  </DemoBlock>
</template>

<style>
/* 按需配置 word-break（官方示例的 scss） */
.components-typography-demo {
  word-break: break-word;
}
</style>
