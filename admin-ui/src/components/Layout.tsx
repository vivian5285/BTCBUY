import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  BellOutlined,
  ShopOutlined,
  DollarOutlined,
  WalletOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

interface LayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: <Link to="/notifications">通知管理</Link>,
    },
    {
      key: '/merchants',
      icon: <ShopOutlined />,
      label: <Link to="/merchants">商户管理</Link>,
    },
    {
      key: '/commission',
      icon: <DollarOutlined />,
      label: <Link to="/commission">佣金管理</Link>,
    },
    {
      key: '/withdrawals',
      icon: <WalletOutlined />,
      label: <Link to="/withdrawals">提现管理</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="light">
        <div className="p-4 text-center text-xl font-bold">
          管理后台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0 }} />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 