# semi-design-vue3

Vue 3 port of [Semi Design](https://github.com/DouyinFE/semi-design)（对齐 Foundation **2.103.0**）。

npm 包名是 **`semi-design-vue3`**（`semi-design-vue` 在 npm 上已被 0.0.0 占位）。同一套包还带 **MCP server**，给 AI 工具查 Vue 文档 / 示例 / 源码。

Semi Design splits every component into a framework-agnostic **Foundation** (`@douyinfe/semi-foundation`: state
machine, keyboard handling, positioning, compiled CSS) and a thin React **adapter**. This project keeps the
foundation untouched and re-implements only the adapter layer with Vue 3 (`defineComponent` + render functions),
so behaviour, class names and styles are identical to the React version.

Theming follows the **Ant Design** model (`token` / `algorithm` / `components`) instead of Semi's scss variable
override build step.

## Install

```bash
npm i semi-design-vue3 vue
```

本地开发本仓库：

```bash
npm install
npm run dev        # playground at http://localhost:5180
npm test           # vitest (jsdom)
npm run typecheck
npm run build      # dist/ + MCP data
```

尚未登录 npm 时，也可以装本地 tarball：

```bash
npm run build
npm pack           # -> semi-design-vue3-2.103.0.tgz
npm i ./semi-design-vue3-2.103.0.tgz
```

发布到 npm（需 `npm login`，registry 为 https://registry.npmjs.org/）：

```bash
npm publish --access public
```

## Usage

```ts
import { createApp } from 'vue';
import { Button, ConfigProvider, theme } from 'semi-design-vue3';
import 'semi-design-vue3/style.css';
```

```vue
<ConfigProvider
  :theme="{
    token: { colorPrimary: '#00b96b', borderRadius: 8, fontSize: 14 },
    algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
    components: { Button: { colorPrimary: '#ff4d4f' }, Input: { borderRadius: 2 } },
  }"
  locale="en_US"
  direction="rtl"
>
  <Button type="primary" theme="solid" @click="onClick">Click</Button>
  <Input v-model="value" showClear />
</ConfigProvider>
```

### Theme API (Ant Design style)

| API | Description |
| --- | --- |
| `token` | Seed / map tokens: `colorPrimary`, `colorSuccess`, `colorWarning`, `colorError`, `colorInfo`, `colorLink`, `colorTextBase`, `colorBgBase`, `fontFamily`, `fontSize`, `borderRadius`, `controlHeight`, `lineWidth`, `motion`, plus derived tokens (`colorPrimaryHover`, `colorText`, `colorBgContainer`, ...) which can be overridden directly. |
| `algorithm` | `theme.defaultAlgorithm`, `theme.darkAlgorithm`, `theme.compactAlgorithm` (single or array, e.g. `[darkAlgorithm, compactAlgorithm]`). |
| `components` | Per-component overrides: `{ Button: { colorPrimary: '#f00' }, Table: { '--semi-table-xxx': '1px' } }`. Any `--custom-var` key is forwarded as a CSS variable scoped to that component's root class. |
| `inherit` | Nested `ConfigProvider`s inherit tokens from their parent (default `true`). |
| `target` | `'scope'` (default: a `.semi-theme-<hash>` wrapper + portals) or `'body'` (whole page). |
| `theme.useToken()` | Composable returning `{ token, hashId, theme }` for the current theme. |
| `theme.getDesignToken(config)` | Compute the full token object without rendering. |
| `theme.generate(color)` | 10-step palette generator (same algorithm as `@ant-design/colors`). |

Tokens are compiled to Semi's `--semi-*` CSS variables (palette triplets, semantic colors, radius, control heights,
font sizes) and injected once per unique config as a `<style data-semi-theme>` tag. Popups rendered through
portals receive the same scope class, so themes apply to tooltips, modals, selects, etc.

### Component conventions

- React `children` → default slot. Node-typed props (`content`, `extra`, `title`, `icon`, `prefix`, ...) accept a
  string / VNode / component / render function **or** a named slot of the same name.
- React `onXxx` callbacks → Vue events (`@visible-change`, `@enter-press`, ...). Controlled value props support
  `v-model` (`modelValue`) as well as the original prop (`value` / `checked` / `visible`).
- `className` / `style` are plain attributes on the component root.
- Icons: `import { IconClose } from 'semi-design-vue3'` (all 500+ Semi icons are generated as Vue components).

## MCP

包内置 stdio MCP，工具对齐官方 `@douyinfe/semi-mcp`，但返回 **Vue 3** 文档、playground 示例和 `src/` 适配层源码。

| 工具 | 作用 |
| --- | --- |
| `get_vue_conventions` | Vue 安装、v-model、事件、插槽、主题 |
| `get_semi_document` | 组件列表或组件文档 |
| `get_vue_demo` | playground Vue SFC |
| `get_semi_code_block` | 文档中第 N 个代码块 |
| `get_component_file_list` | `src/<comp>/` 文件列表 |
| `get_file_code` / `get_function_code` | 读适配层源码 |

### Cursor / Claude Desktop / Trae

```json
{
  "mcpServers": {
    "semi-design-vue": {
      "command": "npx",
      "args": ["-y", "semi-design-vue3"]
    }
  }
}
```

本仓库开发时用 Node 直接跑：

```json
{
  "mcpServers": {
    "semi-design-vue": {
      "command": "node",
      "args": ["semi-mcp.js"]
    }
  }
}
```

Grok CLI 已在仓库 `.grok/config.toml` 里配置了上述本地 server。发布后可改成：

```toml
[mcp_servers.semi-design-vue]
command = "npx"
args = ["-y", "semi-design-vue3"]
```

```bash
npm run test:mcp
```

See `PORTING.md` for the adapter architecture used to port additional components.
