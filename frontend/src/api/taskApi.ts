import axios from 'axios';
const baseURL = 'http://localhost:5172';
axios.defaults.baseURL = baseURL;
// 1. 获取所有任务
export const fetchAllTasks = async () => {
    try {
        const response = await axios.get('/tasks');
        return response.data;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};

// 2. 创建任务
export const createTask = async (prompt: string) => {
    try {
        const response = await axios.post('/tasks', { prompt });
        return response.data.task_id;
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
};

// 3. 获取任务事件流
export const getTaskEvents = async (taskId: string) => {
    try {
        const eventSource = new EventSource(`${baseURL}/tasks/${taskId}/events`);
        return eventSource;
    } catch (error) {
        console.error('Error getting task events:', error);
        throw error;
    }
};

// 4. 检查配置状态
export const checkConfigStatus = async () => {
    try {
        const response = await axios.get('/config/status');
        return response.data;
    } catch (error) {
        console.error('Error checking config status:', error);
        throw error;
    }
};

// 5. 获取单个任务
export const getTask = async (taskId: string) => {
    try {
        const response = await axios.get(`/tasks/${taskId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting task:', error);
        throw error;
    }
};

// 6. 保存配置
export const saveConfig = async (configData: any) => {
    try {
        const response = await axios.post('/config/save', configData);
        return response.data;
    } catch (error) {
        console.error('Error saving config:', error);
        throw error;
    }
};

// 7. 文件下载
export const downloadFile = async (filePath: string) => {
    try {
        const response = await axios.get(`/download?file_path=${filePath}`, {
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
};