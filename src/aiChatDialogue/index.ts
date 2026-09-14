import AIChatDialogue, { aiChatDialogueProps, aiChatDialogueEmits } from './AIChatDialogue';
import DialogueItem from './Dialogue';
import DialogueHint from './widgets/dialogueHint';
import { ReasoningWidget } from './widgets/contentItem/reasoning';
import { DialogueStepWidget } from './widgets/contentItem/dialogueStep';
import { AnnotationWidget } from './widgets/contentItem/annotation';
import { ReferenceWidget } from './widgets/contentItem/reference';
import Code from './widgets/contentItem/code';

export {
  AIChatDialogue,
  aiChatDialogueProps,
  aiChatDialogueEmits,
  DialogueItem,
  DialogueHint,
  ReasoningWidget,
  DialogueStepWidget,
  AnnotationWidget,
  ReferenceWidget,
  Code,
};
export type { Message as DialogueMessage } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation';
export {
  chatCompletionToMessage,
  streamingChatCompletionToMessage,
  responseToMessage,
  streamingResponseToMessage,
  chatInputToMessage,
  chatInputToChatCompletion,
  messageToChatInput,
} from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/dataAdapter';
export default AIChatDialogue;
