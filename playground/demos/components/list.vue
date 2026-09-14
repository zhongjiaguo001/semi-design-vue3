<script setup lang="ts">
import { h, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  List,
  ListItem,
  Avatar,
  Button,
  ButtonGroup,
  Descriptions,
  Rating,
  Skeleton,
  SkeletonAvatar,
  SkeletonTitle,
  SkeletonParagraph,
  Spin,
  Pagination,
  Input,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  IconSearch,
  IconMinusCircle,
  IconPlusCircle,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { List, ListItem } from 'semi-design-vue';
// ListItem 也可通过 List.Item 访问`;

const semiDesc =
  'Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。';

// 基本用法
const basicData = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];
const renderBasic = (item: string) => h(ListItem, null, () => item);

// 模板用法
const pStyle = { color: 'var(--semi-color-text-2)', margin: '4px 0' };
const contentData = [
  h(
    'p',
    { style: { ...pStyle, width: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
    'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。'
  ),
  h(
    'p',
    { style: { ...pStyle, width: '500px' } },
    'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。'
  ),
  h('p', { style: { ...pStyle, width: '500px' } }, 'Semi Design 以用户中心、内容优先、设计人性化的设计系统，打造一致、好看、好用、高效的用户体验。'),
];
const renderContent = (item: any) =>
  h(ListItem, null, {
    header: () => h(Avatar, { color: 'blue' }, () => 'SE'),
    main: () => h('div', [h('span', { style: { color: 'var(--semi-color-text-0)', fontWeight: 500 } }, '示例标题'), item]),
    extra: () => h(ButtonGroup, { theme: 'borderless' }, () => [h(Button, null, () => '编辑'), h(Button, null, () => '更多')]),
  });

// 布局
const layoutData = [
  { title: 'Semi Design Title 1', color: 'light-blue' },
  { title: 'Semi Design Title 2', color: 'grey' },
  { title: 'Semi Design Title 3', color: 'light-green' },
];
const renderTitleItem = (item: { title: string; color: string }) =>
  h(ListItem, null, {
    header: () => h(Avatar, { color: item.color }, () => 'SE'),
    main: () => h('div', [h('span', { style: { color: 'var(--semi-color-text-0)', fontWeight: 500 } }, item.title), h('p', { style: pStyle }, semiDesc)]),
  });

// 栅格列表
const gridData = [
  { title: 'Semi UI', rating: 4.5, feedbacks: 124 },
  { title: 'Semi DSM', rating: 4, feedbacks: 108 },
  { title: 'Semi D2C', rating: 4.5, feedbacks: 244 },
];
const gridStyle = {
  border: '1px solid var(--semi-color-border)',
  backgroundColor: 'var(--semi-color-bg-2)',
  borderRadius: '3px',
  paddingLeft: '20px',
};
const responsiveStyle = { ...gridStyle, margin: '8px 2px' };
const renderGridItem = (style: Record<string, string>) => (item: { title: string; rating?: number; feedbacks: number }) =>
  h(ListItem, { style }, () =>
    h('div', [
      h('h3', { style: { color: 'var(--semi-color-text-0)', fontWeight: 500 } }, item.title),
      h(Descriptions, {
        align: 'center',
        size: 'small',
        row: true,
        data: [
          { key: '满意度', value: () => h(Rating, { allowHalf: true, size: 'small', value: item.rating }) },
          { key: '反馈数', value: item.feedbacks },
        ],
      }),
      h('div', { style: { margin: '12px 0', display: 'flex', justifyContent: 'flex-end' } }, [
        h(ButtonGroup, { theme: 'borderless', style: { marginTop: '8px' } }, () => [h(Button, null, () => '编辑'), h(Button, null, () => '更多')]),
      ]),
    ])
  );
const renderGrid = renderGridItem(gridStyle);
const renderResponsive = renderGridItem(responsiveStyle);

// 响应式的栅格列表
const responsiveData = [
  { title: '审核管理平台', rating: 4.5, feedbacks: 124 },
  { title: '扁鹊', rating: 4, feedbacks: 108 },
  { title: '直播审核平台', rating: 3.5, feedbacks: 244 },
  { title: '抖音安全测试', feedbacks: 189 },
  { title: '内容平台', rating: 3, feedbacks: 128 },
  { title: '策略平台', rating: 4, feedbacks: 156 },
];

// 加载更多
type LoadItem = { color?: string; title?: string; loading: boolean };
const loadMoreCount = 3;
const loadMoreAll: LoadItem[] = Array.from({ length: 40 }, (_e, i) => ({ color: 'grey', title: `Semi Design Title ${i}`, loading: false }));
const loadMorePage = ref(0);
const loadMoreLoading = ref(false);
const loadMoreList = ref<LoadItem[]>([]);
const loadMoreNoMore = ref(false);
let loadMoreData: LoadItem[] = [];
const fetchLoadMore = () => {
  const placeholders: LoadItem[] = [0, 1, 2].map(() => ({ loading: true }));
  loadMoreLoading.value = true;
  loadMoreList.value = [...loadMoreList.value, ...placeholders];
  return new Promise<LoadItem[]>((res) => {
    setTimeout(() => {
      res(loadMoreAll.slice(loadMorePage.value * loadMoreCount, loadMorePage.value * loadMoreCount + loadMoreCount));
    }, 1000);
  }).then((newData) => {
    loadMoreData = [...loadMoreData, ...newData];
    loadMoreLoading.value = false;
    loadMoreList.value = loadMoreData;
    loadMoreNoMore.value = !newData.length;
  });
};
const onLoadMore = () => {
  loadMorePage.value++;
  fetchLoadMore();
};
const showLoadMoreBtn = computed(() => !loadMoreLoading.value && !loadMoreNoMore.value);
const skeletonPlaceholder = () =>
  h('div', { style: { display: 'flex', alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid var(--semi-color-border)' } }, [
    h(SkeletonAvatar, { style: { marginRight: '12px' } }),
    h('div', [
      h(SkeletonTitle, { style: { width: '120px', marginBottom: '12px', marginTop: '12px' } }),
      h(SkeletonParagraph, { style: { width: '600px' }, rows: 2 }),
    ]),
  ]);
const renderLoadMoreItem = (item: LoadItem) =>
  h(Skeleton, { loading: item.loading }, { placeholder: skeletonPlaceholder, default: () => renderTitleItem(item as any) });

// 滚动加载
const scrollCount = 5;
const scrollAll = Array.from({ length: 100 }, (_e, i) => ({ color: 'grey', title: `Semi Design Title ${i}`, loading: false }));
const scrollPage = ref(0);
const scrollLoading = ref(false);
const scrollData = ref<typeof scrollAll>([]);
const scrollHasMore = ref(true);
const scrollContainer = ref<HTMLElement | null>(null);
const fetchScroll = () => {
  scrollLoading.value = true;
  return new Promise<typeof scrollAll>((res) => {
    setTimeout(() => {
      res(scrollAll.slice(scrollPage.value * scrollCount, scrollPage.value * scrollCount + scrollCount));
    }, 1000);
  }).then((newData) => {
    scrollData.value = [...scrollData.value, ...newData];
    scrollPage.value++;
    scrollLoading.value = false;
    scrollHasMore.value = !!newData.length;
  });
};
const showScrollLoadMore = computed(() => scrollPage.value % 4 === 0);
const showScrollLoadMoreBtn = computed(() => !scrollLoading.value && scrollHasMore.value && showScrollLoadMore.value);
const onScrollContainer = () => {
  const el = scrollContainer.value;
  if (!el) return;
  const canAutoLoad = !scrollLoading.value && scrollHasMore.value && !showScrollLoadMore.value;
  if (canAutoLoad && el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
    fetchScroll();
  }
};

// 滚动加载无限长列表 (simple virtualized window on top of List)
const virtualAll = Array.from({ length: 50 }, (_e, i) => ({ color: 'grey', title: `Semi Design Title ${i}` }));
const virtualRowHeight = 118;
const virtualHeight = 500;
const virtualScrollTop = ref(0);
const virtualContainer = ref<HTMLElement | null>(null);
const virtualLoaded = ref<Record<number, 0 | 1>>({});
const virtualData = ref<Record<number, { color: string; title: string }>>({});
const virtualLoadingCount = ref(0);
const fetchVirtual = (startIndex: number, stopIndex: number) =>
  new Promise<void>((res) => {
    setTimeout(() => {
      for (let i = startIndex; i <= stopIndex; i++) {
        virtualData.value[i] = virtualAll[i];
        virtualLoaded.value[i] = 1;
      }
      virtualLoadingCount.value -= stopIndex - startIndex + 1;
      res();
    }, 1000);
  });
const loadVirtualRows = (startIndex: number, stopIndex: number) => {
  stopIndex = Math.min(stopIndex, virtualAll.length - 1);
  const missing: number[] = [];
  for (let i = startIndex; i <= stopIndex; i++) if (virtualLoaded.value[i] === undefined) missing.push(i);
  if (!missing.length || virtualLoadingCount.value > 0) return;
  const s = missing[0];
  const e = missing[missing.length - 1];
  for (let i = s; i <= e; i++) virtualLoaded.value[i] = 0;
  virtualLoadingCount.value += e - s + 1;
  fetchVirtual(s, e);
};
const virtualRange = computed(() => {
  const start = Math.max(0, Math.floor(virtualScrollTop.value / virtualRowHeight) - 2);
  const end = Math.min(virtualAll.length - 1, Math.ceil((virtualScrollTop.value + virtualHeight) / virtualRowHeight) + 2);
  return { start, end };
});
const virtualRows = computed(() => {
  const rows: number[] = [];
  for (let i = virtualRange.value.start; i <= virtualRange.value.end; i++) rows.push(i);
  return rows;
});
const onVirtualScroll = () => {
  const el = virtualContainer.value;
  if (!el) return;
  virtualScrollTop.value = el.scrollTop;
  loadVirtualRows(virtualRange.value.start, virtualRange.value.end);
};

// 拖拽排序 (native HTML5 drag & drop instead of dnd-kit)
const dragData = [
  { id: 1, title: 'Semi Design Title 1', color: 'red' },
  { id: 2, title: 'Semi Design Title 2', color: 'grey' },
  { id: 3, title: 'Semi Design Title 3', color: 'light-green' },
  { id: 4, title: 'Semi Design Title 4', color: 'light-blue' },
  { id: 5, title: 'Semi Design Title 5', color: 'pink' },
];
const dragItems = ref([...dragData]);
const draggingId = ref<number | null>(null);
const overId = ref<number | null>(null);
const arrayMove = <T,>(arr: T[], from: number, to: number) => {
  const copy = arr.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
};
const onDragStart = (id: number, e: DragEvent) => {
  draggingId.value = id;
  e.dataTransfer?.setData('text/plain', String(id));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
};
const onDragOver = (id: number, e: DragEvent) => {
  e.preventDefault();
  overId.value = id;
};
const onDrop = (id: number) => {
  const active = draggingId.value;
  if (active !== null && active !== id) {
    const oldIndex = dragItems.value.findIndex((i) => i.id === active);
    const newIndex = dragItems.value.findIndex((i) => i.id === id);
    dragItems.value = arrayMove(dragItems.value, oldIndex, newIndex);
  }
  draggingId.value = null;
  overId.value = null;
};
const onDragEnd = () => {
  draggingId.value = null;
  overId.value = null;
};
const renderDraggable = (item: { id: number; title: string; color: string }) =>
  h(
    'div',
    {
      key: item.id,
      draggable: true,
      class: { isDragging: draggingId.value === item.id, isOver: overId.value === item.id },
      style: {
        border: '1px solid var(--semi-color-border)',
        marginBottom: '12px',
        cursor: 'grabbing',
        ...(draggingId.value === item.id ? { zIndex: 999, position: 'relative', backgroundColor: 'var(--semi-color-bg-0)', opacity: 0.6 } : {}),
      },
      onDragstart: (e: DragEvent) => onDragStart(item.id, e),
      onDragover: (e: DragEvent) => onDragOver(item.id, e),
      onDrop: () => onDrop(item.id),
      onDragend: onDragEnd,
    },
    [renderTitleItem(item)]
  );

// 书单数据
const books = [
  '围城',
  '平凡的世界（全三册）',
  '三体（全集）',
  '雪中悍刀行（全集）',
  '撒哈拉的故事',
  '明朝那些事',
  '一禅小和尚',
  '沙丘',
  '被讨厌的勇气',
  '罪与罚',
  '月亮与六便士',
  '沉默的大多数',
  '第一人称单数',
];
const renderBook = (item: string) => h(ListItem, { class: 'list-item' }, () => item);

// 带分页器
const pageBooks = books.slice(0, 12);
const page = ref(1);
const pageSize = 4;
const pagedBooks = computed(() => pageBooks.slice((page.value - 1) * pageSize, page.value * pageSize));

// 带筛选器
const filterBooks = books.slice(0, 10);
const filterList = ref([...filterBooks]);
const onSearch = (str?: string) => {
  filterList.value = str ? filterBooks.filter((item) => item.includes(str)) : filterBooks;
};
const renderSearchHeader = () =>
  h(Input, {
    placeholder: '搜索',
    prefix: () => h(IconSearch),
    onCompositionEnd: (e: any) => onSearch(e.target.value),
    onChange: (v: string) => (!v ? onSearch() : null),
    onInput: (e: any) => onSearch(e.target?.value),
  });

// 添加删除项
const addList = ref(books.slice(0, 8));
const updateList = (item?: string) => {
  if (item) {
    addList.value = addList.value.filter((i) => i !== item);
  } else {
    addList.value = addList.value.concat(books.slice(addList.value.length, addList.value.length + 1));
  }
};
const renderRemovable = (item: string) =>
  h('div', { style: { margin: '4px' }, class: 'list-item' }, [
    h(Button, {
      type: 'danger',
      theme: 'borderless',
      icon: () => h(IconMinusCircle),
      style: { marginRight: '4px' },
      onClick: () => updateList(item),
    }),
    item,
  ]);

// 单选或多选
const selectPageSize = 8;
const selectPage = ref(1);
const selectBooks = computed(() => books.slice((selectPage.value - 1) * selectPageSize, selectPage.value * selectPageSize));
const checkboxVal = ref<string[]>([books[0]]);
const radioVal = ref<string>(books[0]);
const renderCheckItem = (item: string) => h(ListItem, { class: 'list-item' }, () => h(Checkbox, { value: item }, () => item));
const renderRadioItem = (item: string) => h(ListItem, { class: 'list-item' }, () => h(Radio, { value: item }, () => item));

// 响应键盘事件
const keyList = ref(books.slice(0, 10));
const hoverIndex = ref(-1);
const changeIndex = (offset: number) => {
  let index = hoverIndex.value + offset;
  if (index < 0) index = keyList.value.length - 1;
  if (index >= keyList.value.length) index = 0;
  hoverIndex.value = index;
};
const keydownHandler = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      changeIndex(-1);
      break;
    case 'ArrowDown':
      event.preventDefault();
      changeIndex(1);
      break;
    default:
      break;
  }
};
const renderKeyItem = (item: string, index: number) =>
  h(ListItem, { class: index === hoverIndex.value ? 'component-list-demo-booklist-active-item' : '' }, () => item);

onMounted(() => {
  fetchLoadMore();
  fetchScroll();
  loadVirtualRows(0, Math.ceil(virtualHeight / virtualRowHeight) + 2);
  window.addEventListener('keydown', keydownHandler);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', keydownHandler);
});
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="列表的基本用法。可以通过 size 设置尺寸，支持 large, default, small。可设置 header 和 footer，来自定义列表头部和尾部。">
    <div>
      <div :style="{ marginRight: '16px' }">
        <h3 :style="{ marginBottom: '16px' }">Default Size</h3>
        <List bordered :dataSource="basicData" :renderItem="renderBasic">
          <template #header><div>Header</div></template>
          <template #footer><div>Footer</div></template>
        </List>
      </div>
      <div :style="{ marginRight: '16px' }">
        <h3 :style="{ margin: '16px 0' }">Small Size</h3>
        <List size="small" bordered :dataSource="basicData" :renderItem="renderBasic">
          <template #header><div>Header</div></template>
          <template #footer><div>Footer</div></template>
        </List>
      </div>
      <div :style="{ marginRight: '16px' }">
        <h3 :style="{ margin: '16px 0' }">Large Size</h3>
        <List size="large" bordered :dataSource="basicData" :renderItem="renderBasic">
          <template #header><div>Header</div></template>
          <template #footer><div>Footer</div></template>
        </List>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="模板用法"
    desc="List.Item 内置了简单的结构包含：header，main 和 extra。其中 header 和 main 的对齐方式可以通过 align 属性设置，支持 flex-start（默认）, flex-end, center, baseline 和 stretch。"
  >
    <div :style="{ padding: '12px', border: '1px solid var(--semi-color-border)', margin: '12px' }">
      <List :dataSource="contentData" :renderItem="renderContent" />
    </div>
  </DemoBlock>

  <DemoBlock title="布局" desc="通过 layout 属性可以设置列表的布局，支持 vertical（默认）和 horizontal。">
    <div :style="{ padding: '12px', border: '1px solid var(--semi-color-border)', margin: '12px' }">
      <List :dataSource="layoutData" layout="horizontal" :renderItem="renderTitleItem" />
    </div>
  </DemoBlock>

  <DemoBlock title="栅格列表" desc="通过 grid 属性可以实现栅格列表，span 可设置每项的占格数，gutter 可设置栅格间隔。">
    <div>
      <List :grid="{ gutter: 12, span: 6 }" :dataSource="gridData" :renderItem="renderGrid" />
    </div>
  </DemoBlock>

  <DemoBlock title="响应式的栅格列表" desc="响应式的栅格列表。响应尺寸与 Grid 保持一致。">
    <div>
      <List :grid="{ gutter: 12, xs: 0, sm: 0, md: 12, lg: 8, xl: 8, xxl: 6 }" :dataSource="responsiveData" :renderItem="renderResponsive" />
    </div>
  </DemoBlock>

  <DemoBlock title="加载更多" desc="可通过 loadMore 属性实现加载更多的功能。">
    <List :loading="loadMoreLoading" :dataSource="loadMoreList" :renderItem="renderLoadMoreItem">
      <template v-if="showLoadMoreBtn" #loadMore>
        <div :style="{ textAlign: 'center', marginTop: '12px', height: '32px', lineHeight: '32px' }">
          <Button @click="onLoadMore">显示更多</Button>
        </div>
      </template>
    </List>
  </DemoBlock>

  <DemoBlock
    title="滚动加载"
    desc="官方示例集成 react-infinite-scroller；这里用容器 scroll 事件实现同样的交互：三次滚动加载后出现 load more 按钮。"
  >
    <div
      ref="scrollContainer"
      class="light-scrollbar"
      :style="{ height: '420px', overflow: 'auto', border: '1px solid var(--semi-color-border)', padding: '10px' }"
      @scroll="onScrollContainer"
    >
      <List :dataSource="scrollData" :renderItem="renderTitleItem">
        <template v-if="showScrollLoadMoreBtn" #loadMore>
          <div :style="{ textAlign: 'center', marginTop: '12px', height: '32px', lineHeight: '32px' }">
            <Button @click="fetchScroll">显示更多</Button>
          </div>
        </template>
      </List>
      <div v-if="scrollLoading && scrollHasMore" :style="{ textAlign: 'center' }">
        <Spin />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock
    title="滚动加载无限长列表"
    desc="官方示例集成 react-virtualized；这里用一个简单的固定行高虚拟滚动窗口实现：只渲染可视区域的行，滚动到未加载区域时异步加载数据。"
  >
    <List :style="{ border: '1px solid var(--semi-color-border)', padding: '10px' }">
      <div ref="virtualContainer" :style="{ height: virtualHeight + 'px', overflow: 'auto', position: 'relative' }" @scroll="onVirtualScroll">
        <div :style="{ height: virtualAll.length * virtualRowHeight + 'px', position: 'relative' }">
          <template v-for="index in virtualRows" :key="index">
            <ListItem
              v-if="virtualData[index]"
              :style="{ position: 'absolute', top: index * virtualRowHeight + 'px', left: 0, right: 0, height: virtualRowHeight + 'px', boxSizing: 'border-box' }"
            >
              <template #header><Avatar :color="virtualData[index].color">SE</Avatar></template>
              <template #main>
                <div>
                  <span :style="{ color: 'var(--semi-color-text-0)', fontWeight: 500 }">{{ virtualData[index].title }}</span>
                  <p :style="{ color: 'var(--semi-color-text-2)', margin: '4px 0' }">{{ semiDesc }}</p>
                </div>
              </template>
            </ListItem>
            <div
              v-else
              :style="{ position: 'absolute', top: index * virtualRowHeight + 'px', left: 0, right: 0, height: virtualRowHeight + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
            >
              <Spin />
            </div>
          </template>
        </div>
      </div>
    </List>
  </DemoBlock>

  <DemoBlock title="拖拽排序" desc="官方示例使用 dnd-kit；这里使用原生 HTML5 拖拽实现同样的排序效果，拖动列表项到目标位置即可交换顺序。">
    <div :style="{ padding: '12px', border: '1px solid var(--semi-color-border)', margin: '12px' }">
      <List :dataSource="dragItems" :renderItem="renderDraggable" />
    </div>
  </DemoBlock>

  <DemoBlock title="带分页器" desc="你可以组合使用 Pagination，实现一个分页的 List">
    <div>
      <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap' }">
        <List
          :dataSource="pagedBooks"
          :split="false"
          size="small"
          class="component-list-demo-booklist"
          :style="{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }"
          :renderItem="renderBook"
        />
        <Pagination
          size="small"
          :style="{ width: '100%', flexBasis: '100%', justifyContent: 'center' }"
          :pageSize="pageSize"
          :total="pageBooks.length"
          :currentPage="page"
          @change="(cPage: number) => (page = cPage)"
        />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="带筛选器" desc="你可以通过组装 Input 使用，实现对 List 列表的筛选">
    <div>
      <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap', border: '1px solid var(--semi-color-border)' }">
        <List
          class="component-list-demo-booklist"
          :dataSource="filterList"
          :split="false"
          :header="renderSearchHeader"
          size="small"
          :style="{ flexBasis: '100%', flexShrink: 0, borderBottom: '1px solid var(--semi-color-border)' }"
          :renderItem="renderBook"
        />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="添加删除项" desc="通过操作 dataSource 实现列表项的增删">
    <div>
      <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap', border: '1px solid var(--semi-color-border)' }">
        <List
          class="component-list-demo-booklist"
          :dataSource="addList"
          :split="false"
          size="small"
          :style="{ flexBasis: '100%', flexShrink: 0, borderBottom: '1px solid var(--semi-color-border)' }"
          :renderItem="renderRemovable"
        />
        <div :style="{ margin: '4px', fontSize: '14px' }" @click="updateList()">
          <Button theme="borderless" :icon="IconPlusCircle" :style="{ marginRight: '4px', color: 'var(--semi-color-info)' }" />
          新增书籍
        </div>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="单选或多选" desc="你可以通过组合使用 Radio 或 Checkbox 将 List 增强为一个列表选择器">
    <div :style="{ display: 'flex' }">
      <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap' }">
        <CheckboxGroup v-model="checkboxVal">
          <List
            :dataSource="selectBooks"
            class="component-list-demo-booklist"
            :split="false"
            size="small"
            :style="{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }"
            :renderItem="renderCheckItem"
          />
        </CheckboxGroup>
      </div>
      <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap' }">
        <RadioGroup v-model="radioVal">
          <List
            class="component-list-demo-booklist"
            :dataSource="selectBooks"
            :split="false"
            size="small"
            :style="{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }"
            :renderItem="renderRadioItem"
          />
        </RadioGroup>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="响应键盘事件" desc="你可以自行监听对应按键的键盘事件，实现不同 Item 的选择。如下面这个例子，可以使用上下方向键选择不同 Item">
    <div>
      <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap', border: '1px solid var(--semi-color-border)' }">
        <List
          class="component-list-demo-booklist"
          :dataSource="keyList"
          :split="false"
          size="small"
          :style="{ flexBasis: '100%', flexShrink: 0, borderBottom: '1px solid var(--semi-color-border)' }"
          :renderItem="renderKeyItem"
        />
      </div>
    </div>
  </DemoBlock>
</template>

<style>
.component-list-demo-booklist .list-item:hover {
  background-color: var(--semi-color-fill-0);
}
.component-list-demo-booklist .list-item:active {
  background-color: var(--semi-color-fill-1);
}
.component-list-demo-booklist-active-item {
  background-color: var(--semi-color-fill-0);
}
</style>
