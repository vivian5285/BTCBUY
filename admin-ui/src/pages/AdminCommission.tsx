import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Modal, Input, Typography, Tag, Space, Form, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { layoutStyles } from '../theme';
import { getCommissionRules, setCommissionRate, addCommissionRule, updateCommissionRule, deleteCommissionRule } from '../api/admin';
import { CommissionRule } from '../types/referral';

const { Title } = Typography;
const { confirm } = Modal;

const AdminCommission: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [form] = Form.useForm();
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await getCommissionRules();
      setRules(response.data);
    } catch (error) {
      message.error('获取佣金规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条佣金规则吗？',
      onOk: async () => {
        try {
          await deleteCommissionRule(id);
          message.success('删除成功');
          fetchRules();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRule) {
        await updateCommissionRule(editingRule.id, values);
        message.success('更新成功');
      } else {
        await addCommissionRule(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchRules();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSetRate = async (rate: number) => {
    try {
      await setCommissionRate(rate);
      message.success('设置成功');
    } catch (error) {
      message.error('设置失败');
    }
  };

  const columns = [
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: '佣金比例',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CommissionRule) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={layoutStyles.container}>
      <Card className={layoutStyles.card}>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>佣金管理</Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加规则
            </Button>
          </Space>
        </div>
        <Table<CommissionRule>
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑佣金规则' : '添加佣金规则'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="level"
            label="等级"
            rules={[{ required: true, message: '请输入等级' }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item
            name="rate"
            label="佣金比例"
            rules={[{ required: true, message: '请输入佣金比例' }]}
          >
            <InputNumber
              min={0}
              max={100}
              formatter={value => `${value}%`}
              parser={value => value!.replace('%', '')}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCommission; 