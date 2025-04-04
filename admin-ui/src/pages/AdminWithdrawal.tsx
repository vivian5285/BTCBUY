import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Button, Modal, Form, Input, message, InputNumber, Space } from 'antd';
import { getAllWithdrawals, processWithdrawal, setWithdrawalFee, setWithdrawalLimit } from '../../api/admin';
import { Withdrawal } from '../../types/withdrawal';

const { Title } = Typography;

interface WithdrawalResponse {
  items: Withdrawal[];
  total: number;
}

const AdminWithdrawal: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await getAllWithdrawals({
        page: pagination.current,
        limit: pagination.pageSize,
      });
      setWithdrawals(data.items);
      setPagination(prev => ({
        ...prev,
        total: data.total,
      }));
    } catch (error) {
      message.error('获取提现记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await processWithdrawal(id, 'completed');
      message.success('审核通过成功');
      fetchWithdrawals();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleReject = (id: string) => {
    Modal.confirm({
      title: '拒绝提现',
      content: (
        <Form form={rejectForm}>
          <Form.Item
            name="reason"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await rejectForm.validateFields();
          await processWithdrawal(id, 'rejected', values.reason);
          message.success('审核拒绝成功');
          fetchWithdrawals();
        } catch (error) {
          if (error instanceof Error) {
            message.error(error.message);
          } else {
            message.error('审核失败');
          }
        }
      },
      onCancel: () => {
        rejectForm.resetFields();
      },
    });
  };

  const handleSetFee = async () => {
    try {
      const values = await rejectForm.validateFields();
      await setWithdrawalFee(values.fee);
      message.success('设置手续费成功');
    } catch (error) {
      message.error('设置手续费失败');
    }
  };

  const handleSetLimit = async () => {
    try {
      const values = await rejectForm.validateFields();
      await setWithdrawalLimit(values.min, values.max);
      message.success('设置限额成功');
    } catch (error) {
      message.error('设置限额失败');
    }
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: ['user', 'id'],
      key: 'userId',
    },
    {
      title: '提现金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          pending: '待审核',
          completed: '已完成',
          rejected: '已拒绝',
        };
        return <Tag color={status === 'pending' ? 'gold' : status === 'completed' ? 'green' : 'red'}>
          {statusMap[status as keyof typeof statusMap] || status}
        </Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Withdrawal) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <>
              <Button type="link" onClick={() => handleApprove(record.id)}>
                通过
              </Button>
              <Button type="link" danger onClick={() => handleReject(record.id)}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <Title level={4}>提现管理</Title>
        <Table
          columns={columns}
          dataSource={withdrawals}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={(newPagination) => {
            setPagination(prev => ({
              ...prev,
              current: newPagination.current || 1,
              pageSize: newPagination.pageSize || 10,
            }));
            fetchWithdrawals();
          }}
        />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Title level={4}>提现设置</Title>
        <Form form={rejectForm} layout="inline">
          <Form.Item
            name="fee"
            label="手续费率"
            rules={[{ required: true, message: '请输入手续费率' }]}
          >
            <InputNumber
              min={0}
              max={100}
              formatter={value => `${value}%`}
              parser={value => {
                const parsed = value ? Number(value.toString().replace('%', '')) : 0;
                return parsed > 100 ? 100 : parsed < 0 ? 0 : parsed;
              }}
            />
          </Form.Item>
          <Button type="primary" onClick={handleSetFee}>
            设置手续费
          </Button>
        </Form>

        <Form form={rejectForm} layout="inline" style={{ marginTop: 16 }}>
          <Form.Item
            name="min"
            label="最小提现金额"
            rules={[{ required: true, message: '请输入最小提现金额' }]}
          >
            <InputNumber
              min={0}
              formatter={value => `¥${value}`}
              parser={value => {
                const parsed = value ? Number(value.toString().replace('¥', '')) : 0;
                return parsed < 0 ? 0 : parsed;
              }}
            />
          </Form.Item>
          <Form.Item
            name="max"
            label="最大提现金额"
            rules={[{ required: true, message: '请输入最大提现金额' }]}
          >
            <InputNumber
              min={0}
              formatter={value => `¥${value}`}
              parser={value => {
                const parsed = value ? Number(value.toString().replace('¥', '')) : 0;
                return parsed < 0 ? 0 : parsed;
              }}
            />
          </Form.Item>
          <Button type="primary" onClick={handleSetLimit}>
            设置限额
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default AdminWithdrawal; 