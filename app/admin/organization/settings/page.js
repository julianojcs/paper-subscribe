'use client';

import React from 'react';
import { FaCog } from 'react-icons/fa';

export default function OrganizationSettingsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <FaCog style={{ fontSize: '1.5rem', marginRight: '0.5rem' }} />
        <h1>Configurações da Organização</h1>
      </div>
      <p>Esta página está em construção. Aqui serão exibidas as configurações da organização.</p>
    </div>
  );
}