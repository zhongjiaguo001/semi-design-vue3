import FloatButton, { floatButtonProps, floatButtonEmits } from './FloatButton';
import FloatButtonGroup, { floatButtonGroupProps, floatButtonGroupEmits } from './FloatButtonGroup';

(FloatButton as any).Group = FloatButtonGroup;

export { FloatButton, FloatButtonGroup, floatButtonProps, floatButtonEmits, floatButtonGroupProps, floatButtonGroupEmits };
export type { FloatButtonShape, FloatButtonSize } from './FloatButton';
export type { FloatButtonGroupItem } from './FloatButtonGroup';
export default FloatButton;
