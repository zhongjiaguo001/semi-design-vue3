import Typography, { Text, Title, Paragraph, Numeral, typographyProps, textProps, titleProps, paragraphProps, numeralProps } from './Typography';
import Base, { baseTypographyProps, baseTypographyEmits } from './Base';
import Copyable, { copyableProps } from './Copyable';
import getRenderText, { copyTextToClipboard } from './util';

export {
  Typography,
  Text,
  Title,
  Paragraph,
  Numeral,
  Base as TypographyBase,
  Copyable,
  typographyProps,
  textProps,
  titleProps,
  paragraphProps,
  numeralProps,
  baseTypographyProps,
  baseTypographyEmits,
  copyableProps,
  getRenderText,
  copyTextToClipboard,
};
export * from './context';
export type {
  TypographyBaseType,
  TypographyBaseSize,
  TypographyBaseSpacing,
  TypographyBaseRule,
  TypographyBaseTruncate,
  TypographyWeight,
  EllipsisPos,
  ShowTooltip,
  Ellipsis,
  CopyableConfig,
  LinkType,
} from './Base';
export type { CopyableRender } from './Copyable';
export default Typography;
