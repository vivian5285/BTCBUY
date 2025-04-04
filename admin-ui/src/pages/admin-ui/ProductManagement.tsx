import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Space, message, Modal } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ProductList from '../../components/ProductList';
import { productService } from '../../services/productService';
import { Product } from '../../types/product';

const { Search } = Input;
const { confirm } = Modal;

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadProducts();
  }, [currentPage, pageSize, searchKeyword]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(currentPage, pageSize, searchKeyword);
      setProducts(response.products);
      setTotal(response.total);
    } catch (error) {
      message.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await productService.deleteProduct(id);
          message.success('删除成功');
          loadProducts();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin-ui/add-product')}
            className="bg-gradient-to-r from-[#4F5BD5] to-[#1B1F3B] border-none"
          >
            添加商品
          </Button>
        </div>

        <Space className="mb-6 w-full" direction="vertical">
          <Search
            placeholder="搜索商品名称"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="max-w-md"
          />
        </Space>

        <ProductList
          products={products}
          loading={loading}
          onDelete={handleDelete}
        />

        <div className="mt-4 flex justify-end">
          <Space>
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="px-4 py-2">
              第 {currentPage} 页 / 共 {Math.ceil(total / pageSize)} 页
            </span>
            <Button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(total / pageSize)}
            >
              下一页
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProductManagement; 