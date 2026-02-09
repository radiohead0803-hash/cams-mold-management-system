import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyForm from '@/components/company/CompanyForm';
import companyApi, { CreateCompanyRequest } from '@/api/companyApi';

export default function CompanyFormPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: CreateCompanyRequest) => {
    try {
      setIsSubmitting(true);
      await companyApi.createCompany(data);
      navigate('/companies');
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('업체 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">업체 등록</h1>
      <CompanyForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
