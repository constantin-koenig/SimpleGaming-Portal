// AdminPanel.tsx
import React from 'react';
import RoleManager from '../components/RoleManager'; // Importiere die Rollenverwaltung

const AdminPanel: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
      <h1>Admin Panel</h1>
      
      {/* Hier fügst du den RoleManager zentriert ein */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Rollenverwaltung</h2>
        <RoleManager />
      </section>
    </div>
  );
};

export default AdminPanel;
