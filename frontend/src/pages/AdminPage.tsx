// 📌 AdminPage.tsx
// The admin dashboard, including the RolePermissionsManager component.

import React from 'react';
import RolePermissionsManager from '../components/RolePermissonsManager';

const AdminPage: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <p>Manage roles and their permissions below:</p>
      <RolePermissionsManager />
    </div>
  );
};

export default AdminPage;
