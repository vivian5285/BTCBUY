import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, message, Tag, Space, Typography } from 'antd';
import { merchantService } from '../services/merchantService';
import { MerchantApplication } from '../types/merchant';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MerchantReview: React.FC = () => {
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<MerchantApplication | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await merchantService.getApplications();
      setApplications(response.data);
    } catch (error) {
      message.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (application: MerchantApplication) => {
    setSelectedApp(application);
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (values: { status: 'approved' | 'rejected'; reason?: string }) => {
    if (!selectedApp) return;

    try {
      await merchantService.updateApplicationStatus(selectedApp.id, values);
      message.success('审核提交成功');
      setReviewModalVisible(false);
      fetchApplications();
    } catch (error) {
      message.error('审核提交失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待审核' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns = [
    {
      title: '店铺名称',
      dataIndex: 'storeName',
      key: 'storeName'
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName'
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MerchantApplication) => (
        <Button 
          type="link" 
          onClick={() => handleReview(record)}
          disabled={record.status !== 'pending'}
        >
          审核
        </Button>
      )
    }
  ];

  return (
    <div className="p-6">
      <Title level={3}>商家入驻申请审核</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={applications}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title="审核商家入驻申请"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedApp && (
          <div className="mb-6">
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <Text strong>店铺名称：</Text>
                <Text>{selectedApp.storeName}</Text>
              </div>
              <div>
                <Text strong>联系人：</Text>
                <Text>{selectedApp.contactName}</Text>
              </div>
              <div>
                <Text strong>联系电话：</Text>
                <Text>{selectedApp.contactPhone}</Text>
              </div>
              <div>
                <Text strong>联系邮箱：</Text>
                <Text>{selectedApp.contactEmail}</Text>
              </div>
              <div>
                <Text strong>店铺简介：</Text>
                <Text>{selectedApp.description}</Text>
              </div>
            </Space>
          </div>
        )}

        <Form
          form={form}
          onFinish={handleSubmitReview}
          layout="vertical"
        >
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Input.Group>
              <Button 
                type="primary" 
                onClick={() => form.setFieldsValue({ status: 'approved' })}
              >
                通过
              </Button>
              <Button 
                danger 
                onClick={() => form.setFieldsValue({ status: 'rejected' })}
              >
                拒绝
              </Button>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="reason"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入审核意见" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交审核
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MerchantReview; 