---
name: semi-design-vue
description: Use Semi Design Vue 3 (semi-design-vue3) with the bundled MCP. Trigger when writing Vue UI with Semi, querying component APIs, converting React Semi samples to Vue, or installing the Vue adapter.
---

# Semi Design Vue

This repo is a **Vue 3 adapter** for Semi Design 2.103.0. Foundation CSS/logic stay in `@douyinfe/semi-foundation`. Do **not** import `@douyinfe/semi-ui` (React).

## Package

```bash
npm i semi-design-vue3 vue
```

```ts
import { Button, ConfigProvider, theme } from 'semi-design-vue3'
import 'semi-design-vue3/style.css'
```

## MCP tools (call these)

1. `get_vue_conventions` — v-model, events, slots, theme
2. `get_semi_document` — omit name for catalog; pass `Button` / `DatePicker` for docs
3. `get_vue_demo` — official-heading Vue SFC from the playground
4. `get_component_file_list` → `get_file_code` / `get_function_code` for adapter source
5. `get_semi_code_block` — nth markdown fence when the doc collapsed live examples

## Vue mapping

| React Semi | Vue 3 |
| --- | --- |
| `onClick` / `onChange` | `@click` / `@change` |
| `value` + `onChange` | `v-model` |
| `children` | default slot |
| `@douyinfe/semi-ui` | `semi-design-vue3` |
| `@douyinfe/semi-icons` | `semi-design-vue3` (`IconXxx`) |

Output Vue 3 SFC or `h()` render functions. Match official class names and visual API; events use Vue emits.
