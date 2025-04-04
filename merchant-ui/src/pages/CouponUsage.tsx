import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Card, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';
import { PaginatedResponse } from '../types/api';

const { RangePicker } = DatePicker;

interface CouponUsageRecord {
  _id: string;
  coupon: {
    amount: number;
    validTo: string;
  };
  order: {
    totalAmount: number;
  };
  user: {
    username: string;
  };
  amount: number;
  originalAmount: number;
  createdAt: string;
}

const CouponUsage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CouponUsageRecord[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  const fetchRecords = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const response = await axios.get<PaginatedResponse<CouponUsageRecord>>('/api/coupon/usage', {
        params: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          page,
          pageSize
        }
      });
      setRecords(response.data.records);
      setPagination(response.data.pagination);
    } catch (error) {
      message.error('获取优惠券使用记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateRange]);

  const columns: ColumnsType<CouponUsageRecord> = [
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'username'
    },
    {
      title: '优惠金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '订单金额',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '优惠券金额',
      dataIndex: ['coupon', 'amount'],
      key: 'couponAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '使用时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  const handleTableChange = (pagination: any) => {
    fetchRecords(pagination.current, pagination.pageSize);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">优惠券使用记录</h2>

      <Card className="mb-6">
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates) {
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
            }
          }}
        />
      </Card>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="_id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true
        }}
        onChange={handleTableChange}
        loading={loading}
      />
    </div>
  );
};

export default CouponUsage; 