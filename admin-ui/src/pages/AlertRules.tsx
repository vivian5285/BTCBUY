import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tag,
  Switch
} from 'antd';
import { useRequest } from 'ahooks';
import { api } from '../api';

const { Option } = Select;

interface AlertRule {
  id: string;
  name: string;
  type: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive';
  actions: string[];
  createdAt: string;
  updatedAt: string;
}

const AlertRules: React.FC = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);

  // 获取告警规则列表
  const { run: fetchRules } = useRequest(
    () => api.get('/admin/security/alert-rules'),
    {
      onSuccess: (res) => setRules(res.data),
      onError: () => message.error('获取告警规则失败')
    }
  );

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setVisible(true);
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/security/alert-rules/${id}`);
      message.success('删除告警规则成功');
      fetchRules();
    } catch (error) {
      message.error('删除告警规则失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRule) {
        await api.put(`/admin/security/alert-rules/${editingRule.id}`, values);
        message.success('更新告警规则成功');
      } else {
        await api.post('/admin/security/alert-rules', values);
        message.success('创建告警规则成功');
      }
      setVisible(false);
      fetchRules();
    } catch (error) {
      message.error(editingRule ? '更新告警规则失败' : '创建告警规则失败');
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '条件',
      dataIndex: 'condition',
      key: 'condition'
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      key: 'threshold'
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors = {
          low: 'green',
          medium: 'orange',
          high: 'red',
          critical: 'purple'
        };
        return <Tag color={colors[severity as keyof typeof colors]}>{severity}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'gray'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AlertRule) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="告警规则"
        extra={
          <Button type="primary" onClick={handleAdd}>
            添加规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑告警规则' : '添加告警规则'}
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="规则名称"
            name="name"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select>
              <Option value="login">登录失败</Option>
              <Option value="api">API调用</Option>
              <Option value="system">系统资源</Option>
              <Option value="security">安全事件</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="条件"
            name="condition"
            rules={[{ required: true, message: '请输入触发条件' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="阈值"
            name="threshold"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item
            label="严重程度"
            name="severity"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="critical">严重</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>

          <Form.Item
            label="动作"
            name="actions"
            rules={[{ required: true, message: '请选择动作' }]}
          >
            <Select mode="multiple">
              <Option value="email">发送邮件</Option>
              <Option value="sms">发送短信</Option>
              <Option value="webhook">Webhook</Option>
              <Option value="notification">系统通知</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlertRules; 