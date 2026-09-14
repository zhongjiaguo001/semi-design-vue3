const modules = import.meta.glob('../official-md/*.md', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>;

const byLower: Record<string, string> = {};
for (const [p, raw] of Object.entries(modules)) {
  const file = p.split('/').pop() || '';
  const name = file.replace(/\.md$/, '');
  byLower[name.toLowerCase()] = raw;
}

const ALIAS: Record<string, string> = {
  autoComplete: 'autocomplete',
  datePicker: 'datepicker',
  inputNumber: 'inputnumber',
  timePicker: 'timepicker',
  tagInput: 'taginput',
  treeSelect: 'treeselect',
  colorPicker: 'colorpicker',
  pinCode: 'pincode',
  backTop: 'backtop',
  overflowList: 'overflowlist',
  sideSheet: 'sidesheet',
  scrollList: 'scrolllist',
  userGuide: 'userguide',
  floatButton: 'floatbutton',
  configProvider: 'configprovider',
  localeProvider: 'locale',
  markdownRender: 'markdownrender',
  codeHighlight: 'codehighlight',
  jsonViewer: 'jsonviewer',
  hotKeys: 'hotkeys',
  dragMove: 'dragmove',
  audioPlayer: 'audioplayer',
  videoPlayer: 'videoplayer',
  aiChatInput: 'aichatinput',
  aiChatDialogue: 'aichatdialogue',
  'getting-started': 'getting-started',
  vchart: 'chart',
  aiButton: 'button',
  aiTag: 'tag',
  aiIcon: 'icon',
  aiFloatButton: 'floatbutton',
};

export function getOfficialMarkdown(docKey: string): string | null {
  const direct = byLower[docKey.toLowerCase()];
  if (direct) return direct;
  const alias = ALIAS[docKey];
  if (alias && byLower[alias.toLowerCase()]) return byLower[alias.toLowerCase()];
  return null;
}

export function hasOfficialMarkdown(docKey: string): boolean {
  return getOfficialMarkdown(docKey) != null;
}
