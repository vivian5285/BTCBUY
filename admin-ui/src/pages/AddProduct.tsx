import React from 'react';
import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { productService } from '../services/productService';
import { ProductFormData } from '../types/product';

const { Title } = Typography;

const AddProduct: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values: ProductFormData) => {
    try {
      await productService.createProduct(values);
      navigate('/admin-ui/products');
    } catch (error) {
      console.error('创建商品失败:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-lg max-w-4xl mx-auto">
        <Title level={2} className="mb-6 text-gray-800">添加新商品</Title>
        <ProductForm
          visible={true}
          onCancel={() => navigate('/admin-ui/products')}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
};

export default AddProduct; 