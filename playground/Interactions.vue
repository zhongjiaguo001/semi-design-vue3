<template>
  <ConfigProvider>
    <div class="wrap">
      <h1>Interaction checks</h1>
      <pre data-log hidden>{{ logs.join('\n') }}</pre>

      <!-- Button -->
      <section data-check="button">
        <h2>Button</h2>
        <Button data-testid="btn-click" @click="onClick">Click me</Button>
        <Button data-testid="btn-disabled" disabled @click="log('button:click-disabled')">Disabled</Button>
        <Button data-testid="btn-icon" :icon="IconSearch" ariaLabel="search" @click="log('button:icon-click')" />
        <Button data-testid="btn-loading" loading>Loading</Button>
        <ButtonGroup data-testid="btn-group">
          <Button @click="log('group:left')">Left</Button>
          <Button @click="log('group:right')">Right</Button>
        </ButtonGroup>
        <output data-out="buttonCount">{{ buttonCount }}</output>
      </section>

      <!-- Input -->
      <section data-check="input">
        <h2>Input</h2>
        <Input data-testid="input-basic" v-model="inputValue" showClear @enterPress="log('input:enter')" @clear="log('input:clear')" />
        <Input data-testid="input-password" mode="password" defaultValue="pw" />
        <InputNumber data-testid="input-number" v-model="numberValue" :step="5" />
        <output data-out="inputValue">{{ inputValue }}</output>
        <output data-out="numberValue">{{ numberValue }}</output>
      </section>

      <!-- Slider / Rating -->
      <section data-check="slider">
        <h2>Slider / Rating</h2>
        <Slider data-testid="slider" v-model="sliderValue" :min="0" :max="100" @change="log('slider:change')" />
        <output data-out="sliderValue">{{ sliderValue }}</output>
        <Rating data-testid="rating" v-model="ratingValue" @change="log('rating:change')" />
        <output data-out="ratingValue">{{ ratingValue }}</output>
      </section>

      <!-- Select -->
      <section data-check="select">
        <h2>Select</h2>
        <Select data-testid="select" v-model="selectValue" style="width: 200px" @change="log('select:change')">
          <Option value="a">Alpha</Option>
          <Option value="b">Beta</Option>
          <Option value="c" disabled>Gamma</Option>
        </Select>
        <Select data-testid="select-multiple" v-model="multiValue" multiple style="width: 240px" @change="log('select:multi-change')">
          <Option value="x">X</Option>
          <Option value="y">Y</Option>
          <Option value="z">Z</Option>
        </Select>
        <Select data-testid="select-filter" v-model="filterValue" filter style="width: 200px">
          <Option value="one">One</Option>
          <Option value="two">Two</Option>
        </Select>
        <output data-out="selectValue">{{ selectValue }}</output>
        <output data-out="multiValue">{{ multiValue }}</output>
      </section>

      <!-- AutoComplete / TagInput -->
      <section data-check="tags">
        <h2>AutoComplete / TagInput</h2>
        <AutoComplete data-testid="autocomplete" :data="['vue', 'vite', 'vitest']" @select="log('ac:select')" @search="(v: string) => log('ac:search:' + v)" />
        <TagInput data-testid="taginput" v-model="tagList" @add="log('tag:add')" @remove="log('tag:remove')" />
        <output data-out="tagList">{{ tagList.join(',') }}</output>
      </section>

      <!-- DatePicker / TimePicker / Calendar -->
      <section data-check="picker">
        <h2>DatePicker / TimePicker</h2>
        <DatePicker data-testid="datepicker" v-model="dateValue" @change="log('date:change')" />
        <TimePicker data-testid="timepicker" v-model="timeValue" @change="log('time:change')" />
        <output data-out="dateValue">{{ dateValue ? String(dateValue) : '' }}</output>
        <output data-out="timeValue">{{ timeValue ? String(timeValue) : '' }}</output>
      </section>

      <!-- Tree / TreeSelect -->
      <section data-check="tree">
        <h2>Tree / TreeSelect</h2>
        <Tree data-testid="tree" :tree-data="treeData" v-model="treeValue" @select="log('tree:select')" @expand="log('tree:expand')" style="width: 240px" />
        <TreeSelect data-testid="treeselect" :tree-data="treeData" v-model="treeSelectValue" style="width: 240px" />
        <output data-out="treeValue">{{ JSON.stringify(treeValue) }}</output>
        <output data-out="treeSelectValue">{{ JSON.stringify(treeSelectValue) }}</output>
      </section>

      <!-- Tabs / Collapse -->
      <section data-check="tabs">
        <h2>Tabs / Collapse</h2>
        <Tabs data-testid="tabs" v-model:activeKey="tabKey" @change="log('tabs:change')">
          <TabPane itemKey="t1" tab="Tab one">Panel one</TabPane>
          <TabPane itemKey="t2" tab="Tab two">Panel two</TabPane>
        </Tabs>
        <output data-out="tabKey">{{ tabKey }}</output>
        <Collapse data-testid="collapse" v-model:activeKey="collapseKey" @change="log('collapse:change')">
          <CollapsePanel itemKey="c1" header="Header one">Body one</CollapsePanel>
          <CollapsePanel itemKey="c2" header="Header two">Body two</CollapsePanel>
        </Collapse>
        <output data-out="collapseKey">{{ JSON.stringify(collapseKey) }}</output>
      </section>

      <!-- Switch / Checkbox / Radio -->
      <section data-check="checks">
        <h2>Switch / Checkbox / Radio</h2>
        <Switch data-testid="switch" v-model="switchValue" @change="log('switch:change')" />
        <Checkbox data-testid="checkbox" v-model="checkValue" @change="log('checkbox:change')">Check</Checkbox>
        <CheckboxGroup data-testid="checkbox-group" v-model="checkGroup" :options="['A', 'B']" direction="horizontal" />
        <RadioGroup data-testid="radio-group" v-model="radioValue" :options="['x', 'y']" />
        <output data-out="switchValue">{{ switchValue }}</output>
        <output data-out="checkValue">{{ checkValue }}</output>
        <output data-out="checkGroup">{{ checkGroup.join(',') }}</output>
        <output data-out="radioValue">{{ radioValue }}</output>
      </section>

      <!-- Tooltip / Popover / Dropdown / Popconfirm -->
      <section data-check="popups">
        <h2>Tooltip / Popover / Dropdown / Popconfirm</h2>
        <Tooltip data-testid="tooltip" content="tooltip body" @visibleChange="(v: boolean) => log('tooltip:visible:' + v)">
          <Button>Hover target</Button>
        </Tooltip>
        <Popover data-testid="popover" trigger="click" content="popover body" @visibleChange="(v: boolean) => log('popover:visible:' + v)">
          <Button>Popover trigger</Button>
        </Popover>
        <Dropdown data-testid="dropdown" :render="renderMenu" @visibleChange="(v: boolean) => log('dropdown:visible:' + v)">
          <Button>Dropdown trigger</Button>
        </Dropdown>
        <Popconfirm data-testid="popconfirm" title="Confirm?" content="sure?" @confirm="log('popconfirm:confirm')" @cancel="log('popconfirm:cancel')">
          <Button>Popconfirm trigger</Button>
        </Popconfirm>
      </section>

      <!-- Modal / SideSheet / Toast / Notification -->
      <section data-check="overlays">
        <h2>Modal / SideSheet / Toast / Notification</h2>
        <Button data-testid="open-modal" @click="modalVisible = true">Open modal</Button>
        <Button data-testid="open-sidesheet" @click="sideSheetVisible = true">Open sidesheet</Button>
        <Button data-testid="show-toast" @click="showToast">Show toast</Button>
        <Button data-testid="show-notification" @click="showNotification">Show notification</Button>
        <Button data-testid="show-confirm" @click="showModalConfirm">Modal.confirm</Button>
        <Modal
          v-model:visible="modalVisible"
          title="Modal title"
          @ok="onModalOk"
          @cancel="onModalCancel"
          @afterClose="log('modal:afterClose')"
        >
          <Input data-testid="modal-input" placeholder="inside modal" />
        </Modal>
        <SideSheet v-model:visible="sideSheetVisible" title="SideSheet title" @cancel="log('sidesheet:cancel')">
          side content
        </SideSheet>
        <output data-out="modalVisible">{{ modalVisible }}</output>
        <output data-out="sideSheetVisible">{{ sideSheetVisible }}</output>
      </section>

      <!-- Table / Pagination -->
      <section data-check="table">
        <h2>Table / Pagination</h2>
        <Table data-testid="table" :columns="columns" :data-source="tableData" :pagination="{ pageSize: 2 }" @change="log('table:change')" />
        <Pagination data-testid="pagination" :total="50" :page-size="10" showTotal @change="log('pagination:change')" />
      </section>

      <!-- Carousel / Image / Upload / ColorPicker -->
      <section data-check="media">
        <h2>Carousel / Image / Upload / ColorPicker</h2>
        <Carousel data-testid="carousel" :auto-play="false" style="width: 260px; height: 100px" @change="log('carousel:change')">
          <div>slide-1</div>
          <div>slide-2</div>
          <div>slide-3</div>
        </Carousel>
        <Image data-testid="image" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%230064fa'/%3E%3C/svg%3E" width="80" height="80" />
        <Upload data-testid="upload" action="/upload" :show-upload-list="false" />
        <ColorPicker data-testid="colorpicker" v-model="colorValue" @change="log('color:change')" />
        <output data-out="colorHex">{{ colorValue.hex }}</output>
      </section>

      <!-- Typography / Highlight -->
      <section data-check="typography">
        <h2>Typography</h2>
        <Text data-testid="copy-text" copyable @copy="log('text:copy')">copy me</Text>
        <Highlight data-testid="highlight" text="Semi Design Vue" :search-words="['Semi']" />
      </section>

      <!-- Anchor / BackTop -->
      <section data-check="scroll">
        <h2>BackTop</h2>
        <BackTop data-testid="backtop" :visibility-height="10" />
      </section>

      <div style="height: 1200px"></div>
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
import { h, ref } from 'vue';
import {
  ConfigProvider,
  Button,
  ButtonGroup,
  Input,
  InputNumber,
  Slider,
  Rating,
  Select,
  Option,
  AutoComplete,
  TagInput,
  DatePicker,
  TimePicker,
  Tree,
  TreeSelect,
  Tabs,
  TabPane,
  Collapse,
  CollapsePanel,
  Switch,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Tooltip,
  Popover,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Popconfirm,
  Modal,
  SideSheet,
  Toast,
  Notification,
  Table,
  Pagination,
  Carousel,
  Image,
  Upload,
  ColorPicker,
  Text,
  Highlight,
  BackTop,
  IconSearch,
} from '@/index';

const logs = ref<string[]>([]);
const log = (m: string) => logs.value.push(m);

const buttonCount = ref(0);
const wrappedButton = ref(0);
function onClick() {
  buttonCount.value += 1;
}

const inputValue = ref('hello');
const numberValue = ref(10);
const sliderValue = ref(20);
const ratingValue = ref(0);
const selectValue = ref('a');
const multiValue = ref<string[]>(['x']);
const filterValue = ref<string | undefined>(undefined);
const tagList = ref<string[]>(['one']);
const dateValue = ref<any>(null);
const timeValue = ref<any>(null);
const treeValue = ref<any>('1');
const treeSelectValue = ref<any>(null);
const tabKey = ref('t1');
const collapseKey = ref<string[]>(['c1']);
const switchValue = ref(false);
const checkValue = ref(false);
const checkGroup = ref<string[]>(['A']);
const radioValue = ref('x');
const modalVisible = ref(false);
const sideSheetVisible = ref(false);
const colorValue = ref<any>({ hex: '#0064fa', rgba: { r: 0, g: 100, b: 250, a: 1 }, hsva: { h: 216, s: 100, v: 98, a: 1 } });

const treeData = [
  {
    label: 'Parent',
    value: '0',
    key: '0',
    children: [
      { label: 'Leaf A', value: '0-0', key: '0-0' },
      { label: 'Leaf B', value: '0-1', key: '0-1' },
    ],
  },
  { label: 'Leaf C', value: '1', key: '1' },
];

const columns = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Score', dataIndex: 'score', sorter: (a: any, b: any) => a.score - b.score },
];
const tableData = [
  { key: '1', name: 'Alice', score: 92 },
  { key: '2', name: 'Bob', score: 78 },
  { key: '3', name: 'Carol', score: 85 },
  { key: '4', name: 'Dave', score: 64 },
];

const renderMenu = () => h(DropdownMenu, null, () => [h(DropdownItem, { onClick: () => log('dropdown:item') }, () => 'Item one')]);

const onModalOk = () => {
  log('modal:ok');
  modalVisible.value = false;
};
const onModalCancel = () => {
  log('modal:cancel');
  modalVisible.value = false;
};
const showToast = () => Toast.info({ content: 'toast body', duration: 0.5 });
const showNotification = () => Notification.info({ title: 'notice', content: 'notification body', duration: 0.5 });
const showModalConfirm = () =>
  Modal.confirm({
    title: 'confirm title',
    content: 'confirm body',
    onOk: () => log('modalconfirm:ok'),
    onCancel: () => log('modalconfirm:cancel'),
  });
</script>

<style>
body {
  margin: 0;
}
.wrap {
  padding: 16px;
  background: var(--semi-color-bg-0);
  color: var(--semi-color-text-0);
}
section {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--semi-color-border);
}
h2 {
  font-size: 14px;
  margin: 0 0 8px;
}
output {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background: var(--semi-color-fill-0);
  font-size: 12px;
}
</style>
