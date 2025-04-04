import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import { productService } from '../services/productService';
import { Product } from '../types/product';

const { Search } = Input;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 加载商品列表
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(
        pagination.current,
        pagination.pageSize,
        searchKeyword
      );
      setProducts(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      message.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [pagination.current, pagination.pageSize, searchKeyword]);

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 添加商品
  const handleAdd = () => {
    setEditingProduct(null);
    setFormVisible(true);
  };

  // 编辑商品
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormVisible(true);
  };

  // 删除商品
  const handleDelete = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      message.success('删除成功');
      loadProducts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, values);
        message.success('更新成功');
      } else {
        await productService.createProduct(values);
        message.success('创建成功');
      }
      setFormVisible(false);
      loadProducts();
    } catch (error) {
      message.error(editingProduct ? '更新失败' : '创建失败');
    }
  };

  return (
    <div className="p-6 bg-[#1B1F3B] min-h-screen">
      <Card className="bg-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="bg-gradient-to-r from-[#4F5BD5] to-[#1B1F3B] border-none"
          >
            添加商品
          </Button>
        </div>

        <div className="mb-6">
          <Search
            placeholder="搜索商品名称"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            className="max-w-md"
          />
        </div>

        <ProductList
          products={products}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
        />

        <ProductForm
          visible={formVisible}
          onCancel={() => setFormVisible(false)}
          onSubmit={handleFormSubmit}
          product={editingProduct}
        />
      </Card>
    </div>
  );
};

export default ProductManagement; 