import { useState } from 'react';
import { Form, Input, Button, DatePicker, InputNumber, Select, message } from 'antd';
import axios from 'axios';
import { UserOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface CouponFormData {
  userId: string;
  amount: number;
  validRange: [dayjs.Dayjs, dayjs.Dayjs];
  reason: string;
  type: 'general' | 'product';
  productId?: string;
}

export default function CouponManager() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSendCoupon = async (values: CouponFormData) => {
    try {
      setLoading(true);
      const [validFrom, validTo] = values.validRange;
      
      await axios.post('/api/admin/coupon/send', {
        userId: values.userId,
        amount: values.amount,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        reason: values.reason,
        type: values.type,
        productId: values.productId
      });

      message.success('优惠券发放成功');
      form.resetFields();
    } catch (error) {
      message.error('优惠券发放失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">优惠券发放管理</h2>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSendCoupon}
        className="max-w-lg"
      >
        <Form.Item
          name="userId"
          label="用户ID"
          rules={[{ required: true, message: '请输入用户ID' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入用户ID" />
        </Form.Item>

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
          name="type"
          label="优惠券类型"
          rules={[{ required: true, message: '请选择优惠券类型' }]}
        >
          <Select>
            <Select.Option value="general">通用优惠券</Select.Option>
            <Select.Option value="product">商品优惠券</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => 
            prevValues.type !== currentValues.type
          }
        >
          {({ getFieldValue }) => 
            getFieldValue('type') === 'product' && (
              <Form.Item
                name="productId"
                label="商品ID"
                rules={[{ required: true, message: '请输入商品ID' }]}
              >
                <Input placeholder="请输入商品ID" />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item
          name="reason"
          label="发放原因"
        >
          <Input.TextArea rows={4} placeholder="请输入发放原因（选填）" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="w-full"
          >
            发放优惠券
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
} 