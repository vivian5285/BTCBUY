import React, { useEffect, useState } from 'react';
import { Card, Typography, message, Image, Space, Divider } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import ProductStatusHistory from '../components/ProductStatusHistory';
import { productService } from '../services/productService';
import { Product, ProductFormData, ProductStatus } from '../types/product';

const { Title, Text } = Typography;

interface StatusChange {
  status: ProductStatus;
  timestamp: string;
  changedBy: string;
}

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        const data = await productService.getProduct(id);
        setProduct(data);
        // 模拟获取状态变更历史
        setStatusHistory([
          {
            status: 'draft',
            timestamp: new Date(data.createdAt).toLocaleString(),
            changedBy: 'System'
          },
          {
            status: data.status,
            timestamp: new Date(data.updatedAt).toLocaleString(),
            changedBy: 'Admin'
          }
        ]);
      } catch (error) {
        message.error('获取商品信息失败');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleSubmit = async (values: ProductFormData) => {
    try {
      if (!id) return;
      await productService.updateProduct(id, values);
      message.success('商品更新成功');
      navigate('/products');
    } catch (error) {
      message.error('商品更新失败');
    }
  };

  const handleCancel = () => {
    navigate('/products');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>商品不存在</div>;
  }

  return (
    <Card title="编辑商品">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <h3>当前商品图片</h3>
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              style={{ maxWidth: 200, marginBottom: 16 }}
            />
          )}
        </div>
        
        <Divider />
        
        <ProductForm
          initialValues={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
        
        <Divider />
        
        <div>
          <h3>状态变更历史</h3>
          <ProductStatusHistory changes={statusHistory} />
        </div>
      </Space>
    </Card>
  );
};

export default EditProduct; 