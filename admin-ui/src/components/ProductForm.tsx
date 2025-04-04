import React from 'react';
import { Form, Input, InputNumber, Select, Button, Space } from 'antd';
import ImageUpload from './ImageUpload';
import { Product, ProductFormData } from '../types/product';

interface ProductFormProps {
  initialValues?: Product;
  onSubmit: (values: ProductFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item
        name="name"
        label="商品名称"
        rules={[{ required: true, message: '请输入商品名称' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="description"
        label="商品描述"
        rules={[{ required: true, message: '请输入商品描述' }]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item
        name="price"
        label="商品价格"
        rules={[{ required: true, message: '请输入商品价格' }]}
      >
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="stock"
        label="商品库存"
        rules={[{ required: true, message: '请输入商品库存' }]}
      >
        <InputNumber
          min={0}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="category"
        label="商品分类"
        rules={[{ required: true, message: '请选择商品分类' }]}
      >
        <Select>
          <Select.Option value="electronics">电子产品</Select.Option>
          <Select.Option value="clothing">服装</Select.Option>
          <Select.Option value="food">食品</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="status"
        label="商品状态"
        rules={[{ required: true, message: '请选择商品状态' }]}
      >
        <Select>
          <Select.Option value="draft">草稿</Select.Option>
          <Select.Option value="published">已发布</Select.Option>
          <Select.Option value="sold_out">已售罄</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="image"
        label="商品图片"
      >
        <ImageUpload />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            保存
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>
              取消
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProductForm; 