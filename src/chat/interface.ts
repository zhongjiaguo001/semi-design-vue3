import type { CSSProperties, VNodeChild } from 'vue';
import type { Message, EnableUploadProps } from '@douyinfe/semi-foundation/lib/es/chat/foundation';

export type { Message, EnableUploadProps };

export interface Metadata {
  name?: string;
  avatar?: VNodeChild | string;
  color?: string;
  [x: string]: any;
}

export interface RoleConfig {
  user?: Metadata;
  assistant?: Metadata;
  system?: Metadata;
  [x: string]: Metadata | undefined;
}

export interface RenderTitleProps {
  message?: Message;
  role?: Metadata;
  defaultTitle?: VNodeChild;
}

export interface RenderAvatarProps {
  message?: Message;
  role?: Metadata;
  defaultAvatar?: VNodeChild;
}

export interface RenderContentProps {
  message?: Message;
  role?: Metadata;
  defaultContent?: VNodeChild | VNodeChild[];
  className?: string;
}

export interface DefaultActionNodeObj {
  copyNode: VNodeChild;
  likeNode: VNodeChild;
  dislikeNode: VNodeChild;
  resetNode: VNodeChild;
  deleteNode: VNodeChild;
}

export interface RenderActionProps {
  message?: Message;
  defaultActions?: VNodeChild | VNodeChild[];
  className: string;
  defaultActionsObj?: DefaultActionNodeObj;
}

export interface FullChatBoxNodes {
  avatar?: VNodeChild;
  title?: VNodeChild;
  content?: VNodeChild;
  action?: VNodeChild;
}

export interface RenderFullChatBoxProps {
  message?: Message;
  role?: Metadata;
  defaultNodes?: FullChatBoxNodes;
  className: string;
}

export interface ChatBoxRenderConfig {
  renderChatBoxTitle?: (props: RenderTitleProps) => VNodeChild;
  renderChatBoxAvatar?: (props: RenderAvatarProps) => VNodeChild;
  renderChatBoxContent?: (props: RenderContentProps) => VNodeChild;
  renderChatBoxAction?: (props: RenderActionProps) => VNodeChild;
  renderFullChatBox?: (props: RenderFullChatBoxProps) => VNodeChild;
}

export interface RenderInputAreaProps {
  defaultNode?: VNodeChild;
  onSend?: (content?: string, attachment?: any[]) => void;
  onClear?: (e?: any) => void;
  detailProps?: {
    clearContextNode?: VNodeChild;
    uploadNode?: VNodeChild;
    inputNode?: VNodeChild;
    sendNode?: VNodeChild;
    onClick?: (e?: MouseEvent) => void;
  };
}

export interface CommonChatsProps {
  align?: 'leftRight' | 'leftAlign';
  mode?: 'bubble' | 'noBubble' | 'userBubble';
  chats?: Message[];
  escapeHtml?: boolean;
  roleConfig?: RoleConfig;
  onMessageDelete?: (message?: Message) => void;
  onChatsChange?: (chats?: Message[]) => void;
  onMessageBadFeedback?: (message?: Message) => void;
  onMessageGoodFeedback?: (message?: Message) => void;
  onMessageReset?: (message?: Message) => void;
  onMessageCopy?: (message?: Message) => void;
  chatBoxRenderConfig?: ChatBoxRenderConfig;
  customMarkDownComponents?: Record<string, any>;
  renderDivider?: (message?: Message) => VNodeChild;
  markdownRenderProps?: Record<string, any>;
}

export interface ChatProps extends CommonChatsProps {
  style?: CSSProperties;
  className?: string;
  canSend?: boolean;
  hints?: string[];
  renderHintBox?: (props: { content: string; index: number; onHintClick: () => void }) => VNodeChild;
  onHintClick?: (hint: string) => void;
  onStopGenerator?: (e?: MouseEvent) => void;
  onClear?: () => void;
  onInputChange?: (props: { value?: string; attachment?: any[] }) => void;
  onMessageSend?: (content: string, attachment: any[]) => void;
  inputBoxStyle?: CSSProperties;
  inputBoxCls?: string;
  renderInputArea?: (props?: RenderInputAreaProps) => VNodeChild;
  placeholder?: string;
  topSlot?: VNodeChild | VNodeChild[];
  bottomSlot?: VNodeChild | VNodeChild[];
  showStopGenerate?: boolean;
  hintStyle?: CSSProperties;
  hintCls?: string;
  uploadProps?: Record<string, any>;
  uploadTipProps?: Record<string, any>;
  showClearContext?: boolean;
  sendHotKey?: 'enter' | 'shift+enter';
  enableUpload?: boolean | EnableUploadProps;
}
