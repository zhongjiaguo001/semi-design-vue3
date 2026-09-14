<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref } from 'vue';
import {
  Avatar,
  Button,
  Column,
  Descriptions,
  Input,
  Pagination,
  RadioGroup,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  IconCaretup,
  IconCaretdown,
  IconChevronDown,
  IconChevronRight,
  IconClear,
  IconComment,
  IconFilter,
  IconMore,
  IconTickCircle,
} from '@/index';
import DemoBlock from '../DemoBlock.vue';

const FIGMA = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/figma-icon.png';
const DOCS = 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/docs-icon.png';
const DAY = 24 * 60 * 60 * 1000;

type FileRow = {
  key: string;
  name: string;
  nameIconSrc: string;
  size: number | string;
  owner: string;
  status?: string;
  updateTime: number | string;
  avatarBg: string;
  address?: string;
};

const fileData: FileRow[] = [
  { key: '1', name: 'Semi Design 设计稿.fig', nameIconSrc: FIGMA, size: '2M', owner: '姜鹏志', status: 'success', updateTime: '2020-02-02 05:13', avatarBg: 'grey', address: '北京朝阳区芍药居' },
  { key: '2', name: 'Semi Design 分享演示文稿', nameIconSrc: DOCS, size: '2M', owner: '郝宣', status: 'pending', updateTime: '2020-01-17 05:31', avatarBg: 'red', address: '北京海淀区西二旗' },
  { key: '3', name: '设计文档', nameIconSrc: DOCS, size: '34KB', owner: 'Zoey Edwards', status: 'wait', updateTime: '2020-01-26 11:01', avatarBg: 'light-blue', address: '北京东城区东直门' },
  { key: '4', name: 'Semi D2C 设计稿.fig', nameIconSrc: FIGMA, size: '2M', owner: '姜鹏志', status: 'wait', updateTime: '2020-02-02 05:13', avatarBg: 'grey' },
  { key: '5', name: 'Semi D2C 分享演示文稿', nameIconSrc: DOCS, size: '2M', owner: '郝宣', status: 'pending', updateTime: '2020-01-17 05:31', avatarBg: 'red' },
  { key: '6', name: 'Semi D2C 设计文档', nameIconSrc: DOCS, size: '34KB', owner: 'Zoey Edwards', status: 'success', updateTime: '2020-01-26 11:01', avatarBg: 'light-blue' },
];

const statusMap: Record<string, { color: string; icon: any; text: string }> = {
  success: { color: 'green', icon: IconTickCircle, text: '已交付' },
  pending: { color: 'pink', icon: IconClear, text: '已延期' },
  wait: { color: 'cyan', icon: IconComment, text: '待评审' },
};

const renderName = (text: any, record: FileRow) =>
  h('div', { style: { display: 'flex', alignItems: 'center' } }, [
    h(Avatar, { size: 'small', shape: 'square', src: record.nameIconSrc || FIGMA, style: { marginRight: '12px' } }),
    text,
  ]);
const renderOwner = (text: any, record: FileRow) =>
  h('div', { style: { display: 'flex', alignItems: 'center' } }, [
    h(Avatar, { size: 'small', color: record.avatarBg as any, style: { marginRight: '4px' } }, () => (typeof text === 'string' ? text.slice(0, 1) : '')),
    text,
  ]);
const renderStatus = (text: any) => {
  const cfg = statusMap[text] || statusMap.wait;
  return h(Tag, { shape: 'circle', color: cfg.color as any, prefixIcon: h(cfg.icon), style: { userSelect: 'text' } }, () => cfg.text);
};
const renderOperate = () => h(IconMore);
const fmtDate = (value: any) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value ?? '');
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function makeFiles(n: number, start = 0): FileRow[] {
  return Array.from({ length: n }, (_, i) => {
    const idx = start + i;
    const isSemi = idx % 2 === 0;
    const size = (idx * 1000) % 199;
    return {
      key: String(idx),
      name: isSemi ? `Semi Design 设计稿${idx}.fig` : `Semi D2C 设计稿${idx}.fig`,
      nameIconSrc: FIGMA,
      owner: isSemi ? '姜鹏志' : '郝宣',
      size,
      status: isSemi ? 'success' : 'wait',
      updateTime: Date.now() + size * DAY,
      avatarBg: isSemi ? 'grey' : 'red',
    };
  });
}

const basicColumns = [
  { title: '标题', dataIndex: 'name', render: renderName, width: 280 },
  { title: '大小', dataIndex: 'size' },
  { title: '交付状态', dataIndex: 'status', render: renderStatus },
  { title: '所有者', dataIndex: 'owner', render: renderOwner },
  { title: '更新日期', dataIndex: 'updateTime' },
  { title: '', dataIndex: 'operate', render: renderOperate, width: 48 },
];

const selectedKeys = ref<Array<string | number>>([]);
const rowSelection = {
  getCheckboxProps: (record: FileRow) => ({ disabled: record.name === '设计文档', name: record.name }),
  onSelect: (record: FileRow, selected: boolean) => {
    console.log(`select row: ${selected}`, record);
  },
  onSelectAll: (selected: boolean, selectedRows: FileRow[]) => {
    console.log(`select all rows: ${selected}`, selectedRows);
  },
  onChange: (keys: Array<string | number>) => {
    selectedKeys.value = keys;
  },
};
const pageSize3 = { pageSize: 3 };

const hoverColumns = [
  { title: '标题', dataIndex: 'name' },
  { title: '所有者', dataIndex: 'owner' },
  {
    title: '操作',
    dataIndex: 'operate',
    render: (text: any, _r: any, _i: number, opts: { isHovering?: boolean }) =>
      opts?.isHovering ? h(Button, { size: 'small', theme: 'borderless' }, () => '编辑') : text || '',
  },
];

const pageData = makeFiles(23);
const pageCfg = { pageSize: 5 };

const remoteLoading = ref(false);
const remoteData = ref<FileRow[]>([]);
const remotePagination = reactive({ currentPage: 1, pageSize: 5, total: 46 });
const loadRemote = (page: number) => {
  remoteLoading.value = true;
  window.setTimeout(() => {
    remoteData.value = makeFiles(remotePagination.pageSize, (page - 1) * remotePagination.pageSize);
    remoteLoading.value = false;
  }, 280);
};
loadRemote(1);
const onRemoteChange = (info: { pagination?: { currentPage?: number } }) => {
  const page = info.pagination?.currentPage ?? 1;
  remotePagination.currentPage = page;
  loadRemote(page);
};

const fixedColumns = [
  { title: '标题', dataIndex: 'name', width: 260, fixed: true, render: renderName },
  { title: '大小', dataIndex: 'size', width: 100 },
  { title: '所有者', dataIndex: 'owner', width: 140, render: renderOwner },
  { title: '状态', dataIndex: 'status', width: 140, render: renderStatus },
  { title: '列 A', dataIndex: 'a', width: 160, render: () => '补充列 A' },
  { title: '列 B', dataIndex: 'b', width: 160, render: () => '补充列 B' },
  { title: '列 C', dataIndex: 'c', width: 160, render: () => '补充列 C' },
  { title: '', dataIndex: 'operate', width: 72, fixed: 'right' as const, render: renderOperate },
];
const scrollFixed = { x: 1300, y: 240 };
const stickyCfg = { top: 0 };

const sortFilterColumns = [
  {
    title: '标题',
    dataIndex: 'name',
    width: 280,
    render: renderName,
    filters: [
      { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
      { text: 'Semi D2C 设计稿', value: 'Semi D2C 设计稿' },
    ],
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
    sorter: (a: FileRow, b: FileRow) => String(a.name).length - String(b.name).length,
  },
  { title: '大小', dataIndex: 'size', sorter: (a: FileRow, b: FileRow) => Number(a.size) - Number(b.size), render: (t: any) => `${t} KB` },
  { title: '交付状态', dataIndex: 'status', render: renderStatus },
  { title: '所有者', dataIndex: 'owner', render: renderOwner },
  { title: '更新日期', dataIndex: 'updateTime', sorter: (a: FileRow, b: FileRow) => Number(a.updateTime) - Number(b.updateTime), render: fmtDate },
];
const sortTipColumns = [
  { title: '标题', dataIndex: 'name', sorter: (a: FileRow, b: FileRow) => String(a.name).localeCompare(String(b.name)), showSortTip: true },
  { title: '大小', dataIndex: 'size', sorter: (a: FileRow, b: FileRow) => Number(a.size) - Number(b.size), showSortTip: true },
  { title: '所有者', dataIndex: 'owner' },
];
const scrollY300 = { y: 300 };

const headerKeyword = ref('');
const headerFilterColumns = computed(() => [
  {
    title: () =>
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        '标题',
        h(Input, {
          size: 'small',
          placeholder: '筛选标题',
          style: { width: '140px' },
          modelValue: headerKeyword.value,
          'onUpdate:modelValue': (v: string) => {
            headerKeyword.value = v;
          },
        }),
      ]),
    dataIndex: 'name',
    filteredValue: headerKeyword.value ? [headerKeyword.value] : [],
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
  },
  { title: '所有者', dataIndex: 'owner' },
  { title: '大小', dataIndex: 'size' },
]);

const filterNameInput = ref<any>(null);
const makeRenderFilterDropdown = (opts: { closeOnAction: boolean; inputRef?: any }) => (api: {
  tempFilteredValue?: any[];
  setTempFilteredValue: (v: any[]) => void;
  confirm: (opts?: any) => void;
  clear: (opts?: any) => void;
  close: () => void;
}) =>
  h('div', { style: { padding: '8px', width: '220px' } }, [
    h(Input, {
      ref: opts.inputRef,
      placeholder: '输入关键词',
      modelValue: api.tempFilteredValue?.[0] || '',
      'onUpdate:modelValue': (v: string) => api.setTempFilteredValue(v ? [v] : []),
      style: { marginBottom: '8px' },
    }),
    h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } }, [
      h(Button, { size: 'small', theme: 'solid', onClick: () => api.confirm({ closeDropdown: opts.closeOnAction }) }, () => (opts.closeOnAction ? '筛选 + 关闭' : '筛选后不关闭')),
      h(Button, { size: 'small', onClick: () => api.clear({ closeDropdown: opts.closeOnAction }) }, () => (opts.closeOnAction ? '清除 + 关闭' : '清除后不关闭')),
      h(Button, { size: 'small', onClick: () => api.close() }, () => '直接关闭'),
    ]),
  ]);
const customFilterColumns = [
  {
    title: '标题',
    dataIndex: 'name',
    render: renderName,
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
    renderFilterDropdown: makeRenderFilterDropdown({ closeOnAction: true, inputRef: filterNameInput }),
    onFilterDropdownVisibleChange: (visible: boolean) => {
      if (visible) window.setTimeout(() => filterNameInput.value?.focus?.(), 0);
    },
  },
  {
    title: '所有者',
    dataIndex: 'owner',
    render: renderOwner,
    onFilter: (value: string, record: FileRow) => String(record.owner).includes(value),
    defaultFilteredValue: ['姜鹏志'],
    renderFilterDropdown: makeRenderFilterDropdown({ closeOnAction: false }),
  },
  { title: '大小', dataIndex: 'size' },
];

const confirmFilterColumns = [
  {
    title: '标题',
    dataIndex: 'name',
    filterConfirmMode: 'confirm' as const,
    filters: [
      { text: 'Semi Design', value: 'Semi Design' },
      { text: 'Semi D2C', value: 'Semi D2C' },
      { text: '设计文档', value: '设计文档' },
    ],
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
  },
  { title: '所有者', dataIndex: 'owner' },
  { title: '大小', dataIndex: 'size' },
];

const renderFilterItem = ({ text, checked, onChange }: any) =>
  h(
    'div',
    {
      onClick: onChange,
      style: {
        padding: '6px 12px',
        cursor: 'pointer',
        background: checked ? 'var(--semi-color-primary-light-default)' : undefined,
      },
    },
    `${checked ? '✓ ' : ''}${text}`
  );
const customItemColumns = [
  {
    title: '标题',
    dataIndex: 'name',
    filters: [
      { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
      { text: 'Semi D2C 设计稿', value: 'Semi D2C 设计稿' },
    ],
    renderFilterDropdownItem: renderFilterItem,
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
  },
  { title: '所有者', dataIndex: 'owner' },
];

const expandData: Record<string, { key: string; value: any }[]> = {
  '0': [
    { key: '实际用户数量', value: '1,480,000' },
    { key: '7 天留存', value: '98%' },
    { key: '安全等级', value: '3 级' },
    { key: '垂类标签', value: h(Tag, { style: { margin: 0 } }, () => '设计') },
    { key: '认证状态', value: '未认证' },
  ],
  '1': [
    { key: '实际用户数量', value: '2,480,000' },
    { key: '7 天留存', value: '90%' },
    { key: '安全等级', value: '1 级' },
    { key: '垂类标签', value: h(Tag, { style: { margin: 0 } }, () => '模板') },
    { key: '认证状态', value: '已认证' },
  ],
  '2': [
    { key: '实际用户数量', value: '2,920,000' },
    { key: '7 天留存', value: '98%' },
    { key: '安全等级', value: '2 级' },
    { key: '垂类标签', value: h(Tag, { style: { margin: 0 } }, () => '文档') },
    { key: '认证状态', value: '已认证' },
  ],
};
const expandRowRender = (_record: FileRow, index: number) => h(Descriptions, { align: 'justify', data: expandData[String(index)] || [] });
const rowExpandable = (record: FileRow) => record.name !== '设计文档';
const expandColumns = [
  { title: '标题', dataIndex: 'name', width: 360, render: renderName },
  { title: '大小', dataIndex: 'size' },
  { title: '所有者', dataIndex: 'owner', render: renderOwner },
  { title: '更新日期', dataIndex: 'updateTime' },
  { title: '', dataIndex: 'operate', render: renderOperate, width: 48 },
];

const treeColumns = [
  { title: 'Key', dataIndex: 'dataKey' },
  { title: '名称', dataIndex: 'name', width: 200 },
  { title: '数据类型', dataIndex: 'type', width: 220 },
  { title: '描述', dataIndex: 'description' },
  { title: '默认值', dataIndex: 'default', width: 100 },
];
const createTreeData = (): any[] => [
  {
    key: 1,
    dataKey: 'videos_info',
    name: '视频信息',
    type: 'Object 对象',
    description: '视频的元信息',
    default: '无',
    children: [
      { key: 11, dataKey: 'status', name: '视频状态', type: 'Enum <Integer> 枚举', description: '视频的可见、推荐状态', default: '1' },
      {
        key: 12,
        dataKey: 'vid',
        name: '视频 ID',
        type: 'String 字符串',
        description: '标识视频的唯一 ID',
        default: '无',
        children: [{ key: 121, dataKey: 'video_url', name: '视频地址', type: 'String 字符串', description: '视频的唯一链接', default: '无' }],
      },
    ],
  },
  {
    key: 2,
    dataKey: 'text_info',
    name: '文本信息',
    type: 'Object 对象',
    description: '视频的元信息',
    default: '无',
    children: [
      { key: 21, dataKey: 'title', name: '视频标题', type: 'String 字符串', description: '视频的标题', default: '无' },
      { key: 22, dataKey: 'video_description', name: '视频描述', type: 'String 字符串', description: '视频的描述', default: '无' },
    ],
  },
];
const treeSource = ref<any[]>(createTreeData());
const treeSelectData = createTreeData();
const swapTree = () => {
  const next = [...treeSource.value];
  if (next.length >= 2) {
    [next[0], next[1]] = [next[1], next[0]];
    treeSource.value = next;
  }
};

const relatedKeys = ref<Array<string | number>>([]);
const relatedSelection = computed(() => ({
  checkRelation: 'related' as const,
  selectedRowKeys: relatedKeys.value,
  onChange: (keys: Array<string | number>) => {
    relatedKeys.value = keys;
  },
}));
const relatedColumns = [
  { title: '名称', dataIndex: 'name' },
  { title: 'Key', dataIndex: 'dataKey' },
];

const collectTreeKeys = (data: any[], acc: Array<string | number> = []) => {
  for (const record of data) {
    acc.push(record.key);
    if (Array.isArray(record.children)) collectTreeKeys(record.children, acc);
  }
  return acc;
};
const keysOfRecordAndChildren = (record: any) => {
  const keys: Array<string | number> = [record.key];
  if (Array.isArray(record.children)) collectTreeKeys(record.children, keys);
  return keys;
};
const treeSelectKeys = ref<Array<string | number>>([]);
const treeSelectSelection = computed(() => ({
  selectedRowKeys: treeSelectKeys.value,
  onSelect: (record: any, selected: boolean) => {
    const related = keysOfRecordAndChildren(record);
    if (selected) {
      treeSelectKeys.value = Array.from(new Set([...treeSelectKeys.value, ...related]));
    } else {
      const drop = new Set(related);
      treeSelectKeys.value = treeSelectKeys.value.filter((k) => !drop.has(k));
    }
  },
  onSelectAll: (selected: boolean) => {
    treeSelectKeys.value = selected ? collectTreeKeys(treeSelectData) : [];
  },
}));

const onRowDemo = (record: FileRow, index: number) => ({
  class: index === 2 ? 'table-demo-click-row' : undefined,
  onClick: () => {
    if (index === 2) console.log('clicked row', record.name);
  },
});
const onHeaderRowDemo = () => ({
  onMouseenter: () => undefined,
  onMouseleave: () => undefined,
});
const eventColumns = [
  { title: '标题', dataIndex: 'name', onCell: () => ({ 'data-demo': 'cell' }) },
  { title: '所有者', dataIndex: 'owner' },
  { title: '大小', dataIndex: 'size' },
];

const zebraOnRow = (_r: FileRow, index: number) => ({
  style: { background: index % 2 ? 'var(--semi-color-fill-0)' : undefined },
});
const headerCellColumns = [
  { title: '标题', dataIndex: 'name', onHeaderCell: () => ({ style: { background: 'var(--semi-color-primary-light-default)' } }) },
  { title: '所有者', dataIndex: 'owner', onHeaderCell: () => ({ style: { background: 'var(--semi-color-primary-light-default)' } }) },
  { title: '大小', dataIndex: 'size', onHeaderCell: () => ({ style: { background: 'var(--semi-color-primary-light-default)' } }) },
];

const ellipsisData = [
  { key: '1', name: '这是一段非常非常长的标题 Semi Design 设计稿需要被缩略显示.fig', owner: '姜鹏志姜鹏志姜鹏志', address: '北京市朝阳区望京街道十号楼某某大厦 18 层 Semi Design' },
  { key: '2', name: '另一段超长标题 Semi D2C 分享演示文稿需要被缩略', owner: '郝宣郝宣郝宣郝宣', address: '上海市浦东新区陆家嘴环路 1000 号' },
];
const ellipsisColumns = [
  { title: '超长标题', dataIndex: 'name', ellipsis: true, width: 180 },
  { title: '所有者', dataIndex: 'owner', ellipsis: true, width: 100 },
  { title: '地址', dataIndex: 'address', ellipsis: true, width: 180 },
];
const ellipsisTitleColumns = [
  {
    title: '超长标题',
    dataIndex: 'name',
    ellipsis: { showTitle: false },
    width: 180,
    render: (text: string) => h(Tooltip, { content: text }, { default: () => h('span', text) }),
  },
  { title: '地址', dataIndex: 'address', ellipsis: { showTitle: false }, width: 220 },
];

const resizableColumns = [
  { title: '标题', dataIndex: 'name', width: 260, resize: false, render: renderName },
  { title: '大小', dataIndex: 'size', width: 140, sorter: (a: FileRow, b: FileRow) => Number(a.size) - Number(b.size), render: (t: any) => `${t} KB` },
  { title: '所有者', dataIndex: 'owner', width: 160, render: renderOwner },
  { title: '更新日期', dataIndex: 'updateTime', width: 160, render: fmtDate },
  { title: '操作列', dataIndex: 'operate', width: 80, resize: false, render: renderOperate },
];
const advancedResizable = {
  onResizeStart: (column: any) => ({ className: `${column.className || ''} table-col-resizing`.trim() }),
  onResizeStop: (column: any) => ({ className: (column.className || '').replace('table-col-resizing', '').trim() }),
};

const dragData = ref(fileData.slice(0, 4).map((r) => ({ ...r })));
let dragKey: string | null = null;
const DragRow = defineComponent({
  name: 'TableDragRow',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        'tr',
        {
          ...attrs,
          draggable: true,
          style: { ...(typeof attrs.style === 'object' ? attrs.style : {}), cursor: 'move' },
          onDragstart: () => {
            dragKey = String(attrs['data-row-key'] ?? '');
          },
          onDragover: (e: DragEvent) => {
            e.preventDefault();
          },
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            const to = String(attrs['data-row-key'] ?? '');
            if (!dragKey || dragKey === to) return;
            const list = [...dragData.value];
            const fromIdx = list.findIndex((r) => r.key === dragKey);
            const toIdx = list.findIndex((r) => r.key === to);
            if (fromIdx < 0 || toIdx < 0) return;
            const [item] = list.splice(fromIdx, 1);
            list.splice(toIdx, 0, item);
            dragData.value = list;
          },
        },
        slots.default?.()
      );
  },
});
const dragComponents = { body: { row: DragRow } };
const dragColumns = [
  { title: '标题', dataIndex: 'name' },
  { title: '所有者', dataIndex: 'owner' },
  { title: '大小', dataIndex: 'size' },
];

const groupData = makeFiles(24);
const groupColumns = [
  { title: '标题', dataIndex: 'name', width: 280, render: renderName },
  { title: '大小', dataIndex: 'size', sorter: (a: FileRow, b: FileRow) => Number(a.size) - Number(b.size), render: (t: any) => `${t} KB` },
  { title: '所有者', dataIndex: 'owner', render: renderOwner },
  { title: '更新日期', dataIndex: 'updateTime', render: fmtDate },
];
const groupRowKey = (record: FileRow) => `${record.owner}-${record.name}`;
const renderGroupSection = (groupKey: any) => h('strong', `根据文件大小分组 ${groupKey} KB`);
const groupScroll = { y: 320 };

const virtualData = makeFiles(200);
const virtualizedCfg = { itemSize: 56, overscanCount: 4 };
const scrollY280 = { y: 280 };
const listApi = { current: null as any };
const getVirtualizedListRef = (r: any) => {
  listApi.current = r?.current ?? r;
};
const scrollVirtualTo = (index: number) => {
  listApi.current?.scrollToItem?.(index);
};

const infData = ref(makeFiles(40));
const infBusy = ref(false);
const infVirtualized = {
  itemSize: 56,
  onScroll: (info: { scrollDirection?: string; scrollOffset?: number }) => {
    if (info.scrollDirection !== 'forward' || infBusy.value || infData.value.length >= 180) return;
    if ((info.scrollOffset || 0) < infData.value.length * 56 - 360) return;
    infBusy.value = true;
    window.setTimeout(() => {
      infData.value = infData.value.concat(makeFiles(20, infData.value.length));
      infBusy.value = false;
    }, 240);
  },
};

const showSizeCol = ref(true);
const dynamicData = makeFiles(12);
const dynamicColumns = computed(() => {
  const cols: any[] = [
    { title: '标题', dataIndex: 'name', render: renderName },
    { title: '所有者', dataIndex: 'owner', render: renderOwner },
    { title: '更新日期', dataIndex: 'updateTime', render: fmtDate },
  ];
  if (showSizeCol.value) cols.splice(1, 0, { title: '大小', dataIndex: 'size', render: (t: any) => `${t} KB` });
  return cols;
});

const fullRenderColumns = [
  {
    title: ({ sorter, filter, selection }: any) =>
      h('span', { style: { display: 'inline-flex', alignItems: 'center', paddingLeft: '20px' } }, [
        selection,
        h('span', { style: { marginLeft: '8px' } }, 'Name'),
        sorter,
        filter,
      ]),
    dataIndex: 'name',
    width: 360,
    useFullRender: true,
    filters: [
      { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
      { text: 'Semi D2C 设计稿', value: 'Semi D2C 设计稿' },
    ],
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
    render: (text: any, record: FileRow, _i: number, { expandIcon, selection, indentText }: any) =>
      h('span', { style: { display: 'inline-flex', alignItems: 'center' } }, [
        indentText,
        expandIcon,
        selection,
        h('span', { style: { marginLeft: '8px' } }, [h(Avatar, { size: 'small', shape: 'square', src: FIGMA, style: { marginRight: '12px' } }), text]),
      ]),
  },
  { title: '大小', dataIndex: 'size', render: (t: any) => `${t} KB` },
  { title: '所有者', dataIndex: 'owner', render: renderOwner },
];
const fullRenderSelection = { hidden: true, fixed: 'left' as const };
const fullRenderExpand = (record: FileRow) => h('article', record.name);
const pageSize12 = { pageSize: 8 };

const mergeHeaderColumns = [
  { title: '标题', dataIndex: 'name', render: renderName },
  {
    title: '信息',
    children: [
      { title: '大小', dataIndex: 'size' },
      { title: '所有者', dataIndex: 'owner', render: renderOwner },
    ],
  },
  { title: '更新日期', dataIndex: 'updateTime' },
];

const spanData = [
  { key: '1', name: ' Semi Design', age: 32, address: '北京' },
  { key: '2', name: ' Semi Design', age: 28, address: '北京' },
  { key: '3', name: 'Semi D2C', age: 31, address: '上海' },
];
const spanColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    render: (text: string, _r: any, index: number) => {
      if (index === 0) return { children: text, props: { rowSpan: 2 } };
      if (index === 1) return { children: text, props: { rowSpan: 0 } };
      return text;
    },
    colSpan: 1,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    render: (text: any, _r: any, index: number) => (index === 2 ? { children: text, props: { colSpan: 2 } } : text),
  },
  {
    title: 'Address',
    dataIndex: 'address',
    render: (text: any, _r: any, index: number) => (index === 2 ? { children: text, props: { colSpan: 0 } } : text),
  },
];

const headerStyle = { background: 'var(--semi-color-fill-0)', fontWeight: 600 };
const clickRowSelection = { clickRow: true };
const tableMethodRef = ref<any>(null);
const pageSnapshot = ref('');
const dumpPageData = () => {
  const data = tableMethodRef.value?.getCurrentPageData?.();
  pageSnapshot.value = (data?.dataSource || []).map((r: FileRow) => r.name).join('、');
};

const simplePeople = [
  { key: '1', name: '张三', age: 32, address: '北京' },
  { key: '2', name: '李四', age: 28, address: '上海' },
  { key: '3', name: '王五', age: 31, address: '广州' },
];
const peopleColumns = [
  { title: '姓名', dataIndex: 'name' },
  { title: '年龄', dataIndex: 'age' },
  { title: '住址', dataIndex: 'address' },
];

const tableSize = ref<'default' | 'middle' | 'small'>('small');
const tableLoading = ref(false);
const showTableHeader = ref(true);
const titleFooterData = fileData.slice(0, 3);
const tableTitle = (pageData: FileRow[]) => `当前 ${pageData.length} 条`;
const tableFooter = (pageData: FileRow[]) => `合计 ${pageData.length} 条`;

const pagePosition = ref<'bottom' | 'top' | 'both'>('both');
const posPageSize = ref(5);
const preventPageJump = ref(false);
const pagePosCfg = computed(() => ({
  pageSize: posPageSize.value,
  position: pagePosition.value,
  showSizeChanger: true,
  pageSizeOpts: [5, 10, 20],
  preventPageChangeOnPageSizeChange: preventPageJump.value,
  formatPageText: (info: { currentStart: number; currentEnd: number; total: number }) => `第 ${info.currentStart}-${info.currentEnd} 条，共 ${info.total} 条`,
  onPageSizeChange: (size: number) => {
    posPageSize.value = size;
  },
}));
const renderPaginationDemo = (pagination: any) => {
  const { currentPage, pageSize, total, onChange } = pagination || {};
  return h('div', { style: { display: 'flex', justifyContent: 'flex-end', width: '100%' } }, [
    h(Pagination, { currentPage, pageSize, total, onChange, size: 'small', showQuickJumper: true }),
  ]);
};

const expandLog = ref('');
const customExpandIcon = (expanded: boolean) => h(expanded ? IconChevronDown : IconChevronRight, { style: { color: 'var(--semi-color-primary)' } });
const keepDomRender = (record: FileRow) =>
  h('div', { style: { padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } }, [
    h('span', `展开内容：${record.name}`),
    h(Input, { placeholder: '折叠后再展开，输入应还在（keepDOM）', style: { width: '260px' } }),
  ]);
const onExpandDemo = (expanded: boolean, record: FileRow) => {
  expandLog.value = `${expanded ? '展开' : '收起'} ${record.name}`;
};
const ctrlExpandKeys = ref<Array<string | number>>(['1']);
const setCtrlExpand = (mode: 'first' | 'all' | 'none') => {
  if (mode === 'none') ctrlExpandKeys.value = [];
  else if (mode === 'first') ctrlExpandKeys.value = ['1'];
  else ctrlExpandKeys.value = fileData.slice(0, 3).map((r) => r.key);
};
const onCtrlExpandedRowsChange = (rows: FileRow[]) => {
  ctrlExpandKeys.value = (rows || []).map((r) => r.key);
};

const renderSelCell = ({ selected, originNode, inHeader, disabled, selectRow }: any) => {
  if (inHeader) return originNode;
  return h(
    Tag,
    {
      color: selected ? 'blue' : 'grey',
      style: { cursor: disabled ? 'not-allowed' : 'pointer' },
      onClick: (e: Event) => {
        e.stopPropagation();
        if (!disabled) selectRow?.(!selected, e);
      },
    },
    () => (selected ? '已选' : '选择')
  );
};
const renderCellSelection = {
  fixed: true,
  width: 72,
  renderCell: renderSelCell,
  getCheckboxProps: (record: FileRow) => ({ disabled: record.name === '设计文档' }),
};

const iconFilterSortColumns = [
  {
    title: '标题',
    dataIndex: 'name',
    sorter: (a: FileRow, b: FileRow) => String(a.name).localeCompare(String(b.name)),
    sortIcon: ({ sortOrder }: { sortOrder: string | boolean }) =>
      h(sortOrder === 'ascend' ? IconCaretup : IconCaretdown, { style: { color: sortOrder ? 'var(--semi-color-primary)' : undefined } }),
    filterIcon: (filtered: boolean) => h(IconFilter, { style: { color: filtered ? 'var(--semi-color-primary)' : undefined } }),
    filters: [
      { text: 'Semi Design', value: 'Semi Design' },
      { text: 'Semi D2C', value: 'Semi D2C' },
    ],
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
  },
  { title: '所有者', dataIndex: 'owner' },
  { title: '大小', dataIndex: 'size' },
];

const nestedFilterColumns = [
  {
    title: '标题',
    dataIndex: 'name',
    filters: [
      {
        text: 'Semi',
        value: 'Semi',
        children: [
          { text: 'Design 设计稿', value: 'Semi Design' },
          { text: 'D2C 设计稿', value: 'Semi D2C' },
        ],
      },
      { text: '设计文档', value: '设计文档' },
    ],
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
  },
  {
    title: '所有者',
    dataIndex: 'owner',
    filterMultiple: false,
    filters: [
      { text: '姜鹏志', value: '姜鹏志' },
      { text: '郝宣', value: '郝宣' },
      { text: 'Zoey Edwards', value: 'Zoey Edwards' },
    ],
    onFilter: (value: string, record: FileRow) => record.owner === value,
  },
];

const ctrlSortOrder = ref<'ascend' | 'descend' | false>('ascend');
const defaultFilterSortColumns = computed(() => [
  {
    title: '标题',
    dataIndex: 'name',
    defaultFilteredValue: ['Semi Design'],
    filters: [
      { text: 'Semi Design', value: 'Semi Design' },
      { text: 'Semi D2C', value: 'Semi D2C' },
    ],
    onFilter: (value: string, record: FileRow) => String(record.name).includes(value),
  },
  {
    title: '大小',
    dataIndex: 'size',
    sortOrder: ctrlSortOrder.value,
    sorter: (a: FileRow, b: FileRow) => Number(a.size) - Number(b.size),
    render: (t: any) => `${t} KB`,
  },
  { title: '所有者', dataIndex: 'owner' },
]);

const childFilterColumns = [
  {
    title: '名称',
    dataIndex: 'name',
    filters: [
      { text: '视频地址', value: '视频地址' },
      { text: '视频标题', value: '视频标题' },
      { text: '视频信息', value: '视频信息' },
    ],
    onFilter: (value: string, record: any) => String(record.name).includes(value),
    filterChildrenRecord: true,
    sorter: (a: any, b: any) => String(a.name).localeCompare(String(b.name)),
    sortChildrenRecord: true,
  },
  { title: 'Key', dataIndex: 'dataKey' },
];
const childFilterData = createTreeData();

const nestNamedData = [
  {
    key: 1,
    name: '目录',
    items: [
      { key: 11, name: '文件 A' },
      { key: 12, name: '文件 B', items: [{ key: 121, name: '附件' }] },
    ],
  },
];
const nestNamedColumns = [{ title: '名称', dataIndex: 'name' }];

const scrollTopOnChange = { y: 180, scrollToFirstRowOnChange: true };

const resizableFixedColumns = [
  { title: '标题', dataIndex: 'name', width: 220, fixed: true as const, render: renderName },
  { title: '大小', dataIndex: 'size', width: 120 },
  { title: '所有者', dataIndex: 'owner', width: 140, render: renderOwner },
  { title: '状态', dataIndex: 'status', width: 120, render: renderStatus },
  { title: '补充', dataIndex: 'extra', render: () => '不设 width，弹性列' },
];

const groupVirtualCfg = { itemSize: 56, overscanCount: 4 };
const groupVirtualData = makeFiles(60);
const onGroupedRowDemo = () => ({ style: { background: 'var(--semi-color-primary-light-default)' } });
const renderOwnerGroup = (key: any) => h('strong', `所有者 ${key}`);

const rtlColumns = [
  { title: '姓名', dataIndex: 'name', align: 'left' as const },
  { title: '年龄', dataIndex: 'age', align: 'right' as const },
  { title: '住址', dataIndex: 'address', fixed: 'left' as const, width: 120 },
];
</script>

<template>
  <DemoBlock
    title="如何使用"
    desc="往 Table 传入表头 columns 和数据 dataSource 进行渲染。请为 dataSource 中的每个数据项提供一个与其他数据项值不同的 key，或者使用 rowKey 指定主键。"
    code="import { Table, Column } from 'semi-design-vue'"
  />

  <DemoBlock title="基本表格" desc="最基本的两个参数为 dataSource 和 columns，前者为数据项，后者为每列的配置。">
    <Table :columns="basicColumns" :dataSource="fileData.slice(0, 3)" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="JSX 写法"
    desc="也可以用 Table.Column 声明式定义列。不要用其他组件包裹 Column；不要与 columns 配置同时使用（同时使用时仅配置写法生效）。JSX 写法暂不支持 resizable。"
    code="<Table :dataSource=&quot;data&quot; :pagination=&quot;false&quot;>
  <Column title=&quot;标题&quot; dataIndex=&quot;name&quot; />
</Table>"
  >
    <Table :dataSource="fileData.slice(0, 3)" :pagination="false">
      <Column title="标题" dataIndex="name" :render="renderName" />
      <Column title="大小" dataIndex="size" />
      <Column title="所有者" dataIndex="owner" :render="renderOwner" />
      <Column title="更新时间" dataIndex="updateTime" />
      <Column title="" dataIndex="operate" :render="renderOperate" />
    </Table>
  </DemoBlock>

  <DemoBlock
    title="行选择操作"
    desc="传入 rowSelection 即可打开。表头选择框会选择所有非 disabled 行（onSelectAll）；行选择框选中当前行（onSelect）。dataSource 更新会让非受控分页回到第一页。"
  >
    <p class="table-note">已选 key：{{ selectedKeys.join(', ') || '无' }}</p>
    <Table :columns="basicColumns" :dataSource="fileData" :rowSelection="rowSelection" :pagination="pageSize3" />
  </DemoBlock>

  <DemoBlock
    title="自定义渲染"
    desc="Column.render 自定义单元格。第四个参数 options 含 expandIcon、selection、indentText、isHovering（v2.98）。可用 isHovering 在悬停时显示操作。"
  >
    <Table :columns="hoverColumns" :dataSource="fileData.slice(0, 3)" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="带分页组件的表格"
    desc="支持受控 / 非受控。传入 pagination.currentPage 即为受控。非受控时默认用 dataSource.length 作为 total，不推荐再传入 total。pagination 不要用每次渲染都新建的字面量。"
  >
    <Table :columns="sortFilterColumns" :dataSource="pageData" :pagination="pageCfg" :scroll="scrollY300" />
  </DemoBlock>

  <DemoBlock
    title="拉取远程数据"
    desc="点击页码、过滤或排序时从接口重新取数，请用受控分页（传入 pagination.currentPage）。受控模式下 Table 不会对 dataSource 再分页，请只传入当前页数据。"
  >
    <Table :columns="basicColumns" :dataSource="remoteData" :pagination="remotePagination" :loading="remoteLoading" @change="onRemoteChange" />
  </DemoBlock>

  <DemoBlock
    title="固定列或表头"
    desc="column.fixed + scroll.x 固定列；scroll.y 固定表头。建议 scroll.x 大于表格宽度。固定列请指定 width。"
  >
    <Table :columns="fixedColumns" :dataSource="fileData" :pagination="false" :scroll="scrollFixed" />
  </DemoBlock>

  <DemoBlock title="sticky 吸顶表头" desc="sticky 将表头固定在滚动容器顶部（v2.21）。传入 top 可控制距离。开启后自动使用 fixed 布局。">
    <Table :columns="peopleColumns" :dataSource="simplePeople" :pagination="false" :sticky="stickyCfg" />
  </DemoBlock>

  <DemoBlock
    title="带排序和过滤功能的表头"
    desc="Column.filters + onFilter 开启过滤器；sorter 开启排序。排序/筛选列必须设置独立 dataIndex。sorter 函数第三个参数为 sortOrder（v2.47）。"
  >
    <Table :columns="sortFilterColumns" :dataSource="pageData" :pagination="pageCfg" :scroll="scrollY300" />
  </DemoBlock>

  <DemoBlock
    title="排序提示 showSortTip"
    desc="v2.65，默认 false。仅排序时悬停表头展示提示；同时有筛选时仅悬停排序图标。sortOrder 受控时不展示（无法预测下一顺序）。"
  >
    <Table :columns="sortTipColumns" :dataSource="pageData.slice(0, 8)" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="自定义表头筛选" desc="在 title 传入 Vue 节点，配合 filteredValue 做受控筛选。">
    <Table :columns="headerFilterColumns" :dataSource="fileData" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="自定义筛选器"
    desc="renderFilterDropdown（v2.52）。输入时 setTempFilteredValue 暂存，confirm / clear 可指定 closeDropdown。本例标题列筛选后关闭并在打开时自动 focus；所有者列默认筛「姜鹏志」，筛选/清除后不关闭。"
  >
    <Table :columns="customFilterColumns" :dataSource="fileData" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="筛选确认模式"
    desc="filterConfirmMode='confirm'：点击筛选项先暂存，底部出现确定/重置；确定后才应用并关闭；重置恢复打开时的初始状态且不关面板。"
  >
    <Table :columns="confirmFilterColumns" :dataSource="fileData" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="自定义筛选项渲染"
    desc="renderFilterDropdownItem 自定义每项。参数含 text、value、checked、filteredValue、level、filterMultiple。"
  >
    <Table :columns="customItemColumns" :dataSource="fileData" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="可以展开的表格"
    desc="传入 expandedRowRender，并用 rowKey（默认 key）标识行。展开按钮默认与第一列同单元格；hideExpandedColumn=false 时单独成列。"
  >
    <Table rowKey="name" :columns="expandColumns" :dataSource="fileData.slice(0, 3)" :expandedRowRender="expandRowRender" :rowSelection="rowSelection" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="展开按钮渲染为单独列" desc="hideExpandedColumn={false} 将展开按钮作为独立列。expandCellFixed 可固定该列。">
    <Table :columns="expandColumns" :dataSource="fileData.slice(0, 3)" :expandedRowRender="expandRowRender" :hideExpandedColumn="false" expandCellFixed="left" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="关闭某一行的可展开按钮渲染" desc="rowExpandable(record) 返回 false 时该行不渲染展开按钮。本例「设计文档」不可展开。">
    <Table :columns="expandColumns" :dataSource="fileData.slice(0, 3)" :expandedRowRender="expandRowRender" :rowExpandable="rowExpandable" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="树形数据展示"
    desc="数据含 children 时自动为树形；可用 childrenRecordName 改字段。indentSize 控制缩进。必须提供唯一 key / rowKey。"
  >
    <Space style="margin-bottom: 12px">
      <Button @click="swapTree">交换两棵树的顺序</Button>
    </Space>
    <Table :columns="treeColumns" :dataSource="treeSource" defaultExpandAllRows />
  </DemoBlock>

  <DemoBlock
    title="树形选择"
    desc="默认行选中互不影响。可通过 selectedRowKeys + onSelect / onSelectAll 自行同步父子节点（官网示例写法）。与下一节 checkRelation='related' 的内置联动不同。"
  >
    <p class="table-note">已选 key：{{ treeSelectKeys.join(', ') || '无' }}</p>
    <Table :columns="treeColumns" :dataSource="treeSelectData" :rowSelection="treeSelectSelection" defaultExpandAllRows :pagination="false" />
  </DemoBlock>

  <DemoBlock title="树形选择关联（checkRelation）" desc="rowSelection.checkRelation='related' 时父子联动：选父选全部子，选子影响父的全选/半选/未选。">
    <Table :columns="relatedColumns" :dataSource="treeSource" :rowSelection="relatedSelection" defaultExpandAllRows :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="自定义行或单元格事件以及属性"
    desc="onRow / onHeaderRow 定义行属性与事件；column.onCell / onHeaderCell 定义单元格。第三行点击会打印日志。"
  >
    <Table :columns="eventColumns" :dataSource="fileData.slice(0, 3)" :pagination="false" :onRow="onRowDemo" :onHeaderRow="onHeaderRowDemo" />
  </DemoBlock>

  <DemoBlock title="实现斑马纹样式" desc="用 onRow 给偶数行设背景。固定列时可用 onCell 给单元格设背景。">
    <Table :columns="peopleColumns" :dataSource="simplePeople" :pagination="false" :onRow="zebraOnRow" />
  </DemoBlock>

  <DemoBlock title="实现表头样式定制" desc="Column.onHeaderCell 返回 style / className。">
    <Table :columns="headerCellColumns" :dataSource="fileData.slice(0, 3)" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="实现单元格 Hover 样式定制" desc="默认整行 Hover。可用 CSS 覆盖改为单元格高亮。">
    <div class="table-cell-hover">
      <Table :columns="peopleColumns" :dataSource="simplePeople" :pagination="false" />
    </div>
  </DemoBlock>

  <DemoBlock title="单元格缩略" desc="ellipsis 自动省略（v2.34），并切换 table-layout: fixed。">
    <Table :columns="ellipsisColumns" :dataSource="ellipsisData" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="ellipsis.showTitle" desc="showTitle=false 隐藏原生 title，配合 render 自定义 Tooltip。">
    <Table :columns="ellipsisTitleColumns" :dataSource="ellipsisData" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="可伸缩列"
    desc="resizable 为 true 或对象；需要伸缩的列必须指定 width。column.resize=false 可关闭该列（v2.42）。不推荐与 scroll.x 同时使用。"
  >
    <Table :columns="resizableColumns" :dataSource="pageData" resizable bordered :pagination="pageCfg" />
  </DemoBlock>

  <DemoBlock title="进阶的伸缩列" desc="resizable 可为对象：onResize / onResizeStart / onResizeStop，返回值会与 column 合并。本例拖拽时高亮列边。">
    <Table :columns="resizableColumns" :dataSource="pageData.slice(0, 8)" :resizable="advancedResizable" bordered :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="拖拽排序"
    desc="官网 React 示例用 dnd-kit + components。Vue 同样通过 components.body.row 覆盖行节点；本例用 HTML5 drag 演示同一 API。"
  >
    <Table :columns="dragColumns" :dataSource="dragData" :components="dragComponents" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="表格分组" desc="groupBy 定义分组，renderGroupSection 渲染分组表头。clickGroupedRowToExpand 点击整行展开。onGroupedRow 定义分组行属性。">
    <Table
      :dataSource="groupData"
      :rowKey="groupRowKey"
      groupBy="size"
      :columns="groupColumns"
      :renderGroupSection="renderGroupSection"
      clickGroupedRowToExpand
      :onGroupedRow="onGroupedRowDemo"
      :scroll="groupScroll"
    />
  </DemoBlock>

  <DemoBlock
    title="虚拟化表格"
    desc="virtualized + 必须的 scroll.y。itemSize 可为数字或 (index, { sectionRow, expandedRow }) => number。可通过 virtualized 传入 overscanCount 等。getVirtualizedListRef 拿到 scrollTo / scrollToItem / resetAfterIndex。"
  >
    <Space style="margin-bottom: 12px">
      <Button @click="scrollVirtualTo(80)">滚动到第 80 行</Button>
      <Button @click="scrollVirtualTo(0)">回到顶部</Button>
    </Space>
    <Table
      :columns="sortFilterColumns"
      :dataSource="virtualData"
      :pagination="false"
      :scroll="scrollY280"
      :virtualized="virtualizedCfg"
      :getVirtualizedListRef="getVirtualizedListRef"
      style="width: 100%"
    />
  </DemoBlock>

  <DemoBlock title="无限滚动" desc="基于虚拟化，virtualized.onScroll 在接近底部时追加数据。">
    <p class="table-note">已加载 {{ infData.length }} 行{{ infBusy ? '，加载中…' : '' }}</p>
    <Table :columns="sortFilterColumns" :dataSource="infData" :pagination="false" :scroll="scrollY280" :virtualized="infVirtualized" style="width: 100%" />
  </DemoBlock>

  <DemoBlock title="受控的动态表格" desc="动态增删 columns，表格会按新列配置重绘。">
    <Space style="margin-bottom: 12px">
      <span>显示「大小」列</span>
      <Switch v-model="showSizeCol" />
    </Space>
    <Table :columns="dynamicColumns" :dataSource="dynamicData" :pagination="pageCfg" />
  </DemoBlock>

  <DemoBlock
    title="完全自定义渲染"
    desc="Column.useFullRender=true 时，复选框、展开按钮、缩进会透传到 title 与 render。title 入参 { filter, sorter, selection }；render 第四参含 expandIcon、selection、indentText、isHovering。"
  >
    <Table
      :columns="fullRenderColumns"
      :dataSource="pageData"
      :pagination="pageSize12"
      :rowSelection="fullRenderSelection"
      :expandedRowRender="fullRenderExpand"
    />
  </DemoBlock>

  <DemoBlock title="表头合并 · 配置式" desc="通过 column.children 分组表头，可与固定列、虚拟化、分组、伸缩等组合。">
    <Table :columns="mergeHeaderColumns" :dataSource="fileData.slice(0, 3)" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="表头合并 · JSX 写法" desc="嵌套 Table.Column 即可。">
    <Table :dataSource="fileData.slice(0, 3)" :pagination="false">
      <Column title="标题" dataIndex="name" :render="renderName" />
      <Column title="信息">
        <Column title="大小" dataIndex="size" />
        <Column title="所有者" dataIndex="owner" :render="renderOwner" />
      </Column>
      <Column title="更新日期" dataIndex="updateTime" />
    </Table>
  </DemoBlock>

  <DemoBlock title="行列合并" desc="表头可用 column.colSpan；单元格在 render 返回 { children, props: { colSpan, rowSpan } }，设为 0 则不渲染。rowSpanHover 悬停合并单元格时高亮覆盖的所有行。">
    <Table :columns="spanColumns" :dataSource="spanData" :pagination="false" bordered rowSpanHover />
  </DemoBlock>

  <DemoBlock title="headerStyle" desc="应用到所有表头 th（含固定表头），v2.97。onHeaderCell 的 style 会覆盖同名属性。">
    <Table :columns="peopleColumns" :dataSource="simplePeople" :pagination="false" :headerStyle="headerStyle" />
  </DemoBlock>

  <DemoBlock title="点击行选择 clickRow" desc="rowSelection.clickRow（v2.94）：点击行任意位置切换选中。被 getCheckboxProps 禁用的行不可点选。">
    <Table :columns="peopleColumns" :dataSource="simplePeople" :rowSelection="clickRowSelection" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="尺寸 size / 边框 bordered / 空状态" desc="size 影响行 padding：default / middle / small。bordered 显示边框。empty 自定义空数据。">
    <Space vertical align="start" style="width: 100%" :spacing="16">
      <RadioGroup v-model="tableSize" type="button" :options="['default', 'middle', 'small']" />
      <Table :columns="peopleColumns" :dataSource="simplePeople" :size="tableSize" bordered :pagination="false" :title="`${tableSize} + bordered`" />
      <Table :columns="peopleColumns" :dataSource="[]" :pagination="false" empty="这里没有数据" />
    </Space>
  </DemoBlock>

  <DemoBlock
    title="loading / title / footer / showHeader"
    desc="loading 显示加载层。title / footer 可为字符串或 (pageData) => 节点。showHeader=false 隐藏表头。"
  >
    <Space style="margin-bottom: 12px">
      <span>loading</span>
      <Switch v-model="tableLoading" />
      <span>显示表头</span>
      <Switch v-model="showTableHeader" />
    </Space>
    <Table
      :columns="peopleColumns"
      :dataSource="titleFooterData"
      :pagination="false"
      :loading="tableLoading"
      :showHeader="showTableHeader"
      :title="tableTitle"
      :footer="tableFooter"
    />
  </DemoBlock>

  <DemoBlock
    title="分页位置与 pageSize 切换"
    desc="pagination.position：top / bottom / both。formatPageText 自定义左侧文案。showSizeChanger 切换每页条数。preventPageChangeOnPageSizeChange 为 true 时切换容量不自动改页码。"
  >
    <Space style="margin-bottom: 12px" :wrap="true">
      <RadioGroup v-model="pagePosition" type="button" :options="['top', 'bottom', 'both']" />
      <span>阻止 pageSize 改页码</span>
      <Switch v-model="preventPageJump" />
    </Space>
    <Table :columns="peopleColumns" :dataSource="pageData" :pagination="pagePosCfg" />
  </DemoBlock>

  <DemoBlock title="自定义分页器 renderPagination" desc="renderPagination(paginationProps) 完全自定义翻页器。本例渲染 small + 快速跳转。">
    <Table :columns="peopleColumns" :dataSource="pageData" :pagination="pageCfg" :renderPagination="renderPaginationDemo" />
  </DemoBlock>

  <DemoBlock
    title="点击行展开 / keepDOM / 自定义 expandIcon"
    desc="expandRowByClick 点击行展开。keepDOM 折叠时不销毁展开区 DOM（输入内容会保留）。expandIcon 可为函数 (expanded) => 节点。onExpand 在展开变化时触发。"
  >
    <p class="table-note">{{ expandLog || '点击行或展开图标试试；在展开区内输入后折叠再展开，文字应还在。' }}</p>
    <Table
      :columns="expandColumns"
      :dataSource="fileData.slice(0, 3)"
      :expandedRowRender="keepDomRender"
      expandRowByClick
      keepDOM
      :expandIcon="customExpandIcon"
      :pagination="false"
      @expand="onExpandDemo"
    />
  </DemoBlock>

  <DemoBlock title="受控展开 expandedRowKeys" desc="传入 expandedRowKeys 后展开受控。也可用 expandAllRows / defaultExpandAllRows。">
    <Space style="margin-bottom: 12px">
      <Button @click="setCtrlExpand('first')">只展开第一行</Button>
      <Button @click="setCtrlExpand('all')">展开全部</Button>
      <Button @click="setCtrlExpand('none')">全部收起</Button>
    </Space>
    <Table
      :columns="expandColumns"
      :dataSource="fileData.slice(0, 3)"
      :expandedRowRender="expandRowRender"
      :expandedRowKeys="ctrlExpandKeys"
      :pagination="false"
      @expandedRowsChange="onCtrlExpandedRowsChange"
    />
  </DemoBlock>

  <DemoBlock
    title="rowSelection.renderCell"
    desc="renderCell 自定义勾选单元格。本例表头保留默认 Checkbox，行内用 Tag。fixed 固定选择列；getCheckboxProps 禁用「设计文档」。"
  >
    <Table :columns="peopleColumns" :dataSource="fileData.slice(0, 3)" :rowSelection="renderCellSelection" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="自定义 filterIcon / sortIcon" desc="filterIcon 可为 (filtered) => 节点；sortIcon 为 ({ sortOrder }) => 节点，需自行根据 sortOrder 控制高亮。">
    <Table :columns="iconFilterSortColumns" :dataSource="fileData" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="单选筛选与嵌套筛选项" desc="filterMultiple=false 为单选。filters 可嵌套 children，renderFilterDropdownItem 的 level >= 1。">
    <Table :columns="nestedFilterColumns" :dataSource="fileData" :pagination="false" />
  </DemoBlock>

  <DemoBlock title="默认筛选值与受控排序" desc="defaultFilteredValue 初始筛选。sortOrder 受控时 showSortTip 不生效。可用按钮切换 ascend / descend / false。">
    <Space style="margin-bottom: 12px">
      <Button @click="ctrlSortOrder = 'ascend'">升序</Button>
      <Button @click="ctrlSortOrder = 'descend'">降序</Button>
      <Button @click="ctrlSortOrder = false">取消排序</Button>
    </Space>
    <Table :columns="defaultFilterSortColumns" :dataSource="pageData.slice(0, 12)" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="子级过滤与排序"
    desc="filterChildrenRecord：子级命中时即使父级不符也保留。sortChildrenRecord：对子级做本地排序。"
  >
    <Table :columns="childFilterColumns" :dataSource="childFilterData" defaultExpandAllRows :pagination="false" />
  </DemoBlock>

  <DemoBlock title="childrenRecordName / indentSize" desc="树形默认读 children；可用 childrenRecordName 改字段。indentSize 控制每层缩进（默认 20）。">
    <Table :columns="nestNamedColumns" :dataSource="nestNamedData" childrenRecordName="items" :indentSize="32" defaultExpandAllRows :pagination="false" />
  </DemoBlock>

  <DemoBlock title="RTL" desc="direction 覆盖 ConfigProvider。列 align / fixed 在 RTL 下自动左右对调（v2.31）。树形数据暂不支持 RTL。">
    <Table :columns="rtlColumns" :dataSource="simplePeople" direction="rtl" :pagination="false" />
  </DemoBlock>

  <DemoBlock
    title="变化后滚回顶部"
    desc="scroll.scrollToFirstRowOnChange：分页、排序、筛选变化后滚回顶部。设置了 scroll.y 时重置表体滚动。"
  >
    <Table :columns="sortFilterColumns" :dataSource="pageData" :pagination="pageCfg" :scroll="scrollTopOnChange" />
  </DemoBlock>

  <DemoBlock title="伸缩列 + 固定列" desc="resizable 与固定列同时使用时，需留一列不设 width。不推荐再叠加 scroll.x。">
    <Table :columns="resizableFixedColumns" :dataSource="fileData.slice(0, 6)" resizable bordered :pagination="false" />
  </DemoBlock>

  <DemoBlock title="分组虚拟化" desc="groupBy 可与 virtualized 组合。itemSize 可为 (index, { sectionRow, expandedRow }) => number。">
    <Table
      :dataSource="groupVirtualData"
      :rowKey="groupRowKey"
      groupBy="owner"
      :columns="groupColumns"
      :renderGroupSection="renderOwnerGroup"
      clickGroupedRowToExpand
      :pagination="false"
      :scroll="scrollY280"
      :virtualized="groupVirtualCfg"
      style="width: 100%"
    />
  </DemoBlock>

  <DemoBlock title="方法 getCurrentPageData" desc="通过 ref 调用 getCurrentPageData()，返回 { dataSource, groups }。">
    <Space style="margin-bottom: 12px">
      <Button @click="dumpPageData">读取当前页</Button>
      <span class="table-note">{{ pageSnapshot || '尚未读取' }}</span>
    </Space>
    <Table ref="tableMethodRef" :columns="peopleColumns" :dataSource="simplePeople.concat(simplePeople)" :pagination="pageSize3" />
  </DemoBlock>

  <DemoBlock
    title="Accessibility"
    desc="表格 role 为 grid（树形为 treegrid）；行为 row，单元格为 gridcell。含 aria-rowcount / aria-colcount、行 aria-rowindex、树形 aria-level、可展开 aria-expanded、单元格 aria-colindex。筛选/排序/行选择按钮带 aria-label。"
  />
</template>

<style scoped>
.table-note {
  margin: 0 0 12px;
  color: var(--semi-color-text-2);
  font-size: 13px;
}
.table-cell-hover :deep(.semi-table-tbody > .semi-table-row:hover > .semi-table-row-cell) {
  background-color: transparent;
}
.table-cell-hover :deep(.semi-table-tbody > .semi-table-row > .semi-table-row-cell:hover) {
  background-color: var(--semi-color-fill-0);
}
:deep(.table-col-resizing) {
  border-right: 2px solid var(--semi-color-primary);
}
</style>
