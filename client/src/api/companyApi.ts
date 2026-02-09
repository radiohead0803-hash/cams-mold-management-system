import { httpClient } from './httpClient';

export interface Company {
  id: number;
  company_code: string;
  company_name: string;
  company_type: 'maker' | 'plant';
  business_number?: string;
  representative_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: number;
  company_id: number;
  name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyRequest {
  company_name: string;
  company_type: 'maker' | 'plant';
  business_number?: string;
  representative_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  contacts: Array<{
    name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    is_primary: boolean;
    notes?: string;
  }>;
}

export interface UpdateCompanyRequest {
  company_name?: string;
  business_number?: string;
  representative_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

export interface CreateContactRequest {
  name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
  notes?: string;
}

export interface UpdateContactRequest {
  name?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  status?: 'active' | 'inactive';
  notes?: string;
}

const companyApi = {
  // 업체 목록 조회
  getCompanies: () => {
    return httpClient.get<Company[]>('/api/companies');
  },

  // 업체 상세 조회
  getCompany: (id: number) => {
    return httpClient.get<Company>(`/api/companies/${id}`);
  },

  // 업체 등록
  createCompany: (data: CreateCompanyRequest) => {
    return httpClient.post<Company>('/api/companies', data);
  },

  // 업체 정보 수정
  updateCompany: (id: number, data: UpdateCompanyRequest) => {
    return httpClient.patch<Company>(`/api/companies/${id}`, data);
  },

  // 업체 삭제 (비활성화)
  deleteCompany: (id: number) => {
    return httpClient.delete(`/api/companies/${id}`);
  },

  // 담당자 목록 조회
  getCompanyContacts: (companyId: number) => {
    return httpClient.get<CompanyContact[]>(`/api/companies/${companyId}/contacts`);
  },

  // 담당자 상세 조회
  getContact: (companyId: number, contactId: number) => {
    return httpClient.get<CompanyContact>(`/api/companies/${companyId}/contacts/${contactId}`);
  },

  // 담당자 등록
  createContact: (companyId: number, data: CreateContactRequest) => {
    return httpClient.post<CompanyContact>(`/api/companies/${companyId}/contacts`, data);
  },

  // 담당자 정보 수정
  updateContact: (companyId: number, contactId: number, data: UpdateContactRequest) => {
    return httpClient.patch<CompanyContact>(`/api/companies/${companyId}/contacts/${contactId}`, data);
  },

  // 담당자 삭제 (비활성화)
  deleteContact: (companyId: number, contactId: number) => {
    return httpClient.delete(`/api/companies/${companyId}/contacts/${contactId}`);
  }
};

export default companyApi;
