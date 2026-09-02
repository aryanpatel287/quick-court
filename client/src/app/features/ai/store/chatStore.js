let state = {
    chats: [],
    messages: [],
    selectedChatId: null,
    isStreaming: false,
    toolStatus: null,
    attachedFiles: [],
    isUploading: false,
    error: null,
    abortController: null,
};

const listeners = new Set();

export const chatStore = {
    subscribe(listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    getSnapshot() {
        return state;
    },

    notify() {
        listeners.forEach((listener) => listener());
    },

    setState(nextState) {
        state = { ...state, ...nextState };
        this.notify();
    },

    setChats(chats) {
        this.setState({ chats });
    },

    setMessages(messages) {
        // Normalize backend fields if required, converting role 'ai' to 'assistant'
        const normalized = messages.map((msg) => ({
            id: msg.id,
            from: msg.role === 'ai' ? 'assistant' : msg.role,
            text: msg.content,
            createdAt: msg.createdAt,
        }));
        this.setState({ messages: normalized });
    },

    setSelectedChatId(selectedChatId) {
        this.setState({ selectedChatId });
    },

    createChat(chat) {
        const list = [chat, ...state.chats];
        this.setState({ chats: list });
    },

    removeChat(chatId) {
        const list = state.chats.filter((c) => c.id !== chatId);
        let activeId = state.selectedChatId;
        if (activeId === chatId) {
            activeId = list.length > 0 ? list[0].id : null;
        }
        this.setState({ chats: list, selectedChatId: activeId });
    },

    renameChat(chatId, title) {
        const list = state.chats.map((c) => (c.id === chatId ? { ...c, title } : c));
        this.setState({ chats: list });
    },

    addUserMessage(msg) {
        const normalizedMsg = {
            id: msg.id || `msg-${Date.now()}`,
            from: msg.role === 'user' ? 'user' : msg.role,
            text: msg.content,
            createdAt: msg.createdAt || new Date().toISOString(),
        };
        this.setState({
            messages: [...state.messages, normalizedMsg],
        });
    },

    addAssistantMessage(msg) {
        const normalizedMsg = {
            id: msg.id || `msg-${Date.now()}`,
            from: msg.role === 'ai' ? 'assistant' : msg.role,
            text: msg.content,
            createdAt: msg.createdAt || new Date().toISOString(),
        };
        this.setState({
            messages: [...state.messages, normalizedMsg],
        });
    },

    appendAssistantToken(token) {
        const len = state.messages.length;
        if (len === 0) return;
        const lastMsg = state.messages[len - 1];
        if (lastMsg.from !== 'assistant') return;

        const updatedMsg = { ...lastMsg, text: lastMsg.text + token };
        const newMessages = [...state.messages];
        newMessages[len - 1] = updatedMsg;
        this.setState({ messages: newMessages });
    },

    replaceAssistantMessage(content) {
        const len = state.messages.length;
        if (len === 0) return;
        const lastMsg = state.messages[len - 1];
        if (lastMsg.from !== 'assistant') return;

        const updatedMsg = { ...lastMsg, text: content };
        const newMessages = [...state.messages];
        newMessages[len - 1] = updatedMsg;
        this.setState({ messages: newMessages });
    },

    setStreaming(isStreaming) {
        this.setState({ isStreaming });
    },

    startTool(toolName) {
        this.setState({ toolStatus: toolName });
    },

    finishTool() {
        this.setState({ toolStatus: null });
    },

    setToolStatus(toolStatus) {
        this.setState({ toolStatus });
    },

    setError(error) {
        this.setState({ error });
    },

    setAbortController(abortController) {
        this.setState({ abortController });
    },

    updateChatSession(tempId, realId, title) {
        // Swap temp selection to real selection
        const newSelectedId = state.selectedChatId === tempId ? realId : state.selectedChatId;

        // If the chat already exists in the sidebar, update its details. Otherwise add it.
        const chatExists = state.chats.some((c) => c.id === realId || c.id === tempId);
        let updatedChats;

        if (chatExists) {
            updatedChats = state.chats.map((c) =>
                c.id === tempId || c.id === realId ? { ...c, id: realId, title } : c,
            );
        } else {
            updatedChats = [{ id: realId, title }, ...state.chats];
        }

        this.setState({
            chats: updatedChats,
            selectedChatId: newSelectedId,
        });
    },

    clear() {
        this.setState({
            chats: [],
            messages: [],
            selectedChatId: null,
            isStreaming: false,
            toolStatus: null,
            attachedFiles: [],
            isUploading: false,
            error: null,
            abortController: null,
        });
    },

    clearConversation() {
        this.setState({
            messages: [],
            error: null,
            toolStatus: null,
            isStreaming: false,
        });
    },

    setAttachedFiles(attachedFiles) {
        this.setState({ attachedFiles });
    },

    addAttachedFile(file) {
        this.setState({
            attachedFiles: [...state.attachedFiles, file],
        });
    },

    updateAttachedFile(fileId, updates) {
        const files = state.attachedFiles.map((f) => (f.id === fileId ? { ...f, ...updates } : f));
        this.setState({ attachedFiles: files });
    },

    removeAttachedFile(fileId) {
        const files = state.attachedFiles.filter((f) => f.id !== fileId);
        this.setState({ attachedFiles: files });
    },

    setUploading(isUploading) {
        this.setState({ isUploading });
    },
};
