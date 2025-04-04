import React from 'react';
import { Timeline, Tag, Typography } from 'antd';
import { ProductStatus } from '../types/product';

const { Text } = Typography;

interface StatusChange {
  status: ProductStatus;
  timestamp: string;
  changedBy: string;
}

interface ProductStatusHistoryProps {
  changes: StatusChange[];
}

const getStatusColor = (status: ProductStatus) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'published':
      return 'success';
    case 'sold_out':
      return 'error';
    default:
      return 'default';
  }
};

const ProductStatusHistory: React.FC<ProductStatusHistoryProps> = ({ changes }) => {
  return (
    <Timeline>
      {changes.map((change, index) => (
        <Timeline.Item key={index}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag color={getStatusColor(change.status)}>{change.status}</Tag>
            <Text type="secondary">{change.timestamp}</Text>
            <Text type="secondary">by {change.changedBy}</Text>
          </div>
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

export default ProductStatusHistory; 