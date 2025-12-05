/* eslint-disable no-console */
(async () => {
  try {
    const base = 'https://cams-mold-management-system-production-b7d0.up.railway.app';
    const loginRes = await fetch(base + '/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123!' })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok || !loginJson?.data?.token) {
      console.error('Login failed', loginRes.status, loginJson);
      process.exit(1);
    }
    const token = loginJson.data.token;
    const listRes = await fetch(base + '/api/v1/mold-specifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listJson = await listRes.json();
    if (!listRes.ok) {
      console.error('List failed', listRes.status, listJson);
      process.exit(1);
    }
    const count = Array.isArray(listJson?.data?.items) ? listJson.data.items.length : 0;
    console.log(JSON.stringify({ success: true, login: loginRes.status, list: listRes.status, count }));
    process.exit(0);
  } catch (e) {
    console.error('check_api error', e?.message || e);
    process.exit(1);
  }
})();
