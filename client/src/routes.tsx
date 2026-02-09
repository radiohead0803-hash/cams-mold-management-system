import { createBrowserRouter } from 'react-router-dom';
import CompanyDetailPage from '@/pages/company/CompanyDetailPage';
import CompanyListPage from '@/pages/company/CompanyListPage';
import CompanyFormPage from '@/pages/company/CompanyFormPage';

export const router = createBrowserRouter([
  {
    path: '/companies',
    children: [
      {
        index: true,
        element: <CompanyListPage />
      },
      {
        path: 'new',
        element: <CompanyFormPage />
      },
      {
        path: ':id',
        element: <CompanyDetailPage />
      }
    ]
  }
]);
