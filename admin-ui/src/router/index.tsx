import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/admin-ui/Dashboard';
import ProductManagement from '../pages/admin-ui/ProductManagement';
import AddProduct from '../pages/admin-ui/AddProduct';
import EditProduct from '../pages/admin-ui/EditProduct';
import OrderManagement from '../pages/admin-ui/OrderManagement';

export const router = createBrowserRouter([
  {
    path: '/admin-ui',
    element: <Layout />,
    children: [
      {
        path: '',
        element: <Dashboard />
      },
      {
        path: 'products',
        element: <ProductManagement />
      },
      {
        path: 'add-product',
        element: <AddProduct />
      },
      {
        path: 'edit-product/:id',
        element: <EditProduct />
      },
      {
        path: 'orders',
        element: <OrderManagement />
      }
    ]
  }
]); 