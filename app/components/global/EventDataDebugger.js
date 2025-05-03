import React, { useEffect, useState } from 'react';

// Componente de diagnóstico (apenas para desenvolvimento)
const EventDataDebugger = () => {
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    const checkEventData = () => {
      const data = localStorageService.getItem(EVENT_DATA_KEY);
      setEventData(data);
    };

    checkEventData();
    const interval = setInterval(checkEventData, 5000);

    return () => clearInterval(interval);
  }, []);

  const hasExpires = eventData && eventData.expires;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '8px',
      background: hasExpires ? '#4ade80' : '#f87171',
      color: 'white',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '250px',
      overflow: 'hidden'
    }}>
      <p>Event Data: {eventData ? '✓' : '✗'}</p>
      <p>Expires: {hasExpires ? new Date(eventData.expires).toLocaleString() : '❌ Ausente'}</p>
    </div>
  );
};

export default EventDataDebugger;