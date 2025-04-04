import { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    borderRadius: 6,
  },
  components: {
    Card: {
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    Button: {
      borderRadius: 6,
    },
    Table: {
      borderRadius: 8,
    },
  },
};

export const layoutStyles = {
  container: 'container mx-auto px-4 py-8',
  card: 'bg-white rounded-lg shadow-md',
  button: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none hover:from-blue-600 hover:to-blue-700',
}; 