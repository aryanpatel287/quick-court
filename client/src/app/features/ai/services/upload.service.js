import axios from 'axios';

const aiApi = axios.create({
    baseURL: '/api/ai',
    withCredentials: true,
});

export async function uploadFiles(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    const response = await aiApi.post('/chat/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data.uploadedFiles || [];
}
