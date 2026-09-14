<script setup lang="ts">
import {
  Layout,
  Nav,
  NavItem,
  NavHeader,
  NavFooter,
  Button,
  Breadcrumb,
  Skeleton,
  SkeletonParagraph,
  Avatar,
  IconSemiLogo,
  IconBell,
  IconHelpCircle,
  IconBytedanceLogo,
  IconHome,
  IconHistogram,
  IconLive,
  IconSetting,
} from '@/index';
import { h } from 'vue';
import DemoBlock from '../../DemoBlock.vue';

const { Header, Footer, Sider, Content } = Layout;

const importCode = `import { Layout } from 'semi-design-vue';
const { Header, Footer, Sider, Content } = Layout;`;

const commonStyle = {
  height: '64px',
  lineHeight: '64px',
  background: 'var(--semi-color-fill-0)',
};
const contentStyle = { height: '300px', lineHeight: '300px' };
const siderStyle = { width: '120px', background: 'var(--semi-color-fill-2)' };

const onBreakpoint = (screen: string, bool: boolean) => {
  // eslint-disable-next-line no-console
  console.log(screen, bool);
};

const iconBtnStyle = { color: 'var(--semi-color-text-2)', marginRight: '12px' };
const footerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '20px',
  color: 'var(--semi-color-text-2)',
  backgroundColor: 'rgba(var(--semi-grey-0), 1)',
};
const contentBoxStyle = {
  borderRadius: '10px',
  border: '1px solid var(--semi-color-border)',
  height: '376px',
  padding: '32px',
};
const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];

const sideNavItems = [
  { itemKey: 'Home', text: '首页', icon: () => h(IconHome, { size: 'large' }) },
  { itemKey: 'Histogram', text: '基础数据', icon: () => h(IconHistogram, { size: 'large' }) },
  { itemKey: 'Live', text: '测试功能', icon: () => h(IconLive, { size: 'large' }) },
  { itemKey: 'Setting', text: '设置', icon: () => h(IconSetting, { size: 'large' }) },
];
const sideNavHeader = {
  logo: () => h(IconSemiLogo, { style: { fontSize: '36px' } }),
  text: 'Semi Design',
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="三行布局" desc="Header / Content / Footer 自上而下排列。">
    <Layout class="components-layout-demo">
      <Header :style="commonStyle">Header</Header>
      <Content :style="contentStyle">Content</Content>
      <Footer :style="commonStyle">Footer</Footer>
    </Layout>
  </DemoBlock>

  <DemoBlock title="左侧边栏布局" desc="嵌套 Layout 中 Sider 在 Content 之前，自动获得 has-sider 横向排列。">
    <Layout class="components-layout-demo">
      <Header :style="commonStyle">Header</Header>
      <Layout>
        <Sider :style="siderStyle">Sider</Sider>
        <Content :style="contentStyle">Content</Content>
      </Layout>
      <Footer :style="commonStyle">Footer</Footer>
    </Layout>
  </DemoBlock>

  <DemoBlock title="右侧边栏布局" desc="Sider 放在 Content 之后即为右侧边栏。">
    <Layout class="components-layout-demo">
      <Header :style="commonStyle">Header</Header>
      <Layout>
        <Content :style="contentStyle">Content</Content>
        <Sider :style="siderStyle">Sider</Sider>
      </Layout>
      <Footer :style="commonStyle">Footer</Footer>
    </Layout>
  </DemoBlock>

  <DemoBlock title="侧边栏布局" desc="Sider 与 Header/Content/Footer 所在的 Layout 并列，形成通栏侧边栏。">
    <Layout class="components-layout-demo">
      <Sider :style="siderStyle">Sider</Sider>
      <Layout>
        <Header :style="commonStyle">Header</Header>
        <Content :style="contentStyle">Content</Content>
        <Footer :style="commonStyle">Footer</Footer>
      </Layout>
    </Layout>
  </DemoBlock>

  <DemoBlock
    title="响应式布局"
    desc="Sider 通过 breakpoint 设置断点（xs/sm/md/lg/xl/xxl），触发时通过 @breakpoint 回调（本例打印到控制台）。"
  >
    <Layout class="components-layout-demo">
      <Header :style="commonStyle">Header</Header>
      <Layout>
        <Sider :style="siderStyle" :breakpoint="['md']" @breakpoint="onBreakpoint">Sider</Sider>
        <Content :style="contentStyle">Content</Content>
      </Layout>
      <Footer :style="commonStyle">Footer</Footer>
    </Layout>
  </DemoBlock>

  <DemoBlock title="顶部导航布局" desc="Header 内放置水平 Nav，Content 内放置面包屑与内容区，Footer 放置版权信息。">
    <Layout :style="{ border: '1px solid var(--semi-color-border)' }">
      <Header :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
        <div>
          <Nav mode="horizontal" :defaultSelectedKeys="['Home']">
            <NavHeader>
              <IconSemiLogo :style="{ fontSize: '36px' }" />
            </NavHeader>
            <NavItem itemKey="Home" text="首页" :icon="() => h(IconHome, { size: 'large' })" />
            <NavItem itemKey="Live" text="直播" :icon="() => h(IconLive, { size: 'large' })" />
            <NavItem itemKey="Setting" text="设置" :icon="() => h(IconSetting, { size: 'large' })" />
            <NavFooter>
              <Button theme="borderless" :style="iconBtnStyle">
                <template #icon><IconBell size="large" /></template>
              </Button>
              <Button theme="borderless" :style="iconBtnStyle">
                <template #icon><IconHelpCircle size="large" /></template>
              </Button>
              <Avatar color="orange" size="small">YJ</Avatar>
            </NavFooter>
          </Nav>
        </div>
      </Header>
      <Content :style="{ padding: '24px', backgroundColor: 'var(--semi-color-bg-0)' }">
        <Breadcrumb :style="{ marginBottom: '24px' }" :routes="routes" />
        <div :style="contentBoxStyle">
          <Skeleton :loading="true">
            <template #placeholder><SkeletonParagraph :rows="2" /></template>
            <p>Hi, Bytedance dance dance.</p>
            <p>Hi, Bytedance dance dance.</p>
          </Skeleton>
        </div>
      </Content>
      <Footer :style="footerStyle">
        <span :style="{ display: 'flex', alignItems: 'center' }">
          <IconBytedanceLogo size="large" :style="{ marginRight: '8px' }" />
          <span>Copyright © 2023 ByteDance. All Rights Reserved. </span>
        </span>
        <span>
          <span :style="{ marginRight: '24px' }">平台客服</span>
          <span>反馈建议</span>
        </span>
      </Footer>
    </Layout>
  </DemoBlock>

  <DemoBlock title="顶部导航-侧边布局" desc="顶部水平 Nav + 左侧垂直 Nav（items 配置，带折叠按钮）。">
    <Layout :style="{ border: '1px solid var(--semi-color-border)' }">
      <Header :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
        <div>
          <Nav mode="horizontal" :defaultSelectedKeys="['Home']">
            <NavHeader>
              <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
            </NavHeader>
            <span :style="{ color: 'var(--semi-color-text-2)' }">
              <span :style="{ marginRight: '24px', color: 'var(--semi-color-text-0)', fontWeight: '600' }">模版推荐</span>
              <span :style="{ marginRight: '24px' }">所有模版</span>
              <span>我的模版</span>
            </span>
            <NavFooter>
              <Button theme="borderless" :style="iconBtnStyle">
                <template #icon><IconBell size="large" /></template>
              </Button>
              <Button theme="borderless" :style="iconBtnStyle">
                <template #icon><IconHelpCircle size="large" /></template>
              </Button>
              <Avatar color="orange" size="small">YJ</Avatar>
            </NavFooter>
          </Nav>
        </div>
      </Header>
      <Layout>
        <Sider :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
          <Nav
            :style="{ maxWidth: '220px', height: '100%' }"
            :defaultSelectedKeys="['Home']"
            :items="sideNavItems"
            :footer="{ collapseButton: true }"
          />
        </Sider>
        <Content :style="{ padding: '24px', backgroundColor: 'var(--semi-color-bg-0)' }">
          <Breadcrumb :style="{ marginBottom: '24px' }" :routes="routes" />
          <div :style="contentBoxStyle">
            <Skeleton :loading="true">
              <template #placeholder><SkeletonParagraph :rows="2" /></template>
              <p>Hi, Bytedance dance dance.</p>
              <p>Hi, Bytedance dance dance.</p>
            </Skeleton>
          </div>
        </Content>
      </Layout>
      <Footer :style="footerStyle">
        <span :style="{ display: 'flex', alignItems: 'center' }">
          <IconBytedanceLogo size="large" :style="{ marginRight: '8px' }" />
          <span>Copyright © 2023 ByteDance. All Rights Reserved. </span>
        </span>
        <span>
          <span :style="{ marginRight: '24px' }">平台客服</span>
          <span>反馈建议</span>
        </span>
      </Footer>
    </Layout>
  </DemoBlock>

  <DemoBlock title="侧边导航" desc="左侧通栏 Sider 放置带 logo 的垂直 Nav，右侧 Layout 内为 Header（仅 footer 区域的水平 Nav）、Content、Footer。">
    <Layout :style="{ border: '1px solid var(--semi-color-border)' }">
      <Sider :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
        <Nav
          :defaultSelectedKeys="['Home']"
          :style="{ maxWidth: '220px', height: '100%' }"
          :items="sideNavItems"
          :header="sideNavHeader"
          :footer="{ collapseButton: true }"
        />
      </Sider>
      <Layout>
        <Header :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
          <Nav mode="horizontal">
            <template #footer>
              <Button theme="borderless" :style="iconBtnStyle">
                <template #icon><IconBell size="large" /></template>
              </Button>
              <Button theme="borderless" :style="iconBtnStyle">
                <template #icon><IconHelpCircle size="large" /></template>
              </Button>
              <Avatar color="orange" size="small">YJ</Avatar>
            </template>
          </Nav>
        </Header>
        <Content :style="{ padding: '24px', backgroundColor: 'var(--semi-color-bg-0)' }">
          <Breadcrumb :style="{ marginBottom: '24px' }" :routes="routes" />
          <div :style="contentBoxStyle">
            <Skeleton :loading="true">
              <template #placeholder><SkeletonParagraph :rows="2" /></template>
              <p>Hi, Bytedance dance dance.</p>
              <p>Hi, Bytedance dance dance.</p>
            </Skeleton>
          </div>
        </Content>
        <Footer :style="footerStyle">
          <span :style="{ display: 'flex', alignItems: 'center' }">
            <IconBytedanceLogo size="large" :style="{ marginRight: '8px' }" />
            <span>Copyright © 2019 ByteDance. All Rights Reserved. </span>
          </span>
          <span>
            <span :style="{ marginRight: '24px' }">平台客服</span>
            <span>反馈建议</span>
          </span>
        </Footer>
      </Layout>
    </Layout>
  </DemoBlock>
</template>

<style scoped>
.components-layout-demo {
  text-align: center;
}
</style>
