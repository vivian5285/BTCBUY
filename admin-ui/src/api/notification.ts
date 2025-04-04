import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

interface NotificationResponse {
  data: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: string;
  }>;
}

export const getAdminNotifications = async (): Promise<NotificationResponse> => {
  const token = localStorage.getItem('token');
  return axios.get(`${API_BASE_URL}/admin/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const markNotificationAsRead = async (id: string): Promise<{ data: any }> => {
  const token = localStorage.getItem('token');
  return axios.patch(
    `${API_BASE_URL}/admin/notifications/${id}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};

export const deleteNotification = async (id: string): Promise<{ data: any }> => {
  const token = localStorage.getItem('token');
  return axios.delete(`${API_BASE_URL}/admin/notifications/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const deleteAllNotifications = async (): Promise<{ data: any }> => {
  const token = localStorage.getItem('token');
  return axios.delete(`${API_BASE_URL}/admin/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const sendNotification = async (data: {
  title: string;
  message: string;
  type: string;
  targetUsers?: string[];
  data?: any;
}): Promise<{ data: any }> => {
  const token = localStorage.getItem('token');
  return axios.post(
    `${API_BASE_URL}/admin/notifications`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}; 