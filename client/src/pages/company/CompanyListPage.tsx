import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { PlusIcon } from 'lucide-react';
import companyApi, { Company } from '@/api/companyApi';

export default function CompanyListPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const data = await companyApi.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
      alert('업체 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말로 이 업체를 삭제하시겠습니까?')) return;

    try {
      await companyApi.deleteCompany(id);
      await loadCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      alert('업체 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">업체 관리</h1>
        <Button onClick={() => navigate('/companies/new')}>
          <PlusIcon className="w-4 h-4 mr-2" />
          업체 등록
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <Card key={company.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{company.company_name}</h3>
                <p className="text-sm text-gray-500">
                  {company.company_type === 'maker' ? '제작처' : '생산처'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/companies/${company.id}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  상세보기
                </Link>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm">
                <p>
                  <span className="text-gray-500">대표자:</span>{' '}
                  {company.representative_name || '-'}
                </p>
                <p>
                  <span className="text-gray-500">연락처:</span>{' '}
                  {company.phone || '-'}
                </p>
                <p>
                  <span className="text-gray-500">이메일:</span>{' '}
                  {company.email || '-'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
