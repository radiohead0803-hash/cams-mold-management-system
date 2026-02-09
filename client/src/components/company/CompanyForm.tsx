import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { CreateCompanyRequest } from '@/api/companyApi';

interface CompanyFormProps {
  onSubmit: (data: CreateCompanyRequest) => void;
  isLoading?: boolean;
}

export default function CompanyForm({ onSubmit, isLoading }: CompanyFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateCompanyRequest>();
  const [contacts, setContacts] = useState([{ 
    name: '', 
    position: '', 
    department: '', 
    email: '', 
    phone: '', 
    is_primary: false,
    notes: '' 
  }]);

  const addContact = () => {
    setContacts([...contacts, { 
      name: '', 
      position: '', 
      department: '', 
      email: '', 
      phone: '', 
      is_primary: false,
      notes: '' 
    }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: string, value: string | boolean) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    
    // 주담당자 설정 시 다른 담당자는 주담당자 해제
    if (field === 'is_primary' && value === true) {
      newContacts.forEach((contact, i) => {
        if (i !== index) {
          contact.is_primary = false;
        }
      });
    }
    
    setContacts(newContacts);
  };

  const handleFormSubmit = (data: Omit<CreateCompanyRequest, 'contacts'>) => {
    onSubmit({
      ...data,
      contacts
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            업체명 <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('company_name', { required: '업체명을 입력하세요' })}
            error={errors.company_name?.message}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            업체 유형 <span className="text-red-500">*</span>
          </label>
          <Select {...register('company_type', { required: '업체 유형을 선택하세요' })}>
            <option value="">선택하세요</option>
            <option value="maker">제작처</option>
            <option value="plant">생산처</option>
          </Select>
          {errors.company_type && (
            <p className="text-sm text-red-500 mt-1">{errors.company_type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">사업자등록번호</label>
          <Input {...register('business_number')} placeholder="000-00-00000" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">대표자명</label>
          <Input {...register('representative_name')} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">대표 이메일</label>
          <Input {...register('email')} type="email" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">대표 전화번호</label>
          <Input {...register('phone')} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">주소</label>
        <Input {...register('address')} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">비고</label>
        <Textarea {...register('notes')} />
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">담당자 정보</h3>
          <Button type="button" variant="outline" onClick={addContact}>
            <PlusIcon className="w-4 h-4 mr-2" />
            담당자 추가
          </Button>
        </div>

        {contacts.map((contact, index) => (
          <div key={index} className="border p-4 rounded-lg mb-4">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium">담당자 #{index + 1}</h4>
              {contacts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(index)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  담당자명 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={contact.name}
                  onChange={(e) => updateContact(index, 'name', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">직책</label>
                <Input
                  value={contact.position}
                  onChange={(e) => updateContact(index, 'position', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">부서</label>
                <Input
                  value={contact.department}
                  onChange={(e) => updateContact(index, 'department', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateContact(index, 'email', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">연락처</label>
                <Input
                  value={contact.phone}
                  onChange={(e) => updateContact(index, 'phone', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={contact.is_primary}
                  onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">주담당자</label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">비고</label>
              <Textarea
                value={contact.notes}
                onChange={(e) => updateContact(index, 'notes', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
