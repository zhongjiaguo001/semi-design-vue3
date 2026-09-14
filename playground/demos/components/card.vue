<script setup lang="ts">
import { ref } from 'vue';
import {
  Card,
  CardGroup,
  CardMeta,
  Text,
  Title,
  Popover,
  Avatar,
  Space,
  Button,
  Row,
  Col,
  Switch,
  Skeleton,
  SkeletonTitle,
  SkeletonParagraph,
  SkeletonImage,
  SkeletonAvatar,
  Tabs,
  TabPane,
  Rating,
  Slider,
  IconInfoCircle,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Card, CardGroup, CardMeta } from 'semi-design-vue';
// CardMeta 也可通过 Card.Meta 访问`;

const desc =
  'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。';
const avatarSrc = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/card-meta-avatar-docs-demo.jpg';
const coverSrc = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/card-cover-docs-demo.jpeg';
const coverSrc2 = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/card-cover-docs-demo2.jpeg';

const metaBodyStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

const loading1 = ref(true);
const loading2 = ref(true);
const spacing = ref(12);
const groupCards = Array.from({ length: 8 }, (_, i) => i);
const gridCards = Array.from({ length: 7 }, (_, i) => i);

const onLoading1Change = (v: boolean) => {
  loading1.value = !v;
};
const onLoading2Change = (v: boolean) => {
  loading2.value = !v;
};
const onSpacingChange = (v: number | number[]) => {
  spacing.value = Array.isArray(v) ? v[0] : v;
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基础卡片" desc="基础卡片包含标题、内容等部分。">
    <Card title="Semi Design" :style="{ maxWidth: '360px' }">
      <template #headerExtraContent>
        <Text link>更多</Text>
      </template>
      {{ desc }}
    </Card>
  </DemoBlock>

  <DemoBlock title="简洁卡片" desc="卡片可以只设置内容区域。">
    <div>
      <Card :style="{ maxWidth: '360px' }">Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。</Card>
      <br />
      <Card :style="{ maxWidth: '360px' }" :bodyStyle="metaBodyStyle">
        <CardMeta title="Semi Doc">
          <template #avatar>
            <Avatar alt="Card meta img" size="default" :src="avatarSrc" />
          </template>
        </CardMeta>
        <Popover position="top" showArrow>
          <template #content>
            <article style="padding: 6px">这是一个 Card</article>
          </template>
          <IconInfoCircle style="color: var(--semi-color-primary)" />
        </Popover>
      </Card>
    </div>
  </DemoBlock>

  <DemoBlock title="封面" desc="可以使用 cover 属性（或 cover 插槽）设置封面。">
    <Card :style="{ maxWidth: '300px' }">
      <template #cover>
        <img alt="example" :src="coverSrc2" />
      </template>
      <CardMeta title="卡片封面" />
    </Card>
  </DemoBlock>

  <DemoBlock
    title="边线和外边框"
    desc="bordered 设置卡片是否有外边框（默认 true）；headerLine 设置内容区和标题区是否有边线，footerLine 设置内容区和页尾区是否有边线。"
  >
    <div style="display: inline-block; padding: 20px; background-color: var(--semi-color-fill-0)">
      <Card :style="{ maxWidth: '360px' }" :bordered="false" :headerLine="true" title="Semi Design">
        {{ desc }}
      </Card>
    </div>
  </DemoBlock>

  <DemoBlock title="阴影" desc="shadows 设置显示阴影的时机：hover（hover 时显示阴影）、always（始终显示阴影），不设置则没有阴影。">
    <div>
      <Card shadows="hover" :style="{ maxWidth: '360px' }" :bodyStyle="metaBodyStyle">
        <CardMeta title="Semi Doc">
          <template #avatar>
            <Avatar alt="Card meta img" size="default" :src="avatarSrc" />
          </template>
        </CardMeta>
        <Popover position="top" showArrow>
          <template #content>
            <article style="padding: 6px">这是一个 Card</article>
          </template>
          <IconInfoCircle style="color: var(--semi-color-primary)" />
        </Popover>
      </Card>
      <br />
      <Card shadows="always" :style="{ maxWidth: '360px' }" :bodyStyle="metaBodyStyle">
        <CardMeta title="Semi Doc">
          <template #avatar>
            <Avatar alt="Card meta img" size="default" :src="avatarSrc" />
          </template>
        </CardMeta>
        <Popover position="top" showArrow>
          <template #content>
            <article style="padding: 6px">这是一个 Card</article>
          </template>
          <IconInfoCircle style="color: var(--semi-color-primary)" />
        </Popover>
      </Card>
    </div>
  </DemoBlock>

  <DemoBlock title="更灵活的内容展示" desc="可以利用 Card.Meta 支持更灵活的内容，允许设置 title、avatar、description。">
    <Card :style="{ maxWidth: '340px' }" :footerLine="true" :footerStyle="{ display: 'flex', justifyContent: 'flex-end' }">
      <template #title>
        <CardMeta title="Semi Doc" description="全面、易用、优质">
          <template #avatar>
            <Avatar alt="Card meta img" size="default" :src="avatarSrc" />
          </template>
        </CardMeta>
      </template>
      <template #headerExtraContent>
        <Text link>More</Text>
      </template>
      <template #cover>
        <img alt="example" :src="coverSrc" />
      </template>
      <template #footer>
        <Space>
          <Button theme="borderless" type="primary">精选案例</Button>
          <Button theme="solid" type="primary">开始使用</Button>
        </Space>
      </template>
      Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。
    </Card>
  </DemoBlock>

  <DemoBlock title="内部卡片" desc="卡片内部可以嵌套其他卡片。">
    <Card title="Card title">
      <Card title="Inner Card title" :style="{ marginBottom: '20px' }">
        <template #headerExtraContent>
          <Text link>More</Text>
        </template>
        Inner Card content
      </Card>
      <Card title="Inner Card title">
        <template #headerExtraContent>
          <Text link>More</Text>
        </template>
        Inner Card content
      </Card>
    </Card>
  </DemoBlock>

  <DemoBlock title="栅格卡片" desc="在系统概览页面常常和栅格进行配合。">
    <div style="background-color: var(--semi-color-fill-0); padding: 20px">
      <Row :gutter="[16, 16]">
        <Col :span="8"><Card title="Card Title" :bordered="false">Card Content</Card></Col>
        <Col :span="8"><Card title="Card Title" :bordered="false">Card Content</Card></Col>
        <Col :span="8"><Card title="Card Title" :bordered="false">Card Content</Card></Col>
      </Row>
      <Row :gutter="[16, 16]">
        <Col :span="16"><Card title="Card Title" :bordered="false">Card Content</Card></Col>
        <Col :span="8"><Card title="Card Title" :bordered="false">Card Content</Card></Col>
      </Row>
    </div>
  </DemoBlock>

  <DemoBlock title="内置预加载" desc="使用 Card 的 loading 属性设置卡片内容区是否显示占位元素。">
    <div>
      <Switch @change="onLoading1Change" />
      <br />
      <br />
      <Card :style="{ maxWidth: '360px' }" :loading="loading1">
        <CardMeta title="Semi Doc" description="全面、易用、优质" />
      </Card>
    </div>
  </DemoBlock>

  <DemoBlock
    title="更丰富的预加载效果"
    desc="Card 自带的 loading 只作用于内容区；想为其他部分或自定义更丰富的预加载效果，可以结合 Skeleton 组件实现。"
  >
    <div>
      <Switch @change="onLoading2Change" />
      <br />
      <br />
      <Card :style="{ maxWidth: '300px' }">
        <template #title>
          <CardMeta>
            <template #title>
              <Skeleton :style="{ width: '80px' }" :loading="loading2">
                <template #placeholder><SkeletonTitle /></template>
                <Title :heading="5">Semi Doc</Title>
              </Skeleton>
            </template>
            <template #description>
              <Skeleton :style="{ width: '150px', marginTop: '12px' }" :loading="loading2">
                <template #placeholder><SkeletonParagraph :rows="1" /></template>
                <Text>全面、易用、优质</Text>
              </Skeleton>
            </template>
            <template #avatar>
              <Skeleton :loading="loading2">
                <template #placeholder><SkeletonAvatar /></template>
                <Avatar alt="Card meta img" size="default" :src="avatarSrc" />
              </Skeleton>
            </template>
          </CardMeta>
        </template>
        <template #headerExtraContent>
          <Skeleton :style="{ width: '50px' }" :loading="loading2">
            <template #placeholder><SkeletonParagraph :rows="1" /></template>
            <Text link>More</Text>
          </Skeleton>
        </template>
        <template #cover>
          <Skeleton :style="{ maxWidth: '100%', height: '220px' }" :loading="loading2">
            <template #placeholder><SkeletonImage /></template>
            <img alt="example" :src="coverSrc" />
          </Skeleton>
        </template>
      </Card>
    </div>
  </DemoBlock>

  <DemoBlock title="带页签的卡片" desc="可以结合 Tabs 组件，实现带页签的卡片。">
    <Card title="Card title">
      <Tabs type="line" :style="{ marginTop: '-20px', marginBottom: '-20px' }">
        <TabPane tab="Tab 1" itemKey="1">
          <p>content1</p>
          <p>content1</p>
          <p>content1</p>
        </TabPane>
        <TabPane tab="Tab 2" itemKey="2">
          <p>content2</p>
          <p>content2</p>
          <p>content2</p>
        </TabPane>
      </Tabs>
    </Card>
  </DemoBlock>

  <DemoBlock title="卡片操作区" desc="actions 接收节点数组（或使用 actions 插槽），元素间以 12px 的水平间距展示于内容区底部。">
    <Card :style="{ maxWidth: '300px' }" :headerLine="false">
      <template #cover>
        <img alt="example" :src="coverSrc" />
      </template>
      <template #actions>
        <Rating size="small" :defaultValue="4" />
      </template>
      <CardMeta title="Semi Doc" description="全面、易用、优质" />
    </Card>
  </DemoBlock>

  <DemoBlock title="卡片组" desc="CardGroup 中的卡片将呈现为等间距排列，利用 spacing 属性可以设置卡片间距大小。">
    <div>
      <Text>滑动调节 Card 间距</Text>
      <Slider :defaultValue="12" :max="40" :min="10" :style="{ width: '360px' }" @change="onSpacingChange" />
      <br />
      <CardGroup :spacing="spacing">
        <Card v-for="idx in groupCards" :key="idx" shadows="hover" title="Card title" :headerLine="false" :style="{ width: '260px' }">
          <template #headerExtraContent>
            <Text link>More</Text>
          </template>
          <Text>Card content</Text>
        </Card>
      </CardGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="网格型卡片组" desc="使用 CardGroup 的 type 属性，可以将卡片组设置为网格型。">
    <CardGroup type="grid">
      <Card v-for="idx in gridCards" :key="idx" shadows="hover" title="Card title" :headerLine="false" :style="{ width: '260px' }">
        <template #headerExtraContent>
          <Text link>More</Text>
        </template>
        <Text>Card content</Text>
      </Card>
    </CardGroup>
  </DemoBlock>
</template>
