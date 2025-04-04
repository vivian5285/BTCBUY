import React, { useState } from 'react';
import { Upload, message, Image, Button } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { productService } from '../services/productService';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  maxCount?: number;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  maxCount = 1,
  disabled = false
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await productService.uploadImage(formData);
      message.success('上传成功');
      onChange?.(response.url);
      return false;
    } catch (error) {
      message.error('上传失败');
      return false;
    }
  };

  const handleRemove = async () => {
    try {
      if (value) {
        await productService.deleteImage(value);
        message.success('删除成功');
        onChange?.('');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {value && (
        <div className="relative">
          <Image
            src={value}
            alt="商品图片"
            width={100}
            height={100}
            className="rounded-lg object-cover"
          />
          {!disabled && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={handleRemove}
              className="absolute top-0 right-0"
            />
          )}
        </div>
      )}
      {(!value || fileList.length < maxCount) && !disabled && (
        <Upload
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={handleUpload}
          maxCount={maxCount}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>上传图片</Button>
        </Upload>
      )}
    </div>
  );
};

export default ImageUpload; 