<script setup lang="ts">
import { Banner, Title, Paragraph, Text } from '@/index';
</script>

<template>
  <article class="doc-article">
    <Banner
      type="info"
      title="和官网 MCP 的差异"
      description="官方 @douyinfe/semi-mcp 面向 React 的 @douyinfe/semi-ui。本仓库 MCP 随 semi-design-vue3 发布，返回 Vue 3 文档、playground 示例和 src/ 适配层源码。"
    />

    <Title :heading="2" id="安装-MCP">安装 MCP</Title>
    <Paragraph>
      包名 <Text code>semi-design-vue3</Text> 同时是组件库和 stdio MCP。Node 建议 ≥ 20.19，npm 建议 ≥ 11.3。
    </Paragraph>
    <pre class="doc-pre">npm i semi-design-vue3 vue</pre>

    <Title :heading="3" id="Cursor-Claude-Trae">Cursor / Claude Desktop / Trae</Title>
    <pre class="doc-pre">{
  "mcpServers": {
    "semi-design-vue": {
      "command": "npx",
      "args": ["-y", "semi-design-vue3"]
    }
  }
}</pre>

    <Title :heading="3" id="Grok-CLI">Grok CLI</Title>
    <Paragraph>本仓库已写入 <Text code>.grok/config.toml</Text>。开发时用本地入口：</Paragraph>
    <pre class="doc-pre">[mcp_servers.semi-design-vue]
command = "node"
args = ["semi-mcp.js"]
enabled = true</pre>
    <Paragraph>发布到 npm 之后可以改成：</Paragraph>
    <pre class="doc-pre">[mcp_servers.semi-design-vue]
command = "npx"
args = ["-y", "semi-design-vue3"]</pre>

    <Title :heading="3" id="本仓库直接跑">本仓库直接跑</Title>
    <pre class="doc-pre">node semi-mcp.js
npm run test:mcp</pre>

    <Title :heading="2" id="工具">工具</Title>
    <Paragraph>工具名与官方 Semi MCP 对齐，但内容是 Vue 3 适配层。</Paragraph>
    <div class="od-table-wrap">
      <table class="od-table">
        <thead>
          <tr>
            <th>工具</th>
            <th>作用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Text code>get_vue_conventions</Text></td>
            <td>安装、v-model、事件、插槽、主题；写 Vue 代码前先调</td>
          </tr>
          <tr>
            <td><Text code>get_semi_document</Text></td>
            <td>不传 componentName 返回组件列表；传入 Button、DatePicker 等返回文档</td>
          </tr>
          <tr>
            <td><Text code>get_vue_demo</Text></td>
            <td>playground 里该组件的 Vue SFC</td>
          </tr>
          <tr>
            <td><Text code>get_semi_code_block</Text></td>
            <td>文档中第 N 个代码块（从 1 开始）</td>
          </tr>
          <tr>
            <td><Text code>get_component_file_list</Text></td>
            <td>列出 <Text code>src/&lt;comp&gt;/</Text> 适配层文件</td>
          </tr>
          <tr>
            <td><Text code>get_file_code</Text></td>
            <td>读取适配层源码</td>
          </tr>
          <tr>
            <td><Text code>get_function_code</Text></td>
            <td>从文件中抽出指定函数</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Title :heading="2" id="推荐工作流">推荐工作流</Title>
    <ol>
      <li>先 <Text code>get_vue_conventions</Text>，确认不要 import <Text code>@douyinfe/semi-ui</Text>。</li>
      <li><Text code>get_semi_document</Text> 查 API 与说明。</li>
      <li><Text code>get_vue_demo</Text> 对照可运行示例。</li>
      <li>需要实现细节时再 <Text code>get_component_file_list</Text> → <Text code>get_file_code</Text>。</li>
    </ol>

    <Title :heading="2" id="Vue-约定">Vue 约定</Title>
    <ul>
      <li>包名 <Text code>semi-design-vue3</Text>，样式 <Text code>import 'semi-design-vue3/style.css'</Text></li>
      <li>React <Text code>onClick</Text> / <Text code>onChange</Text> → <Text code>@click</Text> / <Text code>@change</Text></li>
      <li>受控值优先 <Text code>v-model</Text></li>
      <li><Text code>children</Text> → 默认插槽；<Text code>prefix</Text> / <Text code>icon</Text> / <Text code>title</Text> 可用同名 slot</li>
    </ul>
  </article>
</template>

<style scoped>
.od-table-wrap {
  overflow-x: auto;
  margin: 16px 0 28px;
  border: 1px solid var(--semi-color-border);
  border-radius: 10px;
}
.od-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.od-table th,
.od-table td {
  border-bottom: 1px solid var(--semi-color-border);
  padding: 10px 14px;
  vertical-align: top;
  text-align: left;
}
.od-table tr:last-child td {
  border-bottom: none;
}
.od-table th {
  background: var(--semi-color-fill-0);
  font-weight: 600;
  white-space: nowrap;
  color: var(--semi-color-text-1);
}
.doc-article ol,
.doc-article ul {
  margin: 0 0 14px;
  padding-left: 22px;
  color: var(--semi-color-text-0);
  line-height: 1.8;
}
.doc-article li {
  margin: 6px 0;
}
</style>
