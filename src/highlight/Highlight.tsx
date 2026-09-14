import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/highlight/constants';
import HighlightFoundation from '@douyinfe/semi-foundation/lib/es/highlight/foundation';
import '@douyinfe/semi-foundation/lib/es/highlight/highlight.css';

const prefixCls = cssClasses.PREFIX;

export interface ComplexSearchWord {
  text: string;
  className?: string;
  style?: Record<string, string>;
}
export type SearchWord = string | ComplexSearchWord | undefined;
export type SearchWords = SearchWord[];

export const highlightProps = {
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  autoEscape: { type: Boolean, default: true },
  caseSensitive: { type: Boolean, default: false },
  sourceString: { type: String, default: '' },
  /** alias of `sourceString` */
  text: { type: String, default: undefined },
  searchWords: { type: [Array, String] as PropType<SearchWords | string>, default: () => [] },
  highlightStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  highlightClassName: { type: String, default: undefined },
  component: { type: String, default: 'mark' },
};

export interface HighlightOption {
  autoEscape?: boolean;
  caseSensitive?: boolean;
  highlightTag?: string;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
}

/** CSS properties that accept unitless numbers (React does not append `px` to these) */
const unitlessProps = new Set([
  'opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'zoom',
  'columnCount', 'gridRow', 'gridColumn', 'gridRowStart', 'gridRowEnd', 'gridColumnStart', 'gridColumnEnd',
  'orphans', 'widows', 'tabSize', 'fillOpacity', 'strokeOpacity', 'strokeWidth', 'animationIterationCount',
]);

/** React-like style normalization: numeric values get a `px` suffix (except unitless properties) */
export const normalizeHighlightStyle = (style?: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  if (!style) return out;
  Object.keys(style).forEach((key) => {
    const value = style[key];
    if (value === undefined || value === null) return;
    out[key] = typeof value === 'number' && value !== 0 && !unitlessProps.has(key) && !key.startsWith('--') ? `${value}px` : value;
  });
  return out;
};

/** the React `getHighLightTextHTML`: split a string into text / highlighted vnodes */
export const getHighLightTextHTML = ({
  sourceString = '',
  searchWords = [],
  option = { autoEscape: true, caseSensitive: false },
}: {
  sourceString?: string;
  searchWords?: SearchWords | string;
  option?: HighlightOption;
}) => {
  const chunks = new (HighlightFoundation as any)().findAll({ sourceString, searchWords, ...option });
  const markEle = option.highlightTag || 'mark';
  const highlightClassName = option.highlightClassName || '';
  const highlightStyle = option.highlightStyle || {};
  return chunks.map((chunk: any, index: number) => {
    const { end, start, highlight, style, className } = chunk;
    const text = sourceString.substr(start, end - start);
    if (highlight) {
      return h(markEle, { style: normalizeHighlightStyle({ ...highlightStyle, ...style }), class: `${highlightClassName} ${className || ''}`.trim(), key: text + index }, text);
    }
    return text;
  });
};

const Highlight = defineComponent({
  name: 'Highlight',
  props: highlightProps,
  setup(props, { expose }) {
    // React exposes `getHighLightTextHTML` as an instance method
    expose({ getHighLightTextHTML });
    return () => {
      const { searchWords, sourceString, text, component, highlightClassName, highlightStyle, caseSensitive, autoEscape } = props;
      const tagCls = cls({ [`${prefixCls}-tag`]: true }, highlightClassName);
      const option: HighlightOption = { highlightTag: component, highlightClassName: tagCls, highlightStyle, caseSensitive, autoEscape };
      return getHighLightTextHTML({ sourceString: text ?? sourceString, searchWords, option });
    };
  },
});
(Highlight as any).elementType = 'Highlight';

export default Highlight;
