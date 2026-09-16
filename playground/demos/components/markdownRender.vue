<script setup lang="ts">
import { h } from 'vue';
import { MarkdownRender, Typography, Button } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { MarkdownRender } from 'semi-design-vue';`;

const basicRaw = `
## 

正文内容是普通的文本，也可以**加粗**~~删除线~~和<u>下划线</u> [超链接](https://semi.design) 等 Markdown 与 HTML 的基本语法所支持的富文本，也支持 emoji 🍰


部分符号需要转义 \\{\\} \\<\\> ...

<br/>
<br/>
---
#### Semi Design DSM
[Semi DSM](https://semi.design/dsm) 是 Semi Design 提供的设计系统管理工具（Design System Management），支持全局、组件级别的样式定制，并在 Figma 和前端代码之间保持同步  
适用于各种规模的团队，无论你是需要简化工作流程，提高团队协作，还是增加生产力，我们都有适合你的功能

##### 中大型企业
- 多达 3000+ Design Token，深入每一处细节的定制可能，色彩，阴影，边距，圆角，动效，渲染结构均可自由定制，告别 ~~CSS 硬编码~~
- 功能强大，经过抖音内部数千项目验证过的 UI lib，轻松应对各类复杂场景
- A11y 无障碍友好，国际化功能完备
- 面向社区建设，完全开源，无使用限制
- 从 designOps 到 devOps，自动化工作流，Figma UI Kit 一键刷入主题，生成 Style Guideline，研发一行 npm 代码配置接入

##### 初创企业
- 无需从 0 到 1 投入大量研发资源，快速复用开源社区优秀方案, 低成本快速定制具备品牌特色的设计系统。
- 一键支持暗色模式生成，支持根据品牌色快速生成包含 320 个全色阶、兼容深/浅两种模式的色彩系统，并支持动态切换
- 不断进化，DSM + Semi Design 组件由<u>抖音前端架构团队</u>专业维护，已稳定迭代五年+，值得信赖

##### 自由设计师/个人开发者
- 低成本快速创建风格各异的设计系统，更少时间，更快交付
- 研发接入友好，无需反复沟通，交付npm包产物，一键完成代码接入


![DSM](https://semi.design/dsm_manual/content/introduction/start/start-intro.png)

---

#### MarkdownRender 渲染列表语法
- 好好地吃饭
- 好好地睡觉
- 好好地游玩
- 好好地学习
- 好好地聊天
- 好好地吵架
- 过着平凡普通的每日 

| 支持 | Markdown 表格 |  c |  d  |
| - | :- | -: | :-: |
| 1 | 2 | 3 | 4 |
| 21 | 22 | 23 | 24 |
| 31 | 32 | 33 | 34 |
| 41 | 42 | 43 | 44 |

    `;

// 修改元素样式：覆盖 h2
const styleComponents: Record<string, any> = {
  h2: (_props: any, { slots }: any) =>
    h(Typography.Title, { heading: 2, style: { color: 'var(--semi-color-text-2)' } }, () => slots.default?.()),
};

// 仅纯 Markdown：覆盖 h1
const mdOnlyComponents: Record<string, any> = {
  h1: (_props: any, { slots }: any) =>
    h(Typography.Title, { heading: 1, style: { color: 'var(--semi-color-primary)' } }, () => slots.default?.()),
};

// 添加自定义组件
const customComponents: Record<string, any> = {
  ...(MarkdownRender as any).defaultComponents,
  MyButton: (props: any, { slots }: any) =>
    h(Button, { type: 'primary', onClick: props.onClick, style: { marginBottom: '12px' } }, () => slots.default?.()),
};

const customRaw = `
#### 下面是一个渲染在 Markdown 中的按钮
<MyButton onClick={()=>alert("点击了 MyButton")}>MyButton 点我</MyButton>

直接在 Markdown 中书写 JSX 即可
        `;

/** 演示 remarkPlugins：在文档末尾追加一段说明 */
function remarkAppendNote() {
  return (tree: any) => {
    tree.children = tree.children || [];
    tree.children.push({
      type: 'paragraph',
      children: [{ type: 'text', value: '（本段由 remarkPlugins 追加）' }],
    });
  };
}

/** 演示 rehypePlugins：给 inline code 加上背景 */
function rehypeMarkCode() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node) return;
      if (node.tagName === 'code') {
        node.properties = node.properties || {};
        const prev = node.properties.style || '';
        node.properties.style = `${prev};background:var(--semi-color-fill-1);padding:2px 6px;border-radius:4px`;
      }
      (node.children || []).forEach(visit);
    };
    visit(tree);
  };
}
</script>

<template>
  <DemoBlock title="如何引入" desc="MarkdownRender 支持渲染 Markdown 与 MDX。" :code="importCode" />

  <DemoBlock title="基本用法" desc="导入 MarkdownRender 后，直接传入 Markdown 或 MDX 纯文本即可。注意 < { 等符号在 mdx 模式下需要使用 \ 转义。">
    <MarkdownRender :raw="basicRaw" />
  </DemoBlock>

  <DemoBlock title="修改元素样式" desc="向 components 中传入渲染组件即可覆盖 Markdown 元素的显示效果，例如将 h2 颜色改为 text-2。">
    <MarkdownRender raw="## 从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中" :components="styleComponents" />
  </DemoBlock>

  <DemoBlock title="仅纯 Markdown" desc="传入 format=&quot;md&quot; 开启仅 Markdown 模式，此模式下无需转义特殊字符。">
    <MarkdownRender raw="无需转义的符号{}<> ..." format="md" :components="mdOnlyComponents" />
  </DemoBlock>

  <DemoBlock title="添加自定义组件" desc="通过 components 传入自定义组件，可在 Markdown 中直接书写 JSX，支持 JS 事件。默认组件可从 MarkdownRender.defaultComponents 获取。">
    <MarkdownRender :raw="customRaw" :components="customComponents" />
  </DemoBlock>

  <DemoBlock
    title="添加插件"
    desc="remarkPlugins / rehypePlugins 支持 MDXJS 的 Remark 与 Rehype 插件。下面示例：remark 在文末追加注记，rehype 给行内 code 加背景。"
  >
    <MarkdownRender
      format="md"
      raw="这是一段带 `code` 的 Markdown。"
      :remarkPlugins="[remarkAppendNote]"
      :rehypePlugins="[rehypeMarkCode]"
    />
  </DemoBlock>
</template>
