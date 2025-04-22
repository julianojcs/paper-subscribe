'use client';

import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

export default function OrganizationEventsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <FaCalendarAlt style={{ fontSize: '1.5rem', marginRight: '0.5rem' }} />
        <h1>Eventos da Organização</h1>
      </div>
      <p>Esta página está em construção. Aqui serão exibidos os eventos da organização.</p>
    </div>
  );
}