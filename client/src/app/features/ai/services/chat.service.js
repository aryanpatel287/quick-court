import axios from 'axios';

const aiApi = axios.create({
    baseURL: '/api/ai',
    withCredentials: true,
});

export async function getChats() {
    const response = await aiApi.get('/chats');
    return response.data.chats || [];
}

export async function getChatDetails(chatId) {
    const response = await aiApi.get(`/chats/${chatId}`);
    return response.data.chat;
}

export async function renameChat(chatId, title) {
    const response = await aiApi.patch(`/chats/${chatId}`, { title });
    return response.data.chat;
}

export async function deleteChat(chatId) {
    await aiApi.delete(`/chats/${chatId}`);
}
