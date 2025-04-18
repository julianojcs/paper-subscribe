'use client';

import { createContext, useContext, useState } from 'react';
import styles from './Tabs.module.css';

// Contexto para compartilhar o estado entre componentes
const TabsContext = createContext(null);

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
}

export default function Tabs({ 
  children, 
  defaultValue, 
  value: controlledValue, 
  onValueChange,
  className = '', 
  ...props 
}) {
  // Permite o uso controlado ou não-controlado
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  
  // Determina se está em modo controlado ou não
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  
  // Função para mudar o valor
  const setValue = (newValue) => {
    // Se for controlado, apenas chama o callback
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      // Se não for controlado, atualiza o state interno
      setUncontrolledValue(newValue);
      onValueChange?.(newValue);
    }
  };
  
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={`${styles.tabs} ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}