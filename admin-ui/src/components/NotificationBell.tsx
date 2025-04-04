import React, { useState, useEffect } from 'react';
import { Badge, Popover, List, Button, message, Typography, Space, Tag } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { getAdminNotifications, markNotificationAsRead } from '../api/notification';

const { Text } = Typography;

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  createdAt: string;
  isRead: boolean;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getAdminNotifications();
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      message.error('获取通知失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000); // 每30秒刷新一次
    return () => clearInterval(timer);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      message.error('标记通知已读失败');
    }
  };

  const getNotificationType = (type: string) => {
    const types = {
      INFO: { color: 'blue', text: '信息' },
      WARNING: { color: 'orange', text: '警告' },
      ERROR: { color: 'red', text: '错误' },
      SUCCESS: { color: 'green', text: '成功' }
    };
    return types[type as keyof typeof types] || types.INFO;
  };

  const content = (
    <div style={{ width: 300 }}>
      <List
        loading={loading}
        dataSource={notifications}
        renderItem={item => (
          <List.Item
            actions={[
              !item.isRead && (
                <Button type="link" onClick={() => handleMarkAsRead(item.id)}>
                  标记已读
                </Button>
              )
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Tag color={getNotificationType(item.type).color}>
                    {getNotificationType(item.type).text}
                  </Tag>
                  <Text strong={!item.isRead}>{item.title}</Text>
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text>{item.content}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell; 