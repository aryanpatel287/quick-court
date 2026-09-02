import { useSyncExternalStore } from 'react';
import { chatStore } from './chatStore';

export function useChatStore() {
    return useSyncExternalStore(chatStore.subscribe, chatStore.getSnapshot);
}
