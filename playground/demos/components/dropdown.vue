<script setup lang="ts">
import { h } from 'vue';
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownTitle,
  Button,
  Tag,
  Toast,
  HotKeys,
  IconBox,
  IconSetting,
  IconForward,
  IconRefresh,
  IconSearch,
  IconAlertCircle,
  IconComponent,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Dropdown, DropdownMenu, DropdownItem, DropdownDivider, DropdownTitle } from 'semi-design-vue';
// 也可通过 Dropdown.Menu / Dropdown.Item / Dropdown.Divider / Dropdown.Title 访问`;

const Keys = (HotKeys as any).Keys;

// 嵌套使用：共享的子菜单（对应 React useMemo 的 subDropdown）
const subDropdown = () =>
  h(DropdownMenu, null, () => [
    h(DropdownItem, null, () => 'Nested Menu Item 1'),
    h(DropdownItem, null, () => 'Nested  Menu Item 2'),
    h(DropdownItem, null, () => 'Nested  Menu Item 3'),
  ]);

// Json 用法
const menu = [
  { node: 'title', name: '分组1' },
  { node: 'item', name: 'primary1', type: 'primary', onClick: () => console.log('click primary') },
  { node: 'item', name: 'secondary', type: 'secondary' },
  { node: 'divider' },
  { node: 'title', name: '分组2' },
  { node: 'item', name: 'tertiary', type: 'tertiary' },
  { node: 'item', name: 'warning', type: 'warning', active: true },
  { node: 'item', name: 'danger', type: 'danger' },
] as any[];

const positionDesc = '支持的位置同 Tooltip，常用的是 bottom、bottomLeft、bottomRight 这三种。';
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="children 为 Trigger 触发器（默认 hover 展示）；通过 render 指定下拉内容，使用 Dropdown.Menu 组合 Dropdown.Item / Divider / Title；Item 可设置 disabled、type、icon。"
  >
    <Dropdown position="bottomLeft">
      <template #render>
        <DropdownMenu>
          <DropdownTitle>分组1</DropdownTitle>
          <DropdownItem>
            <template #icon><IconBox /></template>
            Menu Item 1
            <HotKeys :style="{ marginLeft: '20px' }" :hotKeys="[Keys.Control, Keys.B]" :content="['Ctrl', 'B']" />
          </DropdownItem>
          <DropdownItem>
            <template #icon><IconSetting /></template>
            Menu Item 2
            <HotKeys :style="{ marginLeft: '20px' }" :hotKeys="[Keys.Control, Keys.V]" :content="['Ctrl', 'V']" />
          </DropdownItem>
          <DropdownItem disabled>
            <template #icon><IconForward /></template>
            Menu Item 3
            <HotKeys :style="{ marginLeft: '20px' }" :hotKeys="[Keys.Control, Keys.F3]" :content="['Ctrl', 'F3']" />
          </DropdownItem>
          <DropdownDivider />
          <DropdownTitle>分组2</DropdownTitle>
          <DropdownItem type="tertiary">
            <template #icon><IconRefresh /></template>
            tertiary
          </DropdownItem>
          <DropdownItem type="warning">
            <template #icon><IconSearch /></template>
            warning
          </DropdownItem>
          <DropdownItem type="danger">
            <template #icon><IconAlertCircle /></template>
            danger
          </DropdownItem>
        </DropdownMenu>
      </template>
      <Button theme="outline" type="tertiary">
        <template #icon><IconComponent /></template>
        Hover Me
      </Button>
    </Dropdown>
  </DemoBlock>

  <DemoBlock title="嵌套使用" desc="用户可以对 Dropdown 进行嵌套使用，此类情况适合具有多个子级选项的情况。">
    <div :style="{ margin: '100px' }">
      <Dropdown>
        <template #render>
          <DropdownMenu>
            <Dropdown position="rightTop" :render="subDropdown">
              <DropdownItem>Menu Item 1</DropdownItem>
            </Dropdown>
            <Dropdown position="leftTop" :render="subDropdown">
              <DropdownItem>Menu Item 2</DropdownItem>
            </Dropdown>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <Button theme="outline" type="tertiary">
          <template #icon><IconComponent /></template>
          Hover Me
        </Button>
      </Dropdown>
    </div>
  </DemoBlock>

  <DemoBlock title="弹出位置" :desc="positionDesc">
    <div>
      <Dropdown position="bottom">
        <template #render>
          <DropdownMenu>
            <DropdownItem>Menu Item 1</DropdownItem>
            <DropdownItem>Menu Item 2</DropdownItem>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <Tag>Bottom</Tag>
      </Dropdown>
      <br />
      <br />
      <Dropdown position="bottomLeft">
        <template #render>
          <DropdownMenu>
            <DropdownItem>Menu Item 1</DropdownItem>
            <DropdownItem>Menu Item 2</DropdownItem>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <Tag>bottomLeft</Tag>
      </Dropdown>
      <br />
      <br />
      <Dropdown position="bottomRight">
        <template #render>
          <DropdownMenu>
            <DropdownItem>Menu Item 1</DropdownItem>
            <DropdownItem>Menu Item 2</DropdownItem>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <Tag>bottomRight</Tag>
      </Dropdown>
    </div>
  </DemoBlock>

  <DemoBlock title="触发方式" desc="默认是移入触发，可通过获取焦点(focus)，点击(click)、右键(contextMenu)或自定义事件触发菜单展开。">
    <div>
      <Dropdown trigger="hover" position="bottomLeft">
        <template #render>
          <DropdownMenu>
            <DropdownItem>Menu Item 1</DropdownItem>
            <DropdownItem>Menu Item 2</DropdownItem>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <Tag>Hover me</Tag>
      </Dropdown>
      <br />
      <br />
      <Dropdown trigger="focus" position="bottomLeft">
        <template #render>
          <DropdownMenu :tabindex="-1">
            <DropdownItem>Menu Item 1</DropdownItem>
            <DropdownItem>Menu Item 2</DropdownItem>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <div
          :style="{
            border: '1px solid var(--semi-color-border)',
            borderRadius: '4px',
            height: '36px',
            width: '220px',
          }"
        >
          Please use Tab to focus this div
        </div>
      </Dropdown>
      <br />
      <br />
      <Dropdown trigger="click" position="bottomLeft">
        <template #render>
          <DropdownMenu>
            <DropdownItem>Menu Item 1</DropdownItem>
            <DropdownItem>Menu Item 2</DropdownItem>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <Button>Click me</Button>
      </Dropdown>
      <br />
      <br />
      <Dropdown trigger="contextMenu" position="bottomRight">
        <template #render>
          <DropdownMenu>
            <DropdownItem>Menu Item 1</DropdownItem>
            <DropdownItem>Menu Item 2</DropdownItem>
            <DropdownItem>Menu Item 3</DropdownItem>
          </DropdownMenu>
        </template>
        <Button theme="solid" type="secondary" :style="{ marginBottom: '20px' }">Right click (ContextMenu)</Button>
      </Dropdown>
    </div>
  </DemoBlock>

  <DemoBlock title="触发事件" desc="点击菜单项后可触发不同鼠标事件，支持 click、mouseenter、mouseleave 和 contextmenu。">
    <Dropdown trigger="click" position="bottomLeft">
      <template #render>
        <DropdownMenu>
          <DropdownItem @click="Toast.info({ content: 'You clicked me!' })">1: click me!</DropdownItem>
          <DropdownItem @mouseenter="Toast.info({ content: 'Nice to meet you!' })">2: mouse enter</DropdownItem>
          <DropdownItem @mouseleave="Toast.info({ content: 'See ya!' })">3: mouse leave</DropdownItem>
          <DropdownItem @contextmenu="Toast.info({ content: 'Right clicked!' })">4: right click</DropdownItem>
        </DropdownMenu>
      </template>
      <Button theme="outline" type="tertiary">
        <template #icon><IconComponent /></template>
        Click Me
      </Button>
    </Dropdown>
  </DemoBlock>

  <DemoBlock title="Json 用法" desc="可以通过 menu 属性，传入 JSON Array 快速配置出下拉框菜单。">
    <Dropdown trigger="click" showTick position="bottomLeft" :menu="menu">
      <Button theme="outline" type="tertiary">
        <template #icon><IconComponent /></template>
        Click Me
      </Button>
    </Dropdown>
  </DemoBlock>
</template>
