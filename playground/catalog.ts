/** Menu tree aligned with https://semi.design/zh-CN/start/overview */

export interface DocItem {
  key: string;
  title: string;
  brief?: string;
  skipped?: boolean;
}

export interface DocGroup {
  key: string;
  title: string;
  items: DocItem[];
}

export const catalog: DocGroup[] = [
  {
    key: 'start',
    title: '开始',
    items: [
      { key: 'introduction', title: 'Introduction 介绍', brief: 'Semi Design 是一个设计系统，定义了一套中后台设计与前端基础组件。' },
      { key: 'getting-started', title: 'Getting Started 快速开始', brief: '在 Vue 3 项目中安装并使用 Semi Design Vue。' },
      { key: 'mcp-skills', title: 'MCP / Skills', brief: '用 MCP 让 AI 查询 Vue 组件文档、示例和适配层源码。' },
      { key: 'overview', title: 'Overview 组件总览', brief: '按官网分类浏览全部组件。' },
    ],
  },
  {
    key: 'basic',
    title: '基础',
    items: [
      { key: 'divider', title: 'Divider 分割线', brief: '区隔内容的分割线。' },
      { key: 'grid', title: 'Grid 栅格', brief: '24 栅格系统，通过 Row / Col 进行布局。' },
      { key: 'icon', title: 'Icon 图标', brief: '语义化的矢量图形，包含 500+ 内置图标。' },
      { key: 'layout', title: 'Layout 布局', brief: '页面级布局容器，包含 Header / Sider / Content / Footer。' },
      { key: 'space', title: 'Space 间距', brief: '设置组件之间的间距。' },
      { key: 'typography', title: 'Typography 版式', brief: '排版：标题、正文、文本、可复制与省略。' },
      { key: 'floatButton', title: 'FloatButton 悬浮按钮', brief: '悬浮于页面的快捷操作按钮。' },
    ],
  },
  {
    key: 'ai',
    title: 'AI 组件',
    items: [
      { key: 'aiIcon', title: 'AIIcon 图标', brief: 'AI 风格图标（IconAI*），配合 colorful 使用。' },
      { key: 'aiButton', title: 'AIButton 按钮', brief: 'Button 的 colorful 多彩风格，即官网 AIButton。' },
      { key: 'aiTag', title: 'AITag 标签', brief: 'Tag 的 colorful 多彩风格，即官网 AITag。' },
      { key: 'aiFloatButton', title: 'AIFloatButton 悬浮按钮', brief: 'FloatButton 的 colorful 风格。' },
      { key: 'aiChatInput', title: 'AIChatInput 聊天输入框', brief: 'AI 对话输入。基于 TipTap 的富文本，含 skill/input/select slot、技能/建议/模板与 Configure。' },
      { key: 'aiChatDialogue', title: 'AIChatDialogue AI 对话', brief: 'AI 对话消息列表。' },
    ],
  },
  {
    key: 'plus',
    title: 'Plus 组件',
    items: [
      { key: 'codeHighlight', title: 'CodeHighlight 代码高亮', brief: '基于 Prism 的代码高亮。' },
      { key: 'markdownRender', title: 'Markdown 渲染器', brief: '将 Markdown / MDX 渲染为 Semi 排版组件。' },
      { key: 'lottie', title: 'Lottie 动画', brief: '播放 Lottie JSON 动画。' },
      { key: 'chat', title: 'Chat 对话', brief: '通用聊天会话组件。' },
      { key: 'hotKeys', title: 'HotKeys 快捷键', brief: '展示或监听键盘快捷键。' },
      { key: 'dragMove', title: 'DragMove 拖拽移动', brief: '让元素可拖拽移动。' },
      { key: 'jsonViewer', title: 'JsonViewer Json编辑器', brief: 'JSON 查看与编辑。' },
      { key: 'audioPlayer', title: 'AudioPlayer 音频播放器', brief: '音频播放控件。' },
      { key: 'videoPlayer', title: 'VideoPlayer 视频播放器', brief: '视频播放控件。' },
    ],
  },
  {
    key: 'cat-input',
    title: '输入类',
    items: [
      { key: 'autoComplete', title: 'AutoComplete 自动完成', brief: '输入时给出匹配建议。' },
      { key: 'cascader', title: 'Cascader 级联选择', brief: '多级数据的级联选择。' },
      { key: 'button', title: 'Button 按钮', brief: '触发操作或跳转。' },
      { key: 'checkbox', title: 'Checkbox 复选框', brief: '在一组选项中进行多选。' },
      { key: 'datePicker', title: 'DatePicker 日期选择器', brief: '选择日期或日期范围。' },
      { key: 'form', title: 'Form 表单', brief: '高性能表单控件，数据域管理。' },
      { key: 'input', title: 'Input 输入框', brief: '通过鼠标或键盘输入内容。' },
      { key: 'inputNumber', title: 'InputNumber 数字输入框', brief: '仅允许输入标准数字值。' },
      { key: 'pinCode', title: 'PinCode 验证码输入', brief: '分段验证码输入。' },
      { key: 'radio', title: 'Radio 单选框', brief: '在一组选项中进行单选。' },
      { key: 'rating', title: 'Rating 评分', brief: '对事物进行评级操作。' },
      { key: 'select', title: 'Select 选择器', brief: '弹出下拉菜单供用户选择。' },
      { key: 'slider', title: 'Slider 滑动选择器', brief: '滑动输入值。' },
      { key: 'switch', title: 'Switch 开关', brief: '切换两种状态。' },
      { key: 'tagInput', title: 'TagInput 标签输入框', brief: '输入并生成标签。' },
      { key: 'timePicker', title: 'TimePicker 时间选择器', brief: '选择时间。' },
      { key: 'transfer', title: 'Transfer 穿梭框', brief: '两栏数据选择。' },
      { key: 'treeSelect', title: 'TreeSelect 树选择器', brief: '树形结构的选择器。' },
      { key: 'upload', title: 'Upload 上传', brief: '文件选择与上传。' },
      { key: 'colorPicker', title: 'ColorPicker 颜色选择器', brief: '选择颜色（foundation 组件）。' },
    ],
  },
  {
    key: 'cat-navigation',
    title: '导航类',
    items: [
      { key: 'anchor', title: 'Anchor 锚点', brief: '跳转到页面指定位置。' },
      { key: 'backTop', title: 'BackTop 回到顶部', brief: '返回页面顶部。' },
      { key: 'breadcrumb', title: 'Breadcrumb 面包屑', brief: '显示当前页面在系统层级中的位置。' },
      { key: 'navigation', title: 'Navigation 导航', brief: '为页面提供导航的菜单。' },
      { key: 'pagination', title: 'Pagination 翻页器', brief: '采用分页的形式分隔长列表。' },
      { key: 'steps', title: 'Steps 步骤', brief: '引导用户按流程完成任务。' },
      { key: 'tabs', title: 'Tabs 标签栏', brief: '平级内容的分组切换。' },
      { key: 'tree', title: 'Tree 树形控件', brief: '多层次结构的展示与选择。' },
    ],
  },
  {
    key: 'display',
    title: '展示类',
    items: [
      { key: 'avatar', title: 'Avatar 头像', brief: '用来代表用户或事物。' },
      { key: 'badge', title: 'Badge 徽章', brief: '图标右上角的圆形徽标数字。' },
      { key: 'calendar', title: 'Calendar 日历', brief: '展示日期与日程。' },
      { key: 'card', title: 'Card 卡片', brief: '承载信息的容器。' },
      { key: 'carousel', title: 'Carousel 轮播图', brief: '旋转木马，一组内容轮流展示。' },
      { key: 'collapse', title: 'Collapse 折叠面板', brief: '折叠/展开内容区域。' },
      { key: 'collapsible', title: 'Collapsible 折叠', brief: '对子元素进行展开收起。' },
      { key: 'descriptions', title: 'Descriptions 描述列表', brief: '成组展示多个只读字段。' },
      { key: 'dropdown', title: 'Dropdown 下拉框', brief: '向下弹出的列表。' },
      { key: 'empty', title: 'Empty 空状态', brief: '空数据占位。' },
      { key: 'highlight', title: 'Highlight 高亮文本', brief: '在文本中高亮关键词。' },
      { key: 'image', title: 'Image 图片', brief: '图片展示与预览。' },
      { key: 'cropper', title: 'Cropper 图片裁切', brief: '对图片进行裁切。' },
      { key: 'list', title: 'List 列表', brief: '最基础的列表展示。' },
      { key: 'modal', title: 'Modal 模态对话框', brief: '模态对话框，展示重要信息或操作。' },
      { key: 'overflowList', title: 'OverflowList 折叠列表', brief: '空间不足时折叠溢出项。' },
      { key: 'popover', title: 'Popover 气泡卡片', brief: '点击/悬停弹出的卡片浮层。' },
      { key: 'scrollList', title: 'ScrollList 滚动列表', brief: '滚动选择列表。' },
      { key: 'sideSheet', title: 'SideSheet 滑动侧边栏', brief: '从屏幕边缘滑出的面板。' },
      { key: 'table', title: 'Table 表格', brief: '表格用于呈现结构化的数据内容，通常会伴随提供对数据进行操作（排序、搜索、分页……）的能力。' },
      { key: 'tag', title: 'Tag 标签', brief: '进行标记和分类。' },
      { key: 'timeline', title: 'Timeline 时间轴', brief: '垂直展示的时间流信息。' },
      { key: 'tooltip', title: 'Tooltip 工具提示', brief: '简单的文字提示气泡。' },
      { key: 'userGuide', title: 'UserGuide 用户引导', brief: '分步引导用户了解功能。' },
      { key: 'vchart', title: 'VChart 图表', brief: '官方图表组件。本仓库按需求未移植。', skipped: true },
      { key: 'resizable', title: 'Resizable 调整尺寸', brief: '可拖拽调整宽高的容器。' },
    ],
  },
  {
    key: 'feedback',
    title: '反馈类',
    items: [
      { key: 'banner', title: 'Banner 通知横幅', brief: '展示系统级通知。' },
      { key: 'notification', title: 'Notification 通知', brief: '全局展示通知提醒信息。' },
      { key: 'feedback', title: 'Feedback 反馈', brief: '收集用户反馈。' },
      { key: 'popconfirm', title: 'Popconfirm 气泡确认框', brief: '点击元素弹出气泡确认。' },
      { key: 'progress', title: 'Progress 进度条', brief: '展示操作的当前进度。' },
      { key: 'skeleton', title: 'Skeleton 骨架屏', brief: '在内容加载过程中提供占位。' },
      { key: 'spin', title: 'Spin 加载器', brief: '用于页面或区块的加载中状态。' },
      { key: 'toast', title: 'Toast 提示', brief: '轻量级全局反馈。' },
    ],
  },
  {
    key: 'other',
    title: '其他',
    items: [
      { key: 'configProvider', title: 'ConfigProvider 全局配置', brief: '为组件提供统一的全局化配置。' },
      { key: 'localeProvider', title: 'LocaleProvider 多语言', brief: '配置组件文案语言。' },
      { key: 'sidebar', title: 'Sidebar 侧边栏', brief: '侧边配置面板（foundation 组件）。' },
    ],
  },
];

export const allItems: DocItem[] = catalog.flatMap((g) => g.items);

export function findItem(key: string): DocItem | undefined {
  return allItems.find((i) => i.key === key);
}

export const defaultPage = 'getting-started';
