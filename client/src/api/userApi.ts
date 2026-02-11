import api from './httpClient';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'system_admin' | 'mold_developer' | 'maker' | 'plant';
  company_id?: number;
}

export async function searchUsers(query: string): Promise<User[]> {
  const res = await api.get('/users/search', { params: { q: query } });
  return res.data;
}
