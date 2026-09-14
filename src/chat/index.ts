import Chat, { chatProps, chatEmits } from './Chat';
import ChatContent from './chatContent';
import InputBox from './inputBox';
import Hint from './hint';
import Attachment, { FileAttachment, ImageAttachment } from './attachment';
import ChatBox from './chatBox';

export {
  Chat,
  chatProps,
  chatEmits,
  ChatContent,
  InputBox,
  Hint,
  Attachment,
  FileAttachment,
  ImageAttachment,
  ChatBox,
};
export type { Message } from '@douyinfe/semi-foundation/lib/es/chat/foundation';
export type {
  ChatProps,
  ChatBoxRenderConfig,
  RenderInputAreaProps,
  RoleConfig,
  Metadata,
  CommonChatsProps,
  RenderTitleProps,
  RenderAvatarProps,
  RenderContentProps,
  RenderActionProps,
  RenderFullChatBoxProps,
  DefaultActionNodeObj,
  FullChatBoxNodes,
} from './interface';
export default Chat;
