import React, { useState } from 'react';
import { Upload, Button, Card, message, Table, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';

const { Title, Text } = Typography;

interface ImportError {
  row: number;
  error: string;
}

const CouponImport: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('请选择要上传的文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj as File);

    try {
      setImporting(true);
      const response = await axios.post('/api/coupon/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.errors) {
        setErrors(response.data.errors);
        setSuccessCount(response.data.successCount);
        message.warning(`导入完成，但有${response.data.errors.length}条错误`);
      } else {
        message.success(`成功导入${response.data.count}条优惠券`);
        setFileList([]);
        setErrors([]);
        setSuccessCount(0);
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setSuccessCount(error.response.data.successCount);
        message.error('导入过程中发现错误');
      } else {
        message.error('导入失败');
      }
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'userId,amount,validTo,reason,productId\n' +
      'user123,100,2024-12-31,新用户优惠,product123\n' +
      'user456,50,2024-12-31,会员优惠,';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coupon_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const errorColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
    },
    {
      title: '错误信息',
      dataIndex: 'error',
      key: 'error',
    },
  ];

  return (
    <div className="p-6">
      <Title level={2}>批量导入优惠券</Title>
      
      <Card className="mb-6">
        <div className="mb-4">
          <Text>请按照模板格式准备CSV文件，包含以下字段：</Text>
          <ul className="list-disc pl-6 mt-2">
            <li>userId: 用户ID（必填）</li>
            <li>amount: 优惠金额（必填，大于0）</li>
            <li>validTo: 过期时间（必填，格式：YYYY-MM-DD）</li>
            <li>reason: 发放原因（选填）</li>
            <li>productId: 商品ID（选填，不填则为通用优惠券）</li>
          </ul>
        </div>

        <Button
          icon={<DownloadOutlined />}
          onClick={downloadTemplate}
          className="mb-4"
        >
          下载模板
        </Button>

        <Upload
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={() => false}
          maxCount={1}
          accept=".csv"
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>

        <Button
          type="primary"
          onClick={handleUpload}
          loading={importing}
          disabled={fileList.length === 0}
          className="mt-4"
        >
          开始导入
        </Button>
      </Card>

      {errors.length > 0 && (
        <Card title="导入错误" className="mb-6">
          <Text type="warning" className="mb-4 block">
            成功导入 {successCount} 条记录，发现 {errors.length} 条错误：
          </Text>
          <Table
            columns={errorColumns}
            dataSource={errors}
            rowKey="row"
            pagination={false}
          />
        </Card>
      )}
    </div>
  );
};

export default CouponImport; 