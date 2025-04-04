import { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, InputNumber, Select, Table, message, Modal } from 'antd';
import axios from 'axios';
import { DollarOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CouponFormData {
  amount: number;
  validRange: [dayjs.Dayjs, dayjs.Dayjs];
  targetType: 'followers' | 'customers';
  productId?: string;
  reason: string;
}

export default function SendCoupons() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/merchant/products');
        setProducts(res.data);
      } catch (error) {
        message.error('获取商品列表失败');
      }
    };
    fetchProducts();
  }, []);

  const handlePreview = async (values: CouponFormData) => {
    try {
      setLoading(true);
      const [validFrom, validTo] = values.validRange;
      
      const res = await axios.post('/api/merchant/coupon/preview', {
        amount: values.amount,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        targetType: values.targetType,
        productId: values.productId,
      });

      setPreviewData(res.data);
      setPreviewVisible(true);
    } catch (error) {
      message.error('预览失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCoupons = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const [validFrom, validTo] = values.validRange;

      await axios.post('/api/merchant/coupon/send-batch', {
        amount: values.amount,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        targetType: values.targetType,
        productId: values.productId,
        reason: values.reason
      });

      message.success('优惠券发放成功');
      form.resetFields();
      setPreviewVisible(false);
    } catch (error) {
      message.error('优惠券发放失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '优惠金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount}`,
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">优惠券活动管理</h2>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handlePreview}
        className="max-w-lg"
      >
        <Form.Item
          name="amount"
          label="优惠金额"
          rules={[{ required: true, message: '请输入优惠金额' }]}
        >
          <InputNumber
            prefix={<DollarOutlined />}
            min={0}
            step={0.01}
            className="w-full"
            placeholder="请输入优惠金额"
          />
        </Form.Item>

        <Form.Item
          name="validRange"
          label="有效期"
          rules={[{ required: true, message: '请选择有效期' }]}
        >
          <RangePicker
            className="w-full"
            showTime
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item>

        <Form.Item
          name="targetType"
          label="发放对象"
          rules={[{ required: true, message: '请选择发放对象' }]}
        >
          <Select>
            <Select.Option value="followers">关注者</Select.Option>
            <Select.Option value="customers">下单用户</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="productId"
          label="商品"
        >
          <Select allowClear placeholder="选择商品（可选）">
            {products.map(product => (
              <Select.Option key={product.id} value={product.id}>
                {product.name} - ¥{product.price}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="reason"
          label="活动说明"
        >
          <Input.TextArea rows={4} placeholder="请输入活动说明" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="w-full"
          >
            预览发放
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="发放预览"
        open={previewVisible}
        onOk={handleSendCoupons}
        onCancel={() => setPreviewVisible(false)}
        confirmLoading={loading}
        width={800}
      >
        {previewData && (
          <div>
            <div className="mb-4">
              <p>发放对象：{previewData.targetType === 'followers' ? '关注者' : '下单用户'}</p>
              <p>优惠金额：¥{previewData.amount}</p>
              <p>有效期：{dayjs(previewData.validFrom).format('YYYY-MM-DD HH:mm:ss')} 至 {dayjs(previewData.validTo).format('YYYY-MM-DD HH:mm:ss')}</p>
              <p>发放数量：{previewData.totalUsers} 人</p>
            </div>
            <Table
              columns={columns}
              dataSource={previewData.users}
              rowKey="userId"
              pagination={{ pageSize: 5 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
} 