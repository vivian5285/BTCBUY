import React from 'react';
import { Layout, Menu, Space, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

interface NavbarProps {
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({ children }) => {
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      // 处理退出登录
      localStorage.removeItem('token');
      navigate('/login');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      boxShadow: '0 1px 4px rgba(0,21,41,.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, marginRight: '24px' }}>BTCBuy 管理后台</h1>
        <Menu mode="horizontal" defaultSelectedKeys={['dashboard']}>
          <Menu.Item key="dashboard" onClick={() => navigate('/')}>
            仪表盘
          </Menu.Item>
          <Menu.Item key="merchants" onClick={() => navigate('/merchants')}>
            商户管理
          </Menu.Item>
          <Menu.Item key="withdrawals" onClick={() => navigate('/withdrawals')}>
            提现管理
          </Menu.Item>
          <Menu.Item key="commission" onClick={() => navigate('/commission')}>
            佣金管理
          </Menu.Item>
        </Menu>
      </div>
      
      <Space size="large">
        {children}
        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span>管理员</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default Navbar; 