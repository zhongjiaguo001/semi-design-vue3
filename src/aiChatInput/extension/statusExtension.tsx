import { Extension } from '@tiptap/core';
import type { RawCommands } from '@tiptap/core';

const SemiStatusExtension = Extension.create({
  name: 'SemiAIChatInput',
  addStorage() {
    return {
      allowHotKeySend: true,
    };
  },
  addCommands() {
    return {
      setAllowHotKeySendForSemiAIChatInput(allow: boolean) {
        return ({ storage }: any) => {
          storage.SemiAIChatInput.allowHotKeySend = allow;
        };
      },
    } as Partial<RawCommands>;
  },
});

export default SemiStatusExtension;
