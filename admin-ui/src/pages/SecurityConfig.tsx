import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  InputNumber,
  Button,
  message,
  Space,
  Divider,
  Typography,
  Select
} from 'antd';
import { useRequest } from 'ahooks';
import { api } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;

interface SecurityConfig {
  loginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUppercase: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  twoFactorAuth: boolean;
  jwtExpiration: number;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

const SecurityConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 获取安全配置
  const { run: fetchConfig } = useRequest(
    () => api.get('/admin/security/config'),
    {
      onSuccess: (res) => {
        form.setFieldsValue(res.data);
      },
      onError: () => message.error('获取安全配置失败')
    }
  );

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (values: SecurityConfig) => {
    setLoading(true);
    try {
      await api.put('/admin/security/config', values);
      message.success('更新安全配置成功');
    } catch (error) {
      message.error('更新安全配置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>安全配置</Title>
      <Text type="secondary">
        配置系统安全策略，包括登录限制、密码策略、会话管理等
      </Text>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          loginAttempts: 5,
          lockoutDuration: 30,
          passwordMinLength: 8,
          passwordRequireSpecial: true,
          passwordRequireNumber: true,
          passwordRequireUppercase: true,
          sessionTimeout: 120,
          twoFactorAuth: false,
          jwtExpiration: 24,
          rateLimit: {
            windowMs: 15,
            max: 100
          }
        }}
      >
        <Card title="登录安全" style={{ marginBottom: 16 }}>
          <Form.Item
            label="最大登录尝试次数"
            name="loginAttempts"
            rules={[{ required: true, message: '请输入最大登录尝试次数' }]}
          >
            <InputNumber min={1} max={10} />
          </Form.Item>

          <Form.Item
            label="账户锁定时间（分钟）"
            name="lockoutDuration"
            rules={[{ required: true, message: '请输入账户锁定时间' }]}
          >
            <InputNumber min={1} max={1440} />
          </Form.Item>

          <Form.Item
            label="启用双因素认证"
            name="twoFactorAuth"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Card title="密码策略" style={{ marginBottom: 16 }}>
          <Form.Item
            label="最小密码长度"
            name="passwordMinLength"
            rules={[{ required: true, message: '请输入最小密码长度' }]}
          >
            <InputNumber min={6} max={32} />
          </Form.Item>

          <Form.Item
            label="要求特殊字符"
            name="passwordRequireSpecial"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="要求数字"
            name="passwordRequireNumber"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="要求大写字母"
            name="passwordRequireUppercase"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Card title="会话管理" style={{ marginBottom: 16 }}>
          <Form.Item
            label="会话超时时间（分钟）"
            name="sessionTimeout"
            rules={[{ required: true, message: '请输入会话超时时间' }]}
          >
            <InputNumber min={5} max={1440} />
          </Form.Item>

          <Form.Item
            label="JWT过期时间（小时）"
            name="jwtExpiration"
            rules={[{ required: true, message: '请输入JWT过期时间' }]}
          >
            <InputNumber min={1} max={72} />
          </Form.Item>
        </Card>

        <Card title="访问控制" style={{ marginBottom: 16 }}>
          <Form.Item
            label="IP白名单"
            name="ipWhitelist"
            extra="每行一个IP地址"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="IP黑名单"
            name="ipBlacklist"
            extra="每行一个IP地址"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Card>

        <Card title="速率限制" style={{ marginBottom: 16 }}>
          <Form.Item
            label="时间窗口（分钟）"
            name={['rateLimit', 'windowMs']}
            rules={[{ required: true, message: '请输入时间窗口' }]}
          >
            <InputNumber min={1} max={60} />
          </Form.Item>

          <Form.Item
            label="最大请求次数"
            name={['rateLimit', 'max']}
            rules={[{ required: true, message: '请输入最大请求次数' }]}
          >
            <InputNumber min={1} max={1000} />
          </Form.Item>
        </Card>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存配置
            </Button>
            <Button onClick={() => fetchConfig()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SecurityConfig; 