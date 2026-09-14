<script setup lang="ts">
import { h, ref } from 'vue';
import {
  Nav,
  NavItem,
  SubNav,
  NavHeader,
  NavFooter,
  Avatar,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Layout,
  Header as LayoutHeader,
  Footer as LayoutFooter,
  Sider,
  Content,
  Breadcrumb,
  Skeleton,
  SkeletonParagraph,
  IconSemiLogo,
  IconBytedanceLogo,
  IconUser,
  IconEdit,
  IconList,
  IconFolder,
  IconSend,
  IconBell,
  IconGridView,
  IconArticle,
  IconLayers,
  IconInbox,
  IconBookmark,
  IconCheckList,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Nav, NavItem, SubNav, NavHeader, NavFooter } from 'semi-design-vue';
// 也可使用静态子组件：Nav.Item / Nav.Sub / Nav.Header / Nav.Footer`;

// 官方示例使用了 @douyinfe/semi-icons-lab 的图标（IconBadge / IconBanner / IconTreeSelect ...），
// 本仓库仅内置 semi-icons，这里用语义相近的 semi-icons 图标替代。
const IconBadge = IconBell;
const IconBanner = IconArticle;
const IconTreeSelect = IconLayers;
const IconForm = IconEdit;
const IconTree = IconFolder;
const IconTabs = IconGridView;
const IconNavigation = IconSend;
const IconNotification = IconInbox;
const IconSteps = IconCheckList;
const IconBreadcrumb = IconList;
const IconAvatar = IconUser;
const IconDescriptions = IconBookmark;

const logo = () => h(IconSemiLogo, { style: { height: '36px', fontSize: '36px' } });
const header = { logo: logo(), text: 'Semi 运营后台' };
const footer = { collapseButton: true };

const log = (label: string) => (data: any) => console.log(label, data);

// 基本使用
const basicItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconAvatar) },
  { itemKey: 'union', text: '活动管理', icon: h(IconDescriptions) },
  {
    text: '任务平台',
    icon: h(IconTree),
    itemKey: 'job',
    items: ['任务管理', '用户任务查询'],
  },
];

// 导航样式定义
const styleItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  { itemKey: '2', text: '订单管理', icon: h(IconBanner) },
  { itemKey: '3', text: '资源管理', icon: h(IconTreeSelect) },
  {
    text: '任务平台',
    icon: h(IconForm),
    itemKey: '4',
    items: ['任务管理', '用户任务查询'],
  },
  { itemKey: '5', text: '推送通知', icon: h(IconNotification) },
  { itemKey: '6', text: '任务', icon: h(IconSteps) },
  { itemKey: '7', text: '活动管理', icon: h(IconTree) },
  { itemKey: '8', text: '内容工具', icon: h(IconTabs) },
  { itemKey: '9', text: '快捷导航', icon: h(IconNavigation) },
];

// 垂直布局
const verticalItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  { itemKey: 'union', text: '活动管理', icon: h(IconTreeSelect) },
  {
    itemKey: 'union-management',
    text: '任务管理',
    icon: h(IconForm),
    items: ['任务设置', '任务查询', '信息录入'],
  },
  {
    text: '公告管理',
    icon: h(IconBanner),
    itemKey: 'job',
    items: ['推送管理', '已推送查询'],
  },
];

// 水平布局
const horizontalItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  { itemKey: 'union', text: '活动管理', icon: h(IconTreeSelect) },
  {
    itemKey: 'approve-management',
    text: '审批管理',
    icon: h(IconBreadcrumb),
    items: [
      '入驻审核',
      {
        itemKey: 'operation-management',
        text: '运营管理',
        items: ['人员管理', '人员变更'],
      },
    ],
  },
  {
    text: '任务平台',
    icon: h(IconSteps),
    itemKey: 'job',
    items: ['任务管理', '用户任务查询'],
  },
];

// 水平加垂直 - 左侧导航
const leftNavItems = [
  {
    itemKey: 'approve-management',
    text: '审批管理',
    icon: h(IconBreadcrumb),
    items: [
      '入驻审核',
      {
        itemKey: 'operation-management',
        text: '运营管理',
        items: ['人员管理', '人员变更'],
      },
    ],
  },
  {
    text: '任务平台',
    icon: h(IconSteps),
    itemKey: 'job',
    items: ['任务管理', '用户任务查询'],
  },
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  { itemKey: 'union', text: '活动管理', icon: h(IconTreeSelect) },
];

// 展开收起箭头位置
const toggleItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  { itemKey: 'union', text: '活动管理', icon: h(IconBanner) },
  {
    text: '任务平台',
    icon: h(IconForm),
    itemKey: 'job',
    items: ['任务管理', '用户任务查询'],
  },
];

// 导航缩进
const indentItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  {
    text: '任务平台',
    icon: h(IconBanner),
    itemKey: 'job',
    items: [
      '任务管理',
      {
        text: '任务1',
        icon: h(IconForm),
        itemKey: 'mission1',
        items: [
          '任务2',
          {
            text: '任务3拆解',
            icon: h(IconTabs),
            itemKey: 'mission3',
            items: ['子任务1', '子任务2'],
          },
        ],
      },
    ],
  },
];

// 非受控属性
const uncontrolledItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  { itemKey: 'union', text: '活动管理', icon: h(IconBanner) },
  {
    itemKey: 'union-management',
    text: '任务管理',
    icon: h(IconForm),
    items: ['公告设置', '任务查询', '信息录入'],
  },
  {
    text: '任务平台',
    icon: h(IconTree),
    itemKey: 'job',
    items: ['任务管理', '用户任务查询'],
  },
];

// 受控属性
const controlledItems = [
  { itemKey: 'user', text: '用户管理', icon: h(IconBadge) },
  { itemKey: 'union', text: '活动管理', icon: h(IconBanner) },
  {
    itemKey: 'union-management',
    text: '任务管理',
    icon: h(IconForm),
    items: ['公告设置', '任务查询', '信息录入'],
  },
  {
    text: '任务平台',
    icon: h(IconTree),
    itemKey: 'job',
    items: ['任务管理', '用户任务查询'],
  },
];
const openKeys = ref<(string | number)[]>(['union-management', 'job']);
const selectedKeys = ref<(string | number)[]>(['公告设置']);
const isCollapsed = ref(true);
const onControlledSelect = (data: any) => {
  console.log('trigger onSelect: ', data);
  selectedKeys.value = [...data.selectedKeys];
};
const onControlledOpenChange = (data: any) => {
  console.log('trigger onOpenChange: ', data);
  openKeys.value = [...data.openKeys];
};
const onControlledCollapseChange = (collapsed: boolean) => {
  isCollapsed.value = collapsed;
};

const year = new Date().getFullYear();

const currentRoute = ref('/');
const routerMap: Record<string, string> = {
  Home: '/',
  About: '/about',
  Dashboard: '/dashboard',
  'Nothing Here': '/nothing-here',
};
const routerItems = [
  { itemKey: 'Home', text: 'Home' },
  { itemKey: 'About', text: 'About' },
  { text: 'Sub', itemKey: 'Sub', items: ['Dashboard', 'Nothing Here'] },
];
const renderRouterWrapper = ({ itemElement, props: itemProps }: { itemElement: any; props: any }) => {
  const to = routerMap[itemProps.itemKey];
  if (!to) return itemElement;
  return h(
    'a',
    {
      href: to,
      style: { textDecoration: 'none' },
      onClick: (e: MouseEvent) => {
        e.preventDefault();
        currentRoute.value = to;
      },
    },
    [itemElement]
  );
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本使用"
    desc="通过传递 items 参数快速得到一个导航栏；header / footer 定义头部与底部，footer.collapseButton 开启收起按钮（仅垂直模式生效）。"
  >
    <Nav
      :bodyStyle="{ height: '320px' }"
      :items="basicItems"
      :header="header"
      :footer="footer"
      @select="log('trigger onSelect: ')"
      @click="log('trigger onClick: ')"
    />
  </DemoBlock>

  <DemoBlock
    title="导航样式定义"
    desc="style 定义最外层样式，bodyStyle 定义导航列表样式：中间列表可滚动、头部和底部固定。"
  >
    <Nav
      :style="{ height: '520px' }"
      :bodyStyle="{ height: '300px' }"
      :items="styleItems"
      :header="header"
      :footer="footer"
      @select="log('onSelect')"
    />
  </DemoBlock>

  <DemoBlock
    title="JSX 写法"
    desc="使用子组件（Nav.Header / Nav.Item / Nav.Sub / Nav.Footer）定义导航头部、导航项以及导航底部，也可以置入其他自定义元素。"
  >
    <Nav
      :bodyStyle="{ height: '300px' }"
      :defaultOpenKeys="['user', 'union']"
      @select="log('trigger onSelect: ')"
      @click="log('trigger onClick: ')"
    >
      <NavHeader text="Semi 运营后台">
        <template #logo><IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" /></template>
      </NavHeader>
      <NavItem itemKey="union" text="活动管理">
        <template #icon><IconForm /></template>
      </NavItem>
      <SubNav itemKey="user" text="用户管理">
        <template #icon><IconBadge /></template>
        <NavItem itemKey="active" text="活跃用户" />
        <NavItem itemKey="negative" text="非活跃用户" />
      </SubNav>
      <SubNav itemKey="union-management" text="任务管理">
        <template #icon><IconTree /></template>
        <NavItem itemKey="notice" text="任务设置" />
        <NavItem itemKey="query" text="任务查询" />
        <NavItem itemKey="info" text="信息录入" />
      </SubNav>
      <NavFooter :collapseButton="true" />
    </Nav>
  </DemoBlock>

  <DemoBlock
    title="配合 react-router 等路由组件"
    desc="官网用 renderWrapper 把 NavItem 包进 react-router 的 Link。Vue 侧同样用 renderWrapper，可包 vue-router 的 RouterLink。本页用 &lt;a&gt; 模拟，点击只更新当前路由展示、不离开文档页。"
  >
    <p :style="{ marginBottom: '12px', color: 'var(--semi-color-text-2)' }">当前路由：{{ currentRoute }}</p>
    <Nav :style="{ width: '220px' }" :items="routerItems" :renderWrapper="renderRouterWrapper" />
  </DemoBlock>

  <DemoBlock
    title="垂直与水平布局"
    desc="Navigation 提供垂直（默认 mode='vertical'）和水平（mode='horizontal'）两种方向。isCollapsed、defaultOpenKeys / openKeys、Footer.collapseButton 仅在垂直模式有效。"
  />

  <DemoBlock
    title="垂直布局"
    desc="mode = 'vertical'（默认）。isCollapsed、defaultOpenKeys / openKeys、Footer 的 collapseButton 仅在垂直模式下有效。"
  >
    <div style="width: 100%">
      <Nav :bodyStyle="{ height: '300px' }" :items="verticalItems" :header="header" :footer="footer" @select="log('onSelect')" />
    </div>
  </DemoBlock>

  <DemoBlock title="水平布局" desc="mode = 'horizontal'，子导航以下拉浮层展示，footer 可传入任意元素。">
    <div style="width: 100%">
      <Nav mode="horizontal" :items="horizontalItems" :header="header" @select="log('onSelect')">
        <template #footer>
          <Dropdown position="bottomRight">
            <template #render>
              <DropdownMenu>
                <DropdownItem>详情</DropdownItem>
                <DropdownItem>退出</DropdownItem>
              </DropdownMenu>
            </template>
            <Avatar size="small" color="light-blue" :style="{ margin: '4px' }">BD</Avatar>
            <span>Bytedancer</span>
          </Dropdown>
        </template>
      </Nav>
    </div>
  </DemoBlock>

  <DemoBlock title="水平加垂直" desc="一般的平台设计会采取水平加垂直导航的模式，这里有一个比较常见的例子。">
    <Layout :style="{ border: '1px solid var(--semi-color-border)' }">
      <LayoutHeader :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
        <div>
          <Nav mode="horizontal" :items="horizontalItems" :header="header" @select="log('onSelect')">
            <template #footer>
              <Dropdown position="bottomRight">
                <template #render>
                  <DropdownMenu>
                    <DropdownItem>详情</DropdownItem>
                    <DropdownItem>退出</DropdownItem>
                  </DropdownMenu>
                </template>
                <Avatar size="small" color="light-blue" :style="{ margin: '4px' }">BD</Avatar>
                <span>Bytedancer</span>
              </Dropdown>
            </template>
          </Nav>
        </div>
      </LayoutHeader>
      <Layout>
        <Sider :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
          <Nav :style="{ maxWidth: '220px', height: '100%' }" :defaultSelectedKeys="['Home']" :items="leftNavItems" :footer="footer" />
        </Sider>
        <Content :style="{ padding: '24px', backgroundColor: 'var(--semi-color-bg-0)' }">
          <Breadcrumb :style="{ marginBottom: '24px' }" :routes="['首页', '当这个页面标题很长时需要省略', '上一页', '详情页']" />
          <div :style="{ borderRadius: '10px', border: '1px solid var(--semi-color-border)', height: '376px', padding: '32px' }">
            <Skeleton :loading="true">
              <template #placeholder><SkeletonParagraph :rows="2" /></template>
              <p>Hi, Bytedance dance dance.</p>
              <p>Hi, Bytedance dance dance.</p>
            </Skeleton>
          </div>
        </Content>
      </Layout>
      <LayoutFooter
        :style="{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px',
          color: 'var(--semi-color-text-2)',
          backgroundColor: 'rgba(var(--semi-grey-0), 1)',
        }"
      >
        <span :style="{ display: 'flex', alignItems: 'center' }">
          <IconBytedanceLogo size="large" :style="{ marginRight: '8px' }" />
          <span>Copyright © {{ year }} ByteDance. All Rights Reserved. </span>
        </span>
        <span>
          <span :style="{ marginRight: '24px' }">平台客服</span>
          <span>反馈建议</span>
        </span>
      </LayoutFooter>
    </Layout>
  </DemoBlock>

  <DemoBlock title="展开收起箭头位置" desc="通过 toggleIconPosition 改变 Nav.Sub 展开收起箭头的位置，默认 'right'，可改为 'left'。">
    <Nav
      toggleIconPosition="left"
      :defaultOpenKeys="['job']"
      :bodyStyle="{ height: '300px' }"
      :items="toggleItems"
      :header="header"
      :footer="footer"
      @select="log('onSelect')"
    />
  </DemoBlock>

  <DemoBlock
    title="导航缩进"
    desc="默认缩进仅对第一级导航生效；将 limitIndent 设为 false 后多级导航按层级缩进（只在竖直方向生效）。"
  >
    <Nav
      :limitIndent="false"
      :defaultOpenKeys="['job', 'mission1']"
      :bodyStyle="{ height: '300px' }"
      :items="indentItems"
      :header="header"
      :footer="footer"
      @select="log('onSelect')"
    />
  </DemoBlock>

  <DemoBlock title="非受控属性" desc="defaultSelectedKeys / defaultOpenKeys / defaultIsCollapsed。">
    <Nav
      :defaultOpenKeys="['job']"
      :defaultSelectedKeys="['信息录入']"
      :defaultIsCollapsed="true"
      :bodyStyle="{ height: '300px' }"
      :items="uncontrolledItems"
      :header="header"
      :footer="footer"
    />
  </DemoBlock>

  <DemoBlock
    title="受控属性"
    desc="isCollapsed / selectedKeys / openKeys 配合 onCollapseChange / onSelect / onOpenChange 回调（也支持 v-model:isCollapsed 等）控制导航。"
  >
    <Nav
      :isCollapsed="isCollapsed"
      :openKeys="openKeys"
      :selectedKeys="selectedKeys"
      :bodyStyle="{ height: '300px' }"
      :items="controlledItems"
      :header="header"
      :footer="footer"
      @collapseChange="onControlledCollapseChange"
      @openChange="onControlledOpenChange"
      @select="onControlledSelect"
    />
  </DemoBlock>
</template>
