import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import companyApi, { Company, CompanyContact, CreateContactRequest, UpdateContactRequest } from '@/api/companyApi';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [isEditingContact, setIsEditingContact] = useState<number | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editForm, setEditForm] = useState<CreateContactRequest>({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    is_primary: false,
    notes: ''
  });

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      const companyData = await companyApi.getCompany(Number(id));
      setCompany(companyData);
      const contactsData = await companyApi.getCompanyContacts(Number(id));
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load company data:', error);
    }
  };

  const handleAddContact = async () => {
    try {
      if (!id) return;
      await companyApi.createContact(Number(id), editForm);
      setIsAddingContact(false);
      setEditForm({
        name: '',
        position: '',
        department: '',
        email: '',
        phone: '',
        is_primary: false,
        notes: ''
      });
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleUpdateContact = async (contactId: number) => {
    try {
      if (!id) return;
      const updateData: UpdateContactRequest = {
        name: editForm.name,
        position: editForm.position,
        department: editForm.department,
        email: editForm.email,
        phone: editForm.phone,
        is_primary: editForm.is_primary,
        notes: editForm.notes
      };
      await companyApi.updateContact(Number(id), contactId, updateData);
      setIsEditingContact(null);
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm('담당자를 삭제하시겠습니까?')) return;
    try {
      if (!id) return;
      await companyApi.deleteContact(Number(id), contactId);
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const startEditingContact = (contact: CompanyContact) => {
    setIsEditingContact(contact.id);
    setEditForm({
      name: contact.name,
      position: contact.position || '',
      department: contact.department || '',
      email: contact.email || '',
      phone: contact.phone || '',
      is_primary: contact.is_primary,
      notes: contact.notes || ''
    });
  };

  if (!company) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{company.company_name}</h1>
        <p className="text-gray-500">
          {company.company_type === 'maker' ? '제작처' : '생산처'} | 
          {company.business_number && ` 사업자번호: ${company.business_number} |`}
          {company.status === 'active' ? ' 활성' : ' 비활성'}
        </p>
      </div>

      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">대표자명</p>
            <p>{company.representative_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">대표 이메일</p>
            <p>{company.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">대표 전화번호</p>
            <p>{company.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">주소</p>
            <p>{company.address || '-'}</p>
          </div>
          {company.notes && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">비고</p>
              <p>{company.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">담당자 정보</h2>
          <Button onClick={() => setIsAddingContact(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            담당자 추가
          </Button>
        </div>

        {isAddingContact && (
          <Card className="mb-4 p-6">
            <h3 className="font-medium mb-4">새 담당자 추가</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">담당자명 <span className="text-red-500">*</span></label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">직책</label>
                <Input
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">부서</label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">연락처</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.is_primary}
                  onChange={(e) => setEditForm({ ...editForm, is_primary: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">주담당자</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비고</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                취소
              </Button>
              <Button onClick={handleAddContact}>
                저장
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-6">
              {isEditingContact === contact.id ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">담당자명 <span className="text-red-500">*</span></label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">직책</label>
                      <Input
                        value={editForm.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">부서</label>
                      <Input
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">이메일</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">연락처</label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_primary}
                        onChange={(e) => setEditForm({ ...editForm, is_primary: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <label className="text-sm font-medium">주담당자</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">비고</label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsEditingContact(null)}>
                      취소
                    </Button>
                    <Button onClick={() => handleUpdateContact(contact.id)}>
                      저장
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{contact.name}</h3>
                        {contact.is_primary && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            주담당자
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {[contact.position, contact.department].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingContact(contact)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">이메일</p>
                      <p>{contact.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">연락처</p>
                      <p>{contact.phone || '-'}</p>
                    </div>
                    {contact.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">비고</p>
                        <p>{contact.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [isEditingContact, setIsEditingContact] = useState<number | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editForm, setEditForm] = useState<CreateContactRequest>({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    is_primary: false,
    notes: ''
  });

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      const companyData = await companyApi.getCompany(Number(id));
      setCompany(companyData);
      const contactsData = await companyApi.getCompanyContacts(Number(id));
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load company data:', error);
    }
  };

  const handleAddContact = async () => {
    try {
      if (!id) return;
      await companyApi.createContact(Number(id), editForm);
      setIsAddingContact(false);
      setEditForm({
        name: '',
        position: '',
        department: '',
        email: '',
        phone: '',
        is_primary: false,
        notes: ''
      });
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleUpdateContact = async (contactId: number) => {
    try {
      if (!id) return;
      const updateData: UpdateContactRequest = {
        name: editForm.name,
        position: editForm.position,
        department: editForm.department,
        email: editForm.email,
        phone: editForm.phone,
        is_primary: editForm.is_primary,
        notes: editForm.notes
      };
      await companyApi.updateContact(Number(id), contactId, updateData);
      setIsEditingContact(null);
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm('담당자를 삭제하시겠습니까?')) return;
    try {
      if (!id) return;
      await companyApi.deleteContact(Number(id), contactId);
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const startEditingContact = (contact: CompanyContact) => {
    setIsEditingContact(contact.id);
    setEditForm({
      name: contact.name,
      position: contact.position || '',
      department: contact.department || '',
      email: contact.email || '',
      phone: contact.phone || '',
      is_primary: contact.is_primary,
      notes: contact.notes || ''
    });
  };

  if (!company) {
    return <div>Loading...</div>;
  }
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [isEditingContact, setIsEditingContact] = useState<number | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editForm, setEditForm] = useState<CreateContactRequest>({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    is_primary: false,
    notes: ''
  });

  useEffect(() => {
    if (id) {
      loadCompanyData();
    }
  }, [id]);

  const loadCompanyData = async () => {
    try {
      const companyData = await companyApi.getCompany(Number(id));
      setCompany(companyData);
      const contactsData = await companyApi.getCompanyContacts(Number(id));
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load company data:', error);
    }
  };

  const handleAddContact = async () => {
    try {
      if (!id) return;
      await companyApi.createContact(Number(id), editForm);
      setIsAddingContact(false);
      setEditForm({
        name: '',
        position: '',
        department: '',
        email: '',
        phone: '',
        is_primary: false,
        notes: ''
      });
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleUpdateContact = async (contactId: number) => {
    try {
      if (!id) return;
      const updateData: UpdateContactRequest = {
        name: editForm.name,
        position: editForm.position,
        department: editForm.department,
        email: editForm.email,
        phone: editForm.phone,
        is_primary: editForm.is_primary,
        notes: editForm.notes
      };
      await companyApi.updateContact(Number(id), contactId, updateData);
      setIsEditingContact(null);
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm('담당자를 삭제하시겠습니까?')) return;
    try {
      if (!id) return;
      await companyApi.deleteContact(Number(id), contactId);
      await loadCompanyData();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const startEditingContact = (contact: CompanyContact) => {
    setIsEditingContact(contact.id);
    setEditForm({
      name: contact.name,
      position: contact.position || '',
      department: contact.department || '',
      email: contact.email || '',
      phone: contact.phone || '',
      is_primary: contact.is_primary,
      notes: contact.notes || ''
    });
  };

  if (!company) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{company.company_name}</h1>
        <p className="text-gray-500">
          {company.company_type === 'maker' ? '제작처' : '생산처'} | 
          {company.business_number && ` 사업자번호: ${company.business_number} |`}
          {company.status === 'active' ? ' 활성' : ' 비활성'}
        </p>
      </div>

      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">대표자명</p>
            <p>{company.representative_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">대표 이메일</p>
            <p>{company.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">대표 전화번호</p>
            <p>{company.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">주소</p>
            <p>{company.address || '-'}</p>
          </div>
          {company.notes && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">비고</p>
              <p>{company.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">담당자 정보</h2>
          <Button onClick={() => setIsAddingContact(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            담당자 추가
          </Button>
        </div>

        {isAddingContact && (
          <Card className="mb-4 p-6">
            <h3 className="font-medium mb-4">새 담당자 추가</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">담당자명 <span className="text-red-500">*</span></label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">직책</label>
                <Input
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">부서</label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">연락처</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editForm.is_primary}
                  onChange={(e) => setEditForm({ ...editForm, is_primary: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">주담당자</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비고</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                취소
              </Button>
              <Button onClick={handleAddContact}>
                저장
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-6">
              {isEditingContact === contact.id ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">담당자명 <span className="text-red-500">*</span></label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">직책</label>
                      <Input
                        value={editForm.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">부서</label>
                      <Input
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">이메일</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">연락처</label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_primary}
                        onChange={(e) => setEditForm({ ...editForm, is_primary: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <label className="text-sm font-medium">주담당자</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">비고</label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsEditingContact(null)}>
                      취소
                    </Button>
                    <Button onClick={() => handleUpdateContact(contact.id)}>
                      저장
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{contact.name}</h3>
                        {contact.is_primary && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            주담당자
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {[contact.position, contact.department].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingContact(contact)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">이메일</p>
                      <p>{contact.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">연락처</p>
                      <p>{contact.phone || '-'}</p>
                    </div>
                    {contact.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">비고</p>
                        <p>{contact.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
              <input
                className="border p-2 rounded"
                placeholder="부서"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="이메일"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="연락처"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.is_primary}
                  onChange={(e) => setEditForm({ ...editForm, is_primary: e.target.checked })}
                  className="mr-2"
                />
                <label>주담당자</label>
              </div>
            </div>
            <textarea
              className="border p-2 rounded w-full mb-4"
              placeholder="비고"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                취소
              </Button>
              <Button onClick={handleAddContact}>
                저장
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-6">
              {isEditingContact === contact.id ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      className="border p-2 rounded"
                      placeholder="담당자명"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="직책"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="부서"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="이메일"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                    <input
                      className="border p-2 rounded"
                      placeholder="연락처"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.is_primary}
                        onChange={(e) => setEditForm({ ...editForm, is_primary: e.target.checked })}
                        className="mr-2"
                      />
                      <label>주담당자</label>
                    </div>
                  </div>
                  <textarea
                    className="border p-2 rounded w-full mb-4"
                    placeholder="비고"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditingContact(null)}>
                      취소
                    </Button>
                    <Button onClick={() => handleUpdateContact(contact.id)}>
                      저장
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{contact.name}</h3>
                        {contact.is_primary && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            주담당자
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {[contact.position, contact.department].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingContact(contact)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">이메일</p>
                      <p>{contact.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">연락처</p>
                      <p>{contact.phone || '-'}</p>
                    </div>
                    {contact.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">비고</p>
                        <p>{contact.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
