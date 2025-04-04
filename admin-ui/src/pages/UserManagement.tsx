import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Modal, message, Select, Statistic, Row, Col } from 'antd';
import { userService } from '../services/userService';
import { User } from '../types/user';

const { Option } = Select;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    merchants: 0,
    admins: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers(
        pagination.current,
        pagination.pageSize
      );
      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await userService.getUserStats();
      setStats(data);
    } catch (error) {
      message.error('获取统计数据失败');
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await userService.updateUser(userId, { role: role as any });
      message.success('用户角色更新成功');
      fetchUsers();
    } catch (error) {
      message.error('更新用户角色失败');
    }
  };

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await userService.updateUser(userId, { status: status as any });
      message.success('用户状态更新成功');
      fetchUsers();
    } catch (error) {
      message.error('更新用户状态失败');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'merchant':
        return 'blue';
      default:
        return 'green';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'banned':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '钱包地址',
      dataIndex: 'walletAddress',
      key: 'walletAddress',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <Select
          defaultValue={role}
          style={{ width: 120 }}
          onChange={(value) => handleRoleChange(record.id, value)}
        >
          <Option value="user">用户</Option>
          <Option value="merchant">商家</Option>
          <Option value="admin">管理员</Option>
        </Select>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: User) => (
        <Select
          defaultValue={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          <Option value="active">活跃</Option>
          <Option value="inactive">非活跃</Option>
          <Option value="banned">封禁</Option>
        </Select>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="商家数量"
              value={stats.merchants}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管理员数量"
              value={stats.admins}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize
              }));
            },
          }}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default UserManagement; 