import Row, { rowProps, defaultResponsiveMap } from './Row';
import Col, { colProps } from './Col';

// renamed on purpose: `defaultResponsiveMap` is already exported by ConfigProvider
export { Row, Col, rowProps, colProps, defaultResponsiveMap as gridResponsiveMap };
export * from './context';
export type { Breakpoint, Gutter, RowType, RowAlign, RowJustify } from './Row';
export type { ColSize, ColResponsive } from './Col';
export default Row;
