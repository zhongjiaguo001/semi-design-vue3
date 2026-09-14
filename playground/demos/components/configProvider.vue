<script setup lang="ts">
import { h, ref, onBeforeUnmount, watch, defineComponent } from 'vue';
import type { PropType } from 'vue';
import {
  ConfigProvider,
  ConfigConsumer,
  Select,
  Option,
  DatePicker,
  TimePicker,
  Text,
  ButtonGroup,
  Button,
  Row,
  Col,
  Notification,
  Modal,
  Toast,
  Timeline,
  TimelineItem,
  Popover,
  Tag,
  Tooltip,
  Badge,
  Avatar,
  Steps,
  Step,
  Pagination,
  Breadcrumb,
  BreadcrumbItem,
  Rating,
  Nav,
  Spin,
  Cascader,
  Radio,
  Input,
  TextArea,
  Checkbox,
  Switch,
  IconVigoLogo,
  IconEdit,
  IconCamera,
  IconList,
  IconSidebar,
  IconChevronDown,
} from '@/index';
import type { ScreensBreakpoints } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { ConfigProvider, ConfigConsumer, semiGlobal } from 'semi-design-vue';`;

// ---- 基本用法 / 手动获取值 ----
const defaultTimestamp = 1581599305265;
const gmtList: string[] = [];
for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
  const prefix = hourOffset >= 0 ? '+' : '-';
  const hOffset = Math.abs(hourOffset);
  gmtList.push(`GMT${prefix}${String(hOffset).padStart(2, '0')}:00`);
}
const timeZone = ref<string | undefined>('GMT+08:00');
const timeZone2 = ref<string | undefined>('GMT+08:00');
const log = (...args: any[]) => console.log(...args);

// ---- 响应式断点监听 ----
const responsiveMap = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
  xxl: '(min-width: 1600px)',
};
/** Vue port of the official `BreakpointSubscriber`: subscribes through the `onBreakpoint` obtained from ConfigConsumer */
const BreakpointSubscriber = defineComponent({
  props: {
    subscribe: { type: Function as PropType<any>, default: undefined },
    screens: { type: Object as PropType<ScreensBreakpoints>, default: undefined },
  },
  setup(props) {
    const subscribedScreens = ref<ScreensBreakpoints | undefined>(props.screens);
    const lastSingleChange = ref('');
    let unsubscribers: Array<() => void> = [];
    const resubscribe = () => {
      unsubscribers.forEach((fn) => fn());
      unsubscribers = [];
      if (!props.subscribe) return;
      unsubscribers.push(props.subscribe((next: ScreensBreakpoints) => (subscribedScreens.value = { ...next })));
      unsubscribers.push(props.subscribe(['md', 'lg'], (screen: string, match: boolean) => (lastSingleChange.value = `${screen}: ${match}`)));
    };
    watch(() => props.subscribe, resubscribe, { immediate: true });
    onBeforeUnmount(() => unsubscribers.forEach((fn) => fn()));
    return () =>
      h('div', [
        h(Text, null, { default: () => JSON.stringify(subscribedScreens.value || props.screens) }),
        h('br'),
        h(Text, { type: 'tertiary' }, { default: () => `onBreakpoint(['md', 'lg'], cb) 最近一次回调：${lastSingleChange.value || '(none)'}` }),
      ]);
  },
});

// ---- RTL/LTR ----
const direction = ref<'ltr' | 'rtl' | undefined>(undefined);
const flexStyle = { display: 'flex', marginBottom: '32px', flexWrap: 'wrap' as const };
const titleStyle = { margin: '50px 0 16px 0' };
const rowStyle = { margin: '16px 10px' };
const badgeStyle = { width: '42px', height: '42px', borderRadius: '4px', display: 'inline-block' };
const tagStyle = { marginRight: '8px', marginBottom: '8px' };
const buttonStyle = { ...tagStyle };
const getOpts = () => ({
  title: 'Hi,Bytedance',
  content: 'ies dance dance dance',
  duration: 3,
  direction: direction.value,
});
const treeData = [
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '萧山区', value: 'xiaoshan' },
          { label: '临安区', value: 'linan' },
        ],
      },
      {
        label: '宁波市',
        value: 'ningbo',
        children: [
          { label: '海曙区', value: 'haishu' },
          { label: '江北区', value: 'jiangbei' },
        ],
      },
    ],
  },
];
const navItems = [
  { itemKey: 'user', text: 'Option1', icon: h(IconEdit) },
  { itemKey: 'union', text: 'Option2', icon: h(IconCamera) },
  { itemKey: 'approve-management', text: 'Group3', icon: h(IconList), items: ['3-1', '3-2'] },
];
const notifyWithIcon = (color?: string) =>
  Notification.info({ ...getOpts(), icon: h(IconVigoLogo, color ? { style: { color } } : undefined) } as any);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="通过传入 timeZone 参数，用户可以为时间类组件配置时区：">
    <ConfigProvider :timeZone="timeZone">
      <div style="width: 300px">
        <h5 style="margin: 10px">Select Time Zone:</h5>
        <Select
          placeholder="请选择时区"
          style="width: 300px"
          :value="timeZone"
          :showClear="true"
          @select="(value: any) => (timeZone = value)"
          @clear="timeZone = undefined"
        >
          <Option v-for="gmt in gmtList" :key="gmt" :value="gmt">{{ gmt }}</Option>
        </Select>
        <br />
        <br />
        <DatePicker type="dateTime" :defaultValue="defaultTimestamp" @change="(date: any, dateString: any) => log('DatePicker changed: ', date, dateString)" />
        <br />
        <br />
        <TimePicker :defaultValue="defaultTimestamp" @change="(date: any, dateString: any) => log('TimePicker changed: ', date, dateString)" />
      </div>
    </ConfigProvider>
  </DemoBlock>

  <DemoBlock
    title="手动获取值"
    desc="通常情况下，组件内部会自动获取 ConfigProvider 的值自动消费，无需关心。一些特殊场景可以使用 ConfigConsumer（默认作用域插槽）手动获取 ConfigProvider 的值。"
  >
    <ConfigProvider :timeZone="timeZone2">
      <div style="width: 300px; margin-bottom: 16px">
        <Select placeholder="请选择时区" style="width: 300px" :value="timeZone2" :showClear="true" @select="(value: any) => (timeZone2 = value)" @clear="timeZone2 = undefined">
          <Option v-for="gmt in gmtList" :key="gmt" :value="gmt">{{ gmt }}</Option>
        </Select>
      </div>
      <ConfigConsumer v-slot="value">
        <Text :ellipsis="{ showTooltip: { opts: { style: { minWidth: '1200px' } } } }" :style="{ width: '600px' }">
          {{ JSON.stringify({ timeZone: value.timeZone, direction: value.direction, responsiveMap: value.responsiveMap, screens: value.screens, locale: value.locale && value.locale.code }) }}
        </Text>
      </ConfigConsumer>
    </ConfigProvider>
  </DemoBlock>

  <DemoBlock
    title="响应式断点监听"
    desc="通过 responsiveObserve 开启断点监听，responsiveMap 自定义断点；onBreakpoint / screens 需要通过 ConfigConsumer 获取。onBreakpoint(cb) 与 onBreakpoint(['md','lg'], cb) 两种签名均返回取消订阅函数，订阅时会立即执行一次。拖动浏览器窗口宽度观察变化。"
  >
    <ConfigProvider responsiveObserve :responsiveMap="responsiveMap">
      <ConfigConsumer v-slot="{ onBreakpoint, screens }">
        <BreakpointSubscriber :subscribe="onBreakpoint" :screens="screens" />
      </ConfigConsumer>
    </ConfigProvider>
  </DemoBlock>

  <DemoBlock
    title="RTL/LTR"
    desc="全局配置 direction 可以改变组件的文本方向。rtl 表示从右到左，ltr 表示从左到右。Modal、Notification、Toast 的命令式调用需要通过 direction 参数传入。"
  >
    <div>
      <div style="margin-bottom: 20px">
        <ButtonGroup>
          <Button @click="direction = 'ltr'">LTR</Button>
          <Button @click="direction = 'rtl'">RTL</Button>
        </ButtonGroup>
      </div>
      <ConfigProvider :direction="direction">
        <Row>
          <h3 :style="titleStyle">Buttons</h3>
        </Row>
        <Row :style="rowStyle">
          <Button :loading="true" theme="solid" style="margin-right: 8px">加载</Button>
          <Button theme="solid" style="margin-right: 8px">
            <template #icon><IconSidebar /></template>
            收起
          </Button>
          <Button theme="solid" iconPosition="right" style="margin-right: 8px">
            <template #icon><IconChevronDown /></template>
            展开选项
          </Button>
          <br /><br />
          <ButtonGroup>
            <Button>拷贝</Button>
            <Button>查询</Button>
            <Button>剪切</Button>
          </ButtonGroup>
        </Row>
        <Row>
          <h3 :style="titleStyle">Input</h3>
        </Row>
        <Row :style="rowStyle" :gutter="16">
          <Col :span="12">
            <Input placeholder="输入框" />
            <br /><br />
            <Input disabled placeholder="输入框" />
            <br /><br />
            <Input prefix="Prefix" showClear />
            <br /><br />
            <Input showClear>
              <template #suffix>
                <Text strong type="secondary" style="margin: 0 8px">Suffix</Text>
              </template>
            </Input>
            <br /><br />
            <TextArea placeholder="文本框" :maxCount="100" />
            <br /><br />
            <div :style="flexStyle">
              <Switch style="margin-right: 8px" :defaultChecked="true" />
              <Switch style="margin-right: 8px" />
              <Switch disabled :defaultChecked="true" style="margin-right: 8px" />
            </div>
            <div :style="flexStyle">
              <Checkbox style="margin-right: 8px" defaultChecked>多选框</Checkbox>
              <Checkbox style="margin-right: 8px" disabled defaultChecked>禁用的多选框</Checkbox>
              <Checkbox style="margin-right: 8px">禁用的多选框</Checkbox>
            </div>
            <div :style="{ ...flexStyle, marginBottom: 0 }">
              <Radio style="margin-right: 8px" defaultChecked>单选框</Radio>
              <Radio style="margin-right: 8px" disabled defaultChecked>禁用的单选框</Radio>
              <Radio style="margin-right: 8px">禁用的单选框</Radio>
            </div>
          </Col>
          <Col :span="12">
            <DatePicker style="width: 100%" @change="(date: any, dateString: any) => log(dateString)" />
            <br /><br />
            <TimePicker style="width: 100%" />
            <br /><br />
            <Select style="width: 100%" placeholder="选择器-单选">
              <Option value="abc">抖音</Option>
              <Option value="hotsoon">火山</Option>
              <Option value="pipixia" disabled>皮皮虾</Option>
              <Option value="xigua">西瓜视频</Option>
            </Select>
            <br /><br />
            <Select disabled style="width: 100%" placeholder="选择器-禁用">
              <Option value="abc">抖音</Option>
              <Option value="hotsoon">火山</Option>
              <Option value="pipixia" disabled>皮皮虾</Option>
              <Option value="xigua">西瓜视频</Option>
            </Select>
            <br /><br />
            <Select multiple style="width: 100%" placeholder="选择器-多选">
              <Option value="abc">抖音</Option>
              <Option value="hotsoon">火山</Option>
              <Option value="pipixia" disabled>皮皮虾</Option>
              <Option value="xigua">西瓜视频</Option>
            </Select>
            <br /><br />
            <Cascader style="width: 100%" :treeData="treeData" placeholder="级联选择器" />
          </Col>
        </Row>
        <Row>
          <h3 :style="titleStyle">Navigation</h3>
        </Row>
        <Row :style="rowStyle">
          <Breadcrumb>
            <BreadcrumbItem>Semi-ui</BreadcrumbItem>
            <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
            <BreadcrumbItem>Default</BreadcrumbItem>
          </Breadcrumb>
          <Nav mode="horizontal" :items="navItems" />
          <br /><br />
          <Pagination :total="80" showSizeChanger />
          <br />
          <Steps :current="1">
            <Step title="Finished" description="This is a description." />
            <Step title="In Progress" description="This is a description." />
            <Step title="Waiting" description="This is a description." />
          </Steps>
          <br />
          <Steps :current="1" status="error">
            <Step title="Finished" description="This is a description" />
            <Step title="In Process" description="This is a description" />
            <Step title="Waiting" description="This is a description" />
          </Steps>
        </Row>
        <Row>
          <h3 :style="titleStyle">Display</h3>
        </Row>
        <Row :style="rowStyle">
          <div style="display: flex">
            <div style="padding: 8px">
              <Badge :count="5" theme="solid">
                <Avatar color="blue" shape="square" :style="badgeStyle">XZ</Avatar>
              </Badge>
            </div>
            <div style="padding: 8px">
              <Badge :count="5" theme="light">
                <Avatar color="cyan" shape="square" :style="badgeStyle">YB</Avatar>
              </Badge>
            </div>
            <div style="padding: 8px">
              <Badge :count="5" theme="inverted">
                <Avatar color="indigo" shape="square" :style="badgeStyle">LX</Avatar>
              </Badge>
            </div>
            <div style="padding: 8px">
              <Badge dot theme="solid">
                <Avatar color="light-blue" shape="square" :style="badgeStyle">YZ</Avatar>
              </Badge>
            </div>
            <div style="padding: 8px">
              <Badge dot theme="light">
                <Avatar color="teal" shape="square" :style="badgeStyle">HW</Avatar>
              </Badge>
            </div>
            <div style="padding: 8px; border-radius: 4px; background-color: var(--semi-color-fill-0)">
              <Badge dot theme="inverted">
                <Avatar color="green" shape="square" :style="badgeStyle">XM</Avatar>
              </Badge>
            </div>
          </div>
          <br />
          <div>
            <Tag color="grey" :style="tagStyle"> grey tag </Tag>
            <Tag color="blue" :style="tagStyle"> blue tag </Tag>
            <Tag color="blue" type="ghost" :style="tagStyle"> ghost tag </Tag>
            <Tag color="blue" type="solid" :style="tagStyle"> solid tag </Tag>
            <Tag color="red" :style="tagStyle"> red tag </Tag>
            <Tag color="green" :style="tagStyle"> green tag </Tag>
            <Tag color="orange" :style="tagStyle"> orange tag </Tag>
            <Tag color="teal" :style="tagStyle"> teal tag </Tag>
            <Tag color="violet" :style="tagStyle"> violet tag </Tag>
            <Tag color="white" :style="tagStyle"> white tag </Tag>
          </div>
          <br />
          <div style="display: flex; align-items: center">
            <Popover content="hi semi-design" :style="{ padding: '8px' }">
              <Tag style="margin-right: 8px">I am Popover</Tag>
            </Popover>
            <Tooltip content="hi semi-design">
              <Tag style="margin-right: 8px">I am Tooltip</Tag>
            </Tooltip>
            <Rating :defaultValue="3" size="small" style="margin-right: 8px" />
          </div>
          <br />
          <Timeline>
            <TimelineItem time="2019-07-14 10:35" type="ongoing">审核中</TimelineItem>
            <TimelineItem time="2019-06-13 16:17" type="success">发布成功</TimelineItem>
            <TimelineItem time="2019-05-14 18:34" type="error">审核失败</TimelineItem>
          </Timeline>
        </Row>
        <Row>
          <h3 :style="titleStyle">Feedback</h3>
        </Row>
        <Row :style="rowStyle">
          <Button type="primary" @click="Notification.success(getOpts() as any)" :style="buttonStyle">成功信息的通知</Button>
          <Button @click="Notification.info(getOpts() as any)" :style="buttonStyle">提示信息的通知</Button>
          <Button type="warning" @click="Notification.warning(getOpts() as any)" :style="buttonStyle">警告信息的通知</Button>
          <Button type="danger" @click="Notification.error(getOpts() as any)" :style="buttonStyle">失败信息的通知</Button>
          <Button :style="buttonStyle" :ghost="false" @click="notifyWithIcon()">
            <template #icon><IconVigoLogo /></template>
          </Button>
          <Button :style="buttonStyle" :ghost="false" @click="notifyWithIcon('pink')">
            <template #icon><IconVigoLogo /></template>
          </Button>
          <br />
          <Button type="primary" @click="Modal.success(getOpts() as any)" :style="buttonStyle">成功信息的弹窗</Button>
          <Button @click="Modal.info(getOpts() as any)" :style="buttonStyle">提示信息的弹窗</Button>
          <Button type="warning" @click="Modal.warning(getOpts() as any)" :style="buttonStyle">警告信息的弹窗</Button>
          <Button type="danger" @click="Modal.error(getOpts() as any)" :style="buttonStyle">失败信息的弹窗</Button>
          <br />
          <Button type="primary" @click="Toast.success(getOpts() as any)" :style="buttonStyle">成功信息的提示</Button>
          <Button @click="Toast.info(getOpts() as any)" :style="buttonStyle">提示信息的提示</Button>
          <Button type="warning" @click="Toast.warning(getOpts() as any)" :style="buttonStyle">警告信息的提示</Button>
          <Button type="danger" @click="Toast.error(getOpts() as any)" :style="buttonStyle">失败信息的提示</Button>
          <br /><br />
          <Spin tip="I am loading...">
            <div style="background-color: var(--semi-color-primary-light-default); border: 1px solid var(--semi-color-primary); border-radius: 4px; padding: 16px 10px">
              <p>Here are some texts.</p>
              <p>And more texts on the way.</p>
            </div>
          </Spin>
        </Row>
      </ConfigProvider>
    </div>
  </DemoBlock>

  <DemoBlock
    title="semiGlobal"
    desc="除了 ConfigProvider 外，还可以通过 semiGlobal.config.overrideDefaultProps 覆盖全局组件的默认 Props（需放在站点入口处，优先于所有 Semi 组件执行；单例模式，会影响整个站点）。"
    :code="`import { semiGlobal } from 'semi-design-vue';

semiGlobal.config.overrideDefaultProps = {
    Select: {
        zIndex: 2000,
    },
    Tooltip: {
        zIndex: 2001,
        trigger: 'click'
    },
};`"
  />
</template>
